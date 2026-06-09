"use client";

import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
import { useEffect, useState } from "react";
import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";
import type {
	NewScreenRunItem,
	NewScreenSourceItem,
} from "@/components/workbench/new-screen/NewScreenSourcePanel";
import { readErrorMessage } from "@/lib/api-error";
import {
	mergeNewScreenRuns,
	readNewScreenWorkbenchState,
	writeNewScreenWorkbenchState,
} from "@/lib/new-screen-workbench-storage";
import {
	applyScreenInferenceRun,
	createScreenInferenceRunFromSource,
	fetchScreenInferenceArtifact,
	fetchScreenInferenceRunStatus,
	fetchScreenInferenceRuns,
	subscribeScreenInferenceRunEvents,
	uploadScreenInferenceSource,
} from "@/lib/screen-inference-client";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";
import type { ScreenInferenceRunRow } from "@/lib/screen-inference-runs";
import type { NavigatorTab } from "@/model/workbench-view-model";

const TERMINAL_SCREEN_INFERENCE_STATUSES = new Set(["failed", "waiting-review", "applied"]);
const NEW_SCREEN_ERROR_FALLBACK = "화면 데이터를 불러오지 못했습니다.";

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

export function useNewScreenInference(
	activeTab: NavigatorTab,
	setSaveState: (state: SaveState) => void,
) {
	const [newScreenSourceError, setNewScreenSourceError] = useState("");
	const [newScreenRuns, setNewScreenRuns] = useState<NewScreenRunItem[]>(
		() => readNewScreenWorkbenchState().runs,
	);
	const [newScreenPreviewNode, setNewScreenPreviewNode] = useState<RenderTreeScreenNode>();
	const [newScreenQuality, setNewScreenQuality] = useState<QualityInspectionContract>();
	const [newScreenRunStatus, setNewScreenRunStatus] = useState<ScreenInferenceRunStatus>();
	const [newScreenValidation, setNewScreenValidation] = useState<ValidationReportContract>();
	const [isUploadingNewScreenSource, setIsUploadingNewScreenSource] = useState(false);
	const [isStartingNewScreenRun, setIsStartingNewScreenRun] = useState(false);
	const [selectedNewScreenRunId, setSelectedNewScreenRunId] = useState(
		() => readNewScreenWorkbenchState().selectedRunId,
	);

	const selectedNewScreenRun = newScreenRuns.find((run) => run.id === selectedNewScreenRunId);
	const selectedNewScreenActiveRunId = selectedNewScreenRun?.runId;

	// loadRunRows
	useEffect(() => {
		let isActive = true;

		async function loadRunRows() {
			try {
				const runs = (await fetchScreenInferenceRuns()).map(screenInferenceRunRowToItem);
				if (!isActive) return;
				setNewScreenRuns((current) => mergeNewScreenRuns(current, runs));
				setSelectedNewScreenRunId((current) => current || runs[0]?.id || "");
			} catch (error) {
				if (!isActive) return;
				setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
			}
		}

		void loadRunRows();

		return () => {
			isActive = false;
		};
	}, []);

	// persist
	useEffect(() => {
		writeNewScreenWorkbenchState({
			runs: newScreenRuns,
			selectedRunId: selectedNewScreenRunId,
		});
	}, [newScreenRuns, selectedNewScreenRunId]);

	// pollRunStatus
	useEffect(() => {
		if (!selectedNewScreenActiveRunId || activeTab !== "agent") return;
		const runId = selectedNewScreenActiveRunId;
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
				setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
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
	}, [activeTab, selectedNewScreenActiveRunId]);

	// streamRunStatus
	useEffect(() => {
		if (!selectedNewScreenActiveRunId || activeTab !== "agent") return;
		const runId = selectedNewScreenActiveRunId;
		let isActive = true;

		async function refreshRunStatus() {
			try {
				const status = await fetchScreenInferenceRunStatus(runId);
				if (!isActive) return;
				setNewScreenRunStatus(status);
			} catch (error) {
				if (!isActive) return;
				setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
			}
		}

		const unsubscribe = subscribeScreenInferenceRunEvents(runId, {
			onError: () => undefined,
			onEvent: () => {
				void refreshRunStatus();
			},
		});

		return () => {
			isActive = false;
			unsubscribe();
		};
	}, [activeTab, selectedNewScreenActiveRunId]);

	// loadReviewArtifacts
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
				setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
			}
		}

		void loadReviewArtifacts();

		return () => {
			isActive = false;
		};
	}, [newScreenRunStatus?.runId, newScreenRunStatus?.status]);

	function handleSelectNewScreenRun(id: string) {
		setSelectedNewScreenRunId(id);
		const nextRun = newScreenRuns.find((run) => run.id === id);
		setNewScreenPreviewNode(undefined);
		setNewScreenValidation(undefined);
		setNewScreenQuality(undefined);
		setNewScreenRunStatus(undefined);
		if (nextRun?.runId) {
			void fetchScreenInferenceRunStatus(nextRun.runId)
				.then(setNewScreenRunStatus)
				.catch((error) =>
					setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK)),
				);
		}
	}

	async function handleUploadNewScreenSource(file: File) {
		setIsUploadingNewScreenSource(true);
		setNewScreenSourceError("");
		try {
			const source = await uploadScreenInferenceSource(file);
			const pendingRun = sourceToPendingRunItem(source);
			setNewScreenRuns((current) => {
				const withoutDuplicate = current.filter((item) => item.id !== pendingRun.id);
				return [pendingRun, ...withoutDuplicate];
			});
			setSelectedNewScreenRunId(pendingRun.id);
		} catch (error) {
			setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
		} finally {
			setIsUploadingNewScreenSource(false);
		}
	}

	async function handleRunSelectedNewScreenSource() {
		const source = runItemToSource(selectedNewScreenRun);
		if (!source) return;
		setIsStartingNewScreenRun(true);
		setNewScreenSourceError("");
		setNewScreenPreviewNode(undefined);
		setNewScreenValidation(undefined);
		setNewScreenQuality(undefined);
		try {
			const run = await createScreenInferenceRunFromSource(source);
			setNewScreenRunStatus(run.status);
			const nextRun = runStatusToItem(run.status, source);
			setNewScreenRuns((current) => [nextRun, ...current.filter((item) => item.id !== nextRun.id)]);
			setSelectedNewScreenRunId(nextRun.id);
		} catch (error) {
			setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
		} finally {
			setIsStartingNewScreenRun(false);
		}
	}

	async function handleRerunSelectedNewScreenSource() {
		const source = runItemToSource(selectedNewScreenRun);
		if (!source || !selectedNewScreenRun?.runId) return;
		setIsStartingNewScreenRun(true);
		setNewScreenSourceError("");
		setNewScreenPreviewNode(undefined);
		setNewScreenValidation(undefined);
		setNewScreenQuality(undefined);
		try {
			const run = await createScreenInferenceRunFromSource(source, selectedNewScreenRun.runId);
			setNewScreenRunStatus(run.status);
			const nextRun = runStatusToItem(run.status, source);
			setNewScreenRuns((current) => [nextRun, ...current.filter((item) => item.id !== nextRun.id)]);
			setSelectedNewScreenRunId(nextRun.id);
		} catch (error) {
			setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
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
			setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
			setSaveState({ message: "등록 실패", status: "error" });
		}
	}

	return {
		sources: newScreenRuns,
		selectedRunId: selectedNewScreenRunId,
		error: newScreenSourceError,
		runStatus: newScreenRunStatus,
		previewNode: newScreenPreviewNode,
		validation: newScreenValidation,
		quality: newScreenQuality,
		isUploading: isUploadingNewScreenSource,
		isStarting: isStartingNewScreenRun,
		onSelectSource: handleSelectNewScreenRun,
		onUpload: handleUploadNewScreenSource,
		onRun: handleRunSelectedNewScreenSource,
		onRerun: handleRerunSelectedNewScreenSource,
		onApply: handleApplyNewScreenRun,
	};
}

function screenInferenceRunRowToItem(row: ScreenInferenceRunRow): NewScreenRunItem {
	return {
		id: row.jobId,
		runId: row.jobId,
		screenId: row.screenId ?? row.jobId,
		sourcePath: row.sourcePath,
		status: row.status,
		title: row.title,
	};
}

function sourceToPendingRunItem(source: NewScreenSourceItem): NewScreenRunItem {
	return {
		id: `source:${source.path}`,
		screenId: source.screenId,
		sourcePath: source.path,
		status: "source-ready",
	};
}

function runStatusToItem(
	status: ScreenInferenceRunStatus,
	source: NewScreenSourceItem,
): NewScreenRunItem {
	return {
		id: status.runId,
		runId: status.runId,
		screenId: source.screenId,
		sourcePath: source.path,
		status: status.status,
	};
}

function runItemToSource(run: NewScreenRunItem | undefined): NewScreenSourceItem | undefined {
	if (!run?.sourcePath) return undefined;
	return {
		batchId: "",
		importId: "web-upload",
		path: run.sourcePath,
		screenId: run.screenId,
	};
}
