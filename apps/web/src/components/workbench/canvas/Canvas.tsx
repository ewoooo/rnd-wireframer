import { Puck } from "@puckeditor/core";
import { FileUp } from "lucide-react";
import { SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import type { ScreenSummary } from "@/lib/screen-sources";
import type { NavigatorTab } from "@/model/workbench-view-model";
import { RenderedScreen } from "../../screen/RenderedScreen";
import { CanvasToolbar, type SaveState } from "./CanvasToolbar";
import { ExportToolbar } from "./ExportToolbar";

type CanvasProps = {
	activeTab: NavigatorTab;
	loadState?: {
		message?: string;
		status: "error" | "loading" | "ready";
	};
	onSaveSelectedScreen?: () => void | Promise<void>;
	onToggleStatusBar?: () => void;
	renderPuckPreview?: boolean;
	saveState?: SaveState;
	selectedScreen?: ScreenSummary;
	showStatusBar?: boolean;
};

export function Canvas({
	activeTab,
	loadState = { status: "ready" },
	onSaveSelectedScreen,
	onToggleStatusBar,
	renderPuckPreview = false,
	saveState = { status: "idle" },
	selectedScreen,
	showStatusBar = true,
}: CanvasProps) {
	const isPuckTab = activeTab === "puck";
	const isAreaTab = activeTab === "ogn";
	const isNewScreenTab = activeTab === "agent";
	const isEditorTab = isPuckTab || isAreaTab;
	const canExport = activeTab === "scn" && !!selectedScreen?.renderTree;

	return (
		<SidebarInset className="overflow-hidden">
			<SidebarHeader className="h-14 shrink-0 justify-center border-b border-sidebar-border bg-background px-5 py-0">
				<div className="flex min-w-0 items-center justify-between gap-3">
					<div className="min-w-0">
						<h1 className="truncate text-base font-semibold">
							{isNewScreenTab ? "새 화면" : (selectedScreen?.title ?? "Screen Preview")}
						</h1>
						{showStatusBar ? (
							<p className="truncate text-xs text-muted-foreground">
								{readCanvasContextLabel(activeTab, selectedScreen, renderPuckPreview)}
							</p>
						) : null}
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<CanvasToolbar
							canSave={!isNewScreenTab && !!selectedScreen?.renderTree && !!onSaveSelectedScreen}
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
					isEditorTab && !renderPuckPreview
						? "overflow-hidden bg-background p-0"
						: "items-center justify-center overflow-hidden bg-secondary/50 p-6"
				}
			>
				{loadState.status !== "ready" ? (
					<CanvasLoadState message={loadState.message} status={loadState.status} />
				) : isNewScreenTab ? (
					<NewScreenEmptyPreview />
				) : renderPuckPreview ? (
					<div className="flex h-211 w-98 max-w-full shrink-0 overflow-hidden rounded-3xl border bg-background shadow-xl [&_[class*='PuckPreview']]:h-full [&_[class*='PuckPreview']]:w-full">
						<Puck.Preview />
					</div>
				) : (
					<RenderedScreen node={selectedScreen?.renderTree} />
				)}
			</SidebarContent>
		</SidebarInset>
	);
}

function NewScreenEmptyPreview() {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
			<div className="flex size-11 items-center justify-center rounded-md border bg-background">
				<FileUp className="size-5 text-muted-foreground" data-icon="inline-start" />
			</div>
			<div className="grid gap-1">
				<p className="text-sm font-semibold">Markdown source를 업로드하세요.</p>
				<p className="max-w-80 text-xs leading-5 text-muted-foreground">
					업로드된 파일은 data/client-imports 형식으로 저장되고, 다음 롤아웃에서 Run을 시작합니다.
				</p>
			</div>
		</div>
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

function readCanvasContextLabel(
	activeTab: NavigatorTab,
	selectedScreen?: ScreenSummary,
	renderPuckPreview = false,
) {
	if (activeTab === "agent") return "New Screen Intake · data/client-imports";

	const tabLabel =
		activeTab === "scn" && renderPuckPreview
			? "Screen Editor"
			: activeTab === "puck"
				? "Puck Editor"
				: activeTab === "ogn"
					? "Area Editor"
					: "Preview";
	const routeLabel = selectedScreen?.route ?? selectedScreen?.screenRouteId ?? "No route";
	const statusLabel = selectedScreen?.status ?? "draft";
	return `${tabLabel} · ${routeLabel} · ${statusLabel}`;
}
