import { componentCatalog } from "@cx/external/resolver";
import {
	SCHEMA_VERSION,
	type SchemaValidationIssue,
	type SourceSpec,
	type ValidationReportContract,
} from "@cx/schema";
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
		...findUnresolvedPlaceholderIssues(renderTree),
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

/**
 * A bare unresolved binding token left as visible copy, e.g. a prop `default`
 * of `"{실패축}"`. Template strings ("{token} 문제로…") and bind paths
 * ("api.FN-...") do not match — only a string that is exactly one `{…}` token.
 */
const BARE_PLACEHOLDER_TOKEN = /^\s*\{[^{}]+\}\s*$/u;

function findUnresolvedPlaceholderIssues(renderTree: unknown): SchemaValidationIssue[] {
	const issues: SchemaValidationIssue[] = [];
	const visit = (value: unknown, path: Array<string | number>): void => {
		if (typeof value === "string") {
			if (BARE_PLACEHOLDER_TOKEN.test(value)) {
				issues.push({
					code: "unresolved-placeholder-token",
					message: `Unresolved placeholder token "${value.trim()}" left as visible copy. Bound props must resolve their default to readable text, not the raw {token}.`,
					path,
					severity: "error",
				});
			}
			return;
		}
		if (Array.isArray(value)) {
			value.forEach((item, index) => visit(item, [...path, index]));
			return;
		}
		if (value && typeof value === "object") {
			for (const [key, child] of Object.entries(value)) visit(child, [...path, key]);
		}
	};
	visit(renderTree, []);
	return issues;
}

function isSourceSpec(input: unknown): input is SourceSpec {
	if (!input || typeof input !== "object" || Array.isArray(input)) return false;
	const sourceShape = (input as Record<string, unknown>).sourceShape;
	if (!sourceShape || typeof sourceShape !== "object" || Array.isArray(sourceShape)) return false;
	const screen = (sourceShape as Record<string, unknown>).screen;
	return Boolean(screen && typeof screen === "object" && !Array.isArray(screen));
}
