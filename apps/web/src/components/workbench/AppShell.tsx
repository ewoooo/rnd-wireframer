"use client";

import type { RenderTreeScreenNode } from "@cx/renderer";
import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
import { type Data, Puck } from "@puckeditor/core";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { isPuckEditTab, resolveEditScope } from "@/components/puck/workbench/edit-scope";
import {
	applyPuckChangeToScope,
	buildPuckConfigForScope,
	buildPuckDataForScope,
	normalizePuckData,
	readItemKindForScope,
	resolveCatalogItemsForScope,
} from "@/components/puck/workbench/workbench-puck";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Canvas } from "@/components/workbench/canvas/Canvas";
import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";
import { EditSidebar } from "@/components/workbench/edit-sidebar/EditSidebar";
import { NavigationRoutes } from "@/components/workbench/navigation/NavigationRoutes";
import { NavigationSidebar } from "@/components/workbench/navigation/NavigationSidebar";
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
import type {
	ScreenInferenceRunCreateResponse,
	ScreenInferenceRunResponse,
	ScreenInferenceRunStatus,
} from "@/lib/screen-inference-run";
import type { ScreenSummary } from "@/lib/screen-sources";
import {
	collectScreenAreas,
	collectScreenComponents,
	createWorkbenchViewModel,
	getInitialScreen,
	toNavigationNodeItems,
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

type ScreenInferenceSourceUploadResponse = {
	error?: string;
	source?: NewScreenSourceItem;
};

const TERMINAL_SCREEN_INFERENCE_STATUSES = new Set(["failed", "waiting-review", "applied"]);

export function AppShell() {
	const [screens, setScreens] = useState<ScreenSummary[]>([]);
	const [loadState, setLoadState] = useState<LoadState>({
		message: "화면 불러오는 중",
		status: "loading",
	});
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
	const [newScreenSourceError, setNewScreenSourceError] = useState("");
	const [newScreenSources, setNewScreenSources] = useState<NewScreenSourceItem[]>([]);
	const [newScreenPreviewNode, setNewScreenPreviewNode] = useState<RenderTreeScreenNode>();
	const [newScreenQuality, setNewScreenQuality] = useState<QualityInspectionContract>();
	const [newScreenRunStatus, setNewScreenRunStatus] = useState<ScreenInferenceRunStatus>();
	const [newScreenValidation, setNewScreenValidation] = useState<ValidationReportContract>();
	const [isUploadingNewScreenSource, setIsUploadingNewScreenSource] = useState(false);
	const [isStartingNewScreenRun, setIsStartingNewScreenRun] = useState(false);
	const [selectedAreaId, setSelectedAreaId] = useState("");
	const [selectedComponentId, setSelectedComponentId] = useState("");
	const [selectedNewScreenSourcePath, setSelectedNewScreenSourcePath] = useState("");
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
	const visibleAreas = collectScreenAreas(visibleScreen);
	const selectedArea =
		visibleAreas.find((area) => area.metadata.id === selectedAreaId) ?? visibleAreas[0];
	const visibleAreaItems = toNavigationNodeItems(visibleAreas);
	const visibleComponents = collectScreenComponents(visibleScreen);
	const selectedComponent =
		visibleComponents.find((component) => component.metadata.id === selectedComponentId) ??
		visibleComponents[0];
	const visibleComponentItems = toNavigationNodeItems(visibleComponents);
	const editScope = resolveEditScope({
		activeTab,
		selectedArea,
		selectedComponent,
		selectedScreen: visibleScreen?.renderTree,
	});
	const isEditingWithPuck = isPuckEditTab(activeTab) && !!editScope;
	const catalogItems = editScope ? resolveCatalogItemsForScope(editScope) : [];
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
					fetchScreenInferenceArtifact<RenderTreeScreenNode>(runId, "final-result.json"),
					fetchScreenInferenceArtifact<ValidationReportContract>(runId, "validation-report.json"),
					fetchScreenInferenceArtifact<QualityInspectionContract>(runId, "quality-review.json"),
				]);
				if (!isActive) return;
				setNewScreenPreviewNode(finalResult);
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
		setSelectedAreaId(areaId);
	}

	function handleSelectComponent(componentId: string) {
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
					selectedScreenTitle={visibleScreen?.title}
					isUploadingNewScreenSource={isUploadingNewScreenSource || isStartingNewScreenRun}
				/>
				<Canvas
					activeTab={activeTab}
					loadState={loadState}
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
			config={buildPuckConfigForScope(editScope)}
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

async function uploadScreenInferenceSource(file: File): Promise<NewScreenSourceItem> {
	const formData = new FormData();
	formData.set("file", file);
	formData.set("importId", "web-upload");

	const response = await fetch("/api/screen-inference/sources", {
		body: formData,
		method: "POST",
	});
	const body = (await response.json()) as ScreenInferenceSourceUploadResponse;

	if (!response.ok || body.error || !body.source) {
		throw new Error(body.error ?? `새 화면 source 업로드 실패 ${response.status}`);
	}

	return body.source;
}

async function createScreenInferenceRunFromSource(
	source: NewScreenSourceItem,
	previousRunId?: string,
): Promise<ScreenInferenceRunCreateResponse> {
	const response = await fetch("/api/screen-inference/runs", {
		body: JSON.stringify({
			previousRunId,
			screenId: source.screenId,
			source: {
				path: source.path,
			},
		}),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
	const body = (await response.json()) as ScreenInferenceRunCreateResponse & { error?: string };

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 inference 시작 실패 ${response.status}`);
	}

	return body;
}

async function fetchScreenInferenceRunStatus(runId: string): Promise<ScreenInferenceRunStatus> {
	const response = await fetch(`/api/screen-inference/runs/${encodeURIComponent(runId)}`);
	const body = (await response.json()) as ScreenInferenceRunResponse & { error?: string };

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 inference 상태 요청 실패 ${response.status}`);
	}

	return body.status;
}

async function fetchScreenInferenceArtifact<T>(runId: string, artifactName: string): Promise<T> {
	const response = await fetch(
		`/api/screen-inference/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(
			artifactName,
		)}`,
	);
	const body = (await response.json()) as T & { error?: string };

	if (!response.ok || body.error) {
		throw new Error(body.error ?? `새 화면 artifact 요청 실패 ${response.status}`);
	}

	return body;
}

function readErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "화면 데이터를 불러오지 못했습니다.";
}

function readEditScopeKey(scope: NonNullable<ReturnType<typeof resolveEditScope>>) {
	if (!scope) return "none";
	if (scope.kind === "screen-region") return scope.regionType;
	if (scope.kind === "area") return scope.area.metadata.id;
	return scope.component.metadata.id;
}
