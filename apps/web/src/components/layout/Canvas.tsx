import { WireframeNodeRenderer } from "@cx/renderer";
import type { SelectedAgentAsset } from "@/agent/agent-registry-view";
import { AgentRegistryPreview } from "@/components/agent/AgentRegistryPreview";
import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import type { SelectedCompositeContext, SelectedAreaContext } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { RenderedScreen } from "../screen/RenderedScreen";

export function Canvas() {
	const isCompositeView = useWorkbenchStore((state) => state.isCompositeView);
	const isAreaView = useWorkbenchStore((state) => state.isAreaView);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const screenNode = useWorkbenchStore((state) => state.screenNode);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);
	const selectedAgentNode = useWorkbenchStore((state) => state.selectedAgentNode);
	const selectedComposite = useWorkbenchStore((state) => state.selectedComposite);
	const selectedArea = useWorkbenchStore((state) => state.selectedArea);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);

	const selectAgentNode = useWorkbenchStore((state) => state.selectAgentNode);

	return (
		<SidebarInset>
			<SidebarHeader className="border-b border-sidebar-border">
				<h1 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
					{getCanvasTitle({
						activeTab,
						isCompositeView,
						isAreaView,
						selectedAgentAsset,
						selectedComposite,
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
				) : isCompositeView && selectedComposite ? (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						<div className="size-full overflow-y-auto bg-background p-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							<WireframeNodeRenderer
								data={selectedComposite.screen.schema.data}
								node={selectedComposite.node}
							/>
						</div>
					</div>
				) : isAreaView && selectedArea ? (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						<div className="size-full overflow-y-auto bg-background p-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							<WireframeNodeRenderer
								data={selectedArea.screen.schema.data}
								node={selectedArea.node}
							/>
						</div>
					</div>
				) : (
					<RenderedScreen data={selectedScreen?.schema.data} node={screenNode} />
				)}
			</SidebarContent>
		</SidebarInset>
	);
}

function getCanvasTitle({
	activeTab,
	isCompositeView,
	isAreaView,
	selectedAgentAsset,
	selectedComposite,
	selectedArea,
}: {
	activeTab: string;
	isCompositeView: boolean;
	isAreaView: boolean;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedComposite?: SelectedCompositeContext;
	selectedArea?: SelectedAreaContext;
}) {
	if (activeTab === "agent") return selectedAgentAsset?.item.name ?? "Agent Registry";
	if (isCompositeView) return selectedComposite?.node.metadata.title;
	if (isAreaView) return selectedArea?.node.metadata.title;
	return null;
}
