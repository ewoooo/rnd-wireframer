"use client";

import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
import { useEffect, useState } from "react";
import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";
import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";
import { readErrorMessage } from "@/lib/api-error";
import {
	mergeNewScreenSources,
	readNewScreenWorkbenchState,
	writeNewScreenWorkbenchState,
} from "@/lib/new-screen-workbench-storage";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";
import {
	applyScreenInferenceRun,
	createScreenInferenceRunFromSource,
	fetchScreenInferenceArtifact,
	fetchScreenInferenceRunStatus,
	fetchScreenInferenceSources,
	uploadScreenInferenceSource,
} from "@/lib/screen-inference-client";
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
	const [newScreenSources, setNewScreenSources] = useState<NewScreenSourceItem[]>(
		() => readNewScreenWorkbenchState().sources,
	);
	const [newScreenPreviewNode, setNewScreenPreviewNode] = useState<RenderTreeScreenNode>();
	const [newScreenQuality, setNewScreenQuality] = useState<QualityInspectionContract>();
	const [newScreenRunStatus, setNewScreenRunStatus] = useState<ScreenInferenceRunStatus>();
	const [newScreenValidation, setNewScreenValidation] = useState<ValidationReportContract>();
	const [isUploadingNewScreenSource, setIsUploadingNewScreenSource] = useState(false);
	const [isStartingNewScreenRun, setIsStartingNewScreenRun] = useState(false);
	const [selectedNewScreenSourcePath, setSelectedNewScreenSourcePath] = useState(
		() => readNewScreenWorkbenchState().selectedSourcePath,
	);

	const selectedNewScreenSource = newScreenSources.find(
		(source) => source.path === selectedNewScreenSourcePath,
	);
	const selectedNewScreenRunId = selectedNewScreenSource?.latestRunId;

	// loadUploadedSources
	useEffect(() => {
		let isActive = true;

		async function loadUploadedSources() {
			try {
				const sources = await fetchScreenInferenceSources();
				if (!isActive) return;
				setNewScreenSources((current) => mergeNewScreenSources(current, sources));
				setSelectedNewScreenSourcePath((current) => current || sources[0]?.path || "");
			} catch (error) {
				if (!isActive) return;
				setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
			}
		}

		void loadUploadedSources();

		return () => {
			isActive = false;
		};
	}, []);

	// persist
	useEffect(() => {
		writeNewScreenWorkbenchState({
			selectedSourcePath: selectedNewScreenSourcePath,
			sources: newScreenSources,
		});
	}, [newScreenSources, selectedNewScreenSourcePath]);

	// pollRunStatus
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
	}, [activeTab, selectedNewScreenRunId]);

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
				.catch((error) => setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK)));
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
			setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
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
			setNewScreenSourceError(readErrorMessage(error, NEW_SCREEN_ERROR_FALLBACK));
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
		sources: newScreenSources,
		selectedSourcePath: selectedNewScreenSourcePath,
		error: newScreenSourceError,
		runStatus: newScreenRunStatus,
		previewNode: newScreenPreviewNode,
		validation: newScreenValidation,
		quality: newScreenQuality,
		isUploading: isUploadingNewScreenSource,
		isStarting: isStartingNewScreenRun,
		onSelectSource: handleSelectNewScreenSource,
		onUpload: handleUploadNewScreenSource,
		onRun: handleRunSelectedNewScreenSource,
		onRerun: handleRerunSelectedNewScreenSource,
		onApply: handleApplyNewScreenRun,
	};
}
