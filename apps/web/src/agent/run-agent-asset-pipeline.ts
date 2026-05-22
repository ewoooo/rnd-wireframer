import type { GeneratedNodeTree, RegisteredNodeTree } from "@cx/agent";
import { registerAssets } from "@cx/agent";

export function runAgentPhase1Register(input: GeneratedNodeTree): RegisteredNodeTree {
	return registerAssets(input);
}
