import type { Engine } from "../contracts";

/** Stub until the Claude Agent SDK execution path is wired. Throws so misuse is loud. */
export function createClaudeEngine(): Engine {
	return {
		async execute() {
			throw new Error("claude engine not implemented yet");
		},
	};
}
