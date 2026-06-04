import type { NewScreenSourceItem } from "@/components/workbench/new-screen/NewScreenSourcePanel";

export const NEW_SCREEN_WORKBENCH_STORAGE_KEY = "cx.new-screen.workbench.v0.1";
export const NEW_SCREEN_SOURCE_IMPORT_ID = "web-upload";

export function mergeNewScreenSources(
	currentSources: NewScreenSourceItem[],
	serverSources: NewScreenSourceItem[],
): NewScreenSourceItem[] {
	const mergedByPath = new Map<string, NewScreenSourceItem>();
	for (const source of currentSources.filter(isWebUploadedNewScreenSource)) {
		mergedByPath.set(source.path, source);
	}
	for (const source of serverSources.filter(isWebUploadedNewScreenSource)) {
		const current = mergedByPath.get(source.path);
		mergedByPath.set(source.path, {
			...source,
			latestRunId: source.latestRunId ?? current?.latestRunId,
		});
	}
	return Array.from(mergedByPath.values());
}

export function readNewScreenWorkbenchState(): {
	selectedSourcePath: string;
	sources: NewScreenSourceItem[];
} {
	if (typeof window === "undefined") return { selectedSourcePath: "", sources: [] };
	try {
		const rawValue = window.localStorage.getItem(NEW_SCREEN_WORKBENCH_STORAGE_KEY);
		if (!rawValue) return { selectedSourcePath: "", sources: [] };
		const value = JSON.parse(rawValue) as {
			selectedSourcePath?: unknown;
			sources?: unknown;
		};
		const sources = Array.isArray(value.sources)
			? value.sources.filter(isNewScreenSourceItem).filter(isWebUploadedNewScreenSource)
			: [];
		const selectedSourcePath =
			typeof value.selectedSourcePath === "string" &&
			sources.some((source) => source.path === value.selectedSourcePath)
				? value.selectedSourcePath
				: (sources[0]?.path ?? "");

		return { selectedSourcePath, sources };
	} catch {
		return { selectedSourcePath: "", sources: [] };
	}
}

export function writeNewScreenWorkbenchState(input: {
	selectedSourcePath: string;
	sources: NewScreenSourceItem[];
}) {
	if (typeof window === "undefined") return;
	const sources = input.sources.filter(isWebUploadedNewScreenSource);
	const selectedSourcePath = sources.some((source) => source.path === input.selectedSourcePath)
		? input.selectedSourcePath
		: (sources[0]?.path ?? "");
	window.localStorage.setItem(
		NEW_SCREEN_WORKBENCH_STORAGE_KEY,
		JSON.stringify({ selectedSourcePath, sources }),
	);
}

export function isNewScreenSourceItem(value: unknown): value is NewScreenSourceItem {
	if (!value || typeof value !== "object") return false;
	const item = value as Partial<Record<keyof NewScreenSourceItem, unknown>>;
	return (
		typeof item.batchId === "string" &&
		typeof item.importId === "string" &&
		typeof item.path === "string" &&
		typeof item.screenId === "string" &&
		(typeof item.latestRunId === "string" || item.latestRunId === undefined)
	);
}

export function isWebUploadedNewScreenSource(source: NewScreenSourceItem): boolean {
	return source.importId === NEW_SCREEN_SOURCE_IMPORT_ID;
}
