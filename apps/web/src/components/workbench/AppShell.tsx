"use client";

import { type Data, Puck } from "@puckeditor/core";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useState } from "react";
import { buildPuckConfigForScope } from "@/components/puck/workbench/workbench-puck";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Divider } from "@/components/layout/Aside";
import { DoubleBorder } from "@/components/layout/DoubleBorder";
import { Rail } from "@/components/layout/Rail";
import { useSessionLayout } from "@/components/layout/use-session-layout";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Canvas } from "@/components/workbench/canvas/Canvas";
import { EditSidebar } from "@/components/workbench/edit-sidebar/EditSidebar";
import { NavigationRoutes } from "@/components/workbench/navigation/NavigationRoutes";
import { useNewScreenInference } from "@/feature/inference-new-screen/hooks/use-new-screen-inference";
import { buildPuckDataForScope } from "@/lib/workbench-puck/puck-scope";
import { usePuckEditing } from "@/model/workbench/use-puck-editing";
import { useScreenWorkbench } from "@/model/workbench/use-screen-workbench";
import type { NavigatorTab } from "@/model/workbench-view-model";

const ASIDE_WIDTH = "320px";

export function AppShell({ initialTab = "scn" }: { initialTab?: NavigatorTab }) {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<NavigatorTab>(initialTab);

	// 탭 전환 시 ?tab= 쿼리도 갱신 → 새로고침/공유 시 같은 탭으로 복원(깜빡임 없음).
	function handleSelectTab(tab: NavigatorTab) {
		setActiveTab(tab);
		const params = new URLSearchParams(window.location.search);
		params.set("tab", tab);
		router.replace(`?${params.toString()}`, { scroll: false });
	}

	// Run 탭 canvas↔RightAside 가로 분할 크기 유지(새로고침), 앱 새로 열면 초기화.
	const runSplitLayout = useSessionLayout("run-split");

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

	// Puck context는 Canvas(Preview)·EditSidebar(Fields/Components)에만 필요하다.
	// 이 영역만 <Puck>로 감싸고 Rail·LeftAside(네비)는 밖에 둔다 →
	// 화면 전환 시 Puck remount가 무거운 네비 목록·Rail까지 재마운트하지 않는다.
	const canvas = (
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
	);

	// Run(agent) 탭 예외: canvas↔RightAside를 가로 ResizablePanelGroup으로 묶어
	// 그 사이 수직 Divider로 RightAside 폭을 드래그 조절한다(md가 길어서).
	const editorRegion =
		activeTab === "agent" ? (
			<ResizablePanelGroup
				className="min-w-0 flex-1"
				orientation="horizontal"
				{...runSplitLayout}
			>
				<ResizablePanel className="flex min-h-0 min-w-0" defaultSize={68} minSize={30}>
					{canvas}
				</ResizablePanel>
				<Divider orientation="vertical" />
				<ResizablePanel className="flex min-h-0" defaultSize={32} minSize={18}>
					<EditSidebar
						scope={puck.editScope}
						newScreenSource={{ runId: newScreen.selectedRun?.runId }}
					/>
				</ResizablePanel>
			</ResizablePanelGroup>
		) : (
			<>
				{canvas}
				<DoubleBorder />
				<EditSidebar scope={puck.editScope} />
			</>
		);

	const editorRegionWithPuck =
		puck.isEditingWithPuck && puck.editScope && screen.visibleScreen ? (
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
				{editorRegion}
			</Puck>
		) : (
			editorRegion
		);

	return (
		<main className="flex h-svh w-screen min-w-0 overflow-hidden bg-sidebar">
			{/* body: rail · double border · main(=SidebarProvider) 3형제 */}
			<Rail activeTab={activeTab} onSelectTab={handleSelectTab} />
			<DoubleBorder />
			<SidebarProvider
				className="min-h-0 flex-1 overflow-hidden"
				style={{ "--sidebar-width": ASIDE_WIDTH } as CSSProperties}
			>
				<NavigationRoutes
					activeTab={activeTab}
					newScreenReview={
						activeTab === "agent"
							? {
									quality: newScreen.quality,
									status: newScreen.runStatus,
									validation: newScreen.validation,
								}
							: undefined
					}
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
				<DoubleBorder />
				{editorRegionWithPuck}
			</SidebarProvider>
		</main>
	);
}
