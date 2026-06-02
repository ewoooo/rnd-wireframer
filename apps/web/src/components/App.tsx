"use client";

import type { RenderTreeNode, RenderTreeScreenNode } from "@cx/renderer";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Canvas } from "@/components/layout/Canvas";
import type { SaveState } from "@/components/layout/CanvasToolbar";
import { InspectionPanel } from "@/components/layout/InspectionPanel";
import { NavigationPanel } from "@/components/layout/NavigationPanel";
import { NavigationRail } from "@/components/layout/NavigationRail";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { ScreenSummary } from "@/lib/screen-sources";
import {
	collectScreenAreas,
	collectScreenComponents,
	createWorkbenchViewModel,
	getInitialScreen,
	type NavigatorTab,
} from "@/model/workbench-view-model";

const ASIDE_WIDTH = "320px";

type LoadState = {
	message?: string;
	status: "error" | "loading" | "ready";
};

type ScreensApiResponse = {
	error?: string;
	screens?: ScreenSummary[];
};

type ScreenTreeApiResponse = {
	error?: string;
	node?: RenderTreeScreenNode;
};

export function App() {
	const [screens, setScreens] = useState<ScreenSummary[]>([]);
	const [loadState, setLoadState] = useState<LoadState>({
		message: "화면 불러오는 중",
		status: "loading",
	});
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
	const [screenCandidates, setScreenCandidates] = useState<Record<string, RenderTreeScreenNode>>({});
	const [showStatusBar, setShowStatusBar] = useState(true);
	const initialScreen = getInitialScreen(screens);
	const [selectedScreenId, setSelectedScreenId] = useState(initialScreen?.id ?? "");
	const { screenModules, screenRoutes } = createWorkbenchViewModel(screens);
	const selectedScreen = screens.find((screen) => screen.id === selectedScreenId) ?? screens[0];
	const selectedScreenCandidate = selectedScreen ? screenCandidates[selectedScreen.id] : undefined;
	const visibleScreen =
		selectedScreen && selectedScreenCandidate
			? { ...selectedScreen, renderTree: selectedScreenCandidate }
			: selectedScreen;
	const visibleAreas = collectScreenAreas(visibleScreen);
	const selectedArea = visibleAreas[0];
	const [activeRouteId, setActiveRouteId] = useState(
		initialScreen?.screenRouteId ?? screenRoutes[0]?.id ?? "",
	);
	const activeRoute =
		screenRoutes.find((route) => route.id === activeRouteId) ??
		screenRoutes.find((route) => route.id === selectedScreen?.screenRouteId) ??
		screenRoutes[0];

	useEffect(() => {
		let isActive = true;

		async function loadScreens() {
			setLoadState({ message: "화면 불러오는 중", status: "loading" });
			try {
				const nextScreens = await fetchScreensFromApi();
				if (!isActive) return;
				setScreens(nextScreens);
				setLoadState({ status: "ready" });
				const nextInitialScreen = getInitialScreen(nextScreens);
				setSelectedScreenId(nextInitialScreen?.id ?? "");
				setActiveRouteId(nextInitialScreen?.screenRouteId ?? "");
			} catch (error) {
				if (!isActive) return;
				setLoadState({ message: readErrorMessage(error), status: "error" });
			}
		}

		void loadScreens();

		return () => {
			isActive = false;
		};
	}, []);

	function handleSelectRoute(routeId: string) {
		setActiveRouteId(routeId);
		const nextRoute = screenRoutes.find((route) => route.id === routeId);
		const nextScreenId = nextRoute?.variants[0]?.options[0]?.screen.id;
		if (nextScreenId) setSelectedScreenId(nextScreenId);
	}

	function handleSelectScreen(screenId: string) {
		const nextScreen = screens.find((screen) => screen.id === screenId);
		if (nextScreen?.screenRouteId) setActiveRouteId(nextScreen.screenRouteId);
		setSelectedScreenId(screenId);
	}

	function handleScreenCandidateChange(screenId: string, node: RenderTreeScreenNode) {
		setScreenCandidates((current) => ({
			...current,
			[screenId]: node,
		}));
	}

	async function handleScreenCandidatePublish(screenId: string, node: RenderTreeScreenNode) {
		setSaveState({ message: "저장 중", status: "saving" });
		const response = await fetch(`/api/screens/${encodeURIComponent(screenId)}/tree`, {
			body: JSON.stringify({ node }),
			headers: { "Content-Type": "application/json" },
			method: "PUT",
		});
		if (!response.ok) {
			const body = await response.text();
			console.error(`Failed to save screen candidate ${screenId}: ${response.status} ${body}`);
			setSaveState({ message: `저장 실패 ${response.status}`, status: "error" });
			return;
		}
		setScreenCandidates((current) => ({
			...current,
			[screenId]: node,
		}));
		setSaveState({ message: "저장됨", status: "saved" });
	}

	function handleAreaCandidateChange(screenId: string, node: RenderTreeNode) {
		const currentScreen = readVisibleRenderTree(screenId);
		if (!currentScreen) return;
		handleScreenCandidateChange(screenId, replaceRenderTreeNode(currentScreen, node));
	}

	async function handleAreaCandidatePublish(screenId: string, node: RenderTreeNode) {
		const currentScreen = readVisibleRenderTree(screenId);
		if (!currentScreen) return;
		await handleScreenCandidatePublish(screenId, replaceRenderTreeNode(currentScreen, node));
	}

	function readVisibleRenderTree(screenId: string) {
		return (
			screenCandidates[screenId] ??
			screens.find((screen) => screen.id === screenId)?.renderTree
		);
	}

	async function handleSaveSelectedScreen() {
		if (!visibleScreen?.renderTree) return;
		await handleScreenCandidatePublish(visibleScreen.id, visibleScreen.renderTree);
	}

	return (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar">
			<NavigationRail activeTab={activeTab} onSelectTab={setActiveTab} />
			<SidebarProvider
				className="min-h-0 flex-1 overflow-hidden"
				style={{ "--sidebar-width": ASIDE_WIDTH } as CSSProperties}
			>
				<NavigationPanel
					activeTab={activeTab}
					activeRouteId={activeRoute?.id}
					onSelectRoute={handleSelectRoute}
					onSelectScreen={handleSelectScreen}
					screenModules={screenModules}
					screenRoute={activeRoute}
					selectedScreenId={visibleScreen?.id}
				/>
				<Canvas
					activeTab={activeTab}
					loadState={loadState}
					onAreaCandidateChange={handleAreaCandidateChange}
					onAreaCandidatePublish={handleAreaCandidatePublish}
					onSaveSelectedScreen={handleSaveSelectedScreen}
					onScreenCandidateChange={handleScreenCandidateChange}
					onScreenCandidatePublish={handleScreenCandidatePublish}
					onToggleStatusBar={() => setShowStatusBar((current) => !current)}
					saveState={saveState}
					selectedArea={selectedArea}
					selectedScreen={visibleScreen}
					showStatusBar={showStatusBar}
				/>
				<InspectionPanel
					activeTab={activeTab}
					areas={visibleAreas}
					components={collectScreenComponents(visibleScreen)}
					screen={visibleScreen}
				/>
			</SidebarProvider>
		</main>
	);
}

async function fetchScreensFromApi(): Promise<ScreenSummary[]> {
	const summariesResponse = await fetch("/api/screens");
	if (!summariesResponse.ok) {
		throw new Error(`화면 목록 요청 실패 ${summariesResponse.status}`);
	}
	const summariesBody = (await summariesResponse.json()) as ScreensApiResponse;
	if (summariesBody.error) throw new Error(summariesBody.error);
	const summaries = summariesBody.screens ?? [];

	return Promise.all(
		summaries.map(async (summary) => {
			const treeResponse = await fetch(`/api/screens/${encodeURIComponent(summary.id)}/tree`);
			if (!treeResponse.ok) {
				throw new Error(`화면 트리 요청 실패 ${summary.id}: ${treeResponse.status}`);
			}
			const treeBody = (await treeResponse.json()) as ScreenTreeApiResponse;
			if (treeBody.error) throw new Error(treeBody.error);
			return {
				...summary,
				renderTree: treeBody.node,
			};
		}),
	);
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "화면 데이터를 불러오지 못했습니다.";
}

function replaceRenderTreeNode(
	screen: RenderTreeScreenNode,
	replacement: RenderTreeNode,
): RenderTreeScreenNode {
	return replaceNode(screen, replacement) as RenderTreeScreenNode;
}

function replaceNode(node: RenderTreeNode, replacement: RenderTreeNode): RenderTreeNode {
	if (node.metadata.id === replacement.metadata.id) return replacement;
	return {
		...node,
		children: node.children?.map((child) => replaceNode(child, replacement)),
	};
}
