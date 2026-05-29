import { Copy, GripHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { ScreenVariantCard } from "@/components/screen/ScreenVariantCard";
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
		<aside className="flex h-svh w-[340px] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
			{activeTab === "scn" ? (
				<div className="grid min-h-0 flex-1 grid-rows-[minmax(140px,35fr)_6px_minmax(220px,65fr)] overflow-hidden">
					<div className="min-h-0 overflow-hidden">
						<div className="flex h-8 items-center border-b border-sidebar-border px-3">
							<span className="text-[10px] font-semibold uppercase text-muted-foreground">
								{screenModules.length}개 도메인
							</span>
						</div>
						<div className="min-h-0 h-[calc(100%-32px)] overflow-y-auto py-1">
							{screenModules.map((module) => (
								<ScreenModuleGroupView
									key={module.id}
									activeRouteId={activeRouteId}
									module={module}
									onSelectRoute={onSelectRoute}
								/>
							))}
							<div className="px-2 pt-1">
								<button
									type="button"
									className="flex h-7 w-full items-center gap-1.5 rounded px-2 text-left text-muted-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
									title="현재 로컬 테이블 미리보기에서는 도메인 추가가 비활성화되어 있습니다."
								>
									<Plus className="size-3" />
									<span className="text-[12px] font-medium">도메인 추가</span>
								</button>
							</div>
						</div>
					</div>
					<div className="group flex items-center justify-center border-y border-sidebar-border bg-background/40">
						<GripHorizontal className="size-3.5 text-muted-foreground/45 transition-colors group-hover:text-muted-foreground" />
					</div>
					<div className="min-h-0 overflow-y-auto [&>*:first-child]:border-t-0">
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
			) : (
				<div className="m-2 rounded-md border border-sidebar-border bg-background p-3 text-sm text-muted-foreground">
					이 탭은 예전 사이드바 UI만 복구된 상태입니다. 데이터 연결은 Screen 탭부터 사용합니다.
				</div>
			)}
		</aside>
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
		<section className="py-1">
			<div className="group flex h-6 items-center gap-1 px-3">
				<div className="flex min-w-0 flex-1 items-center gap-1">
					<span className="truncate text-[10px] font-semibold uppercase text-muted-foreground/70">
						{module.name}
					</span>
				</div>
				<PanelIconButton label="도메인 이름 편집" />
				<PanelIconButton icon="copy" label="도메인 복제" />
				<PanelIconButton icon="delete" label="도메인 삭제" />
			</div>
			<div className="flex flex-col">
				{module.routes.map((route) => (
					<div
						key={route.id}
						className={cn(
							"group relative flex h-8 min-w-0 items-center gap-1 px-2 transition-colors hover:bg-sidebar-accent",
							route.id === activeRouteId && "bg-primary/[0.08] text-primary",
						)}
					>
						{route.id === activeRouteId ? (
							<span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />
						) : null}
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
						<PanelIconButton label="루트 이름 편집" />
						<PanelIconButton icon="copy" label="루트 복제" />
						<PanelIconButton icon="delete" label="루트 삭제" />
						<span className="min-w-5 shrink-0 text-right text-[11px] text-muted-foreground">
							{route.screenCount}
						</span>
					</div>
				))}
				<button
					type="button"
					className="ml-2 flex h-7 items-center gap-1.5 rounded px-2 text-left text-muted-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
					title="현재 로컬 테이블 미리보기에서는 루트 추가가 비활성화되어 있습니다."
				>
					<Plus className="size-3" />
					<span className="text-[12px] font-medium">루트 추가</span>
				</button>
			</div>
		</section>
	);
}

function PanelIconButton({
	icon = "edit",
	label,
}: {
	icon?: "copy" | "delete" | "edit";
	label: string;
}) {
	const Icon = icon === "copy" ? Copy : icon === "delete" ? Trash2 : Pencil;

	return (
		<button
			type="button"
			className="shrink-0 rounded p-0.5 text-muted-foreground/70 opacity-0 transition-opacity hover:bg-background hover:text-sidebar-foreground group-hover:opacity-100"
			onClick={(event) => event.stopPropagation()}
			title={`${label} (비활성화됨)`}
		>
			<Icon className="size-3" />
		</button>
	);
}
