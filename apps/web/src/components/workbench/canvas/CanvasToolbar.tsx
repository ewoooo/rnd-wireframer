"use client";

import { Check, CircleAlert, Loader2, PanelTop, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";

export type SaveState = {
	message?: string;
	status: "idle" | "saving" | "saved" | "error";
};

type CanvasToolbarProps = {
	canSave: boolean;
	isStatusBarVisible: boolean;
	onSave: () => void | Promise<void>;
	onToggleStatusBar: () => void;
	saveState: SaveState;
};

export function CanvasToolbar({
	canSave,
	isStatusBarVisible,
	onSave,
	onToggleStatusBar,
	saveState,
}: CanvasToolbarProps) {
	const isSaving = saveState.status === "saving";

	return (
		<div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-1.5 py-1 shadow-sm">
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className="size-8 rounded-full"
				disabled={!canSave || isSaving}
				onClick={onSave}
				title={readSaveLabel(saveState, canSave)}
			>
				{readSaveIcon(saveState)}
			</Button>
			<Button
				type="button"
				size="icon"
				variant="ghost"
				className={cn("size-8 rounded-full", isStatusBarVisible && "bg-accent")}
				onClick={onToggleStatusBar}
				title={isStatusBarVisible ? "상태바 숨기기" : "상태바 표시"}
			>
				<PanelTop className="size-4" data-icon="inline-start" />
			</Button>
		</div>
	);
}

function readSaveIcon(saveState: SaveState) {
	if (saveState.status === "saving") {
		return <Loader2 className="size-4 animate-spin" data-icon="inline-start" />;
	}
	if (saveState.status === "saved") {
		return <Check className="size-4 text-primary" data-icon="inline-start" />;
	}
	if (saveState.status === "error") {
		return <CircleAlert className="size-4 text-destructive" data-icon="inline-start" />;
	}
	return <Save className="size-4" data-icon="inline-start" />;
}

function readSaveLabel(saveState: SaveState, canSave: boolean) {
	if (!canSave) return "저장할 화면이 없습니다";
	if (saveState.message) return saveState.message;
	if (saveState.status === "saving") return "저장 중";
	if (saveState.status === "saved") return "저장됨";
	if (saveState.status === "error") return "저장 실패";
	return "선택한 화면 저장";
}
