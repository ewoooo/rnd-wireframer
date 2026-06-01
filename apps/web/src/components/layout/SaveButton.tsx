"use client";

import { Check, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { updateScreenRegions } from "@/app/actions/screen-actions";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { renderTreeToTables } from "@/adapters/render-tree-to-tables";
import { useWorkbenchStore } from "@/model/store";

export function SaveButton() {
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);
	const [isSaving, startSaving] = useTransition();
	const [savedAt, setSavedAt] = useState(0);

	// 현재는 Screen 페이지(scn)만 저장 백엔드가 연결되어 있음. Area/Component는 추후.
	const canSave = activeTab === "scn" && !!selectedScreen;

	function handleSave() {
		if (!selectedScreen) return;
		startSaving(async () => {
			const result = renderTreeToTables(selectedScreen.schema, {
				screenVariantId: selectedScreen.screenVariantId,
			});
			const screen = result.screens.screens[0]?.screen;
			const { error } = await updateScreenRegions(selectedScreen.code, screen);
			if (!error) {
				setSavedAt(Date.now());
				setTimeout(() => setSavedAt(0), 1500);
			}
		});
	}

	const justSaved = savedAt > 0;

	return (
		<Tooltip delayDuration={300}>
			<TooltipTrigger asChild>
				<span>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="size-8 rounded-full"
						disabled={!canSave || isSaving}
						onClick={handleSave}
					>
						{justSaved ? <Check className="size-4 text-primary" /> : <Save className="size-4" />}
					</Button>
				</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">
				{canSave
					? "선택한 스크린 저장"
					: activeTab === "scn"
						? "스크린을 선택해주세요"
						: "이 페이지는 아직 저장을 지원하지 않습니다"}
			</TooltipContent>
		</Tooltip>
	);
}
