import type { CompositionOutput, CompositionSourceRef } from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import { makeIssue } from "../shared/issue";
import type { ValidatorDeps } from "../../types";

/**
 * Rule: source 추적성 (SPEC §7.1 source/target 정합성, multi-source 추적성, area 재구성 규칙)
 * - 모든 decision.sourceRef.areaId 가 Schema A의 area에 존재
 * - 모든 decision.target.areaId 가 Schema B areas에 존재
 * - area/decision의 sourceRefs[] 가 비어있지 않음 또는 synthetic 근거 충족
 * - compositionAction 별 area 재구성 조건 만족
 */
export function checkSourceTracing(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];

	const prddAreaIds = new Set(deps.prddScreenRecord.areas.map((a) => a.areaId));
	const compositionAreaIds = new Set(output.areas.map((a) => a.areaId));
	const prddAreaById = new Map(deps.prddScreenRecord.areas.map((a) => [a.areaId, a]));

	// area level
	output.areas.forEach((area, i) => {
		if (area.compositionAction === "synthesize-supporting-area") {
			if (!area.synthetic || !area.synthetic.reason) {
				issues.push(
					makeIssue(
						"composition.area.synthesize.missing-reason",
						"contract",
						`area "${area.areaId}" 가 synthesize-supporting-area인데 synthetic.reason 없음`,
						{
							path: ["areas", i],
							nodeId: area.areaId,
							data: { areaId: area.areaId },
						},
					),
				);
			}
		} else {
			// 비-synthesize는 sourceRefs[] 필수
			if (area.sourceRefs.length === 0) {
				issues.push(
					makeIssue(
						"composition.source-refs.empty",
						"reference",
						`area "${area.areaId}" 의 sourceRefs[] 가 비어있음`,
						{
							path: ["areas", i, "sourceRefs"],
							nodeId: area.areaId,
							data: { areaId: area.areaId },
						},
					),
				);
			}
		}

		if (area.compositionAction === "merge-source-areas" && area.sourceRefs.length < 2) {
			issues.push(
				makeIssue(
					"composition.area.merge.insufficient-sources",
					"contract",
					`area "${area.areaId}" 가 merge-source-areas인데 sourceRefs 수가 2 미만`,
					{
						path: ["areas", i, "sourceRefs"],
						nodeId: area.areaId,
						data: { areaId: area.areaId, sourceRefCount: area.sourceRefs.length },
					},
				),
			);
		}

		area.sourceRefs.forEach((ref, refIndex) => {
			verifySourceRef(
				ref,
				{
					path: ["areas", i, "sourceRefs", refIndex],
					nodeId: area.areaId,
					prddScreenId: deps.prddScreenRecord.id,
					prddAreaIds,
					prddAreaById,
				},
				issues,
			);
		});
		area.synthetic?.basedOnSourceRefs.forEach((ref, refIndex) => {
			verifySourceRef(
				ref,
				{
					path: ["areas", i, "synthetic", "basedOnSourceRefs", refIndex],
					nodeId: area.areaId,
					prddScreenId: deps.prddScreenRecord.id,
					prddAreaIds,
					prddAreaById,
				},
				issues,
			);
		});
	});

	// split: 같은 source area를 참조하는 Schema B area가 2개 이상이어야 함
	const splitTargetsBySource = new Map<string, number>();
	for (const area of output.areas) {
		if (area.compositionAction === "split-source-area" && area.sourceRefs[0]?.areaId) {
			const src = area.sourceRefs[0].areaId;
			splitTargetsBySource.set(src, (splitTargetsBySource.get(src) ?? 0) + 1);
		}
	}
	for (const [src, count] of splitTargetsBySource) {
		if (count < 2) {
			issues.push(
				makeIssue(
					"composition.area.split.duplicate-target-missing",
					"contract",
					`split-source-area가 source area "${src}" 를 가리키지만 target area 수가 ${count}개 (2 이상 필요)`,
					{ data: { sourceAreaId: src, targetCount: count } },
				),
			);
		}
	}

	// decision level
	output.decisions.forEach((decision, i) => {
		if (!prddAreaIds.has(decision.sourceRef.areaId)) {
			issues.push(
				makeIssue(
					"composition.source-ref.unknown-area",
					"reference",
					`decision "${decision.id}" 의 sourceRef.areaId "${decision.sourceRef.areaId}" 가 Schema A area에 없음`,
					{
						path: ["decisions", i, "sourceRef", "areaId"],
						nodeId: decision.id,
						data: { decisionId: decision.id, areaId: decision.sourceRef.areaId },
					},
				),
			);
		}
		if (!compositionAreaIds.has(decision.target.areaId)) {
			issues.push(
				makeIssue(
					"composition.target.unknown-area",
					"reference",
					`decision "${decision.id}" 의 target.areaId "${decision.target.areaId}" 가 Schema B areas에 없음`,
					{
						path: ["decisions", i, "target", "areaId"],
						nodeId: decision.id,
						data: { decisionId: decision.id, areaId: decision.target.areaId },
					},
				),
			);
		}
		if (decision.sourceRefs.length === 0) {
			issues.push(
				makeIssue(
					"composition.source-refs.empty",
					"reference",
					`decision "${decision.id}" 의 sourceRefs[] 가 비어있음`,
					{
						path: ["decisions", i, "sourceRefs"],
						nodeId: decision.id,
						data: { decisionId: decision.id },
					},
				),
			);
		}
		verifySourceRef(
			decision.sourceRef,
			{
				path: ["decisions", i, "sourceRef"],
				nodeId: decision.id,
				prddScreenId: deps.prddScreenRecord.id,
				prddAreaIds,
				prddAreaById,
			},
			issues,
		);
		decision.sourceRefs.forEach((ref, refIndex) => {
			verifySourceRef(
				ref,
				{
					path: ["decisions", i, "sourceRefs", refIndex],
					nodeId: decision.id,
					prddScreenId: deps.prddScreenRecord.id,
					prddAreaIds,
					prddAreaById,
				},
				issues,
			);
		});
	});

	return issues;
}

function verifySourceRef(
	ref: Pick<
		CompositionSourceRef,
		"screenId" | "areaId" | "componentRow" | "semanticName" | "rawComponentId"
	>,
	extras: {
		path: ReadonlyArray<string | number>;
		nodeId: string;
		prddScreenId: string;
		prddAreaIds: ReadonlySet<string>;
		prddAreaById: ReadonlyMap<
			string,
			{ area: { children: Array<{ order: number; semanticName: string; rawComponentId: string }> } }
		>;
	},
	issues: ValidationIssue[],
): void {
	if (ref.screenId !== extras.prddScreenId) {
		issues.push(
			makeIssue(
				"cross-table.invariant.mismatch",
				"reference",
				`sourceRef.screenId "${ref.screenId}" 가 PRDD screen "${extras.prddScreenId}" 와 다름`,
				{
					path: [...extras.path, "screenId"],
					nodeId: extras.nodeId,
					data: { screenId: ref.screenId, expectedScreenId: extras.prddScreenId },
				},
			),
		);
	}

	if (!ref.areaId) return;
	if (!extras.prddAreaIds.has(ref.areaId)) {
		issues.push(
			makeIssue(
				"composition.source-ref.unknown-area",
				"reference",
				`sourceRef.areaId "${ref.areaId}" 가 Schema A area에 없음`,
				{
					path: [...extras.path, "areaId"],
					nodeId: extras.nodeId,
					data: { areaId: ref.areaId },
				},
			),
		);
		return;
	}

	if (
		ref.componentRow === undefined &&
		ref.semanticName === undefined &&
		ref.rawComponentId === undefined
	) {
		return;
	}

	const area = extras.prddAreaById.get(ref.areaId);
	const matched = area?.area.children.some((child) => {
		if (ref.componentRow !== undefined && child.order !== ref.componentRow) return false;
		if (ref.semanticName !== undefined && child.semanticName !== ref.semanticName) return false;
		if (ref.rawComponentId !== undefined && child.rawComponentId !== ref.rawComponentId)
			return false;
		return true;
	});

	if (!matched) {
		issues.push(
			makeIssue(
				"composition.source-ref.unknown-component",
				"reference",
				`sourceRef가 area "${ref.areaId}" 안의 PRDD component와 매칭되지 않음`,
				{
					path: extras.path,
					nodeId: extras.nodeId,
					data: {
						areaId: ref.areaId,
						componentRow: ref.componentRow,
						semanticName: ref.semanticName,
						rawComponentId: ref.rawComponentId,
					},
				},
			),
		);
	}
}
