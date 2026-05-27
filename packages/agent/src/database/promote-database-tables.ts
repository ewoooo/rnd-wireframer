import { tablesToRenderTrees, validateRenderTreeFull } from "@cx/renderer";
import type { DatabaseAreaRow, DatabaseComponentRow, DatabaseRegionChild, DatabaseScreenRouteRow, DatabaseScreenRow, DatabaseScreenVariantRow, MaterializedNodeTree } from "@cx/types/database-tables";
import type { PatternStore } from "@cx/types/pattern-store";
import { errorsOf, type ValidationIssue, type ValidationResult } from "@cx/types/validation";
export interface PromoteDatabaseTablesOptions {
	patternStore?: PatternStore;
	strictRendererCoverage?: boolean;
}

export type PromoteDatabaseTablesResult = ValidationResult<PromotedDatabaseTableFiles>;

export interface PromotedDatabaseTableFiles {
	"areas.json": { areas: DatabaseAreaRow[] };
	"components.json": { components: DatabaseComponentRow[] };
	"screen_routes.json": { screenRoutes: DatabaseScreenRouteRow[] };
	"screen_variants.json": { screenVariants: DatabaseScreenVariantRow[] };
	"screens.json": { screens: DatabaseScreenRow[] };
}

export function promoteDatabaseTablesCandidate(
	candidate: unknown,
	options: PromoteDatabaseTablesOptions = {},
): PromoteDatabaseTablesResult {
	const shape = parseCandidateShape(candidate);
	if (shape.success === false) {
		return { ok: false, issues: shape.issues };
	}

	const tables = shape.tables;
	const issues: ValidationIssue[] = [];

	issues.push(
		...(tables.warnings ?? []).map<ValidationIssue>((message) => ({
			code: "schema.invalid",
			severity: "warning",
			layer: "schema",
			message,
		})),
	);
	issues.push(...validateReferences(tables));
	issues.push(...validatePatternReferences(tables, options.patternStore));

	const hasError = errorsOf({ ok: false, issues }).length > 0;
	if (!hasError) {
		issues.push(...validateRendererProjection(tables, options));
	}

	const ok = !issues.some((issue) => issue.severity === "error");

	return {
		ok,
		issues,
		data: ok ? createPromotedTableFiles(tables) : undefined,
	};
}

export function createPromotedTableFiles(tables: MaterializedNodeTree): PromotedDatabaseTableFiles {
	return {
		"areas.json": { areas: tables.areas },
		"components.json": { components: tables.components },
		"screen_routes.json": { screenRoutes: tables.screenRoutes },
		"screen_variants.json": { screenVariants: tables.screenVariants },
		"screens.json": { screens: tables.screens },
	};
}

function schemaError(message: string, data?: Record<string, unknown>): ValidationIssue {
	return { code: "schema.invalid", severity: "error", layer: "schema", message, data };
}

function referenceError(message: string, data?: Record<string, unknown>): ValidationIssue {
	return { code: "reference.missing-area", severity: "error", layer: "reference", message, data };
}

function patternWarning(message: string, data?: Record<string, unknown>): ValidationIssue {
	return {
		code: "reference.missing-pattern",
		severity: "warning",
		layer: "reference",
		message,
		data,
	};
}

function parseCandidateShape(
	candidate: unknown,
): { success: true; tables: MaterializedNodeTree } | { success: false; issues: ValidationIssue[] } {
	if (!candidate || typeof candidate !== "object") {
		return { success: false, issues: [schemaError("candidate must be an object")] };
	}

	const record = candidate as Partial<Record<keyof MaterializedNodeTree, unknown>>;
	const issues: ValidationIssue[] = [];
	if (!Array.isArray(record.screenRoutes)) issues.push(schemaError("screenRoutes array is required"));
	if (!Array.isArray(record.screenVariants))
		issues.push(schemaError("screenVariants array is required"));
	if (!Array.isArray(record.screens)) issues.push(schemaError("screens array is required"));
	if (!Array.isArray(record.areas)) issues.push(schemaError("areas array is required"));
	if (!Array.isArray(record.components)) issues.push(schemaError("components array is required"));
	if (record.warnings !== undefined && !Array.isArray(record.warnings)) {
		issues.push(schemaError("warnings must be an array when provided"));
	}

	if (issues.length > 0) return { success: false, issues };

	return {
		success: true,
		tables: {
			screenRoutes: record.screenRoutes as DatabaseScreenRouteRow[],
			screenVariants: record.screenVariants as DatabaseScreenVariantRow[],
			screens: record.screens as DatabaseScreenRow[],
			areas: record.areas as DatabaseAreaRow[],
			components: record.components as DatabaseComponentRow[],
			warnings: (record.warnings ?? []) as string[],
		},
	};
}

function validateReferences(tables: MaterializedNodeTree): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const routeIds = new Set(tables.screenRoutes.map((route) => route.id));
	const variantIds = new Set(tables.screenVariants.map((variant) => variant.id));
	const areaIds = new Set(tables.areas.map((area) => area.id));
	const componentIds = new Set(tables.components.map((component) => component.id));

	issues.push(
		...findDuplicateIds("screenRoute", tables.screenRoutes.map((r) => r.id)),
		...findDuplicateIds("screenVariant", tables.screenVariants.map((v) => v.id)),
		...findDuplicateIds("screen", tables.screens.map((s) => s.id)),
		...findDuplicateIds("area", tables.areas.map((a) => a.id)),
		...findDuplicateIds("component", tables.components.map((c) => c.id)),
	);

	for (const variant of tables.screenVariants) {
		if (!routeIds.has(variant.screenRouteId)) {
			issues.push(referenceError(`${variant.id}: missing screenRoute ${variant.screenRouteId}`));
		}
	}

	for (const screen of tables.screens) {
		if (!variantIds.has(screen.screenVariantId)) {
			issues.push(referenceError(`${screen.id}: missing screenVariant ${screen.screenVariantId}`));
		}
		issues.push(
			...validateRegionChildren(`${screen.id}.header`, screen.screen.regions.header.children, {
				areaIds,
				componentIds,
			}),
			...validateRegionChildren(`${screen.id}.contents`, screen.screen.regions.contents.children, {
				areaIds,
				componentIds,
			}),
			...validateRegionChildren(`${screen.id}.bottom`, screen.screen.regions.bottom.children, {
				areaIds,
				componentIds,
			}),
		);
	}

	for (const area of tables.areas) {
		for (const child of area.children) {
			if (!componentIds.has(child.id)) {
				issues.push(referenceError(`${area.id}: missing component ${child.id}`));
			}
		}
	}

	return issues;
}

function validateRegionChildren(
	scope: string,
	children: DatabaseRegionChild[],
	context: { areaIds: Set<string>; componentIds: Set<string> },
): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	for (const child of children) {
		if (child.kind === "area" && !context.areaIds.has(child.id)) {
			issues.push(referenceError(`${scope}: missing area ${child.id}`));
		}
		if (child.kind === "component" && !context.componentIds.has(child.id)) {
			issues.push(referenceError(`${scope}: missing component ${child.id}`));
		}
	}
	return issues;
}

function validatePatternReferences(
	tables: MaterializedNodeTree,
	patternStore: PatternStore | undefined,
): ValidationIssue[] {
	if (!patternStore) return [];
	const issues: ValidationIssue[] = [];
	const patternIds = new Set(patternStore.patterns.map((pattern) => pattern.id));
	for (const screen of tables.screens) {
		if (screen.pattern?.id && !patternIds.has(screen.pattern.id)) {
			issues.push(patternWarning(`${screen.id}: pattern ${screen.pattern.id} is not in pattern-store`));
		}
	}
	for (const area of tables.areas) {
		if (area.pattern?.id && !patternIds.has(area.pattern.id)) {
			issues.push(patternWarning(`${area.id}: pattern ${area.pattern.id} is not in pattern-store`));
		}
	}
	for (const component of tables.components) {
		if (component.pattern?.id && !patternIds.has(component.pattern.id)) {
			issues.push(
				patternWarning(`${component.id}: pattern ${component.pattern.id} is not in pattern-store`),
			);
		}
	}
	return issues;
}

function validateRendererProjection(
	tables: MaterializedNodeTree,
	options: PromoteDatabaseTablesOptions,
): ValidationIssue[] {
	const renderTrees = tablesToRenderTrees({
		screens: tables.screens,
		areas: tables.areas,
		components: tables.components,
		patternStore: options.patternStore,
	});

	return renderTrees.flatMap((renderTree) => {
		const result = validateRenderTreeFull(renderTree, {
			strictRendererCoverage: options.strictRendererCoverage ?? false,
		});
		return result.issues.map((issue) => ({
			...issue,
			message: `${renderTree.metadata.id}: render tree: ${issue.message}`,
		}));
	});
}

function findDuplicateIds(label: string, ids: string[]): ValidationIssue[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const id of ids) {
		if (!id) continue;
		if (seen.has(id)) duplicates.add(id);
		seen.add(id);
	}
	return Array.from(duplicates)
		.sort()
		.map<ValidationIssue>((id) => ({
			code: "reference.duplicate-id",
			severity: "error",
			layer: "reference",
			message: `${label} id is duplicated: ${id}`,
			data: { label, id },
		}));
}
