import {
	type RenderTree,
	type RenderTreeNode,
	type RenderTreeScreenNode,
	type RenderTreeTableAreaRow,
	type RenderTreeTableComponentRow,
	type RenderTreeTableScreenRow,
	tablesToRenderTrees,
	validateRenderTreeFull,
} from "@cx/renderer";
import type { DraftTablesBundle } from "@cx/types/draft-tables";
import { getNodeTypeFamily, isAreaType, NODE_TYPES } from "@cx/types/node-types";
import {
	errorsOf,
	type ValidationStats as RenderTreeValidationStats,
	warningsOf,
} from "@cx/types/validation";
import {
	type AppArea,
	type AppComponent,
	type AppScreen,
	type DatabaseScreenRouteSet,
	type DatabaseScreenRow,
	type DatabaseScreenVariantSet,
	validateDatabaseScreenSource,
} from "@/adapters/tables-to-render-tree";
import { loadPatternStoreForWorkbench } from "@/data/pattern-store-loader";

const NON_COMPONENT_TYPES = new Set<string>(["Divider"]);

export interface WorkbenchData {
	areas: AppArea[];
	components: AppComponent[];
	renderTrees: RenderTree[];
	screens: AppScreen[];
}

export type WorkbenchRenderSelection = {
	code: string;
	data: Record<string, unknown>;
	node: RenderTreeNode;
	screenCode: string;
	title: string;
};

export type WorkbenchValidationStatus = {
	errors: string[];
	label: string;
	stats?: RenderTreeValidationStats;
	success: boolean;
	warnings: string[];
};

export function createWorkbenchDataFromTables(tables: DraftTablesBundle): WorkbenchData {
	const patternStore = loadPatternStoreForWorkbench();
	const routes: DatabaseScreenRouteSet = { screenRoutes: tables.screenRoutes };
	const variants: DatabaseScreenVariantSet = { screenVariants: tables.screenVariants };
	const orderedDatabaseScreens = orderDatabaseScreens(tables.screens, variants, routes);
	const areaById = new Map(tables.areas.map((area) => [area.id, area]));
	const componentById = new Map(tables.components.map((component) => [component.id, component]));
	const patternById = new Map(patternStore.patterns.map((pattern) => [pattern.id, pattern]));
	const renderedScreens = tablesToRenderTrees({
		screens: orderedDatabaseScreens,
		areas: tables.areas,
		components: tables.components,
		patternStore,
	});
	const screens = renderedScreens.map((schema, index) => {
		const databaseScreen = orderedDatabaseScreens[index];
		const variant = variants.screenVariants.find(
			(candidate) => candidate.id === databaseScreen.screenVariantId,
		);
		const route = routes.screenRoutes.find((candidate) => candidate.id === variant?.screenRouteId);

		return {
			code: schema.metadata.id,
			name: schema.metadata.title,
			description: schema.metadata.description ?? schema.children[0]?.metadata.title,
			module: route?.moduleId ?? schema.metadata.id.split("-")[1]?.toLowerCase() ?? "unknown",
			areas: extractAreas(schema),
			screenOrder: databaseScreen.order ?? index + 1,
			screenRouteId: route?.id ?? "unknown-route",
			screenRouteName: route?.name ?? "Unknown route",
			screenVariantId: variant?.id ?? databaseScreen.screenVariantId ?? schema.metadata.id,
			screenVariantName: variant?.name ?? schema.metadata.title,
			screenVariantOrder: variant?.order ?? databaseScreen.order ?? index + 1,
			screenVariantType: variant?.variantType ?? "base",
			sourceValidationErrors: [
				...validateDatabaseScreenSource(databaseScreen as DatabaseScreenRow),
				...validateDatabaseReferences({
					areaById,
					componentById,
					patternById,
					routes,
					screen: databaseScreen,
					variant,
				}),
			],
			warnings: [],
		} satisfies AppScreen;
	});

	return {
		areas: getAreaCatalog(renderedScreens),
		components: getComponentCatalog(renderedScreens),
		renderTrees: renderedScreens,
		screens,
	};
}

export function getWorkbenchScreenNodeFromData(
	renderTrees: RenderTree[],
	screenCode: string,
	areaOrderOverrides: Record<string, string[]> = {},
) {
	const schema = getWorkbenchRenderTreeFromData(renderTrees, screenCode, areaOrderOverrides);
	return schema?.children.find((node) => node.type === NODE_TYPES.screenRoot[0]) as
		| RenderTreeScreenNode
		| undefined;
}

export function getWorkbenchScreenDataFromData(renderTrees: RenderTree[], screenCode: string) {
	return renderTrees.find((schema) => schema.metadata.id === screenCode)?.data;
}

export function getWorkbenchValidationStatusFromData(
	screens: AppScreen[],
	renderTrees: RenderTree[],
	screenCode: string,
): WorkbenchValidationStatus {
	const screen = screens.find((candidate) => candidate.code === screenCode);
	const schema = renderTrees.find((candidate) => candidate.metadata.id === screenCode);
	if (!screen || !schema) {
		return {
			errors: [],
			label: "screen source not selected",
			success: true,
			warnings: [],
		};
	}

	const validation = validateRenderTreeFull(schema);
	const errors = [
		...screen.sourceValidationErrors,
		...errorsOf(validation).map((issue) => `render tree: ${issue.message}`),
	];
	const warnings = [
		...screen.warnings,
		...warningsOf(validation).map((issue) => `render tree: ${issue.message}`),
	];

	return {
		errors,
		label:
			errors.length === 0
				? warnings.length === 0
					? "screen source + render tree valid"
					: "valid with warnings"
				: "validation failed",
		stats: validation.stats,
		success: errors.length === 0,
		warnings,
	};
}

export function getWorkbenchAreaSelectionFromData(
	screens: AppScreen[],
	renderTrees: RenderTree[],
	areaCode: string,
	areaOrderOverrides: Record<string, string[]> = {},
): WorkbenchRenderSelection | undefined {
	for (const screen of screens) {
		const schema = getWorkbenchRenderTreeFromData(renderTrees, screen.code, areaOrderOverrides);
		if (!schema) continue;
		const node = findAreaNode(schema.children, areaCode);
		if (node) {
			return {
				code: areaCode,
				data: schema.data ?? {},
				node,
				screenCode: screen.code,
				title: node.metadata.title,
			};
		}
	}
	return undefined;
}

export function getWorkbenchComponentSelectionFromData(
	screens: AppScreen[],
	renderTrees: RenderTree[],
	componentCode: string,
	areaOrderOverrides: Record<string, string[]> = {},
): (WorkbenchRenderSelection & { parentAreaCode?: string }) | undefined {
	for (const screen of screens) {
		const schema = getWorkbenchRenderTreeFromData(renderTrees, screen.code, areaOrderOverrides);
		if (!schema) continue;
		const found = findComponentNode(schema.children, componentCode);
		if (found) {
			return {
				code: componentCode,
				data: schema.data ?? {},
				node: found.node,
				parentAreaCode: found.parentAreaCode,
				screenCode: screen.code,
				title: found.node.metadata.title,
			};
		}
	}
	return undefined;
}

function getWorkbenchRenderTreeFromData(
	renderTrees: RenderTree[],
	screenCode: string,
	areaOrderOverrides: Record<string, string[]>,
) {
	const schema = renderTrees.find((candidate) => candidate.metadata.id === screenCode);
	const areaOrder = areaOrderOverrides[screenCode];
	if (!schema || !areaOrder) return schema;
	return reorderRenderTreeAreas(schema, areaOrder);
}

function extractAreas(schema: RenderTree) {
	const areas: Array<{ order: number; areaCode: string }> = [];

	forEachNode(schema.children, (node) => {
		if (!isAreaNode(node)) return;
		areas.push({
			order: areas.length + 1,
			areaCode: node.metadata.id,
		});
	});

	return areas;
}

function getAreaCatalog(schemas: RenderTree[]): AppArea[] {
	const byCode = new Map<string, AppArea>();

	for (const schema of schemas) {
		forEachNode(schema.children, (node) => {
			if (!isAreaNode(node)) return;
			const code = node.metadata.id;
			byCode.set(code, {
				code,
				name: node.metadata.title,
				usage: "section",
				stateCount: 1,
				componentCount: node.children?.length ?? 0,
			});
		});
	}

	return Array.from(byCode.values());
}

function getComponentCatalog(schemas: RenderTree[]): AppComponent[] {
	const byCode = new Map<string, AppComponent>();

	for (const schema of schemas) {
		forEachComponentNode(schema.children, undefined, (node, parentAreaCode) => {
			const code = node.metadata.id;
			if (byCode.has(code)) return;
			byCode.set(code, {
				code,
				name: node.metadata.title,
				parentAreaCode,
				sourceScreenCode: schema.metadata.id,
				type: node.type,
			});
		});
	}

	return Array.from(byCode.values());
}

function orderDatabaseScreens(
	screens: RenderTreeTableScreenRow[],
	variants: DatabaseScreenVariantSet,
	routes: DatabaseScreenRouteSet,
) {
	const routeOrderByCode = new Map(routes.screenRoutes.map((route) => [route.id, route.order]));
	const variantByCode = new Map(variants.screenVariants.map((variant) => [variant.id, variant]));

	return [...screens].sort((left, right) => {
		const leftVariant = left.screenVariantId ? variantByCode.get(left.screenVariantId) : undefined;
		const rightVariant = right.screenVariantId
			? variantByCode.get(right.screenVariantId)
			: undefined;
		const leftRouteOrder = leftVariant
			? (routeOrderByCode.get(leftVariant.screenRouteId) ?? Number.MAX_SAFE_INTEGER)
			: Number.MAX_SAFE_INTEGER;
		const rightRouteOrder = rightVariant
			? (routeOrderByCode.get(rightVariant.screenRouteId) ?? Number.MAX_SAFE_INTEGER)
			: Number.MAX_SAFE_INTEGER;

		return (
			leftRouteOrder - rightRouteOrder ||
			(leftVariant?.order ?? Number.MAX_SAFE_INTEGER) -
				(rightVariant?.order ?? Number.MAX_SAFE_INTEGER) ||
			(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER) ||
			(left.id ?? "").localeCompare(right.id ?? "")
		);
	});
}

function validateDatabaseReferences({
	areaById,
	componentById,
	patternById,
	routes,
	screen,
	variant,
}: {
	areaById: Map<string, RenderTreeTableAreaRow>;
	componentById: Map<string, RenderTreeTableComponentRow>;
	patternById: Map<
		string,
		{ defaultVariant: string; target: string; variants: Record<string, unknown> }
	>;
	routes: DatabaseScreenRouteSet;
	screen: RenderTreeTableScreenRow;
	variant: DatabaseScreenVariantSet["screenVariants"][number] | undefined;
}) {
	const errors: string[] = [];
	const screenLabel = screen.id ?? screen.metadata.title;

	if (!variant) {
		errors.push(
			`${screenLabel}: screenVariantId references missing variant ${screen.screenVariantId}`,
		);
	} else if (!routes.screenRoutes.some((route) => route.id === variant.screenRouteId)) {
		errors.push(
			`${screenLabel}: variant ${variant.id} references missing route ${variant.screenRouteId}`,
		);
	}

	validatePatternReference(screenLabel, "screen", screen.pattern, undefined, patternById, errors);
	validateRegionReferences(
		screenLabel,
		"header",
		screen.screen.regions.header,
		{ areaById, componentById, patternById },
		errors,
	);
	validateRegionReferences(
		screenLabel,
		"contents",
		screen.screen.regions.contents,
		{ areaById, componentById, patternById },
		errors,
	);
	validateRegionReferences(
		screenLabel,
		"bottom",
		screen.screen.regions.bottom,
		{ areaById, componentById, patternById },
		errors,
	);

	return errors;
}

function validateRegionReferences(
	screenLabel: string,
	regionKey: "bottom" | "contents" | "header",
	region: RenderTreeTableScreenRow["screen"]["regions"]["header"],
	context: {
		areaById: Map<string, RenderTreeTableAreaRow>;
		componentById: Map<string, RenderTreeTableComponentRow>;
		patternById: Map<
			string,
			{ defaultVariant: string; target: string; variants: Record<string, unknown> }
		>;
	},
	errors: string[],
) {
	validatePatternReference(
		`${screenLabel}.${regionKey}`,
		"region",
		region.pattern,
		"region",
		context.patternById,
		errors,
	);

	for (const child of region.children ?? []) {
		if (child.kind === "area") {
			const area = context.areaById.get(child.id);
			if (!area) {
				errors.push(`${screenLabel}.${regionKey}: missing area row ${child.id}`);
				continue;
			}
			validateAreaReferences(screenLabel, area, context, errors);
			continue;
		}

		validateComponentReference(`${screenLabel}.${regionKey}`, child.id, context, errors);
	}
}

function validateAreaReferences(
	screenLabel: string,
	area: RenderTreeTableAreaRow,
	context: {
		componentById: Map<string, RenderTreeTableComponentRow>;
		patternById: Map<
			string,
			{ defaultVariant: string; target: string; variants: Record<string, unknown> }
		>;
	},
	errors: string[],
) {
	validatePatternReference(
		`${screenLabel}.${area.id}`,
		"area",
		area.pattern,
		"area",
		context.patternById,
		errors,
	);

	for (const componentRef of area.children) {
		validateComponentReference(`${screenLabel}.${area.id}`, componentRef.id, context, errors);
	}
}

function validateComponentReference(
	scope: string,
	componentId: string,
	context: {
		componentById: Map<string, RenderTreeTableComponentRow>;
		patternById: Map<
			string,
			{ defaultVariant: string; target: string; variants: Record<string, unknown> }
		>;
	},
	errors: string[],
) {
	const component = context.componentById.get(componentId);
	if (!component) {
		errors.push(`${scope}: missing component row ${componentId}`);
		return;
	}
	validatePatternReference(
		scope,
		"component",
		component.pattern,
		"composite",
		context.patternById,
		errors,
	);
}

function validatePatternReference(
	scope: string,
	label: string,
	pattern: { id?: string; variant?: string } | undefined,
	expectedTarget: "area" | "composite" | "region" | undefined,
	patternById: Map<
		string,
		{ defaultVariant: string; target: string; variants: Record<string, unknown> }
	>,
	errors: string[],
) {
	if (!pattern?.id) return;

	const patternEntry = patternById.get(pattern.id);
	if (!patternEntry) {
		errors.push(`${scope}: ${label} references missing pattern ${pattern.id}`);
		return;
	}
	if (expectedTarget && patternEntry.target !== expectedTarget) {
		errors.push(
			`${scope}: pattern ${pattern.id} target must be ${expectedTarget}, got ${patternEntry.target}`,
		);
	}

	const variant = pattern.variant ?? patternEntry.defaultVariant;
	if (!patternEntry.variants[variant]) {
		errors.push(`${scope}: pattern ${pattern.id} references missing variant ${variant}`);
	}
}

function forEachNode(nodes: RenderTreeNode[], callback: (node: RenderTreeNode) => void): void {
	for (const node of nodes) {
		callback(node);
		if (node.children) {
			forEachNode(node.children, callback);
		}
	}
}

function isAreaNode(node: RenderTreeNode) {
	return isAreaType(node.type);
}

function isComponentNode(node: RenderTreeNode) {
	if (NON_COMPONENT_TYPES.has(node.type)) return false;
	return getNodeTypeFamily(node.type) === "component";
}

function forEachComponentNode(
	nodes: RenderTreeNode[],
	parentAreaCode: string | undefined,
	callback: (node: RenderTreeNode, parentAreaCode?: string) => void,
) {
	for (const node of nodes) {
		const nextParentAreaCode = getAreaCode(node) ?? parentAreaCode;
		if (isComponentNode(node)) {
			callback(node, parentAreaCode);
		}
		if (node.children) {
			forEachComponentNode(node.children, nextParentAreaCode, callback);
		}
	}
}

function findAreaNode(nodes: RenderTreeNode[], areaCode: string): RenderTreeNode | undefined {
	for (const node of nodes) {
		if (isAreaNode(node) && node.metadata.id === areaCode) {
			return node;
		}
		const childMatch = node.children ? findAreaNode(node.children, areaCode) : undefined;
		if (childMatch) return childMatch;
	}
	return undefined;
}

function findComponentNode(
	nodes: RenderTreeNode[],
	componentCode: string,
	parentAreaCode?: string,
): { node: RenderTreeNode; parentAreaCode?: string } | undefined {
	for (const node of nodes) {
		const nextParentAreaCode = getAreaCode(node) ?? parentAreaCode;
		if (isComponentNode(node) && node.metadata.id === componentCode) {
			return {
				node,
				parentAreaCode,
			};
		}
		const childMatch = node.children
			? findComponentNode(node.children, componentCode, nextParentAreaCode)
			: undefined;
		if (childMatch) return childMatch;
	}
	return undefined;
}

function reorderRenderTreeAreas(schema: RenderTree, areaCodes: string[]): RenderTree {
	const nextSchema = cloneSchema(schema);
	const screenNode = getWorkbenchScreenNodeFromSchema(nextSchema);
	const contentsNode = screenNode?.children.find(
		(node) => node.type === NODE_TYPES.screenRegion[1],
	);

	if (contentsNode?.children) {
		contentsNode.children = reorderAreaContainers(contentsNode.children, areaCodes);
	}

	return nextSchema;
}

function getWorkbenchScreenNodeFromSchema(schema: RenderTree) {
	return schema.children.find((node) => node.type === NODE_TYPES.screenRoot[0]) as
		| RenderTreeScreenNode
		| undefined;
}

function reorderAreaContainers(nodes: RenderTreeNode[], areaCodes: string[]) {
	const areaContainerByCode = new Map(
		nodes
			.map((node) => {
				const areaCode = getContainedAreaCode(node);
				return areaCode ? ([areaCode, node] as const) : undefined;
			})
			.filter(isAreaContainerEntry),
	);
	const nextAreaContainers = areaCodes
		.map((areaCode) => areaContainerByCode.get(areaCode))
		.filter(isRenderTreeNode);
	let nextAreaIndex = 0;

	return nodes.map((node) => {
		if (!getContainedAreaCode(node)) return node;
		const nextNode = nextAreaContainers[nextAreaIndex];
		nextAreaIndex += 1;
		return nextNode ?? node;
	});
}

function getContainedAreaCode(node: RenderTreeNode): string | undefined {
	if (isAreaNode(node)) return getAreaCode(node);
	const childArea = node.children?.find(isAreaNode);
	return childArea ? getAreaCode(childArea) : undefined;
}

function getAreaCode(node: RenderTreeNode) {
	if (!isAreaNode(node)) return undefined;
	return node.metadata.id;
}

function cloneSchema<T>(schema: T): T {
	return JSON.parse(JSON.stringify(schema)) as T;
}

function isAreaContainerEntry(
	entry: readonly [string, RenderTreeNode] | undefined,
): entry is readonly [string, RenderTreeNode] {
	return Boolean(entry);
}

function isRenderTreeNode(node: RenderTreeNode | undefined): node is RenderTreeNode {
	return Boolean(node);
}
