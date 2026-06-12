"use client";

import { useEffect, useState } from "react";
import {
	fetchScreenInferenceRuns,
	fetchScreenInferenceRunStatus,
} from "@/feature/inference-new-screen/api/screen-inference-client";
import { screenInferenceRunRowToItem } from "@/feature/inference-new-screen/model/new-screen-mappers";
import {
	mergeNewScreenRuns,
	readNewScreenWorkbenchState,
	writeNewScreenWorkbenchState,
} from "@/feature/inference-new-screen/storage/new-screen-workbench-storage";
import type { NewScreenRunItem } from "@/feature/inference-new-screen/types";
import { readErrorMessage } from "@/lib/api-error";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";

const NEW_SCREEN_ERROR_FALLBACK = "화면 데이터를 불러오지 못했습니다.";

export function useNewScreenRuns() {
	const [error, setError] = useState("");
	const [runs, setRuns] = useState<NewScreenRunItem[]>(
		() => readNewScreenWorkbenchState().runs,
	);
	const [selectedRunId, setSelectedRunId] = useState(
		() => readNewScreenWorkbenchState().selectedRunId,
	);
	const [selectedRunStatus, setSelectedRunStatus] = useState<ScreenInferenceRunStatus>();

	const selectedRun = runs.find((run) => run.id === selectedRunId);

	useEffect(() => {
		let isActive = true;

		async function loadRunRows() {
			try {
				const nextRuns = (await fetchScreenInferenceRuns()).map(screenInferenceRunRowToItem);
				if (!isActive) return;
				setRuns((current) => mergeNewScreenRuns(current, nextRuns));
				setSelectedRunId((current) => current || nextRuns[0]?.id || "");
			} catch (caughtError) {
				if (!isActive) return;
				setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK));
			}
		}

		void loadRunRows();

		return () => {
			isActive = false;
		};
	}, []);

	useEffect(() => {
		writeNewScreenWorkbenchState({ runs, selectedRunId });
	}, [runs, selectedRunId]);

	function selectRun(id: string) {
		setSelectedRunId(id);
		setSelectedRunStatus(undefined);
		const nextRun = runs.find((run) => run.id === id);
		if (nextRun?.runId) {
			void fetchScreenInferenceRunStatus(nextRun.runId)
				.then(setSelectedRunStatus)
				.catch((caughtError) =>
					setError(readErrorMessage(caughtError, NEW_SCREEN_ERROR_FALLBACK)),
				);
		}
	}

	return {
		error,
		runs,
		selectedRun,
		selectedRunId,
		selectedRunStatus,
		selectRun,
		setError,
		setRuns,
		setSelectedRunId,
		setSelectedRunStatus,
	};
}
