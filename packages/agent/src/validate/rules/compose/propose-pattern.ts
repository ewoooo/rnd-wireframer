import type {
	ComponentPattern,
	ComponentPatternNode,
	CompositionOutput,
	ValidationIssue,
} from "@cx/types";

import { indexCatalogDeck } from "../shared/deck-lookup";
import { makeIssue } from "../shared/issue";
import type { ValidatorDeps } from "../../types";

/**
 * Rule: propose-pattern 완전성·참조 범위·DAG (SPEC §7.1 propose 5종 세트 / proposed 참조 범위 / propose 내부 / 순환)
 *
 * - 5종 세트: props·slots·variants·tokensUsed·rationale
 * - 참조 범위: composition 내부의 `kind: "primitive"` 잎은 catalog primitives,
 *   `kind: "componentPattern"` 참조는 registered만 (proposed → proposed 금지)
 * - DAG: componentPattern 참조 그래프 순환 금지
 */
export function checkProposePattern(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const index = indexCatalogDeck(deps.catalogDeck);

	output.proposedComponentPatterns.forEach((pattern, i) => {
		// 5종 세트
		const missing: string[] = [];
		if (pattern.props.length === 0) missing.push("props");
		if (pattern.slots.length === 0) missing.push("slots");
		if (pattern.variants.length === 0) missing.push("variants");
		if (pattern.tokensUsed.length === 0) missing.push("tokensUsed");
		if (!pattern.rationale || pattern.rationale.trim().length === 0) missing.push("rationale");
		if (missing.length > 0) {
			issues.push(
				makeIssue(
					"component-pattern.propose.incomplete",
					"contract",
					`proposed componentPattern "${pattern.id}" 에 필수 필드 누락: ${missing.join(", ")}`,
					{
						path: ["proposedComponentPatterns", i],
						nodeId: pattern.id,
						data: { componentPatternId: pattern.id, missing },
					},
				),
			);
		}

		// 참조 범위 검사
		walkNodes(pattern.composition, (node, nodePath) => {
			if (node.kind === "primitive") {
				if (!node.ref || !index.primitives.has(node.ref)) {
					issues.push(
						makeIssue(
							"component-pattern.propose.scope-violation",
							"reference",
							`proposed "${pattern.id}" composition의 primitive ref "${node.ref ?? "(empty)"}" 가 catalog primitives에 없음 (gap-report 경로 사용)`,
							{
								path: ["proposedComponentPatterns", i, "composition", ...nodePath],
								nodeId: pattern.id,
								data: { componentPatternId: pattern.id, missingPrimitive: node.ref },
							},
						),
					);
				}
			} else if (node.kind === "componentPattern") {
				if (!node.ref || !index.registeredComponentPatternIds.has(node.ref)) {
					issues.push(
						makeIssue(
							"component-pattern.propose.scope-violation",
							"reference",
							`proposed "${pattern.id}" 가 registered가 아닌 componentPattern "${node.ref ?? "(empty)"}" 참조 (v1: proposed→proposed 금지)`,
							{
								path: ["proposedComponentPatterns", i, "composition", ...nodePath],
								nodeId: pattern.id,
								data: { componentPatternId: pattern.id, illegalRef: node.ref },
							},
						),
					);
				}
			}
		});
	});

	// DAG: proposed 그래프에서 사이클 검사 (registered 참조는 leaf로 취급)
	const cycleIssues = detectCycles(output.proposedComponentPatterns);
	issues.push(...cycleIssues);

	return issues;
}

function walkNodes(
	root: ComponentPatternNode,
	visit: (node: ComponentPatternNode, path: ReadonlyArray<string | number>) => void,
	path: ReadonlyArray<string | number> = [],
): void {
	visit(root, path);
	root.children?.forEach((child, i) => {
		walkNodes(child, visit, [...path, "children", i]);
	});
}

function detectCycles(patterns: ComponentPattern[]): ValidationIssue[] {
	const idToPattern = new Map(patterns.map((p) => [p.id, p]));
	const visiting = new Set<string>();
	const visited = new Set<string>();
	const issues: ValidationIssue[] = [];

	function dfs(id: string, stack: string[]): void {
		if (visited.has(id)) return;
		if (visiting.has(id)) {
			const cycleStart = stack.indexOf(id);
			const cycle = stack.slice(cycleStart).concat(id);
			issues.push(
				makeIssue(
					"component-pattern.cycle",
					"reference",
					`componentPattern 참조 그래프에 사이클: ${cycle.join(" -> ")}`,
					{
						nodeId: id,
						data: { cycle },
					},
				),
			);
			return;
		}
		const pattern = idToPattern.get(id);
		if (!pattern) return;
		visiting.add(id);
		walkNodes(pattern.composition, (node) => {
			if (node.kind === "componentPattern" && node.ref) {
				dfs(node.ref, [...stack, id]);
			}
		});
		visiting.delete(id);
		visited.add(id);
	}

	for (const pattern of patterns) {
		dfs(pattern.id, []);
	}
	return issues;
}
