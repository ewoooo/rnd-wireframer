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
	const composites = useWorkbenchStore((state) => state.composites);
	const organisms = useWorkbenchStore((state) => state.organisms);
	const screenRoutes = useWorkbenchStore((state) => state.screenRoutes);
	const selectedAgentNode = useWorkbenchStore((state) => state.selectedAgentNode);
	const selectedCompositeCode = useWorkbenchStore((state) => state.selectedCompositeCode);
	const selectedOrganismCode = useWorkbenchStore((state) => state.selectedOrganismCode);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);
	const selectedScreenCode = useWorkbenchStore((state) => state.selectedScreenCode);
	const selectAgentNode = useWorkbenchStore((state) => state.selectAgentNode);
	const selectComposite = useWorkbenchStore((state) => state.selectComposite);
	const selectOrganism = useWorkbenchStore((state) => state.selectOrganism);
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
								{organisms.map((organism) => (
									<button
										type="button"
										key={organism.code}
										className={cn(
											"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
											organism.code === selectedOrganismCode && "border-primary bg-primary/5",
										)}
										onClick={() => selectOrganism(organism.code)}
									>
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-medium">{organism.name}</p>
											<Badge variant="secondary">{organism.usage}</Badge>
										</div>
										<p className="mt-1 text-xs text-muted-foreground">{organism.code}</p>
										<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
											<span>{organism.stateCount} states</span>
											<span>{organism.compositeCount} composites</span>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					) : null}
					{activeTab === "comp" ? (
						<ScrollArea className="h-[calc(100vh-32px)]">
							<div className="flex flex-col gap-2 pr-3">
								{composites.map((composite) => (
									<button
										type="button"
										key={composite.code}
										className={cn(
											"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
											composite.code === selectedCompositeCode && "border-primary bg-primary/5",
										)}
										onClick={() => selectComposite(composite.code)}
									>
										<div className="flex items-center justify-between gap-2">
											<p className="truncate text-sm font-medium">{composite.name}</p>
											<Badge variant="secondary">{composite.type}</Badge>
										</div>
										<p className="mt-1 truncate text-xs text-muted-foreground">{composite.code}</p>
										<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
											<span>{composite.sourceScreenCode}</span>
											<span>{composite.parentOrganismCode ?? "screen"}</span>
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
