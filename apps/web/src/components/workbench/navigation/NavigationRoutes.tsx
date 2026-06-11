import type { ReactNode } from "react";
import { ICONS } from "@/components/icons";
import { Aside, Panel } from "@/components/layout/Aside";
import { ScreenVariantCard } from "@/components/screen/ScreenVariantCard";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import { NewScreenSourcePanel } from "@/feature/inference-new-screen/components/NewScreenSourcePanel";
import type { NewScreenRunItem } from "@/feature/inference-new-screen/types";
import type {
	NavigationNodeItem,
	NavigatorTab,
	ScreenModuleGroup,
	ScreenRouteGroup,
} from "@/model/workbench-view-model";

// 도메인/루트 선택 패널: UI를 재설계할 예정이라 잠시 숨긴다(핸들러·데이터 로직은 유지 → 플래그만 켜면 복구).
const SHOW_DOMAINS = false;

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

/**
 * LeftAside — 모든 페이지(scn/ogn/comp)가 동일한 2패널 구조를 공유한다.
 *   좌상단: 편집할 x 선택 (탭별 내용만 교체 — 슬롯)
 *   좌하단: 레이어 패널 (순서·계층, 현재는 placeholder)
 * 패널 위치/chrome은 고정이고, 안에 들어가는 내용만 탭에 따라 꽂힌다.
 */
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
	// Run 탭은 별도 패널(4패널 규칙 밖) — 현행 유지.
	if (activeTab === "agent") {
		return (
			<Sidebar side="left">
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
			</Sidebar>
		);
	}

	return (
		<Aside side="left">
			{/* (숨김) 도메인/루트 선택 — 플래그 복구 시 좌상단 위에 추가됨 */}
			{SHOW_DOMAINS ? (
				<Panel
					title="Domains"
					icon={<ICONS.domain className="size-3.5" data-icon="inline-start" />}
					count={screenModules.length}
					defaultSize={30}
					minSize={15}
				>
					{screenModules.map((module) => (
						<ScreenModuleGroupView
							key={module.id}
							activeRouteId={activeRouteId}
							module={module}
							onSelectRoute={onSelectRoute}
						/>
					))}
				</Panel>
			) : null}

			{/* 좌상단: 편집할 x 선택 */}
			{activeTab === "scn" ? (
				<Panel
					title="Screens"
					icon={<ICONS.screen className="size-3.5" data-icon="inline-start" />}
					count={screenRoute?.variants.length ?? 0}
					defaultSize={62}
					minSize={20}
					bodyClassName="py-0 [&>*:first-child]:border-t-0"
				>
					{screenRoute?.variants.map((variant) => (
						<ScreenVariantCard
							key={variant.id}
							onSelectScreen={onSelectScreen}
							selectedScreenId={selectedScreenId}
							variant={variant}
						/>
					))}
				</Panel>
			) : activeTab === "ogn" ? (
				<Panel
					title="Areas"
					icon={<ICONS.area className="size-3.5" data-icon="inline-start" />}
					count={areas.length}
					defaultSize={62}
					minSize={20}
				>
					<NodeListBody
						emptyMessage="등록된 Area가 없습니다."
						items={areas}
						onSelect={onSelectArea}
						selectedId={selectedAreaId}
					/>
				</Panel>
			) : activeTab === "comp" ? (
				<Panel
					title="Components"
					icon={<ICONS.component className="size-3.5" data-icon="inline-start" />}
					count={components.length}
					defaultSize={62}
					minSize={20}
				>
					<NodeListBody
						emptyMessage="등록된 Component가 없습니다."
						items={components}
						onSelect={onSelectComponent}
						selectedId={selectedComponentId}
					/>
				</Panel>
			) : (
				<Panel title="Screen" defaultSize={62} minSize={20}>
					<div className="px-3 py-2 text-sm text-muted-foreground">
						이 탭은 예전 사이드바 UI만 복구된 상태입니다.
					</div>
				</Panel>
			)}

			{/* 좌하단: 레이어 패널 (순서·계층 — 준비 중) */}
			<Panel
				title="Layer"
				icon={<ICONS.layers className="size-3.5" data-icon="inline-start" />}
				defaultSize={38}
				minSize={15}
			>
				<div className="px-3 py-3 text-xs leading-5 text-muted-foreground">
					레이어 패널 — 순서·계층 (준비 중)
				</div>
			</Panel>
		</Aside>
	);
}

function NodeListBody({
	emptyMessage,
	items,
	onSelect,
	selectedId,
}: {
	emptyMessage: string;
	items: NavigationNodeItem[];
	onSelect: (id: string) => void;
	selectedId?: string;
}) {
	if (!items.length) {
		return <div className="px-3 py-4 text-sm text-muted-foreground">{emptyMessage}</div>;
	}
	return (
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
