import { Copy } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cloneOrganism } from "@/app/actions/screen-actions";
import { AgentRegistryNavigation } from "@/components/agent/AgentRegistryNavigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import type { AppScreenRoute } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { ScreenVariantCard } from "../screen/ScreenVariantCard";

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
				<div className="flex h-full min-h-0 flex-col overflow-hidden">
					{/* ── A: 루트 목록 (스크롤 가능) ── */}
					<div className="flex min-h-0 flex-col overflow-hidden" style={{ maxHeight: "40%" }}>
						<p className="shrink-0 px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
							루트
						</p>
						<div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
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

					<Separator />

					{/* ── B: 선택된 루트 상세 ── */}
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

					{/* ── C: 스크린 목록 (스크롤 가능) ── */}
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
			) : (
				<SidebarContent className="p-2">
					{activeTab === "ogn" ? (
						<div className="flex flex-col gap-2">
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
					) : null}
					{activeTab === "comp" ? (
						<div className="flex flex-col gap-2">
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
