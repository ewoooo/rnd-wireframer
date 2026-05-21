import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/components/utils";
import type { NavigatorTab } from "../model/workbench-store";
import { useWorkbenchStore } from "../model/workbench-store";

export function WorkbenchPanelNavigation() {
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const components = useWorkbenchStore((state) => state.components);
	const organisms = useWorkbenchStore((state) => state.organisms);
	const screens = useWorkbenchStore((state) => state.screens);
	const selectedComponentCode = useWorkbenchStore((state) => state.selectedComponentCode);
	const selectedOrganismCode = useWorkbenchStore((state) => state.selectedOrganismCode);
	const selectedScreenCode = useWorkbenchStore((state) => state.selectedScreenCode);
	const selectComponent = useWorkbenchStore((state) => state.selectComponent);
	const selectOrganism = useWorkbenchStore((state) => state.selectOrganism);
	const selectScreen = useWorkbenchStore((state) => state.selectScreen);
	const selectTab = useWorkbenchStore((state) => state.selectTab);

	return (
		<Card className="flex min-h-0 flex-col">
			<CardContent className="min-h-0 flex-1">
				<Tabs
					value={activeTab}
					onValueChange={(value) => selectTab(toNavigatorTab(value))}
					className="h-full"
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="scn">SCN</TabsTrigger>
						<TabsTrigger value="ogn">OGN</TabsTrigger>
						<TabsTrigger value="comp">COMP</TabsTrigger>
					</TabsList>
					<TabsContent value="scn" className="min-h-0 flex-1">
						<ScrollArea className="h-[calc(100vh-180px)]">
							<div className="flex flex-col gap-2 pr-3">
								{screens.map((screen) => (
									<button
										type="button"
										key={screen.code}
										className={cn(
											"flex flex-col gap-1 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
											screen.code === selectedScreenCode && "border-primary bg-primary/5",
										)}
										onClick={() => selectScreen(screen.code)}
									>
										<span className="text-sm font-medium">{screen.name}</span>
										<span className="text-xs text-muted-foreground">{screen.code}</span>
										<span className="text-xs text-muted-foreground">
											{screen.screenRouteName} / {screen.screenVariantName}
										</span>
										<span className="text-xs text-muted-foreground">
											{screen.organisms.length} organisms
										</span>
									</button>
								))}
							</div>
						</ScrollArea>
					</TabsContent>
					<TabsContent value="ogn" className="min-h-0 flex-1">
						<ScrollArea className="h-[calc(100vh-180px)]">
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
											<span>{organism.componentCount} components</span>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					</TabsContent>
					<TabsContent value="comp" className="min-h-0 flex-1">
						<ScrollArea className="h-[calc(100vh-180px)]">
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
											<span>{component.parentOrganismCode ?? "screen"}</span>
										</div>
									</button>
								))}
							</div>
						</ScrollArea>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

function toNavigatorTab(value: string): NavigatorTab {
	if (value === "comp" || value === "ogn" || value === "scn") return value;
	return "scn";
}
