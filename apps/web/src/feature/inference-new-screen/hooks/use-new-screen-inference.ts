"use client";

import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";
import { useNewScreenRunLifecycle } from "@/feature/inference-new-screen/hooks/use-new-screen-run-lifecycle";
import { useNewScreenRuns } from "@/feature/inference-new-screen/hooks/use-new-screen-runs";
import type { NavigatorTab } from "@/model/workbench-view-model";

export function useNewScreenInference(
	activeTab: NavigatorTab,
	setSaveState: (state: SaveState) => void,
) {
	const runs = useNewScreenRuns();
	const lifecycle = useNewScreenRunLifecycle({
		activeTab,
		selectedRun: runs.selectedRun,
		selectedRunStatus: runs.selectedRunStatus,
		setError: runs.setError,
		setRuns: runs.setRuns,
		setSaveState,
		setSelectedRunId: runs.setSelectedRunId,
		setSelectedRunStatus: runs.setSelectedRunStatus,
	});

	return {
		sources: runs.runs,
		selectedRunId: runs.selectedRunId,
		error: runs.error,
		runStatus: lifecycle.runStatus,
		previewNode: lifecycle.previewNode,
		validation: lifecycle.validation,
		quality: lifecycle.quality,
		isUploading: lifecycle.isUploading,
		isStarting: lifecycle.isStarting,
		onSelectSource: runs.selectRun,
		onUpload: lifecycle.upload,
		onRun: lifecycle.run,
		onRerun: lifecycle.rerun,
		onApply: lifecycle.apply,
	};
}
