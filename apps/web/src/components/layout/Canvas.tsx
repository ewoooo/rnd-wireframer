import { RenderTreeNodeRenderer } from "@cx/renderer";
import type { SelectedAgentAsset } from "@/agent/agent-registry-view";
import { AgentRegistryPreview } from "@/components/agent/AgentRegistryPreview";
import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import {
	getWorkbenchAreaSelection,
	getWorkbenchComponentSelection,
	getWorkbenchScreenData,
	getWorkbenchScreenNode,
	type WorkbenchRenderSelection,
} from "@/data/local-workbench-data-loader";
import { useWorkbenchStore } from "@/model/store";
import { RenderedScreen } from "../screen/RenderedScreen";

export function Canvas() {
	const isComponentView = useWorkbenchStore((state) => state.isComponentView);
	const isAreaView = useWorkbenchStore((state) => state.isAreaView);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const areaOrderOverrides = useWorkbenchStore((state) => state.areaOrderOverrides);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);
	const selectedAgentNode = useWorkbenchStore((state) => state.selectedAgentNode);
	const selectedComponentCode = useWorkbenchStore((state) => state.selectedComponentCode);
	const selectedAreaCode = useWorkbenchStore((state) => state.selectedAreaCode);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);

	const selectAgentNode = useWorkbenchStore((state) => state.selectAgentNode);
	const selectedComponent = isComponentView
		? getWorkbenchComponentSelection(selectedComponentCode, areaOrderOverrides)
		: undefined;
	const selectedArea = isAreaView
		? getWorkbenchAreaSelection(selectedAreaCode, areaOrderOverrides)
		: undefined;
	const screenNode = selectedScreen
		? getWorkbenchScreenNode(selectedScreen.code, areaOrderOverrides)
		: undefined;
	const screenData = selectedScreen ? getWorkbenchScreenData(selectedScreen.code) : undefined;

	return (
		<SidebarInset>
			<SidebarHeader className="border-b border-sidebar-border">
				<h1 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
					{getCanvasTitle({
						activeTab,
						isComponentView,
						isAreaView,
						selectedAgentAsset,
						selectedComponent,
						selectedArea,
					})}
				</h1>
			</SidebarHeader>
			<SidebarContent className="items-center justify-center bg-secondary/50 p-6">
				{activeTab === "agent" ? (
					<AgentRegistryPreview
						registry={agentRegistry}
						selectedAsset={selectedAgentAsset}
						selectedNode={selectedAgentNode}
						onSelectNode={selectAgentNode}
					/>
				) : isComponentView && selectedComponent ? (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						<div className="size-full overflow-y-auto bg-background p-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							<RenderTreeNodeRenderer data={selectedComponent.data} node={selectedComponent.node} />
						</div>
					</div>
				) : isAreaView && selectedArea ? (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						<div className="size-full overflow-y-auto bg-background p-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							<RenderTreeNodeRenderer data={selectedArea.data} node={selectedArea.node} />
						</div>
					</div>
				) : (
					<RenderedScreen data={screenData} node={screenNode} />
				)}
			</SidebarContent>
		</SidebarInset>
	);
}

function getCanvasTitle({
	activeTab,
	isComponentView,
	isAreaView,
	selectedAgentAsset,
	selectedComponent,
	selectedArea,
}: {
	activeTab: string;
	isComponentView: boolean;
	isAreaView: boolean;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedComponent?: WorkbenchRenderSelection;
	selectedArea?: WorkbenchRenderSelection;
}) {
	if (activeTab === "agent") return selectedAgentAsset?.item.name ?? "Agent Registry";
	if (isComponentView) return selectedComponent?.node.metadata.title;
	if (isAreaView) return selectedArea?.node.metadata.title;
	return null;
}
