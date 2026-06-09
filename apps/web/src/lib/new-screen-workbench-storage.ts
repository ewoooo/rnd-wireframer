import type { NewScreenRunItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";

const NEW_SCREEN_WORKBENCH_STORAGE_KEY = "cx.new-screen.workbench.v0.1";

export function mergeNewScreenRuns(
	currentRuns: NewScreenRunItem[],
	serverRuns: NewScreenRunItem[],
): NewScreenRunItem[] {
	const mergedById = new Map<string, NewScreenRunItem>();
	for (const run of serverRuns) {
		mergedById.set(run.id, run);
	}
	for (const run of currentRuns) {
		if (!run.runId) mergedById.set(run.id, run);
	}
	return Array.from(mergedById.values());
}

export function readNewScreenWorkbenchState(): {
	runs: NewScreenRunItem[];
	selectedRunId: string;
} {
	if (typeof window === "undefined") return { runs: [], selectedRunId: "" };
	try {
		const rawValue = window.localStorage.getItem(NEW_SCREEN_WORKBENCH_STORAGE_KEY);
		if (!rawValue) return { runs: [], selectedRunId: "" };
		const value = JSON.parse(rawValue) as {
			runs?: unknown;
			selectedRunId?: unknown;
		};
		const runs = Array.isArray(value.runs) ? value.runs.filter(isNewScreenRunItem) : [];
		const selectedRunId =
			typeof value.selectedRunId === "string" && runs.some((run) => run.id === value.selectedRunId)
				? value.selectedRunId
				: (runs[0]?.id ?? "");

		return { runs, selectedRunId };
	} catch {
		return { runs: [], selectedRunId: "" };
	}
}

export function writeNewScreenWorkbenchState(input: {
	runs: NewScreenRunItem[];
	selectedRunId: string;
}) {
	if (typeof window === "undefined") return;
	const runs = input.runs.filter(isNewScreenRunItem);
	const selectedRunId = runs.some((run) => run.id === input.selectedRunId)
		? input.selectedRunId
		: (runs[0]?.id ?? "");
	window.localStorage.setItem(
		NEW_SCREEN_WORKBENCH_STORAGE_KEY,
		JSON.stringify({ runs, selectedRunId }),
	);
}

function isNewScreenRunItem(value: unknown): value is NewScreenRunItem {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const item = value as Partial<Record<keyof NewScreenRunItem, unknown>>;
	return (
		typeof item.id === "string" &&
		typeof item.screenId === "string" &&
		(typeof item.runId === "string" || item.runId === undefined) &&
		(typeof item.sourcePath === "string" || item.sourcePath === undefined) &&
		(typeof item.status === "string" || item.status === undefined) &&
		(typeof item.title === "string" || item.title === undefined)
	);
}
