"use client";

import type { PuckCatalogItem } from "@cx/adapters/puck";
import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
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
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";
import {
	applyScreenInferenceRun,
	createScreenInferenceRunFromSource,
	fetchScreenInferenceArtifact,
	fetchScreenInferenceRunStatus,
	fetchScreenInferenceSources,
	uploadScreenInferenceSource,
} from "@/lib/screen-inference-client";
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

const ASIDE_WIDTH = "320px";
const NEW_SCREEN_WORKBENCH_STORAGE_KEY = "cx.new-screen.workbench.v0.1";
const NEW_SCREEN_SOURCE_IMPORT_ID = "web-upload";

type LoadState = {
	message?: string;
	status: "error" | "loading" | "ready";
};

const TERMINAL_SCREEN_INFERENCE_STATUSES = new Set(["failed", "waiting-review", "applied"]);

export function AppShell() {
	const initialNewScreenWorkbenchState = readNewScreenWorkbenchState();
	const [screens, setScreens] = useState<ScreenSummary[]>([]);
	const [loadState, setLoadState] = useState<LoadState>({
		message: "화면 불러오는 중",
		status: "loading",
	});
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
	const [newScreenSourceError, setNewScreenSourceError] = useState("");
	const [newScreenSources, setNewScreenSources] = useState<NewScreenSourceItem[]>(
		initialNewScreenWorkbenchState.sources,
	);
	const [newScreenPreviewNode, setNewScreenPreviewNode] = useState<RenderTreeScreenNode>();
	const [newScreenQuality, setNewScreenQuality] = useState<QualityInspectionContract>();
	const [newScreenRunStatus, setNewScreenRunStatus] = useState<ScreenInferenceRunStatus>();
	const [newScreenValidation, setNewScreenValidation] = useState<ValidationReportContract>();
	const [isUploadingNewScreenSource, setIsUploadingNewScreenSource] = useState(false);
	const [isStartingNewScreenRun, setIsStartingNewScreenRun] = useState(false);
	const [selectedAreaId, setSelectedAreaId] = useState("");
	const [selectedComponentId, setSelectedComponentId] = useState("");
	const [selectedNewScreenSourcePath, setSelectedNewScreenSourcePath] = useState(
		initialNewScreenWorkbenchState.selectedSourcePath,
	);
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
	const selectedNewScreenSource = newScreenSources.find(
		(source) => source.path === selectedNewScreenSourcePath,
	);
	const selectedNewScreenRunId = selectedNewScreenSource?.latestRunId;

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

	useEffect(() => {
		let isActive = true;

		async function loadUploadedSources() {
			try {
				const sources = await fetchScreenInferenceSources();
				if (!isActive) return;
				setNewScreenSources((current) => mergeNewScreenSources(current, sources));
				setSelectedNewScreenSourcePath((current) => current || sources[0]?.path || "");
			} catch (error) {
				if (!isActive) return;
				setNewScreenSourceError(readErrorMessage(error));
			}
		}

		void loadUploadedSources();

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

	useEffect(() => {
		writeNewScreenWorkbenchState({
			selectedSourcePath: selectedNewScreenSourcePath,
			sources: newScreenSources,
		});
	}, [newScreenSources, selectedNewScreenSourcePath]);

	useEffect(() => {
		if (!selectedNewScreenRunId || activeTab !== "agent") return;
		const runId = selectedNewScreenRunId;
		let isActive = true;
		let intervalId: ReturnType<typeof setInterval> | undefined;

		async function pollRunStatus() {
			try {
				const status = await fetchScreenInferenceRunStatus(runId);
				if (!isActive) return;
				setNewScreenRunStatus(status);
				if (TERMINAL_SCREEN_INFERENCE_STATUSES.has(status.status)) {
					if (intervalId) clearInterval(intervalId);
				}
			} catch (error) {
				if (!isActive) return;
				setNewScreenSourceError(readErrorMessage(error));
			}
		}

		void pollRunStatus();
		intervalId = setInterval(() => {
			void pollRunStatus();
		}, 1500);

		return () => {
			isActive = false;
			if (intervalId) clearInterval(intervalId);
		};
	}, [activeTab, selectedNewScreenRunId]);

	useEffect(() => {
		if (!newScreenRunStatus?.runId || newScreenRunStatus.status !== "waiting-review") return;
		const runId = newScreenRunStatus.runId;
		let isActive = true;

		async function loadReviewArtifacts() {
			try {
				const [finalResult, validation, quality] = await Promise.all([
					fetchScreenInferenceArtifact<RenderTree | RenderTreeScreenNode>(
						runId,
						"final-result.json",
					),
					fetchScreenInferenceArtifact<ValidationReportContract>(runId, "validation-report.json"),
					fetchScreenInferenceArtifact<QualityInspectionContract>(runId, "quality-review.json"),
				]);
				if (!isActive) return;
				setNewScreenPreviewNode(readScreenNodeFromRenderTreeArtifact(finalResult));
				setNewScreenValidation(validation);
				setNewScreenQuality(quality);
			} catch (error) {
				if (!isActive) return;
				setNewScreenSourceError(readErrorMessage(error));
			}
		}

		void loadReviewArtifacts();

		return () => {
			isActive = false;
		};
	}, [newScreenRunStatus?.runId, newScreenRunStatus?.status]);

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

	function handleSelectNewScreenSource(path: string) {
		setSelectedNewScreenSourcePath(path);
		const nextSource = newScreenSources.find((source) => source.path === path);
		setNewScreenPreviewNode(undefined);
		setNewScreenValidation(undefined);
		setNewScreenQuality(undefined);
		setNewScreenRunStatus(undefined);
		if (nextSource?.latestRunId) {
			void fetchScreenInferenceRunStatus(nextSource.latestRunId)
				.then(setNewScreenRunStatus)
				.catch((error) => setNewScreenSourceError(readErrorMessage(error)));
		}
	}

	async function handleUploadNewScreenSource(file: File) {
		setIsUploadingNewScreenSource(true);
		setNewScreenSourceError("");
		try {
			const source = await uploadScreenInferenceSource(file);
			setNewScreenSources((current) => {
				const withoutDuplicate = current.filter((item) => item.path !== source.path);
				return [source, ...withoutDuplicate];
			});
			setSelectedNewScreenSourcePath(source.path);
		} catch (error) {
			setNewScreenSourceError(readErrorMessage(error));
		} finally {
			setIsUploadingNewScreenSource(false);
		}
	}

	async function handleRunSelectedNewScreenSource() {
		if (!selectedNewScreenSource) return;
		setIsStartingNewScreenRun(true);
		setNewScreenSourceError("");
		setNewScreenPreviewNode(undefined);
		setNewScreenValidation(undefined);
		setNewScreenQuality(undefined);
		try {
			const run = await createScreenInferenceRunFromSource(selectedNewScreenSource);
			setNewScreenRunStatus(run.status);
			setNewScreenSources((current) =>
				current.map((source) =>
					source.path === selectedNewScreenSource.path
						? { ...source, latestRunId: run.runId }
						: source,
				),
			);
		} catch (error) {
			setNewScreenSourceError(readErrorMessage(error));
		} finally {
			setIsStartingNewScreenRun(false);
		}
	}

	async function handleRerunSelectedNewScreenSource() {
		if (!selectedNewScreenSource?.latestRunId) return;
		setIsStartingNewScreenRun(true);
		setNewScreenSourceError("");
		setNewScreenPreviewNode(undefined);
		setNewScreenValidation(undefined);
		setNewScreenQuality(undefined);
		try {
			const run = await createScreenInferenceRunFromSource(
				selectedNewScreenSource,
				selectedNewScreenSource.latestRunId,
			);
			setNewScreenRunStatus(run.status);
			setNewScreenSources((current) =>
				current.map((source) =>
					source.path === selectedNewScreenSource.path
						? { ...source, latestRunId: run.runId }
						: source,
				),
			);
		} catch (error) {
			setNewScreenSourceError(readErrorMessage(error));
		} finally {
			setIsStartingNewScreenRun(false);
		}
	}

	async function handleApplyNewScreenRun() {
		if (!newScreenRunStatus?.runId || newScreenRunStatus.status !== "waiting-review") return;
		setSaveState({ message: "등록 중", status: "saving" });
		setNewScreenSourceError("");
		try {
			await applyScreenInferenceRun(newScreenRunStatus.runId);
			const status = await fetchScreenInferenceRunStatus(newScreenRunStatus.runId);
			setNewScreenRunStatus(status);
			setSaveState({ message: "등록됨", status: "saved" });
		} catch (error) {
			setNewScreenSourceError(readErrorMessage(error));
			setSaveState({ message: "등록 실패", status: "error" });
		}
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
					onSelectNewScreenSource={handleSelectNewScreenSource}
					onSelectRoute={handleSelectRoute}
					onSelectScreen={handleSelectScreen}
					screenModules={screenModules}
					screenRoute={activeRoute}
					newScreenSourceError={newScreenSourceError}
					newScreenSources={newScreenSources}
					onRerunSelectedNewScreenSource={handleRerunSelectedNewScreenSource}
					onRunSelectedNewScreenSource={handleRunSelectedNewScreenSource}
					onUploadNewScreenSource={handleUploadNewScreenSource}
					selectedAreaId={selectedArea?.metadata.id}
					selectedComponentId={selectedComponent?.metadata.id}
					selectedNewScreenSourcePath={selectedNewScreenSourcePath}
					selectedScreenId={visibleScreen?.id}
					isUploadingNewScreenSource={isUploadingNewScreenSource || isStartingNewScreenRun}
				/>
				<Canvas
					activeTab={activeTab}
					loadState={loadState}
					onApplyNewScreenRun={handleApplyNewScreenRun}
					onSaveSelectedScreen={handleSaveSelectedScreen}
					onToggleStatusBar={() => setShowStatusBar((current) => !current)}
					renderPuckPreview={isEditingWithPuck}
					saveState={saveState}
					selectedScreen={visibleScreen}
					newScreenPreviewNode={newScreenPreviewNode}
					newScreenRunStatus={newScreenRunStatus}
					showStatusBar={showStatusBar}
				/>
				<EditSidebar
					scope={editScope}
					newScreenReview={
						activeTab === "agent"
							? {
									quality: newScreenQuality,
									status: newScreenRunStatus,
									validation: newScreenValidation,
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

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "화면 데이터를 불러오지 못했습니다.";
}

function mergeNewScreenSources(
	currentSources: NewScreenSourceItem[],
	serverSources: NewScreenSourceItem[],
): NewScreenSourceItem[] {
	const mergedByPath = new Map<string, NewScreenSourceItem>();
	for (const source of currentSources.filter(isWebUploadedNewScreenSource)) {
		mergedByPath.set(source.path, source);
	}
	for (const source of serverSources.filter(isWebUploadedNewScreenSource)) {
		const current = mergedByPath.get(source.path);
		mergedByPath.set(source.path, {
			...source,
			latestRunId: source.latestRunId ?? current?.latestRunId,
		});
	}
	return Array.from(mergedByPath.values());
}

function readNewScreenWorkbenchState(): {
	selectedSourcePath: string;
	sources: NewScreenSourceItem[];
} {
	if (typeof window === "undefined") return { selectedSourcePath: "", sources: [] };
	try {
		const rawValue = window.localStorage.getItem(NEW_SCREEN_WORKBENCH_STORAGE_KEY);
		if (!rawValue) return { selectedSourcePath: "", sources: [] };
		const value = JSON.parse(rawValue) as {
			selectedSourcePath?: unknown;
			sources?: unknown;
		};
		const sources = Array.isArray(value.sources)
			? value.sources.filter(isNewScreenSourceItem).filter(isWebUploadedNewScreenSource)
			: [];
		const selectedSourcePath =
			typeof value.selectedSourcePath === "string" &&
			sources.some((source) => source.path === value.selectedSourcePath)
				? value.selectedSourcePath
				: (sources[0]?.path ?? "");

		return { selectedSourcePath, sources };
	} catch {
		return { selectedSourcePath: "", sources: [] };
	}
}

function writeNewScreenWorkbenchState(input: {
	selectedSourcePath: string;
	sources: NewScreenSourceItem[];
}) {
	if (typeof window === "undefined") return;
	const sources = input.sources.filter(isWebUploadedNewScreenSource);
	const selectedSourcePath = sources.some((source) => source.path === input.selectedSourcePath)
		? input.selectedSourcePath
		: (sources[0]?.path ?? "");
	window.localStorage.setItem(
		NEW_SCREEN_WORKBENCH_STORAGE_KEY,
		JSON.stringify({ selectedSourcePath, sources }),
	);
}

function isNewScreenSourceItem(value: unknown): value is NewScreenSourceItem {
	if (!value || typeof value !== "object") return false;
	const item = value as Partial<Record<keyof NewScreenSourceItem, unknown>>;
	return (
		typeof item.batchId === "string" &&
		typeof item.importId === "string" &&
		typeof item.path === "string" &&
		typeof item.screenId === "string" &&
		(typeof item.latestRunId === "string" || item.latestRunId === undefined)
	);
}

function isWebUploadedNewScreenSource(source: NewScreenSourceItem): boolean {
	return source.importId === NEW_SCREEN_SOURCE_IMPORT_ID;
}

function readScreenNodeFromRenderTreeArtifact(
	artifact: RenderTree | RenderTreeScreenNode,
): RenderTreeScreenNode {
	if (isRenderTreeScreenNode(artifact)) return artifact;
	const screenNode = artifact.children?.find(isRenderTreeScreenNode);
	if (!screenNode) throw new Error("final-result.json에 Screen 노드가 없습니다.");
	return screenNode;
}

function isRenderTreeScreenNode(value: unknown): value is RenderTreeScreenNode {
	return typeof value === "object" && value !== null && "type" in value && value.type === "Screen";
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
