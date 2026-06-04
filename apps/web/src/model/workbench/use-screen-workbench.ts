"use client";

import { useEffect, useState } from "react";
import type { RenderTreeScreenNode } from "@cx/renderer";
import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";
import { readErrorMessage } from "@/lib/api-error";
import type { ScreenSummary } from "@/lib/screen-sources";
import { fetchScreensFromApi } from "@/lib/screens-client";
import {
	collectWorkbenchAreas,
	collectWorkbenchComponents,
	createWorkbenchViewModel,
	getInitialScreen,
	toNavigationNodeItems,
} from "@/model/workbench-view-model";

type LoadState = {
	message?: string;
	status: "error" | "loading" | "ready";
};

export function useScreenWorkbench() {
	const [screens, setScreens] = useState<ScreenSummary[]>([]);
	const [loadState, setLoadState] = useState<LoadState>({
		message: "화면 불러오는 중",
		status: "loading",
	});
	const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
	const [selectedAreaId, setSelectedAreaId] = useState("");
	const [selectedComponentId, setSelectedComponentId] = useState("");
	const [screenCandidates, setScreenCandidates] = useState<Record<string, RenderTreeScreenNode>>(
		{},
	);

	const initialScreen = getInitialScreen(screens);
	const { screenModules, screenRoutes } = createWorkbenchViewModel(screens);
	const [selectedScreenId, setSelectedScreenId] = useState(initialScreen?.id ?? "");
	const [activeRouteId, setActiveRouteId] = useState(
		initialScreen?.screenRouteId ?? screenRoutes[0]?.id ?? "",
	);

	const selectedScreen = screens.find((screen) => screen.id === selectedScreenId) ?? screens[0];
	const selectedScreenCandidate = selectedScreen ? screenCandidates[selectedScreen.id] : undefined;
	const visibleScreen =
		selectedScreen && selectedScreenCandidate
			? { ...selectedScreen, renderTree: selectedScreenCandidate }
			: selectedScreen;

	const navigationScreens = screens.map((screen) =>
		screenCandidates[screen.id] ? { ...screen, renderTree: screenCandidates[screen.id] } : screen,
	);

	const visibleAreas = collectWorkbenchAreas(navigationScreens);

	const selectedAreaEntry =
		visibleAreas.find(
			(entry) => entry.node.metadata.id === selectedAreaId && entry.screen.id === visibleScreen?.id,
		) ??
		visibleAreas.find((entry) => entry.screen.id === visibleScreen?.id) ??
		visibleAreas[0];
	const selectedArea = selectedAreaEntry?.node;
	const visibleAreaItems = toNavigationNodeItems(visibleAreas);

	const visibleComponents = collectWorkbenchComponents(navigationScreens);

	const selectedComponentEntry =
		visibleComponents.find(
			(entry) =>
				entry.node.metadata.id === selectedComponentId && entry.screen.id === visibleScreen?.id,
		) ??
		visibleComponents.find((entry) => entry.screen.id === visibleScreen?.id) ??
		visibleComponents[0];
	const selectedComponent = selectedComponentEntry?.node;
	const visibleComponentItems = toNavigationNodeItems(visibleComponents);

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
				setLoadState({
					message: readErrorMessage(error, "화면 데이터를 불러오지 못했습니다."),
					status: "error",
				});
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

	function handleSelectArea(areaId: string) {
		const nextArea = visibleAreas.find((entry) => entry.node.metadata.id === areaId);
		if (nextArea?.screen.screenRouteId) setActiveRouteId(nextArea.screen.screenRouteId);
		if (nextArea?.screen.id) setSelectedScreenId(nextArea.screen.id);
		setSelectedAreaId(areaId);
	}

	function handleSelectComponent(componentId: string) {
		const nextComponent = visibleComponents.find(
			(entry) => entry.node.metadata.id === componentId,
		);
		if (nextComponent?.screen.screenRouteId) setActiveRouteId(nextComponent.screen.screenRouteId);
		if (nextComponent?.screen.id) setSelectedScreenId(nextComponent.screen.id);
		setSelectedComponentId(componentId);
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

	async function handleSaveSelectedScreen() {
		if (!visibleScreen?.renderTree) return;
		await handleScreenCandidatePublish(visibleScreen.id, visibleScreen.renderTree);
	}

	return {
		loadState,
		screens,
		screenRoutes,
		screenModules,
		selectedScreenId,
		activeRouteId,
		activeRoute,
		visibleScreen,
		navigationScreens,
		visibleAreaItems,
		selectedArea,
		visibleComponentItems,
		selectedComponent,
		saveState,
		setSaveState,
		onSelectRoute: handleSelectRoute,
		onSelectScreen: handleSelectScreen,
		onSelectArea: handleSelectArea,
		onSelectComponent: handleSelectComponent,
		onScreenCandidateChange: handleScreenCandidateChange,
		onScreenCandidatePublish: handleScreenCandidatePublish,
		onSaveSelectedScreen: handleSaveSelectedScreen,
	};
}
