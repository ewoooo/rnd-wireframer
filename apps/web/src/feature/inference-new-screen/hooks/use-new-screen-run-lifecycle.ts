"use client";

import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import type { QualityInspectionContract, ValidationReportContract } from "@cx/schema";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import type { SaveState } from "@/components/workbench/canvas/CanvasToolbar";
import {
	applyScreenInferenceRun,
	createScreenInferenceRunFromSource,
	fetchScreenInferenceArtifact,
	fetchScreenInferenceRunStatus,
	subscribeScreenInferenceRunEvents,
	uploadScreenInferenceSource,
} from "@/feature/inference-new-screen/api/screen-inference-client";
import {
	readScreenNodeFromRenderTreeArtifact,
	runItemToSource,
	runStatusToItem,
	sourceToPendingRunItem,
} from "@/feature/inference-new-screen/model/new-screen-mappers";
import type { NewScreenRunItem } from "@/feature/inference-new-screen/types";
import { readErrorMessage } from "@/lib/api-error";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";
import type { NavigatorTab } from "@/model/workbench-view-model";

const TERMINAL_SCREEN_INFERENCE_STATUSES = new Set(["failed", "waiting-review", "applied"]);
const NEW_SCREEN_ERROR_FALLBACK = "화면 데이터를 불러오지 못했습니다.";

type UseNewScreenRunLifecycleInput = {
	activeTab: NavigatorTab;
	selectedRun?: NewScreenRunItem;
	selectedRunStatus?: ScreenInferenceRunStatus;
	setError: (message: string) => void;
	setRuns: Dispatch<SetStateAction<NewScreenRunItem[]>>;
	setSaveState: (state: SaveState) => void;
	setSelectedRunId: Dispatch<SetStateAction<string>>;
	setSelectedRunStatus: Dispatch<SetStateAction<ScreenInferenceRunStatus | undefined>>;
};

export function useNewScreenRunLifecycle({
	activeTab,
	selectedRun,
	selectedRunStatus,
	setError,
	setRuns,
	setSaveState,
	setSelectedRunId,
	setSelectedRunStatus,
}: UseNewScreenRunLifecycleInput) {
	const [previewNode, setPreviewNode] = useState<RenderTreeScreenNode>();
	const [quality, setQuality] = useState<QualityInspectionContract>();
	const [runStatus, setRunStatus] = useState<ScreenInferenceRunStatus>();
	const [validation, setValidation] = useState<ValidationReportContract>();
	const [isUploading, setIsUploading] = useState(false);
	const [isStarting, setIsStarting] = useState(false);

	const selectedRunId = selectedRun?.id;
	const selectedActiveRunId = selectedRun?.runId;

	useEffect(() => {
		clearReviewArtifacts();
		setRunStatus(undefined);
	}, [selectedRunId]);

	useEffect(() => {
		if (selectedRunStatus) setRunStatus(selectedRunStatus);
	}, [selectedRunStatus]);

	useEffect(() => {
		if (!selectedActiveRunId || activeTab !== "agent") return;
		const runId = selectedActiveRunId;
		let isActive = true;
		let intervalId: ReturnType<typeof setInterval> | undefined;

		async function pollRunStatus() {
			try {
				const status = await fetchScreenInferenceRunStatus(runId);
				if (!isActive) return;
				setRunStatus(status);
				setSelectedRunStatus(status);
				if (TERMINAL_SCREEN_INFERENCE_STATUSES.has(status.status) && intervalId) {
					clearInterval(intervalId);
				}
			} catch (caughtError) {
				if (!isActive) return;
				setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
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
	}, [activeTab, selectedActiveRunId, setError, setSelectedRunStatus]);

	useEffect(() => {
		if (!selectedActiveRunId || activeTab !== "agent") return;
		const runId = selectedActiveRunId;
		let isActive = true;

		async function refreshRunStatus() {
			try {
				const status = await fetchScreenInferenceRunStatus(runId);
				if (!isActive) return;
				setRunStatus(status);
				setSelectedRunStatus(status);
			} catch (caughtError) {
				if (!isActive) return;
				setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
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
	}, [activeTab, selectedActiveRunId, setError, setSelectedRunStatus]);

	useEffect(() => {
		if (!runStatus?.runId || runStatus.status !== "waiting-review") return;
		const runId = runStatus.runId;
		let isActive = true;

		async function loadReviewArtifacts() {
			try {
				const [finalResult, validationArtifact, qualityArtifact] = await Promise.all([
					fetchScreenInferenceArtifact<RenderTree | RenderTreeScreenNode>(
						runId,
						"final-result.json",
					),
					fetchScreenInferenceArtifact<ValidationReportContract>(runId, "validation-report.json"),
					fetchScreenInferenceArtifact<QualityInspectionContract>(runId, "quality-review.json"),
				]);
				if (!isActive) return;
				setPreviewNode(readScreenNodeFromRenderTreeArtifact(finalResult));
				setValidation(validationArtifact);
				setQuality(qualityArtifact);
			} catch (caughtError) {
				if (!isActive) return;
				setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
			}
		}

		void loadReviewArtifacts();

		return () => {
			isActive = false;
		};
	}, [runStatus?.runId, runStatus?.status, setError]);

	async function upload(file: File) {
		setIsUploading(true);
		setError("");
		try {
			const source = await uploadScreenInferenceSource(file);
			const pendingRun = sourceToPendingRunItem(source);
			setRuns((current) => {
				const withoutDuplicate = current.filter((item) => item.id !== pendingRun.id);
				return [pendingRun, ...withoutDuplicate];
			});
			setSelectedRunId(pendingRun.id);
		} catch (caughtError) {
			setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
		} finally {
			setIsUploading(false);
		}
	}

	async function run() {
		const source = runItemToSource(selectedRun);
		if (!source) return;
		setIsStarting(true);
		setError("");
		clearReviewArtifacts();
		try {
			const nextRun = await createScreenInferenceRunFromSource(source);
			setRunStatus(nextRun.status);
			setSelectedRunStatus(nextRun.status);
			const nextRunItem = runStatusToItem(nextRun.status, source);
			setRuns((current) => [
				nextRunItem,
				...current.filter(
					(item) => item.id !== nextRunItem.id && item.sourcePath !== nextRunItem.sourcePath,
				),
			]);
			setSelectedRunId(nextRunItem.id);
		} catch (caughtError) {
			setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
		} finally {
			setIsStarting(false);
		}
	}

	async function rerun() {
		const source = runItemToSource(selectedRun);
		if (!source || !selectedRun?.runId) return;
		setIsStarting(true);
		setError("");
		clearReviewArtifacts();
		try {
			const nextRun = await createScreenInferenceRunFromSource(source, selectedRun.runId);
			setRunStatus(nextRun.status);
			setSelectedRunStatus(nextRun.status);
			const nextRunItem = runStatusToItem(nextRun.status, source);
			setRuns((current) => [
				nextRunItem,
				...current.filter(
					(item) => item.id !== nextRunItem.id && item.sourcePath !== nextRunItem.sourcePath,
				),
			]);
			setSelectedRunId(nextRunItem.id);
		} catch (caughtError) {
			setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
		} finally {
			setIsStarting(false);
		}
	}

	async function apply() {
		if (!runStatus?.runId || runStatus.status !== "waiting-review") return;
		setSaveState({ message: "등록 중", status: "saving" });
		setError("");
		try {
			await applyScreenInferenceRun(runStatus.runId);
			const status = await fetchScreenInferenceRunStatus(runStatus.runId);
			setRunStatus(status);
			setSelectedRunStatus(status);
			setSaveState({ message: "등록됨", status: "saved" });
		} catch (caughtError) {
			setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
			setSaveState({ message: "등록 실패", status: "error" });
		}
	}

	function clearReviewArtifacts() {
		setPreviewNode(undefined);
		setValidation(undefined);
		setQuality(undefined);
	}

	return {
		apply,
		isStarting,
		isUploading,
		previewNode,
		quality,
		rerun,
		run,
		runStatus,
		upload,
		validation,
	};
}
