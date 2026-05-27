import type { ArchetypeBlockId, CompositionOutput } from "@cx/types/composition-output";
import type { ValidationIssue } from "@cx/types/validation";
import { buildArchetypeScaffold } from "../../../compose-screen/scaffold";
import type { ValidatorDeps } from "../../types";

export function checkArchetypeCompleteness(
	output: CompositionOutput,
	deps: ValidatorDeps,
): ValidationIssue[] {
	const scaffold = deps.archetypeScaffold ?? buildArchetypeScaffold(deps.prddScreenRecord);
	const issues: ValidationIssue[] = [];

	if (output.screen.archetype !== scaffold.archetype) {
		issues.push({
			code: "composition.screen.archetype.mismatch",
			severity: "error",
			layer: "contract",
			message: `screen.archetype "${output.screen.archetype}" != scaffold archetype "${scaffold.archetype}"`,
			path: ["screen", "archetype"],
			nodeId: output.screen.screenId,
			data: { expected: scaffold.archetype, actual: output.screen.archetype },
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
