"use client";

import type { PuckCatalogItem } from "@cx/adapters/puck";
import type { RenderTreeScreenNode } from "@cx/renderer";
import { type Data, Puck } from "@puckeditor/core";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { buildPuckConfigForScope } from "@/components/puck/workbench/workbench-puck";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Canvas } from "@/components/workbench/canvas/Canvas";
import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";
import { EditSidebar } from "@/components/workbench/edit-sidebar/EditSidebar";
import { NavigationRoutes } from "@/components/workbench/navigation/NavigationRoutes";
import { NavigationSidebar } from "@/components/workbench/navigation/NavigationSidebar";
import { readErrorMessage } from "@/lib/api-error";
import type { ScreenSummary } from "@/lib/screen-sources";
import {
	fetchPuckCatalogItemsFromApi,
	fetchScreensFromApi,
	type PuckCatalogScope,
} from "@/lib/screens-client";
import {
	applyPuckChangeToScope,
	buildPuckDataForScope,
	normalizePuckData,
	readItemKindForScope,
	resolveCatalogItemsForScope,
} from "@/lib/workbench-puck/puck-scope";
import { isPuckEditTab, resolveEditScope } from "@/model/puck-edit-scope";
import {
	collectWorkbenchAreas,
	collectWorkbenchComponents,
	createWorkbenchViewModel,
	getInitialScreen,
	type NavigatorTab,
	toNavigationNodeItems,
} from "@/model/workbench-view-model";
import { useNewScreenInference } from "@/model/workbench/use-new-screen-inference";

const ASIDE_WIDTH = "320px";

type LoadState = {
	message?: string;
	status: "error" | "loading" | "ready";
};

export function AppShell() {
	const [screens, setScreens] = useState<ScreenSummary[]>([]);
	const [loadState, setLoadState] = useState<LoadState>({
		message: "화면 불러오는 중",
		status: "loading",
	});
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
	const [selectedAreaId, setSelectedAreaId] = useState("");
	const [selectedComponentId, setSelectedComponentId] = useState("");
	const [puckCatalogItemsByScope, setPuckCatalogItemsByScope] = useState<
		Partial<Record<PuckCatalogScope, PuckCatalogItem[]>>
	>({});
	const [screenCandidates, setScreenCandidates] = useState<Record<string, RenderTreeScreenNode>>(
		{},
	);
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
	const editScope = resolveEditScope({
		activeTab,
		selectedArea,
		selectedComponent,
		selectedScreen: visibleScreen?.renderTree,
	});
	const isEditingWithPuck = isPuckEditTab(activeTab) && !!editScope;
	const puckCatalogScope = readPuckCatalogScope(editScope);
	const catalogItems =
		editScope && puckCatalogScope
			? (puckCatalogItemsByScope[puckCatalogScope] ?? resolveCatalogItemsForScope(editScope))
			: editScope
				? resolveCatalogItemsForScope(editScope)
				: [];
	const [activeRouteId, setActiveRouteId] = useState(
		initialScreen?.screenRouteId ?? screenRoutes[0]?.id ?? "",
	);
	const activeRoute =
		screenRoutes.find((route) => route.id === activeRouteId) ??
		screenRoutes.find((route) => route.id === selectedScreen?.screenRouteId) ??
		screenRoutes[0];

	const newScreen = useNewScreenInference(activeTab, setSaveState);

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
				setLoadState({ message: readErrorMessage(error, "화면 데이터를 불러오지 못했습니다."), status: "error" });
			}
		}

		void loadScreens();

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		if (!puckCatalogScope || puckCatalogItemsByScope[puckCatalogScope]) return;
		const scope = puckCatalogScope;
		let isActive = true;

		async function loadPuckCatalogItems() {
			try {
				const catalogItems = await fetchPuckCatalogItemsFromApi(scope);
				if (!isActive) return;
				setPuckCatalogItemsByScope((current) => ({
					...current,
					[scope]: catalogItems,
				}));
			} catch (error) {
				console.error(`Failed to load Puck catalog '${scope}':`, error);
			}
		}

		void loadPuckCatalogItems();

		return () => {
			isActive = false;
		};
	}, [puckCatalogScope, puckCatalogItemsByScope]);

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
		const nextComponent = visibleComponents.find((entry) => entry.node.metadata.id === componentId);
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

	const workbenchLayout = (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar">
			<SidebarProvider
				className="min-h-0 flex-1 overflow-hidden"
				style={{ "--sidebar-width": ASIDE_WIDTH } as CSSProperties}
			>
				<NavigationSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
				<NavigationRoutes
					activeTab={activeTab}
					activeRouteId={activeRoute?.id}
					areas={visibleAreaItems}
					components={visibleComponentItems}
					onSelectArea={handleSelectArea}
					onSelectComponent={handleSelectComponent}
					onSelectNewScreenSource={newScreen.onSelectSource}
					onSelectRoute={handleSelectRoute}
					onSelectScreen={handleSelectScreen}
					screenModules={screenModules}
					screenRoute={activeRoute}
					newScreenSourceError={newScreen.error}
					newScreenSources={newScreen.sources}
					onRerunSelectedNewScreenSource={newScreen.onRerun}
					onRunSelectedNewScreenSource={newScreen.onRun}
					onUploadNewScreenSource={newScreen.onUpload}
					selectedAreaId={selectedArea?.metadata.id}
					selectedComponentId={selectedComponent?.metadata.id}
					selectedNewScreenSourcePath={newScreen.selectedSourcePath}
					selectedScreenId={visibleScreen?.id}
					isUploadingNewScreenSource={newScreen.isUploading || newScreen.isStarting}
				/>
				<Canvas
					activeTab={activeTab}
					loadState={loadState}
					onApplyNewScreenRun={newScreen.onApply}
					onSaveSelectedScreen={handleSaveSelectedScreen}
					onToggleStatusBar={() => setShowStatusBar((current) => !current)}
					renderPuckPreview={isEditingWithPuck}
					saveState={saveState}
					selectedScreen={visibleScreen}
					newScreenPreviewNode={newScreen.previewNode}
					newScreenRunStatus={newScreen.runStatus}
					showStatusBar={showStatusBar}
				/>
				<EditSidebar
					scope={editScope}
					newScreenReview={
						activeTab === "agent"
							? {
									quality: newScreen.quality,
									status: newScreen.runStatus,
									validation: newScreen.validation,
								}
							: undefined
					}
				/>
			</SidebarProvider>
		</main>
	);

	if (!isEditingWithPuck || !editScope || !visibleScreen) return workbenchLayout;

	function handlePuckChange(nextData: Data) {
		if (!editScope || !visibleScreen) return;
		const puckData = normalizePuckData(nextData, readItemKindForScope(editScope));
		const nextScreen = applyPuckChangeToScope({
			catalogItems,
			data: puckData,
			scope: editScope,
		});
		handleScreenCandidateChange(visibleScreen.id, nextScreen);
	}

	return (
		<Puck
			key={`${visibleScreen.id}:${activeTab}:${editScope.kind}:${readEditScopeKey(editScope)}`}
			config={buildPuckConfigForScope(editScope, catalogItems)}
			data={buildPuckDataForScope(editScope) as Data}
			headerTitle={visibleScreen.title}
			iframe={{ enabled: false }}
			onChange={handlePuckChange}
			permissions={{
				delete: true,
				drag: true,
				duplicate: false,
				edit: true,
				insert: true,
			}}
		>
			{workbenchLayout}
		</Puck>
	);
}

function readEditScopeKey(scope: NonNullable<ReturnType<typeof resolveEditScope>>) {
	if (!scope) return "none";
	if (scope.kind === "screen-region") return scope.regionType;
	if (scope.kind === "area") return scope.area.metadata.id;
	return scope.component.metadata.id;
}

function readPuckCatalogScope(
	scope: ReturnType<typeof resolveEditScope>,
): PuckCatalogScope | undefined {
	if (!scope || scope.kind === "component") return undefined;
	return scope.kind;
}
