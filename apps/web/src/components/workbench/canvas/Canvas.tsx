import type { RenderTreeNode, RenderTreeScreenNode } from "@cx/renderer";
import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import type { ScreenSummary } from "@/lib/screen-sources";
import type { NavigatorTab } from "@/model/workbench-view-model";
import { AreaPuckEditor } from "../../puck/AreaPuckEditor";
import { ScreenPuckEditor } from "../../puck/ScreenPuckEditor";
import { RenderedScreen } from "../../screen/RenderedScreen";
import { CanvasToolbar, type SaveState } from "./CanvasToolbar";
import { ExportToolbar } from "./ExportToolbar";

type CanvasProps = {
	activeTab: NavigatorTab;
	loadState?: {
		message?: string;
		status: "error" | "loading" | "ready";
	};
	onAreaCandidateChange?: (screenId: string, node: RenderTreeNode) => void;
	onAreaCandidatePublish?: (screenId: string, node: RenderTreeNode) => void | Promise<void>;
	onScreenCandidateChange?: (screenId: string, node: RenderTreeScreenNode) => void;
	onScreenCandidatePublish?: (screenId: string, node: RenderTreeScreenNode) => void | Promise<void>;
	onSaveSelectedScreen?: () => void | Promise<void>;
	onToggleStatusBar?: () => void;
	saveState?: SaveState;
	selectedArea?: RenderTreeNode;
	selectedScreen?: ScreenSummary;
	showStatusBar?: boolean;
};

export function Canvas({
	activeTab,
	loadState = { status: "ready" },
	onAreaCandidateChange,
	onAreaCandidatePublish,
	onScreenCandidateChange,
	onScreenCandidatePublish,
	onSaveSelectedScreen,
	onToggleStatusBar,
	saveState = { status: "idle" },
	selectedArea,
	selectedScreen,
	showStatusBar = true,
}: CanvasProps) {
	const isPuckTab = activeTab === "puck";
	const isAreaTab = activeTab === "ogn";
	const isEditorTab = isPuckTab || isAreaTab;
	const canExport = activeTab === "scn" && !!selectedScreen?.renderTree;

	return (
		<SidebarInset className="overflow-hidden">
			<SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border bg-background px-5 py-0">
				<div className="flex min-w-0 items-center justify-between gap-3">
					<div className="min-w-0">
						<h1 className="truncate text-base font-semibold">
							{selectedScreen?.title ?? "Screen Preview"}
						</h1>
						{showStatusBar ? (
							<p className="truncate text-xs text-muted-foreground">
								{readCanvasContextLabel(activeTab, selectedScreen)}
							</p>
						) : null}
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<CanvasToolbar
							canSave={!!selectedScreen?.renderTree && !!onSaveSelectedScreen}
							isStatusBarVisible={showStatusBar}
							onSave={() => onSaveSelectedScreen?.()}
							onToggleStatusBar={() => onToggleStatusBar?.()}
							saveState={saveState}
						/>
						<ExportToolbar
							canExport={canExport}
							disabledReason={
								activeTab === "scn" ? "스크린을 선택해주세요" : "스크린 탭에서만 내보낼 수 있어요"
							}
							screen={selectedScreen}
						/>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent
				className={
					isEditorTab
						? "overflow-hidden bg-background p-0"
						: "items-center justify-center overflow-hidden bg-secondary/50 p-6"
				}
			>
				{loadState.status !== "ready" ? (
					<CanvasLoadState message={loadState.message} status={loadState.status} />
				) : isPuckTab && selectedScreen?.renderTree ? (
					<ScreenPuckEditor
						screen={selectedScreen.renderTree}
						onCandidateChange={(node) => onScreenCandidateChange?.(selectedScreen.id, node)}
						onPublishCandidate={(node) => onScreenCandidatePublish?.(selectedScreen.id, node)}
					/>
				) : isAreaTab && selectedScreen && selectedArea ? (
					<AreaPuckEditor
						area={selectedArea}
						onCandidateChange={(node) => onAreaCandidateChange?.(selectedScreen.id, node)}
						onPublishCandidate={(node) => onAreaCandidatePublish?.(selectedScreen.id, node)}
					/>
				) : (
					<RenderedScreen node={selectedScreen?.renderTree} />
				)}
			</SidebarContent>
		</SidebarInset>
	);
}

function CanvasLoadState({ message, status }: { message?: string; status: "error" | "loading" }) {
	return (
		<div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
			<p className="text-sm font-medium">
				{status === "loading" ? "화면을 불러오고 있습니다." : "화면을 불러오지 못했습니다."}
			</p>
			{message ? <p className="max-w-80 text-xs text-muted-foreground">{message}</p> : null}
		</div>
	);
}

function readCanvasContextLabel(activeTab: NavigatorTab, selectedScreen?: ScreenSummary) {
	const tabLabel =
		activeTab === "puck" ? "Puck Editor" : activeTab === "ogn" ? "Area Editor" : "Preview";
	const routeLabel = selectedScreen?.route ?? selectedScreen?.screenRouteId ?? "No route";
	const statusLabel = selectedScreen?.status ?? "draft";
	return `${tabLabel} · ${routeLabel} · ${statusLabel}`;
}
