import { AgentRegistryNavigation } from "@/components/agent/AgentRegistryNavigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import { useWorkbenchStore } from "@/model/store";
import { ScreenRouteCard } from "../screen/ScreenRouteCard";
import { NavigationRail } from "./NavigationRail";

export function NavigationPanel() {
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const components = useWorkbenchStore((state) => state.components);
	const areas = useWorkbenchStore((state) => state.areas);
	const screenRoutes = useWorkbenchStore((state) => state.screenRoutes);
	const selectedAgentNode = useWorkbenchStore((state) => state.selectedAgentNode);
	const selectedComponentCode = useWorkbenchStore((state) => state.selectedComponentCode);
	const selectedAreaCode = useWorkbenchStore((state) => state.selectedAreaCode);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);
	const selectedScreenCode = useWorkbenchStore((state) => state.selectedScreenCode);
	const selectAgentNode = useWorkbenchStore((state) => state.selectAgentNode);
	const selectComponent = useWorkbenchStore((state) => state.selectComponent);
	const selectArea = useWorkbenchStore((state) => state.selectArea);
	const selectScreenRoute = useWorkbenchStore((state) => state.selectScreenRoute);
	const selectScreenVariant = useWorkbenchStore((state) => state.selectScreenVariant);
	const selectTab = useWorkbenchStore((state) => state.selectTab);

	return (
		<Sidebar side="left">
			<SidebarContent className="flex-row gap-0 overflow-hidden p-0">
				<NavigationRail activeTab={activeTab} onSelectTab={selectTab} />
				<div className="min-w-0 flex-1 p-2">
					{activeTab === "scn" ? (
						<ScrollArea className="h-[calc(100vh-32px)]">
							<div className="flex flex-col gap-2">
								{screenRoutes.map((route) => (
									<ScreenRouteCard
										key={route.code}
										isSelected={route.code === selectedScreen?.screenRouteId}
										onSelectRoute={selectScreenRoute}
										onSelectVariant={selectScreenVariant}
										route={route}
										selectedScreenCode={selectedScreenCode}
									/>
								))}
							</div>
						</ScrollArea>
					) : null}
					{activeTab === "ogn" ? (
						<ScrollArea className="h-[calc(100vh-32px)]">
							<div className="flex flex-col gap-2 pr-3">
								{areas.map((area) => (
									<button
										type="button"
										key={area.code}
										className={cn(
											"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
											area.code === selectedAreaCode && "border-primary bg-primary/5",
										)}
										onClick={() => selectArea(area.code)}
									>
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-medium">{area.name}</p>
											<Badge variant="secondary">{area.usage}</Badge>
										</div>
										<p className="mt-1 text-xs text-muted-foreground">{area.code}</p>
										<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
											<span>{area.stateCount} states</span>
											<span>{area.componentCount} components</span>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					) : null}
					{activeTab === "comp" ? (
						<ScrollArea className="h-[calc(100vh-32px)]">
							<div className="flex flex-col gap-2 pr-3">
								{components.map((component) => (
									<button
										type="button"
										key={component.code}
										className={cn(
											"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
											component.code === selectedComponentCode && "border-primary bg-primary/5",
										)}
										onClick={() => selectComponent(component.code)}
									>
										<div className="flex items-center justify-between gap-2">
											<p className="truncate text-sm font-medium">{component.name}</p>
											<Badge variant="secondary">{component.type}</Badge>
										</div>
										<p className="mt-1 truncate text-xs text-muted-foreground">{component.code}</p>
										<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
											<span>{component.sourceScreenCode}</span>
											<span>{component.parentAreaCode ?? "screen"}</span>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					) : null}
					{activeTab === "agent" ? (
						<ScrollArea className="h-[calc(100vh-32px)]">
							<AgentRegistryNavigation
								registry={agentRegistry}
								selectedNode={selectedAgentNode}
								onSelectNode={selectAgentNode}
							/>
						</ScrollArea>
					) : null}
				</div>
			</SidebarContent>
		</Sidebar>
	);
}
