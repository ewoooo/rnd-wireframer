import type {
	ArchetypeBlockId,
	ArchetypeChoice,
	CompositionOutput,
	ProposedArchetypeScaffold,
} from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import {
	type ArchetypeScaffold,
	lookupArchetypeScaffold,
} from "../../../compose-screen/scaffold";
import type { ValidatorDeps } from "../../types";

/**
 * archetype 선택과 completeness 검증.
 *
 * - archetypeChoice.rationale은 빈 문자열 금지.
 * - source="catalog"면 catalog에 존재하는 archetype이어야 한다.
 * - source="proposed"면 proposedScaffold가 동봉되어야 하고, 그 rationale도 빈 문자열 금지.
 * - 선택된 scaffold의 requiredBlocks가 completeness 4채널 중 하나로 설명되어야 한다.
 * - syntheticBlocks는 scaffold.allowedSyntheticBlocks 안에 있어야 한다.
 * - screen.archetype은 archetypeChoice.archetype과 동일해야 한다.
 */
export function checkArchetypeCompleteness(
	output: CompositionOutput,
	_deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const choice = output.screen.archetypeChoice as ArchetypeChoice | undefined;

	if (!choice) {
		issues.push({
			code: "composition.screen.archetypeChoice.missing",
			severity: "error",
			layer: "contract",
			message: "screen.archetypeChoice is required",
			path: ["screen", "archetypeChoice"],
			nodeId: output.screen.screenId,
		});
		return issues;
	}

	if (!choice.rationale || choice.rationale.trim().length === 0) {
		issues.push({
			code: "composition.screen.archetypeChoice.rationale-required",
			severity: "error",
			layer: "contract",
			message: "archetypeChoice.rationale must be a non-empty PRDD citation",
			path: ["screen", "archetypeChoice", "rationale"],
			nodeId: output.screen.screenId,
		});
	}

	const scaffold = resolveScaffold(choice, output, issues);
	if (!scaffold) return issues;

	if (output.screen.archetype !== choice.archetype) {
		issues.push({
			code: "composition.screen.archetype.mismatch",
			severity: "error",
			layer: "contract",
			message: `screen.archetype "${output.screen.archetype}" != archetypeChoice.archetype "${choice.archetype}"`,
			path: ["screen", "archetype"],
			nodeId: output.screen.screenId,
			data: { expected: choice.archetype, actual: output.screen.archetype },
		});
	}

	const explained = new Set<ArchetypeBlockId>([
		...output.screen.completeness.presentBlocks,
		...output.screen.completeness.syntheticBlocks,
		...output.screen.completeness.missingBlocks,
		...output.screen.completeness.omittedBlocks.map((block) => block.blockId),
	]);
	const missingExplanations = scaffold.requiredBlocks.filter((block) => !explained.has(block));
	if (missingExplanations.length > 0) {
		issues.push({
			code: "composition.completeness.missing-block",
			severity: "error",
			layer: "contract",
			message: `required scaffold blocks are not explained: ${missingExplanations.join(", ")}`,
			path: ["screen", "completeness"],
			nodeId: output.screen.screenId,
			data: { missingBlocks: missingExplanations, requiredBlocks: scaffold.requiredBlocks },
		});
	}

	const allowedSynthetic = new Set(scaffold.allowedSyntheticBlocks);
	const invalidSynthetic = output.screen.completeness.syntheticBlocks.filter(
		(block) => !allowedSynthetic.has(block),
	);
	if (invalidSynthetic.length > 0) {
		issues.push({
			code: "composition.completeness.missing-block",
			severity: "error",
			layer: "contract",
			message: `synthetic blocks are outside scaffold allowedSyntheticBlocks: ${invalidSynthetic.join(", ")}`,
			path: ["screen", "completeness", "syntheticBlocks"],
			nodeId: output.screen.screenId,
			data: {
				invalidSyntheticBlocks: invalidSynthetic,
				allowedSyntheticBlocks: scaffold.allowedSyntheticBlocks,
			},
		});
	}

	return issues;
}

function resolveScaffold(
	choice: ArchetypeChoice,
	output: CompositionOutput,
	issues: ValidationIssue[],
): ArchetypeScaffold | ProposedArchetypeScaffold | undefined {
	if (choice.source === "catalog") {
		const catalogScaffold = lookupArchetypeScaffold(choice.archetype);
		if (!catalogScaffold) {
			issues.push({
				code: "composition.screen.archetype.unknown",
				severity: "error",
				layer: "contract",
				message: `archetypeChoice.archetype "${choice.archetype}" is not in catalog. Use source="proposed" to introduce a new one.`,
				path: ["screen", "archetypeChoice", "archetype"],
				nodeId: output.screen.screenId,
				data: { archetype: choice.archetype },
			});
			return undefined;
		}
		return catalogScaffold;
	}

	// source === "proposed"
	if (!choice.proposedScaffold) {
		issues.push({
			code: "composition.screen.archetype.proposed-scaffold-required",
			severity: "error",
			layer: "contract",
			message: "archetypeChoice.proposedScaffold is required when source=\"proposed\"",
			path: ["screen", "archetypeChoice", "proposedScaffold"],
			nodeId: output.screen.screenId,
		});
		return undefined;
	}

	if (
		!choice.proposedScaffold.rationale ||
		choice.proposedScaffold.rationale.trim().length === 0
	) {
		issues.push({
			code: "composition.screen.archetypeChoice.rationale-required",
			severity: "error",
			layer: "contract",
			message: "proposedScaffold.rationale must be a non-empty justification",
			path: ["screen", "archetypeChoice", "proposedScaffold", "rationale"],
			nodeId: output.screen.screenId,
		});
	}

	if (choice.proposedScaffold.archetype !== choice.archetype) {
		issues.push({
			code: "composition.screen.archetype.mismatch",
			severity: "error",
			layer: "contract",
			message: `proposedScaffold.archetype "${choice.proposedScaffold.archetype}" != archetypeChoice.archetype "${choice.archetype}"`,
			path: ["screen", "archetypeChoice", "proposedScaffold", "archetype"],
			nodeId: output.screen.screenId,
			data: { expected: choice.archetype, actual: choice.proposedScaffold.archetype },
		});
	}

	if (lookupArchetypeScaffold(choice.archetype)) {
		issues.push({
			code: "composition.screen.archetype.propose-conflict",
			severity: "error",
			layer: "contract",
			message: `archetype "${choice.archetype}" already exists in catalog. Use source="catalog" to reuse it.`,
			path: ["screen", "archetypeChoice"],
			nodeId: output.screen.screenId,
			data: { archetype: choice.archetype },
		});
	}

	return choice.proposedScaffold;
}
