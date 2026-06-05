import type { ComponentCatalog } from "@cx/components/types";
import { SCHEMA_VERSION, type SourceSpec, type ValidationReportContract } from "@cx/schema";
import { isRecord } from "@cx/types/guards";
import {
	validateCompositionPlan,
	validateRenderTree,
	validateSchemaArtifact,
	validateTableGenerationResult,
} from "@cx/validation";

export function createRenderTreeValidationReport(
	payload: unknown,
	options: {
		allowedLayoutIds?: string[];
		componentCatalog?: ComponentCatalog;
		compositionPlan?: unknown;
		decorationPlan?: unknown;
		screenIntent?: unknown;
		sourceSpec?: SourceSpec;
	} = {},
): ValidationReportContract {
	const renderTree = extractPayloadArtifact(payload, "renderTree");
	const tableGenerationResult = extractPayloadArtifact(payload, "tableGenerationResult");
	const schemaReport = validateSchemaArtifact("render-tree", renderTree);
	const semanticReport = validateRenderTree(renderTree, {
		allowedLayoutIds: options.allowedLayoutIds,
		componentCatalog: options.componentCatalog,
		generatedArtifact: payload,
		sourceSpec: options.sourceSpec,
	});
	const screenIntentReport =
		options.screenIntent === undefined
			? undefined
			: validateSchemaArtifact("screen-intent", options.screenIntent);
	const compositionPlanReport =
		options.compositionPlan === undefined
			? undefined
			: validateCompositionPlan(options.compositionPlan, {
					generatedArtifact: payload,
					sourceSpec: options.sourceSpec,
				});
	const decorationPlanReport =
		options.decorationPlan === undefined
			? undefined
			: validateSchemaArtifact("decoration-plan", options.decorationPlan);
	const tableReport =
		tableGenerationResult === undefined
			? createMissingArtifactReport("tableGenerationResult")
			: validateTableGenerationResult(tableGenerationResult, {
					allowedLayoutIds: options.allowedLayoutIds,
				});
	const issues: ValidationReportContract["issues"] = [
		...(screenIntentReport?.issues ?? []),
		...(compositionPlanReport?.issues ?? []),
		...(decorationPlanReport?.issues ?? []),
		...schemaReport.issues,
		...semanticReport.issues,
	];
	issues.push(...tableReport.issues);
	const errorCount = issues.filter((issue) => issue.severity === "error").length;
	const warningCount = issues.filter((issue) => issue.severity === "warning").length;

	return {
		issues,
		ok: errorCount === 0,
		schemaVersion: SCHEMA_VERSION.validationReport,
		summary: {
			errorCount,
			warningCount,
		},
		target: "render-tree",
	};
}

function extractPayloadArtifact(payload: unknown, key: "renderTree" | "tableGenerationResult") {
	if (!isRecord(payload)) return key === "renderTree" ? payload : undefined;
	return payload[key] ?? (key === "renderTree" ? payload : undefined);
}

function createMissingArtifactReport(key: "tableGenerationResult"): ValidationReportContract {
	return {
		issues: [
			{
				code: "required-field-missing",
				message: `${key} is required in the generation agent payload.`,
				path: [key],
				severity: "error",
			},
		],
		ok: false,
		schemaVersion: SCHEMA_VERSION.validationReport,
		summary: {
			errorCount: 1,
			warningCount: 0,
		},
		target: "schema-artifact",
	};
}
