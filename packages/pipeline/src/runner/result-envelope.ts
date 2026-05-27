import type {
	SideEffectCommandResult,
	SideEffectExecutionResult,
	SideEffectIssue,
} from "../public/types";

export function createSideEffectExecutionResult(input: {
	commands: SideEffectCommandResult[];
	issues: SideEffectIssue[];
}): SideEffectExecutionResult {
	return {
		commands: input.commands,
		issues: input.issues,
		ok: input.issues.every((issue) => issue.severity !== "error"),
		operation: "side-effect-command-conveying",
	};
}
