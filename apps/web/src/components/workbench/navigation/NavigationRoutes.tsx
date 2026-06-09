import { Box, Boxes, Layers3, Route } from "lucide-react";
import type { ReactNode } from "react";
import { ScreenVariantCard } from "@/components/screen/ScreenVariantCard";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import {
	type NewScreenRunItem,
	NewScreenSourcePanel,
} from "@/components/workbench/new-screen/NewScreenSourcePanel";
import type {
	NavigationNodeItem,
	NavigatorTab,
	ScreenModuleGroup,
	ScreenRouteGroup,
} from "@/model/workbench-view-model";

type NavigationRoutesProps = {
	activeRouteId?: string;
	activeTab: NavigatorTab;
	areas: NavigationNodeItem[];
	components: NavigationNodeItem[];
	onSelectRoute: (routeId: string) => void;
	onSelectScreen: (screenId: string) => void;
	onSelectArea: (areaId: string) => void;
	onSelectComponent: (componentId: string) => void;
	onSelectNewScreenSource?: (id: string) => void;
	screenModules: ScreenModuleGroup[];
	screenRoute?: ScreenRouteGroup;
	newScreenSourceError?: string;
	newScreenSources?: NewScreenRunItem[];
	onRerunSelectedNewScreenSource?: () => void;
	onRunSelectedNewScreenSource?: () => void;
	onUploadNewScreenSource?: (file: File) => void | Promise<void>;
	selectedAreaId?: string;
	selectedComponentId?: string;
	selectedNewScreenRunId?: string;
	selectedScreenId?: string;
	isUploadingNewScreenSource?: boolean;
};

export function NavigationRoutes({
	activeRouteId,
	activeTab,
	areas,
	components,
	onSelectRoute,
	onSelectScreen,
	onSelectArea,
	onSelectComponent,
	onSelectNewScreenSource,
	screenModules,
	screenRoute,
	newScreenSourceError,
	newScreenSources = [],
	onRerunSelectedNewScreenSource,
	onRunSelectedNewScreenSource,
	onUploadNewScreenSource,
	selectedAreaId,
	selectedComponentId,
	selectedNewScreenRunId,
	selectedScreenId,
	isUploadingNewScreenSource = false,
}: NavigationRoutesProps) {
	return (
		<Sidebar side="left">
			{activeTab === "agent" ? (
				<NewScreenSourcePanel
					errorMessage={newScreenSourceError}
					isUploading={isUploadingNewScreenSource}
					onRerunSelectedSource={onRerunSelectedNewScreenSource}
					onRunSelectedSource={onRunSelectedNewScreenSource}
					onSelectSource={onSelectNewScreenSource ?? (() => {})}
					onUploadSource={onUploadNewScreenSource ?? (() => {})}
					runs={newScreenSources}
					selectedRunId={selectedNewScreenRunId}
				/>
			) : activeTab === "scn" ? (
				<ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1 overflow-hidden">
					<ResizablePanel defaultSize={35} minSize={15}>
						<div className="flex h-full min-h-0 flex-col overflow-hidden">
							<PanelTitle
								count={screenModules.length}
								icon={<Layers3 className="size-3.5" data-icon="inline-start" />}
								title="Domains"
							/>
							<div className="min-h-0 flex-1 overflow-y-auto py-1">
								{screenModules.map((module) => (
									<ScreenModuleGroupView
										key={module.id}
										activeRouteId={activeRouteId}
										module={module}
										onSelectRoute={onSelectRoute}
									/>
								))}
							</div>
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={65} minSize={20}>
						<div className="flex h-full min-h-0 flex-col overflow-hidden">
							<PanelTitle
								count={screenRoute?.variants.length ?? 0}
								icon={<Route className="size-3.5" data-icon="inline-start" />}
								title={screenRoute?.name ?? "Screens"}
							/>
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
			) : activeTab === "ogn" ? (
				<NavigationNodeList
					emptyMessage="등록된 Area가 없습니다."
					icon={<Boxes className="size-3.5" data-icon="inline-start" />}
					items={areas}
					onSelect={onSelectArea}
					selectedId={selectedAreaId}
					title="Areas"
				/>
			) : activeTab === "comp" ? (
				<NavigationNodeList
					emptyMessage="등록된 Component가 없습니다."
					icon={<Box className="size-3.5" data-icon="inline-start" />}
					items={components}
					onSelect={onSelectComponent}
					selectedId={selectedComponentId}
					title="Components"
				/>
			) : (
				<SidebarContent className="p-2 text-sm text-muted-foreground">
					이 탭은 예전 사이드바 UI만 복구된 상태입니다. 데이터 연결은 Screen 탭부터 사용합니다.
				</SidebarContent>
			)}
		</Sidebar>
	);
}

function NavigationNodeList({
	emptyMessage,
	icon,
	items,
	onSelect,
	selectedId,
	title,
}: {
	emptyMessage: string;
	icon: ReactNode;
	items: NavigationNodeItem[];
	onSelect: (id: string) => void;
	selectedId?: string;
	title: string;
}) {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden">
			<PanelTitle count={items.length} icon={icon} title={title} />
			<div className="min-h-0 flex-1 overflow-y-auto py-1">
				{items.length ? (
					<div className="flex flex-col">
						{items.map((item) => (
							<NavigationNodeListItem
								isSelected={item.id === selectedId}
								item={item}
								key={item.id}
								onSelect={onSelect}
							/>
						))}
					</div>
				) : (
					<div className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage}</div>
				)}
			</div>
		</div>
	);
}

function NavigationNodeListItem({
	isSelected,
	item,
	onSelect,
}: {
	isSelected: boolean;
	item: NavigationNodeItem;
	onSelect: (id: string) => void;
}) {
	return (
		<button
			type="button"
			className={cn(
				"flex min-h-14 min-w-0 cursor-pointer flex-col gap-1 border-t border-sidebar-border px-3 py-2 text-left transition-colors first:border-t-0 hover:bg-sidebar-accent",
				isSelected && "bg-primary/[0.08] text-primary hover:bg-primary/[0.08]",
			)}
			onClick={() => onSelect(item.id)}
			title={`${item.title} · ${item.type}`}
		>
			<div className="flex min-w-0 items-center justify-between gap-2">
				<span className={cn("truncate text-[13px]", isSelected ? "font-semibold" : "font-medium")}>
					{item.title}
				</span>
				<span className="shrink-0 rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
					{item.childCount}
				</span>
			</div>
			<div className="flex min-w-0 flex-col gap-0.5 text-[10px] leading-3 text-muted-foreground">
				<span className="truncate">{item.id}</span>
				<span className="truncate">{item.screenTitle}</span>
				<span className="truncate">{item.layout ?? item.type}</span>
			</div>
		</button>
	);
}

function PanelTitle({ count, icon, title }: { count: number; icon: ReactNode; title: string }) {
	return (
		<div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-3">
			<div className="flex min-w-0 items-center gap-1.5">
				{icon}
				<p className="truncate text-xs font-semibold text-sidebar-foreground">{title}</p>
			</div>
			<span className="shrink-0 rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
				{count}
			</span>
		</div>
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
