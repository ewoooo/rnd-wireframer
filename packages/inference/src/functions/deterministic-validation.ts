import { componentCatalog } from "@cx/components/catalog";
import { SCHEMA_VERSION, type SourceSpec, type ValidationReportContract } from "@cx/schema";
import {
	validateCompositionPlan,
	validateRenderTree,
	validateSchemaArtifact,
} from "@cx/validation";
import type { EngineRequest } from "../contracts";

export function runDeterministicValidation(request: EngineRequest): ValidationReportContract {
	const renderTree = request.inputs.renderTree;
	const sourceSpec = isSourceSpec(request.inputs.sourceSpec)
		? request.inputs.sourceSpec
		: undefined;
	const compositionPlan = request.inputs.compositionPlan;
	const schemaReport = validateSchemaArtifact("render-tree", renderTree);
	const semanticReport = validateRenderTree(renderTree, {
		componentCatalog,
		generatedArtifact: renderTree,
		sourceSpec,
	});
	const compositionPlanReport =
		compositionPlan === undefined
			? undefined
			: validateCompositionPlan(compositionPlan, {
					generatedArtifact: renderTree,
					sourceSpec,
				});
	const issues = [
		...schemaReport.issues,
		...semanticReport.issues,
		...(compositionPlanReport?.issues ?? []),
	];
	const errorCount = issues.filter((issue) => issue.severity === "error").length;
	const warningCount = issues.filter((issue) => issue.severity === "warning").length;

	return {
		issues,
		ok: errorCount === 0,
		schemaVersion: SCHEMA_VERSION.validationReport,
		summary: { errorCount, warningCount },
		target: "render-tree",
	};
}

function isSourceSpec(input: unknown): input is SourceSpec {
	if (!input || typeof input !== "object" || Array.isArray(input)) return false;
	const sourceShape = (input as Record<string, unknown>).sourceShape;
	if (!sourceShape || typeof sourceShape !== "object" || Array.isArray(sourceShape)) return false;
	const screen = (sourceShape as Record<string, unknown>).screen;
	return Boolean(screen && typeof screen === "object" && !Array.isArray(screen));
}
