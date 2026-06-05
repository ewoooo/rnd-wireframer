import type {
	RunSideEffectsInput,
	SideEffectCommand,
	SideEffectCommandResult,
	SideEffectExecutionResult,
	SideEffectIssue,
} from "../public/types";
import { sideEffectExecutors } from "./command-registry";
import { createSideEffectExecutionResult } from "./result-envelope";

export async function runSideEffects(
	input: RunSideEffectsInput,
): Promise<SideEffectExecutionResult> {
	const issues = findDuplicateCommandIssues(input.commands);
	if (issues.length > 0) {
		return createSideEffectExecutionResult({ commands: [], issues });
	}

	const commandResults: SideEffectCommandResult[] = [];
	const executionIssues: SideEffectIssue[] = [];

	for (const command of input.commands) {
		const executor = sideEffectExecutors[command.operation];
		const result = await executor({
			adapters: input.adapters,
			command,
			mode: input.mode,
		});

		commandResults.push(result);
		executionIssues.push(...result.issues);

		if (input.stopOnFailure !== false && result.status === "failed") {
			break;
		}
	}

	return createSideEffectExecutionResult({
		commands: commandResults,
		issues: executionIssues,
	});
}

function findDuplicateCommandIssues(commands: SideEffectCommand[]): SideEffectIssue[] {
	const seen = new Set<string>();
	const duplicateIds = new Set<string>();

	for (const command of commands) {
		if (seen.has(command.id)) duplicateIds.add(command.id);
		seen.add(command.id);
	}

	return [...duplicateIds].map((id) => ({
		code: "pipeline.duplicate_command_id",
		message: `Duplicate side effect command id: ${id}`,
		severity: "error",
	}));
}
