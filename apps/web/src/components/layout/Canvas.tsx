import { SystemHeader } from "@cx/layout/chrome";
import { RenderTreeNodeRenderer } from "@cx/renderer";
import { Puck } from "@measured/puck";
import { Bot, Box, Boxes, Smartphone } from "lucide-react";
import type { ComponentType } from "react";
import type { SelectedAgentAsset } from "@/agent/agent-registry-view";
import { AgentRegistryPreview } from "@/components/agent/AgentRegistryPreview";
import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import type { SelectedAreaContext, SelectedComponentContext } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { RenderedScreen } from "../screen/RenderedScreen";
import { CanvasToolbar } from "./CanvasToolbar";
import { ExportToolbar } from "./ExportToolbar";

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
	const showStatusBar = useWorkbenchStore((state) => state.showStatusBar);
	const darkMode = useWorkbenchStore((state) => state.darkMode);

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
				{(() => {
					const { kind, title } = getCanvasHeader({
						activeTab,
						isComponentView,
						isAreaView,
						selectedAgentAsset,
						selectedComponent,
						selectedArea,
						selectedScreen,
					});
					const { label, Icon } = CANVAS_KIND[kind];
					return (
						<div className="flex h-8 items-center gap-2 tracking-normal">
							<Icon className="size-4 shrink-0 text-muted-foreground" />
							<span className="font-medium text-muted-foreground text-sm">{label}</span>
							{title ? (
								<span className="truncate font-semibold text-base leading-none">{title}</span>
							) : null}
						</div>
					);
				})()}
			</SidebarHeader>
			<SidebarContent className="items-center justify-center bg-muted p-6">
				<div className="flex flex-col items-center gap-6">
					<CanvasToolbar />
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
								<Puck.Preview />
							</div>
						</div>
					) : canvasEmptyMessage ? (
						<RenderedScreen emptyMessage={canvasEmptyMessage} />
					) : (
						<div
							className={cn(
								"flex h-211 w-98 max-w-full flex-col overflow-hidden border shadow-xl",
								showStatusBar ? "rounded-[28px]" : "rounded-none",
								darkMode ? "bg-neutral-200" : "bg-background",
							)}
						>
							{showStatusBar ? <SystemHeader /> : null}
							<div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
								{/* TODO(임시): 하드코딩 스크린 컨테이너 — 콘텐츠 여백(p-7). 정식 container 정보 도입 시 제거 */}
								<div className="p-7">
									<Puck.Preview />
								</div>
							</div>
						</div>
					)}
					<ExportToolbar />
				</div>
			</SidebarContent>
		</SidebarInset>
	);
}

type CanvasKind = "screen" | "area" | "component" | "agent";

const CANVAS_KIND: Record<
	CanvasKind,
	{ label: string; Icon: ComponentType<{ className?: string }> }
> = {
	screen: { label: "Screen", Icon: Smartphone },
	area: { label: "Area", Icon: Boxes },
	component: { label: "Component", Icon: Box },
	agent: { label: "Agent", Icon: Bot },
};

function getCanvasHeader({
	activeTab,
	isComponentView,
	isAreaView,
	selectedAgentAsset,
	selectedComponent,
	selectedArea,
	selectedScreen,
}: {
	activeTab: string;
	isComponentView: boolean;
	isAreaView: boolean;
	selectedAgentAsset?: SelectedAgentAsset;
	selectedComponent?: SelectedComponentContext;
	selectedArea?: SelectedAreaContext;
	selectedScreen?: { name: string };
}): { kind: CanvasKind; title?: string } {
	if (activeTab === "agent") return { kind: "agent", title: selectedAgentAsset?.item.name };
	if (isComponentView) return { kind: "component", title: selectedComponent?.node.metadata.title };
	if (isAreaView) return { kind: "area", title: selectedArea?.node.metadata.title };
	return { kind: "screen", title: selectedScreen?.name };
}
