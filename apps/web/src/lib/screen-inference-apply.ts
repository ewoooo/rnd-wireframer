import type { RenderTreeScreenNodeContract } from "@cx/schema";
import { replaceGeneratedScreenRows } from "./screen-inference-persistence";
import {
	type ApplyScreenInferenceDiagnostic,
	projectScreenInferenceFinalResult,
	readProjectionRowCounts,
} from "./screen-inference-projection";

export type { ApplyScreenInferenceDiagnostic } from "./screen-inference-projection";

export type ApplyScreenInferenceResult = {
	diagnostics: ApplyScreenInferenceDiagnostic[];
	rowCounts: Record<string, number>;
	screenId: string;
	written: boolean;
};

export async function applyScreenInferenceFinalResult(input: {
	node: RenderTreeScreenNodeContract;
}): Promise<ApplyScreenInferenceResult> {
	const projection = projectScreenInferenceFinalResult(input.node);

	if (projection.diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
		return {
			diagnostics: projection.diagnostics,
			rowCounts: readProjectionRowCounts(projection),
			screenId: input.node.metadata.id,
			written: false,
		};
	}

	await replaceGeneratedScreenRows(projection);

	return {
		diagnostics: projection.diagnostics,
		rowCounts: readProjectionRowCounts(projection),
		screenId: input.node.metadata.id,
		written: true,
	};
}
