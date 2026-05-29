import { ScreenVariantCard } from "@/components/screen/ScreenVariantCard";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import type {
	NavigatorTab,
	ScreenModuleGroup,
	ScreenRouteGroup,
} from "@/model/workbench-view-model";

type NavigationPanelProps = {
	activeRouteId?: string;
	activeTab: NavigatorTab;
	onSelectRoute: (routeId: string) => void;
	onSelectScreen: (screenId: string) => void;
	screenModules: ScreenModuleGroup[];
	screenRoute?: ScreenRouteGroup;
	selectedScreenId?: string;
};

export function NavigationPanel({
	activeRouteId,
	activeTab,
	onSelectRoute,
	onSelectScreen,
	screenModules,
	screenRoute,
	selectedScreenId,
}: NavigationPanelProps) {
	return (
		<Sidebar side="left">
			{activeTab === "scn" ? (
				<ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1 overflow-hidden">
					<ResizablePanel defaultSize={35} minSize={15}>
						<div className="h-full min-h-0 overflow-y-auto py-1">
							{screenModules.map((module) => (
								<ScreenModuleGroupView
									key={module.id}
									activeRouteId={activeRouteId}
									module={module}
									onSelectRoute={onSelectRoute}
								/>
							))}
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={65} minSize={20}>
						<div className="flex h-full min-h-0 flex-col overflow-hidden">
							<div className="min-h-0 flex-1 overflow-y-auto [&>*:first-child]:border-t-0">
								{screenRoute?.variants.map((variant) => (
									<ScreenVariantCard
										key={variant.id}
										onSelectScreen={onSelectScreen}
										selectedScreenId={selectedScreenId}
										variant={variant}
									/>
								))}
							</div>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			) : (
				<SidebarContent className="p-2 text-sm text-muted-foreground">
					이 탭은 예전 사이드바 UI만 복구된 상태입니다. 데이터 연결은 Screen 탭부터 사용합니다.
				</SidebarContent>
			)}
		</Sidebar>
	);
}

function ScreenModuleGroupView({
	activeRouteId,
	module,
	onSelectRoute,
}: {
	activeRouteId?: string;
	module: ScreenModuleGroup;
	onSelectRoute: (routeId: string) => void;
}) {
	return (
		<div className="flex flex-col">
			{module.routes.map((route) => (
				<div
					key={route.id}
					className={cn(
						"group relative flex h-8 min-w-0 items-center gap-1 px-2 transition-colors hover:bg-sidebar-accent",
						route.id === activeRouteId && "bg-primary/[0.08] text-primary",
					)}
				>
					<button
						type="button"
						className="flex min-w-0 flex-1 cursor-pointer flex-col justify-center pl-2 text-left"
						onClick={() => onSelectRoute(route.id)}
					>
						<span
							className={cn(
								"truncate text-[13px] leading-4",
								route.id === activeRouteId ? "font-semibold" : "font-medium",
							)}
						>
							{route.name}
						</span>
						<span className="truncate text-[10px] leading-3 text-muted-foreground/60">
							{route.id}
						</span>
					</button>
					<span className="min-w-5 shrink-0 text-right text-[11px] text-muted-foreground">
						{route.screenCount}
					</span>
				</div>
			))}
		</div>
	);
}
