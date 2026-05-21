import type { AssetRegistry, RegisterAssetsInput } from "@cx/agent";
import { registerAssets } from "@cx/agent";

export function runAgentPhase1Register(input: RegisterAssetsInput): AssetRegistry {
	return registerAssets(input);
}
