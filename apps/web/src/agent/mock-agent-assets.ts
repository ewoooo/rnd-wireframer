import type { GeneratedNodeTree } from "@cx/agent/types";
import agentAssets from "../../../../database/ai-imports/agent-assets.json";
import { runAgentPhase1Register } from "./run-agent-asset-pipeline";

export const mockAgentAssetRegistry = runAgentPhase1Register(agentAssets as GeneratedNodeTree);
