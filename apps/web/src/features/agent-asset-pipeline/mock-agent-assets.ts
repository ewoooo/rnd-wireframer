import type { RegisterAssetsInput } from "@cx/agent";
import agentAssets from "../../../../../database/ai-imports/agent-assets.generated.json";
import { runAgentPhase1Register } from "./run-agent-asset-pipeline";

export const mockAgentAssetRegistry = runAgentPhase1Register(agentAssets as RegisterAssetsInput);
