import { useEffect, useState } from "react";
import { AgentRegistryNavigation } from "@/components/agent/AgentRegistryNavigation";
import { Badge } from "@/components/ui/badge";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import type { AppScreenRoute } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { ScreenVariantCard } from "../screen/ScreenVariantCard";

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

	const [activeRouteCode, setActiveRouteCode] = useState<string>(() => screenRoutes[0]?.code ?? "");

	// 캔버스 선택 → 루트 셀렉터 동기화
	useEffect(() => {
		if (selectedScreen?.screenRouteId) {
			setActiveRouteCode(selectedScreen.screenRouteId);
		}
	}, [selectedScreen?.screenRouteId]);

	// 초기 데이터 로드 후 세팅
	useEffect(() => {
		if (!activeRouteCode && screenRoutes.length > 0) {
			setActiveRouteCode(screenRoutes[0].code);
		}
	}, [screenRoutes, activeRouteCode]);

	const activeRoute =
		screenRoutes.find((r) => r.code === activeRouteCode) ?? screenRoutes[0];

	return (
		<Sidebar side="left">
			{activeTab === "scn" ? (
				<ResizablePanelGroup orientation="vertical" className="h-full">
					{/* ── A: 루트 목록 ── */}
					<ResizablePanel defaultSize={35} minSize={15}>
						<div className="flex h-full flex-col overflow-hidden">
							<div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
								{screenRoutes.map((route) => (
									<RouteListItem
										key={route.code}
										isActive={route.code === activeRoute?.code}
										route={route}
										onSelect={() => {
											setActiveRouteCode(route.code);
											selectScreenRoute(route.code);
										}}
									/>
								))}
							</div>
						</div>
					</ResizablePanel>

					<ResizableHandle />

					{/* ── B+C: 선택된 루트 상세 + 스크린 목록 ── */}
					<ResizablePanel defaultSize={65} minSize={20}>
						<div className="flex h-full flex-col overflow-hidden">
							{activeRoute && (
								<>
									<div className="shrink-0 px-3 py-3">
										<p className="truncate text-sm font-semibold leading-snug">
											{activeRoute.name}
										</p>
										<p className="mt-0.5 truncate text-xs text-muted-foreground">
											{activeRoute.code}
										</p>
										<div className="mt-2 flex items-center gap-2">
											<Badge variant="secondary">{activeRoute.module}</Badge>
											<span className="text-xs text-muted-foreground">
												{activeRoute.screenCount} screens
											</span>
										</div>
									</div>
									<Separator />
								</>
							)}
							<div className="min-h-0 flex-1 overflow-y-auto">
								{activeRoute?.screenVariants.map((variant) => (
									<ScreenVariantCard
										key={variant.id}
										onSelect={selectScreenVariant}
										screenVariant={variant}
										selectedScreenCode={selectedScreenCode}
									/>
								))}
							</div>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			) : (
				<SidebarContent className="p-2">
					{activeTab === "ogn" ? (
						<div className="flex flex-col gap-2">
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
					) : null}
					{activeTab === "comp" ? (
						<div className="flex flex-col gap-2">
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
					) : null}
					{activeTab === "agent" ? (
						<AgentRegistryNavigation
							registry={agentRegistry}
							selectedNode={selectedAgentNode}
							onSelectNode={selectAgentNode}
						/>
					) : null}
				</SidebarContent>
			)}
		</Sidebar>
	);
}

function RouteListItem({
	isActive,
	route,
	onSelect,
}: {
	isActive: boolean;
	route: AppScreenRoute;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
				isActive && "bg-primary/10 text-primary",
			)}
			onClick={onSelect}
		>
			<span className={cn("truncate text-sm", isActive ? "font-semibold" : "font-normal")}>
				{route.name}
			</span>
			<span className="shrink-0 text-xs text-muted-foreground">{route.screenCount}</span>
		</button>
	);
}
