import { mockAgentAssetRegistry } from "@/features/agent-asset-pipeline/mock-agent-assets";
import {
	organismCatalog,
	wireframeWorkbenchData,
} from "@/features/wireframe-renderer/mock-wireframe-data";
import { WireframeWorkbench } from "@/widgets/wireframe-renderer/wireframe-workbench";

export default function Home() {
	return (
		<WireframeWorkbench
			agentRegistry={mockAgentAssetRegistry}
			organisms={organismCatalog}
			screens={wireframeWorkbenchData}
		/>
	);
}
