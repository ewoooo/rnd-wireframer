import { registerAssets } from "@cx/agent/register-assets";
import type { GeneratedNodeTree, RegisteredNodeTree } from "@cx/agent/types";

export function runAgentPhase1Register(input: GeneratedNodeTree): RegisteredNodeTree {
	return registerAssets(input);
}
