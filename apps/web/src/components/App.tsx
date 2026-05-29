"use client";

import type { RenderTreeNode } from "@cx/renderer";
import { Box, Boxes, Plus, Smartphone, Table2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/utils";
import type { ScreenSummary } from "@/lib/screen-sources";
import { RenderedScreen } from "./screen/RenderedScreen";

type NavigatorTab = "agent" | "comp" | "ogn" | "scn";

type AppProps = {
	screens: ScreenSummary[];
};

type ScreenRouteGroup = {
	id: string;
	moduleId?: string;
	name: string;
	screenCount: number;
	variants: ScreenVariantGroup[];
};

type ScreenModuleGroup = {
	id: string;
	name: string;
	routes: ScreenRouteGroup[];
};

type ScreenVariantGroup = {
	id: string;
	name: string;
	options: ScreenVariantOption[];
	order: number;
};

type ScreenVariantOption = {
	label: string;
	screen: ScreenSummary;
};

const primaryNavigationTabs: Array<{
	description: string;
	id: NavigatorTab;
	icon: typeof Smartphone;
	label: string;
	name: string;
}> = [
	{
		description: "화면 목록 및 라우트별 변형 탐색",
		id: "scn",
		icon: Smartphone,
		label: "SCN",
		name: "Screen",
	},
	{
		description: "재사용 가능한 섹션 단위 컴포넌트 목록",
		id: "ogn",
		icon: Boxes,
		label: "ARE",
		name: "Area",
	},
	{
		description: "영역을 구성하는 컴포넌트 목록",
		id: "comp",
		icon: Box,
		label: "CMP",
		name: "Component",
	},
];

const secondaryNavigationTabs: Array<{
	description: string;
	id: NavigatorTab;
	icon: typeof Smartphone;
	label: string;
	name: string;
}> = [
	{
		description: "AI 에이전트 노드 레지스트리 및 생성 현황",
		id: "agent",
		icon: Table2,
		label: "AGT",
		name: "Agent",
	},
];

const moduleNamesById: Record<string, string> = {
	mbr: "MBR",
	preview: "Preview",
};

const moduleSortOrderById: Record<string, number> = {
	preview: 0,
	mbr: 1,
};

export function App({ screens }: AppProps) {
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const initialScreen = getInitialScreen(screens);
	const [selectedScreenId, setSelectedScreenId] = useState(initialScreen?.id ?? "");
	const screenRoutes = buildScreenRouteGroups(screens);
	const screenModules = buildScreenModuleGroups(screenRoutes);
	const selectedScreen = screens.find((screen) => screen.id === selectedScreenId) ?? screens[0];
	const [activeRouteId, setActiveRouteId] = useState(
		initialScreen?.screenRouteId ?? screenRoutes[0]?.id ?? "",
	);
	const activeRoute =
		screenRoutes.find((route) => route.id === activeRouteId) ??
		screenRoutes.find((route) => route.id === selectedScreen?.screenRouteId) ??
		screenRoutes[0];
	const selectedAreas = selectedScreen?.renderTree
		? collectNodesByTypePrefix(selectedScreen.renderTree, "area.")
		: [];
	const selectedComponents = selectedScreen?.renderTree
		? collectLeafComponents(selectedScreen.renderTree)
		: [];

	return (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar">
			<NavigationPanel
				activeTab={activeTab}
				activeRouteId={activeRoute?.id}
				onSelectRoute={(routeId) => {
					setActiveRouteId(routeId);
					const nextRoute = screenRoutes.find((route) => route.id === routeId);
					const nextScreenId = nextRoute?.variants[0]?.options[0]?.screen.id;
					if (nextScreenId) setSelectedScreenId(nextScreenId);
				}}
				onSelectScreen={(screenId) => {
					const nextScreen = screens.find((screen) => screen.id === screenId);
					if (nextScreen?.screenRouteId) setActiveRouteId(nextScreen.screenRouteId);
					setSelectedScreenId(screenId);
				}}
				onSelectTab={setActiveTab}
				screenModules={screenModules}
				screenRoute={activeRoute}
				selectedScreenId={selectedScreen?.id}
			/>
			<section className="flex h-svh min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
				<header className="flex h-14 shrink-0 items-center border-b border-sidebar-border bg-background px-5">
					<h1 className="truncate text-base font-semibold">
						{selectedScreen?.title ?? "Screen Preview"}
					</h1>
				</header>
				<div className="flex min-h-0 flex-1 items-center justify-center bg-secondary/50 p-6">
					<RenderedScreen node={selectedScreen?.renderTree} />
				</div>
			</section>
			<InspectionPanel
				activeTab={activeTab}
				areas={selectedAreas}
				components={selectedComponents}
				screen={selectedScreen}
			/>
		</main>
	);
}

function NavigationPanel({
	activeTab,
	activeRouteId,
	onSelectRoute,
	onSelectScreen,
	onSelectTab,
	screenModules,
	screenRoute,
	selectedScreenId,
}: {
	activeTab: NavigatorTab;
	activeRouteId?: string;
	onSelectRoute: (routeId: string) => void;
	onSelectScreen: (screenId: string) => void;
	onSelectTab: (tab: NavigatorTab) => void;
	screenModules: ScreenModuleGroup[];
	screenRoute?: ScreenRouteGroup;
	selectedScreenId?: string;
}) {
	return (
		<>
			<nav
				aria-label="Workbench navigation"
				className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar p-2"
			>
				{primaryNavigationTabs.map((tab) => (
					<NavigationButton
						key={tab.id}
						activeTab={activeTab}
						onSelectTab={onSelectTab}
						tab={tab}
					/>
				))}
				<div className="my-1 w-6 border-t border-sidebar-border" />
				{secondaryNavigationTabs.map((tab) => (
					<NavigationButton
						key={tab.id}
						activeTab={activeTab}
						onSelectTab={onSelectTab}
						tab={tab}
					/>
				))}
			</nav>
			<aside className="flex h-svh w-[380px] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
				{activeTab === "scn" ? (
					<div className="grid min-h-0 flex-1 grid-rows-[35fr_auto_65fr] overflow-hidden">
						<div className="min-h-0 overflow-hidden">
							<div className="border-b border-sidebar-border px-3 py-2">
								<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
									{screenModules.length}개 도메인
								</span>
							</div>
							<div className="min-h-0 h-[calc(100%-33px)] overflow-y-auto py-1">
								{screenModules.map((module) => (
									<ScreenModuleGroupView
										key={module.id}
										activeRouteId={activeRouteId}
										module={module}
										onSelectRoute={onSelectRoute}
									/>
								))}
								<div className="px-3 py-1.5">
									<button
										type="button"
										className="flex w-full items-center gap-1 rounded-md px-3 py-1.5 text-left hover:ring-1 hover:ring-border"
										title="현재 로컬 테이블 미리보기에서는 도메인 추가가 비활성화되어 있습니다."
									>
										<Plus className="size-3 text-muted-foreground/60" />
										<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
											도메인 추가
										</span>
									</button>
								</div>
							</div>
						</div>
						<div className="h-px bg-sidebar-border" />
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
		</>
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
		<div className="px-3 py-1.5">
			<div className="overflow-hidden rounded-md border border-sidebar-border">
				<div className="border-b border-sidebar-border px-3 py-1.5">
					<span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
						{module.name}
					</span>
				</div>
				{module.routes.map((route) => (
					<button
						type="button"
						key={route.id}
						className={cn(
							"group flex w-full items-center gap-1 px-3 py-2 text-left transition-colors hover:bg-sidebar-accent",
							route.id === activeRouteId && "bg-primary/10 text-primary",
						)}
						onClick={() => onSelectRoute(route.id)}
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-1">
								<span
									className={cn(
										"truncate text-sm",
										route.id === activeRouteId ? "font-semibold" : "font-normal",
									)}
								>
									{route.name}
								</span>
							</div>
							{route.id === activeRouteId ? (
								<span className="truncate text-[10px] text-muted-foreground/60">{route.id}</span>
							) : null}
						</div>
						<span className="shrink-0 text-xs text-muted-foreground">{route.screenCount}</span>
					</button>
				))}
			</div>
		</div>
	);
}

function ScreenVariantCard({
	onSelectScreen,
	selectedScreenId,
	variant,
}: {
	onSelectScreen: (screenId: string) => void;
	selectedScreenId?: string;
	variant: ScreenVariantGroup;
}) {
	const isSelected = variant.options.some((option) => option.screen.id === selectedScreenId);

	return (
		<div
			className={cn(
				"flex min-w-0 border-t border-sidebar-border bg-sidebar transition-colors first:border-t-0 hover:bg-sidebar-accent",
				isSelected && "bg-sidebar-accent",
			)}
		>
			<div className="flex w-[34%] min-w-0 items-center gap-1.5 p-2">
				<span
					className={cn(
						"shrink-0 text-xs",
						isSelected ? "text-sidebar-accent-foreground" : "text-muted-foreground",
					)}
				>
					{variant.order}
				</span>
				<span
					className={cn(
						"truncate text-xs",
						isSelected ? "font-semibold text-sidebar-accent-foreground" : "font-medium",
					)}
				>
					{variant.name}
				</span>
			</div>
			<div className="flex w-[66%] flex-wrap content-start gap-1 p-2">
				{variant.options.map((option) => (
					<button
						type="button"
						key={option.screen.id}
						className={cn(
							"h-5 max-w-full cursor-pointer rounded-full border border-sidebar-border px-2 text-xs font-normal leading-none transition-colors hover:bg-background hover:text-foreground",
							option.screen.id === selectedScreenId &&
								"border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
							isSelected &&
								option.screen.id !== selectedScreenId &&
								"border-background/80 text-sidebar-accent-foreground",
						)}
						onClick={(event) => {
							event.stopPropagation();
							onSelectScreen(option.screen.id);
						}}
						title={option.screen.title}
					>
						<span className="block max-w-24 truncate">{option.label}</span>
					</button>
				))}
			</div>
		</div>
	);
}

function NavigationButton({
	activeTab,
	onSelectTab,
	tab,
}: {
	activeTab: NavigatorTab;
	onSelectTab: (tab: NavigatorTab) => void;
	tab: (typeof primaryNavigationTabs)[number];
}) {
	const Icon = tab.icon;
	const isActive = activeTab === tab.id;

	return (
		<button
			type="button"
			className={cn(
				"flex size-10 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-none",
			)}
			aria-label={tab.label}
			aria-pressed={isActive}
			onClick={() => onSelectTab(tab.id)}
			title={`${tab.name} (${tab.label}) - ${tab.description}`}
		>
			<Icon className="size-4" data-icon="inline-start" />
		</button>
	);
}

function InspectionPanel({
	activeTab,
	areas,
	components,
	screen,
}: {
	activeTab: NavigatorTab;
	areas: RenderTreeNode[];
	components: RenderTreeNode[];
	screen?: ScreenSummary;
}) {
	const title = activeTab === "agent" ? "Agent" : "Information";

	return (
		<aside className="flex h-svh min-w-0 flex-col overflow-hidden border-l border-sidebar-border bg-sidebar text-sidebar-foreground">
			<div className="border-b border-sidebar-border p-4">
				<h2 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
					<Table2 className="size-4" data-icon="inline-start" />
					{title}
				</h2>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-3">
				{screen ? (
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1">
							<p className="text-xs font-medium uppercase text-muted-foreground">Selected screen</p>
							<h3 className="truncate text-base font-semibold">{screen.title}</h3>
						</div>
						<div className="flex flex-col gap-2">
							<InfoRow label="Screen ID" value={screen.id} />
							<InfoRow label="Route" value={screen.route ?? "-"} />
							<InfoRow label="Type" value={screen.type ?? "-"} />
							<InfoRow label="Status" value={screen.status ?? "-"} />
						</div>
						<div className="grid grid-cols-2 gap-2">
							<StatCard label="Areas" value={String(areas.length)} />
							<StatCard label="Components" value={String(components.length)} />
						</div>
						<NodeList
							nodes={activeTab === "comp" ? components : areas}
							title={activeTab === "comp" ? "Components" : "Areas"}
						/>
					</div>
				) : (
					<div className="rounded-lg border bg-background p-3 text-sm text-muted-foreground">
						현재 테이블에서 표시할 MBR 화면을 찾지 못했습니다.
					</div>
				)}
			</div>
		</aside>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-sidebar-border bg-background p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 break-all text-sm font-medium">{value}</p>
		</div>
	);
}

function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-sidebar-border bg-background p-3">
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-1 text-xl font-semibold">{value}</p>
		</div>
	);
}

function NodeList({ nodes, title }: { nodes: RenderTreeNode[]; title: string }) {
	return (
		<div className="flex flex-col gap-2">
			<h3 className="text-sm font-semibold">{title}</h3>
			{nodes.map((node) => (
				<div
					key={node.metadata.id}
					className="min-w-0 rounded-lg border border-sidebar-border bg-background p-3"
				>
					<p className="truncate text-sm font-medium">{node.metadata.title}</p>
					<p className="mt-1 truncate font-mono text-xs text-muted-foreground">
						{node.metadata.id}
					</p>
					<p className="mt-3 text-xs text-muted-foreground">{node.type}</p>
				</div>
			))}
		</div>
	);
}

function buildScreenRouteGroups(screens: ScreenSummary[]): ScreenRouteGroup[] {
	const routes = new Map<string, ScreenRouteGroup>();

	for (const screen of screens) {
		const routeId = screen.screenRouteId ?? "unknown-route";
		const route = routes.get(routeId) ?? {
			id: routeId,
			moduleId: screen.moduleId,
			name: screen.route ?? "Unknown route",
			screenCount: 0,
			variants: [],
		};
		const variantId = screen.screenVariantId ?? screen.id;
		let variant = route.variants.find((candidate) => candidate.id === variantId);

		if (!variant) {
			variant = {
				id: variantId,
				name: screen.screenVariantName ?? screen.title,
				options: [],
				order: screen.screenVariantOrder ?? route.variants.length + 1,
			};
			route.variants.push(variant);
		}

		variant.options.push({
			label: getScreenOptionLabel(screen),
			screen,
		});
		route.screenCount += 1;
		routes.set(routeId, route);
	}

	return Array.from(routes.values()).map((route) => ({
		...route,
		variants: route.variants
			.map((variant) => ({
				...variant,
				options: [...variant.options].sort(compareScreenOptions),
			}))
			.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name)),
	}));
}

function buildScreenModuleGroups(routes: ScreenRouteGroup[]): ScreenModuleGroup[] {
	const modules = new Map<string, ScreenModuleGroup>();

	for (const route of routes) {
		const moduleId = route.moduleId ?? "local";
		const module: ScreenModuleGroup = modules.get(moduleId) ?? {
			id: moduleId,
			name: getModuleName(moduleId),
			routes: [],
		};
		module.routes.push(route);
		modules.set(moduleId, module);
	}

	return Array.from(modules.values())
		.map((module) => ({
			...module,
			routes: [...module.routes].sort((left, right) => left.name.localeCompare(right.name)),
		}))
		.sort(
			(left, right) =>
				getModuleSortOrder(left.id) - getModuleSortOrder(right.id) ||
				left.name.localeCompare(right.name),
		);
}

function getModuleName(moduleId: string) {
	return moduleNamesById[moduleId] ?? moduleId;
}

function getModuleSortOrder(moduleId?: string) {
	return moduleSortOrderById[moduleId ?? ""] ?? Number.MAX_SAFE_INTEGER;
}

function compareScreenOptions(left: ScreenVariantOption, right: ScreenVariantOption) {
	return (
		(left.screen.order ?? Number.MAX_SAFE_INTEGER) -
			(right.screen.order ?? Number.MAX_SAFE_INTEGER) ||
		left.screen.id.localeCompare(right.screen.id)
	);
}

function getInitialScreen(screens: ScreenSummary[]) {
	return screens[0];
}

function getScreenOptionLabel(screen: ScreenSummary) {
	if (screen.title === screen.screenVariantName) return "기본";
	const prefix = `${screen.screenVariantName}-`;
	if (screen.screenVariantName && screen.title.startsWith(prefix)) {
		return screen.title.slice(prefix.length).trim();
	}
	return screen.id.split("-").at(-1) ?? screen.title;
}

function collectNodesByTypePrefix(node: RenderTreeNode, prefix: string): RenderTreeNode[] {
	const current = node.type.startsWith(prefix) ? [node] : [];
	const children = node.children?.flatMap((child) => collectNodesByTypePrefix(child, prefix)) ?? [];
	return [...current, ...children];
}

function collectLeafComponents(node: RenderTreeNode): RenderTreeNode[] {
	if (!node.children?.length && !node.type.startsWith("Screen.") && node.type !== "Screen") {
		return [node];
	}
	return node.children?.flatMap((child) => collectLeafComponents(child)) ?? [];
}
