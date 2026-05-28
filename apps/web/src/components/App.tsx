"use client";

import type { RenderTreeScreenNode } from "@cx/renderer";
import { Box, Boxes, FileJson2, Smartphone, Table2 } from "lucide-react";
import { useState } from "react";
import type { ScreenSummary } from "@/lib/screen-sources";
import { RenderedScreen } from "./screen/RenderedScreen";
import { cn } from "./utils";

type AppProps = {
	screens: ScreenSummary[];
};

const railItems = [
	{
		id: "scn",
		icon: Smartphone,
		label: "SCN",
		name: "Screen",
		description: "화면 목록 및 라우트별 변형 탐색",
	},
	{
		id: "ogn",
		icon: Boxes,
		label: "OGN",
		name: "Area",
		description: "재사용 가능한 영역 단위 후보",
	},
	{
		id: "cmp",
		icon: Box,
		label: "CMP",
		name: "Component",
		description: "컴포넌트 후보",
	},
	{
		id: "src",
		icon: FileJson2,
		label: "SRC",
		name: "Source",
		description: "원본 markdown",
	},
	{
		id: "agt",
		icon: Table2,
		label: "AGT",
		name: "Agent",
		description: "생성 단계",
	},
];

export function App({ screens }: AppProps) {
	const [selectedScreenId, setSelectedScreenId] = useState(screens[0]?.id ?? "redesign-preview");
	const selectedScreen = findScreenById(screens, selectedScreenId);
	const previewScreen = createPreviewScreen(selectedScreen);
	const screenRoutes = groupScreensByRoute(screens);

	return (
		<main className="grid h-svh min-w-0 grid-cols-[clamp(280px,18.5vw,380px)_minmax(0,1fr)_clamp(280px,17.5vw,360px)] overflow-hidden bg-secondary/50 text-foreground">
			<aside className="flex min-w-0 overflow-hidden border-r bg-background">
				<nav
					aria-label="Workbench navigation"
					className="flex w-14 shrink-0 flex-col items-center gap-1 border-r bg-sidebar p-2"
				>
					{railItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.id === "scn";
						return (
							<button
								aria-label={item.name}
								aria-pressed={isActive}
								className={cn(
									"flex size-10 items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
									isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "bg-transparent",
								)}
								key={item.id}
								title={`${item.name} (${item.label}) - ${item.description}`}
								type="button"
							>
								<Icon className="size-4" aria-hidden="true" />
							</button>
						);
					})}
				</nav>
				<div className="min-w-0 flex-1 overflow-hidden p-2">
					<div className="mb-2 flex min-w-0 items-center justify-between gap-2 px-1">
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase text-muted-foreground">screen</p>
							<h1 className="truncate text-sm font-semibold">260528_mbr</h1>
						</div>
						<Badge>{screens.length}</Badge>
					</div>
					<div className="h-[calc(100vh-72px)] min-w-0 overflow-y-auto pr-1">
						<div className="flex min-w-0 flex-col gap-2">
							{screenRoutes.map((route) => (
								<ScreenRouteCard
									key={route.id}
									onSelectScreen={setSelectedScreenId}
									route={route}
									selectedScreenId={selectedScreenId}
								/>
							))}
						</div>
					</div>
				</div>
			</aside>

			<section className="flex min-w-0 flex-col overflow-hidden">
				<header className="border-b bg-background px-4 py-3">
					<h2 className="truncate text-base font-semibold">
						{selectedScreen?.title ?? "RenderTree Preview"}
					</h2>
				</header>
				<div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6">
					<RenderedScreen node={previewScreen} />
				</div>
			</section>

			<aside className="flex min-w-0 flex-col overflow-hidden border-l bg-background">
				<div className="border-b px-4 py-4">
					<h2 className="text-base font-semibold leading-none">관련 정보</h2>
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-4 text-sm">
					<InfoRow label="Screen code" value={selectedScreen?.id ?? previewScreen.metadata.id} />
					<InfoRow label="Route" value={selectedScreen?.route ?? "-"} />
					<InfoRow label="Status" value={selectedScreen?.status ?? "-"} />
					<InfoRow label="Source" value={selectedScreen?.sourcePath ?? "-"} />
				</div>
			</aside>
		</main>
	);
}

type ScreenRoute = {
	id: string;
	module: string;
	name: string;
	screenCount: number;
	screens: ScreenSummary[];
};

function ScreenRouteCard({
	onSelectScreen,
	route,
	selectedScreenId,
}: {
	onSelectScreen: (screenId: string) => void;
	route: ScreenRoute;
	selectedScreenId: string;
}) {
	const isSelected = route.screens.some((screen) => screen.id === selectedScreenId);

	return (
		<div
			className={cn(
				"flex min-w-0 flex-col overflow-hidden border bg-background transition-colors",
				isSelected && "bg-primary/5",
			)}
		>
			<div className="flex min-w-0 items-start justify-between gap-2 p-3">
				<button
					type="button"
					className="min-w-0 flex-1 text-left"
					onClick={() => onSelectScreen(route.screens[0]?.id ?? "")}
				>
					<span className="block truncate text-sm font-medium">{route.name}</span>
					<span className="mt-1 flex min-w-0 gap-1 text-xs text-muted-foreground">
						<span className="truncate">{route.id}</span>
						<span className="shrink-0">{route.screenCount} screens</span>
					</span>
				</button>
				<Badge>{route.module}</Badge>
			</div>
			<div className="flex min-w-0 flex-col">
				{route.screens.map((screen, index) => (
					<ScreenVariantCard
						key={screen.id}
						index={index + 1}
						isSelected={screen.id === selectedScreenId}
						onSelect={onSelectScreen}
						screen={screen}
					/>
				))}
			</div>
		</div>
	);
}

function ScreenVariantCard({
	index,
	isSelected,
	onSelect,
	screen,
}: {
	index: number;
	isSelected: boolean;
	onSelect: (screenId: string) => void;
	screen: ScreenSummary;
}) {
	return (
		<div className="flex min-w-0 flex-col justify-between gap-2 border-t bg-background/80 p-2">
			<div className="flex min-w-0 items-center gap-2">
				<span className="shrink-0 text-xs text-muted-foreground">{index}</span>
				<span className="truncate text-xs font-medium">{screen.title}</span>
			</div>
			<div className="flex flex-wrap gap-1">
				<button
					type="button"
					className={cn(
						"h-5 min-w-8 justify-center rounded-full border px-2 font-mono text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
						isSelected
							? "border-transparent bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
							: "bg-background text-foreground",
					)}
					aria-pressed={isSelected}
					title={screen.id}
					onClick={() => onSelect(screen.id)}
				>
					{screenVariantLabel(screen.id)}
				</button>
				<span className="min-w-0 truncate text-xs text-muted-foreground">{screen.id}</span>
			</div>
		</div>
	);
}

function Badge({ children }: { children: string | number }) {
	return (
		<span className="inline-flex shrink-0 items-center rounded-md border-transparent bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
			{children}
		</span>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex min-w-0 items-center justify-between gap-3 overflow-hidden border bg-background p-3">
			<span className="shrink-0 text-xs text-muted-foreground">{label}</span>
			<span className="min-w-0 truncate text-right text-sm font-medium">{value}</span>
		</div>
	);
}

function findScreenById(screens: ScreenSummary[], id: string) {
	return screens.find((screen) => screen.id === id) ?? screens[0];
}

function createPreviewScreen(screen: ScreenSummary | undefined): RenderTreeScreenNode {
	const id = screen?.id ?? "redesign-preview";
	const title = screen?.title ?? "Redesign Preview";
	const description = screen?.description ?? "생성 결과를 선택하면 이 영역에서 확인합니다.";

	return {
		type: "Screen",
		componentVersion: "1.0.0",
		metadata: {
			id,
			title,
		},
		children: [
			{
				type: "Screen.Header",
				componentVersion: "0.1.0",
				metadata: {
					id: `${id}.header`,
					title: "Header",
				},
				children: [
					{
						type: "AppBar",
						componentVersion: "1.0.0",
						metadata: {
							id: `${id}.appbar`,
							title: `${title} 상단 앱 바`,
						},
						props: {
							title,
							showBack: true,
							showLogo: false,
						},
					},
				],
			},
			{
				type: "Screen.Contents",
				componentVersion: "0.1.0",
				metadata: {
					id: `${id}.contents`,
					title: "Contents",
				},
				children: [
					{
						type: "area.static",
						componentVersion: "1.0.0",
						metadata: {
							id: `${id}.summary-area`,
							title: "화면 요약",
						},
						props: { name: "화면 요약" },
						children: [
							{
								type: "list-cell",
								componentVersion: "1.0.0",
								metadata: {
									id: `${id}.summary-cell`,
									title: "summary",
								},
								props: {
									title,
									description,
								},
							},
						],
					},
				],
			},
			{
				type: "Screen.Bottom",
				componentVersion: "0.1.0",
				metadata: {
					id: `${id}.bottom`,
					title: "Bottom",
				},
				children: [],
			},
		],
	};
}

function groupScreensByRoute(screens: ScreenSummary[]): ScreenRoute[] {
	const routes: ScreenRoute[] = [];

	for (const screen of screens) {
		const routeId = routeCode(screen);
		const existingRoute = routes.find((route) => route.id === routeId);

		if (existingRoute) {
			existingRoute.screens.push(screen);
			existingRoute.screenCount = existingRoute.screens.length;
			continue;
		}

		routes.push({
			id: routeId,
			module: screen.type ?? "PG",
			name: routeName(screen),
			screenCount: 1,
			screens: [screen],
		});
	}

	return routes;
}

function routeCode(screen: ScreenSummary) {
	const match = screen.id.match(/^(.*?-\d{3})/);

	return match?.[1] ?? screen.route ?? "screens";
}

function routeName(screen: ScreenSummary) {
	if (screen.route) {
		const routeSegments = screen.route.split(">").map((segment) => segment.trim());
		return routeSegments[routeSegments.length - 1] ?? screen.title;
	}

	return screen.title.replace(/-.+$/, "");
}

function screenVariantLabel(screenId: string) {
	const match = screenId.match(/-(\d+|E\d+)$/);

	return match?.[1] ?? "0";
}
