"use client";

import { type Data, Puck } from "@puckeditor/core";
import type { CSSProperties } from "react";
import { useState } from "react";
import { buildPuckConfigForScope } from "@/components/puck/workbench/workbench-puck";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Rail } from "@/components/layout/Rail";
import { Canvas } from "@/components/workbench/canvas/Canvas";
import { EditSidebar } from "@/components/workbench/edit-sidebar/EditSidebar";
import { NavigationRoutes } from "@/components/workbench/navigation/NavigationRoutes";
import { useNewScreenInference } from "@/feature/inference-new-screen/hooks/use-new-screen-inference";
import { buildPuckDataForScope } from "@/lib/workbench-puck/puck-scope";
import { usePuckEditing } from "@/model/workbench/use-puck-editing";
import { useScreenWorkbench } from "@/model/workbench/use-screen-workbench";
import type { NavigatorTab } from "@/model/workbench-view-model";

const ASIDE_WIDTH = "320px";

export function AppShell() {
	const [activeTab, setActiveTab] = useState<NavigatorTab>("scn");
	const screen = useScreenWorkbench();
	const newScreen = useNewScreenInference(activeTab, screen.setSaveState);
	const puck = usePuckEditing({
		activeTab,
		visibleScreen: screen.visibleScreen,
		selectedArea: screen.selectedArea,
		selectedComponent: screen.selectedComponent,
		onScreenCandidateChange: screen.onScreenCandidateChange,
	});
	const [showStatusBar, setShowStatusBar] = useState(true);

	const workbenchLayout = (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar">
			<SidebarProvider
				className="min-h-0 flex-1 overflow-hidden"
				style={{ "--sidebar-width": ASIDE_WIDTH } as CSSProperties}
			>
				<Rail activeTab={activeTab} onSelectTab={setActiveTab} />
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
					selectedNewScreenRunId={newScreen.selectedRunId}
					selectedScreenId={screen.visibleScreen?.id}
					isUploadingNewScreenSource={newScreen.isUploading || newScreen.isStarting}
				/>
				<Canvas
					activeTab={activeTab}
					loadState={screen.loadState}
					onApplyNewScreenRun={newScreen.onApply}
					onSaveSelectedScreen={screen.onSaveSelectedScreen}
					onToggleStatusBar={() => setShowStatusBar((current) => !current)}
					renderPuckPreview={puck.isEditingWithPuck}
					saveState={screen.saveState}
					selectedScreen={screen.visibleScreen}
					newScreenPreviewNode={newScreen.previewNode}
					newScreenRunStatus={newScreen.runStatus}
					showStatusBar={showStatusBar}
				/>
				<EditSidebar
					scope={puck.editScope}
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

	if (!puck.isEditingWithPuck || !puck.editScope || !screen.visibleScreen) return workbenchLayout;

	return (
		<Puck
			key={`${screen.visibleScreen.id}:${activeTab}:${puck.editScope.kind}:${puck.editScopeKey}`}
			config={buildPuckConfigForScope(puck.editScope, puck.catalogItems)}
			data={buildPuckDataForScope(puck.editScope) as Data}
			headerTitle={screen.visibleScreen.title}
			iframe={{ enabled: false }}
			onChange={puck.handlePuckChange}
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
