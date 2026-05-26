import { tablesToRenderTrees, validateRenderTreeFull } from "@cx/renderer";
import type {
	DatabaseAreaRow,
	DatabaseComponentRow,
	DatabaseRegionChild,
	DatabaseScreenRouteRow,
	DatabaseScreenRow,
	DatabaseScreenVariantRow,
	MaterializedDatabaseNodeTables,
	PatternStore,
} from "@cx/types";

export interface PromoteDatabaseTablesOptions {
	patternStore?: PatternStore;
	strictRendererCoverage?: boolean;
}

export interface PromoteDatabaseTablesResult {
	errors: string[];
	files?: PromotedDatabaseTableFiles;
	success: boolean;
	warnings: string[];
}

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
		return {
			errors: shape.errors,
			success: false,
			warnings: [],
		};
	}

	const tables = shape.tables;
	const errors = validateReferences(tables);
	const warnings = [
		...(tables.warnings ?? []),
		...validatePatternReferences(tables, options.patternStore),
	];

	if (errors.length === 0) {
		const renderValidation = validateRendererProjection(tables, options);
		errors.push(...renderValidation.errors);
		warnings.push(...renderValidation.warnings);
	}

	return {
		errors,
		files: errors.length === 0 ? createPromotedTableFiles(tables) : undefined,
		success: errors.length === 0,
		warnings,
	};
}

export function createPromotedTableFiles(
	tables: MaterializedDatabaseNodeTables,
): PromotedDatabaseTableFiles {
	return {
		"areas.json": { areas: tables.areas },
		"components.json": { components: tables.components },
		"screen_routes.json": { screenRoutes: tables.screenRoutes },
		"screen_variants.json": { screenVariants: tables.screenVariants },
		"screens.json": { screens: tables.screens },
	};
}

function parseCandidateShape(
	candidate: unknown,
):
	| { success: true; tables: MaterializedDatabaseNodeTables }
	| { success: false; errors: string[] } {
	if (!candidate || typeof candidate !== "object") {
		return { success: false, errors: ["candidate must be an object"] };
	}

	const record = candidate as Partial<Record<keyof MaterializedDatabaseNodeTables, unknown>>;
	const errors: string[] = [];
	if (!Array.isArray(record.screenRoutes)) errors.push("screenRoutes array is required");
	if (!Array.isArray(record.screenVariants)) errors.push("screenVariants array is required");
	if (!Array.isArray(record.screens)) errors.push("screens array is required");
	if (!Array.isArray(record.areas)) errors.push("areas array is required");
	if (!Array.isArray(record.components)) errors.push("components array is required");
	if (record.warnings !== undefined && !Array.isArray(record.warnings)) {
		errors.push("warnings must be an array when provided");
	}

	if (errors.length > 0) return { success: false, errors };

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

function validateReferences(tables: MaterializedDatabaseNodeTables) {
	const errors: string[] = [];
	const routeIds = new Set(tables.screenRoutes.map((route) => route.id));
	const variantIds = new Set(tables.screenVariants.map((variant) => variant.id));
	const areaIds = new Set(tables.areas.map((area) => area.id));
	const componentIds = new Set(tables.components.map((component) => component.id));

	errors.push(
		...findDuplicateIds(
			"screenRoute",
			tables.screenRoutes.map((route) => route.id),
		),
	);
	errors.push(
		...findDuplicateIds(
			"screenVariant",
			tables.screenVariants.map((variant) => variant.id),
		),
	);
	errors.push(
		...findDuplicateIds(
			"screen",
			tables.screens.map((screen) => screen.id),
		),
	);
	errors.push(
		...findDuplicateIds(
			"area",
			tables.areas.map((area) => area.id),
		),
	);
	errors.push(
		...findDuplicateIds(
			"component",
			tables.components.map((component) => component.id),
		),
	);

	for (const variant of tables.screenVariants) {
		if (!routeIds.has(variant.screenRouteId)) {
			errors.push(`${variant.id}: missing screenRoute ${variant.screenRouteId}`);
		}
	}

	for (const screen of tables.screens) {
		if (!variantIds.has(screen.screenVariantId)) {
			errors.push(`${screen.id}: missing screenVariant ${screen.screenVariantId}`);
		}
		validateRegionChildren(`${screen.id}.header`, screen.screen.regions.header.children, {
			areaIds,
			componentIds,
			errors,
		});
		validateRegionChildren(`${screen.id}.contents`, screen.screen.regions.contents.children, {
			areaIds,
			componentIds,
			errors,
		});
		validateRegionChildren(`${screen.id}.bottom`, screen.screen.regions.bottom.children, {
			areaIds,
			componentIds,
			errors,
		});
	}

	for (const area of tables.areas) {
		for (const child of area.children) {
			if (!componentIds.has(child.id)) {
				errors.push(`${area.id}: missing component ${child.id}`);
			}
		}
	}

	return errors;
}

function validateRegionChildren(
	scope: string,
	children: DatabaseRegionChild[],
	context: {
		areaIds: Set<string>;
		componentIds: Set<string>;
		errors: string[];
	},
) {
	for (const child of children) {
		if (child.kind === "area" && !context.areaIds.has(child.id)) {
			context.errors.push(`${scope}: missing area ${child.id}`);
		}
		if (child.kind === "component" && !context.componentIds.has(child.id)) {
			context.errors.push(`${scope}: missing component ${child.id}`);
		}
	}
}

function validatePatternReferences(
	tables: MaterializedDatabaseNodeTables,
	patternStore: PatternStore | undefined,
) {
	if (!patternStore) return [];

	const warnings: string[] = [];
	const patternIds = new Set(patternStore.patterns.map((pattern) => pattern.id));
	for (const screen of tables.screens) {
		if (screen.pattern?.id && !patternIds.has(screen.pattern.id)) {
			warnings.push(`${screen.id}: pattern ${screen.pattern.id} is not in pattern-store`);
		}
	}
	for (const area of tables.areas) {
		if (area.pattern?.id && !patternIds.has(area.pattern.id)) {
			warnings.push(`${area.id}: pattern ${area.pattern.id} is not in pattern-store`);
		}
	}
	for (const component of tables.components) {
		if (component.pattern?.id && !patternIds.has(component.pattern.id)) {
			warnings.push(`${component.id}: pattern ${component.pattern.id} is not in pattern-store`);
		}
	}
	return warnings;
}

function validateRendererProjection(
	tables: MaterializedDatabaseNodeTables,
	options: PromoteDatabaseTablesOptions,
) {
	const errors: string[] = [];
	const warnings: string[] = [];
	const renderTrees = tablesToRenderTrees({
		screens: tables.screens,
		areas: tables.areas,
		components: tables.components,
		patternStore: options.patternStore,
	});

	for (const renderTree of renderTrees) {
		const validation = validateRenderTreeFull(renderTree, {
			strictRendererCoverage: options.strictRendererCoverage ?? false,
		});
		errors.push(
			...validation.errors.map((error) => `${renderTree.metadata.id}: render tree: ${error}`),
		);
		warnings.push(
			...validation.warnings.map((warning) => `${renderTree.metadata.id}: render tree: ${warning}`),
		);
	}

	return { errors, warnings };
}

function findDuplicateIds(label: string, ids: string[]) {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const id of ids) {
		if (!id) continue;
		if (seen.has(id)) duplicates.add(id);
		seen.add(id);
	}
	return Array.from(duplicates)
		.sort()
		.map((id) => `${label} id is duplicated: ${id}`);
}
