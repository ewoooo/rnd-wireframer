import type { RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import type { ScreenInferenceRunStatus } from "@/lib/screen-inference-run";
import type { ScreenInferenceRunRow } from "@/lib/screen-inference-runs";
import type { NewScreenRunItem, NewScreenSourceItem } from "../types";

export function readScreenNodeFromRenderTreeArtifact(
	artifact: RenderTree | RenderTreeScreenNode,
): RenderTreeScreenNode {
	if (isRenderTreeScreenNode(artifact)) return artifact;
	const screenNode = artifact.children?.find(isRenderTreeScreenNode);
	if (!screenNode) throw new Error("final-result.json에 Screen 노드가 없습니다.");
	return screenNode;
}

export function screenInferenceRunRowToItem(row: ScreenInferenceRunRow): NewScreenRunItem {
	return {
		id: row.jobId,
		runId: row.jobId,
		screenId: row.screenId ?? row.jobId,
		sourcePath: row.sourcePath,
		status: row.status,
		title: row.title,
	};
}

export function sourceToPendingRunItem(source: NewScreenSourceItem): NewScreenRunItem {
	return {
		id: `source:${source.path}`,
		screenId: source.screenId,
		sourcePath: source.path,
		status: "source-ready",
	};
}

export function runStatusToItem(
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

export function runItemToSource(run: NewScreenRunItem | undefined): NewScreenSourceItem | undefined {
	if (!run?.sourcePath) return undefined;
	return {
		batchId: "",
		importId: "web-upload",
		path: run.sourcePath,
		screenId: run.screenId,
	};
}

function isRenderTreeScreenNode(value: unknown): value is RenderTreeScreenNode {
	return typeof value === "object" && value !== null && "type" in value && value.type === "Screen";
}
