"use client";

import type { PuckCatalogItem } from "@cx/adapters/puck";
import type { RenderTreeScreenNode } from "@cx/renderer";
import { type Data, Puck } from "@puckeditor/core";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { buildPuckConfigForScope } from "@/components/puck/workbench/workbench-puck";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Canvas } from "@/components/workbench/canvas/Canvas";
import { EditSidebar } from "@/components/workbench/edit-sidebar/EditSidebar";
import { NavigationRoutes } from "@/components/workbench/navigation/NavigationRoutes";
import { NavigationSidebar } from "@/components/workbench/navigation/NavigationSidebar";
import {
	fetchPuckCatalogItemsFromApi,
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
import type { NavigatorTab } from "@/model/workbench-view-model";
import { useNewScreenInference } from "@/model/workbench/use-new-screen-inference";
import { useScreenWorkbench } from "@/model/workbench/use-screen-workbench";

const ASIDE_WIDTH = "320px";

export function AppShell() {
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const screen = useScreenWorkbench();
	const newScreen = useNewScreenInference(activeTab, screen.setSaveState);

	const [puckCatalogItemsByScope, setPuckCatalogItemsByScope] = useState<
		Partial<Record<PuckCatalogScope, PuckCatalogItem[]>>
	>({});
	const [showStatusBar, setShowStatusBar] = useState(true);

	const editScope = resolveEditScope({
		activeTab,
		selectedArea: screen.selectedArea,
		selectedComponent: screen.selectedComponent,
		selectedScreen: screen.visibleScreen?.renderTree,
	});
	const isEditingWithPuck = isPuckEditTab(activeTab) && !!editScope;
	const puckCatalogScope = readPuckCatalogScope(editScope);
	const catalogItems =
		editScope && puckCatalogScope
			? (puckCatalogItemsByScope[puckCatalogScope] ?? resolveCatalogItemsForScope(editScope))
			: editScope
				? resolveCatalogItemsForScope(editScope)
				: [];

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

	const workbenchLayout = (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar">
			<SidebarProvider
				className="min-h-0 flex-1 overflow-hidden"
				style={{ "--sidebar-width": ASIDE_WIDTH } as CSSProperties}
			>
				<NavigationSidebar activeTab={activeTab} onSelectTab={setActiveTab} />
				<NavigationRoutes
					activeTab={activeTab}
					activeRouteId={screen.activeRoute?.id}
					areas={screen.visibleAreaItems}
					components={screen.visibleComponentItems}
					onSelectArea={screen.onSelectArea}
					onSelectComponent={screen.onSelectComponent}
					onSelectNewScreenSource={newScreen.onSelectSource}
					onSelectRoute={screen.onSelectRoute}
					onSelectScreen={screen.onSelectScreen}
					screenModules={screen.screenModules}
					screenRoute={screen.activeRoute}
					newScreenSourceError={newScreen.error}
					newScreenSources={newScreen.sources}
					onRerunSelectedNewScreenSource={newScreen.onRerun}
					onRunSelectedNewScreenSource={newScreen.onRun}
					onUploadNewScreenSource={newScreen.onUpload}
					selectedAreaId={screen.selectedArea?.metadata.id}
					selectedComponentId={screen.selectedComponent?.metadata.id}
					selectedNewScreenSourcePath={newScreen.selectedSourcePath}
					selectedScreenId={screen.visibleScreen?.id}
					isUploadingNewScreenSource={newScreen.isUploading || newScreen.isStarting}
				/>
				<Canvas
					activeTab={activeTab}
					loadState={screen.loadState}
					onApplyNewScreenRun={newScreen.onApply}
					onSaveSelectedScreen={screen.onSaveSelectedScreen}
					onToggleStatusBar={() => setShowStatusBar((current) => !current)}
					renderPuckPreview={isEditingWithPuck}
					saveState={screen.saveState}
					selectedScreen={screen.visibleScreen}
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

	if (!isEditingWithPuck || !editScope || !screen.visibleScreen) return workbenchLayout;

	function handlePuckChange(nextData: Data) {
		if (!editScope || !screen.visibleScreen) return;
		const puckData = normalizePuckData(nextData, readItemKindForScope(editScope));
		const nextScreen = applyPuckChangeToScope({
			catalogItems,
			data: puckData,
			scope: editScope,
		});
		screen.onScreenCandidateChange(screen.visibleScreen.id, nextScreen as RenderTreeScreenNode);
	}

	return (
		<Puck
			key={`${screen.visibleScreen.id}:${activeTab}:${editScope.kind}:${readEditScopeKey(editScope)}`}
			config={buildPuckConfigForScope(editScope, catalogItems)}
			data={buildPuckDataForScope(editScope) as Data}
			headerTitle={screen.visibleScreen.title}
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
