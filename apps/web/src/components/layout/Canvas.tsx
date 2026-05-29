import { RenderTreeNodeRenderer } from "@cx/renderer";
import { Puck } from "@measured/puck";
import type { SelectedAgentAsset } from "@/agent/agent-registry-view";
import { AgentRegistryPreview } from "@/components/agent/AgentRegistryPreview";
import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import type { SelectedComponentContext, SelectedAreaContext } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { RenderedScreen } from "../screen/RenderedScreen";

export function Canvas() {
	const isComponentView = useWorkbenchStore((state) => state.isComponentView);
	const isAreaView = useWorkbenchStore((state) => state.isAreaView);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const screenNode = useWorkbenchStore((state) => state.screenNode);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);
	const selectedAgentNode = useWorkbenchStore((state) => state.selectedAgentNode);
	const selectedComponent = useWorkbenchStore((state) => state.selectedComponent);
	const selectedArea = useWorkbenchStore((state) => state.selectedArea);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);

	const activeRouteId = useWorkbenchStore((state) => state.activeRouteId);
	const screenRoutes = useWorkbenchStore((state) => state.screenRoutes);
	const selectAgentNode = useWorkbenchStore((state) => state.selectAgentNode);

	const isScreenTab = activeTab !== "agent" && !isComponentView && !isAreaView;
	const activeRoute = screenRoutes.find((r) => r.code === activeRouteId);

	let canvasEmptyMessage: string | undefined;
	if (isScreenTab && !selectedScreen) {
		canvasEmptyMessage = "스크린을 선택해주세요.";
	}

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
			<SidebarContent className="items-center justify-center bg-muted p-6">
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
							<RenderTreeNodeRenderer
								data={selectedComponent.screen.schema.data}
								node={selectedComponent.node}
							/>
						</div>
					</div>
				) : isAreaView && selectedArea ? (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						<div className="size-full overflow-y-auto bg-background p-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							<RenderTreeNodeRenderer
								data={selectedArea.screen.schema.data}
								node={selectedArea.node}
							/>
						</div>
					</div>
				) : canvasEmptyMessage ? (
					<RenderedScreen emptyMessage={canvasEmptyMessage} />
				) : (
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-xl">
						<div className="size-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
							<Puck.Preview />
						</div>
					</div>
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
	selectedComponent?: SelectedComponentContext;
	selectedArea?: SelectedAreaContext;
}) {
	if (activeTab === "agent") return selectedAgentAsset?.item.name ?? "Agent Registry";
	if (isComponentView) return selectedComponent?.node.metadata.title;
	if (isAreaView) return selectedArea?.node.metadata.title;
	return null;
}
