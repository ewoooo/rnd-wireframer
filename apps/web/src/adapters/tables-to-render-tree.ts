import {
	type PropValue,
	validateWireframeSchemaFull,
	type WireframeMetadata,
	type WireframeNode,
	type WireframeSchema,
	type WireframeScreenNode,
	type WireframeValidationStats,
} from "@cx/renderer";

export const DEFAULT_WIREFRAME_SCREEN_CODE = "NOVA-MBR-FP-002-0";

export interface AppScreen {
	code: string;
	description?: string;
	module: string;
	name: string;
	areas: Array<{
		order: number;
		areaCode: string;
	}>;
	screenOrder: number;
	screenRouteId: string;
	screenRouteName: string;
	schema: WireframeSchema;
	screenVariantId: string;
	screenVariantName: string;
	screenVariantOrder: number;
	screenVariantType: "base" | "edge";
	sourceValidationErrors: string[];
	validationStats?: WireframeValidationStats;
	warnings: string[];
}

export interface AppArea {
	code: string;
	componentCount: number;
	name: string;
	stateCount: number;
	usage: string;
}

// 모든 Database* row 타입은 @cx/agent에서 단일 정의. 이 adapter는 import만.
export type {
	DatabaseAreaMetadata,
	DatabaseAreaRow,
	DatabaseComponentChildEntry,
	DatabaseComponentMetadata,
	DatabaseComponentRow,
	DatabaseRegionChild,
	DatabaseScreenRegion,
	DatabaseScreenRouteRow,
	DatabaseScreenRow,
	DatabaseScreenRowMetadata,
	DatabaseScreenVariantRow,
} from "@cx/agent/register-assets-to-database-tables";

import type {
	DatabaseAreaRow,
	DatabaseComponentRow,
	DatabaseRegionChild,
	DatabaseScreenRegion,
	DatabaseScreenRouteRow,
	DatabaseScreenRow,
	DatabaseScreenVariantRow,
} from "@cx/agent/register-assets-to-database-tables";

// JSON 묶음 wrapper — 단순 plural 컨테이너라 inline 타입 alias.
export type DatabaseComponentSet = { components: DatabaseComponentRow[] };
export type DatabaseAreaSet = { areas: DatabaseAreaRow[] };
export type DatabaseScreenSet = { screens: DatabaseScreenRow[] };
export type DatabaseScreenRouteSet = { screenRoutes: DatabaseScreenRouteRow[] };
export type DatabaseScreenVariantSet = { screenVariants: DatabaseScreenVariantRow[] };

import type {
	AreaVariant,
	CompositeVariant,
	PatternStore,
	PatternStorePattern,
	PatternStoreTarget,
	RegionVariant,
} from "@cx/agent/pattern-store";

export {
	findPattern as findPatternStorePattern,
	listPatterns as listPatternStorePatterns,
	loadPatternStore,
} from "@cx/agent/pattern-store";
export type {
	AreaVariant,
	CompositeVariant,
	PatternStore,
	PatternStorePattern,
	PatternStoreTarget,
	RegionVariant,
};

export function tablesToRenderTrees({
	components,
	areas,
	patternStore,
	screens,
}: {
	components: DatabaseComponentRow[];
	areas: DatabaseAreaRow[];
	patternStore?: PatternStore;
	screens: DatabaseScreenRow[];
}) {
	const componentById = new Map(components.map((component) => [component.id, component]));
	const areaById = new Map(areas.map((area) => [area.id, area]));
	const patternById = new Map(
		(patternStore?.patterns ?? []).map((pattern) => [pattern.id, pattern]),
	);

	return screens.map((screen) =>
		tablesToRenderTree({
			componentById,
			areaById,
			patternById,
			screen,
		}),
	);
}

export const SCREEN_NODE_COMPONENT_VERSION = "1.0.0";

function deriveSchemaMetadata(screen: DatabaseScreenRow): WireframeMetadata {
	const id = screen.id ?? screen.metadata.title;
	return {
		id,
		title: screen.metadata.title,
		author: screen.metadata.author,
		createdAt: screen.metadata.createdAt,
		updatedAt: screen.metadata.updatedAt,
		description: screen.metadata.description,
	};
}

export function tablesToRenderTree({
	componentById,
	areaById,
	patternById = new Map(),
	screen,
}: {
	componentById: Map<string, DatabaseComponentRow>;
	areaById: Map<string, DatabaseAreaRow>;
	patternById?: Map<string, PatternStorePattern>;
	screen: DatabaseScreenRow;
}): WireframeSchema {
	const screenBody = screen.screen;
	const schemaMetadata = deriveSchemaMetadata(screen);
	const screenNodeMetadata: WireframeMetadata = {
		...schemaMetadata,
		id: `${schemaMetadata.id}-screen-root`,
		title: `${schemaMetadata.title} 화면`,
	};

	return {
		version: screen.version,
		minRendererVersion: screen.minRendererVersion,
		minComponentsVersion: screen.minComponentsVersion,
		metadata: schemaMetadata,
		theme: screen.theme,
		data: screen.data,
		children: [
			{
				type: "Screen",
				componentVersion: SCREEN_NODE_COMPONENT_VERSION,
				metadata: screenNodeMetadata,
				props: { surface: screenBody.type },
				children: [
					tableRegionToRenderNode(
						"header",
						schemaMetadata,
						screenBody.regions.header,
						componentById,
						areaById,
						patternById,
					),
					tableRegionToRenderNode(
						"contents",
						schemaMetadata,
						screenBody.regions.contents,
						componentById,
						areaById,
						patternById,
					),
					tableRegionToRenderNode(
						"bottom",
						schemaMetadata,
						screenBody.regions.bottom,
						componentById,
						areaById,
						patternById,
					),
				],
			},
		],
	};
}

export function getInitialScreenCode(screens: AppScreen[]) {
	return (
		screens.find((screen) => screen.code === DEFAULT_WIREFRAME_SCREEN_CODE)?.code ??
		screens[0]?.code ??
		""
	);
}

export function getSelectedScreen(screens: AppScreen[], selectedScreenCode: string) {
	return screens.find((screen) => screen.code === selectedScreenCode) ?? screens[0];
}

export function getScreenNode(screen?: AppScreen) {
	return screen?.schema.children.find((node) => node.type === "Screen") as
		| WireframeScreenNode
		| undefined;
}

export function getValidationErrors(screen?: AppScreen) {
	if (!screen) return [];
	const validation = validateWireframeSchemaFull(screen.schema);
	return [
		...screen.sourceValidationErrors,
		...validation.errors.map((error) => `render tree: ${error}`),
	];
}

export function getValidationStatus(screen?: AppScreen) {
	const errors = getValidationErrors(screen);
	const warnings = getValidationWarnings(screen);
	const stats = screen ? validateWireframeSchemaFull(screen.schema).stats : undefined;
	return {
		errors,
		label:
			errors.length === 0
				? warnings.length === 0
					? "screen source + render tree valid"
					: "valid with warnings"
				: "validation failed",
		stats,
		success: errors.length === 0,
		warnings,
	};
}

export function getValidationWarnings(screen?: AppScreen) {
	if (!screen) return [];
	const validation = validateWireframeSchemaFull(screen.schema);
	return [...screen.warnings, ...validation.warnings.map((warning) => `render tree: ${warning}`)];
}

export function validateDatabaseScreenSource(screen: DatabaseScreenRow) {
	const errors: string[] = [];
	const label = screen.id ?? screen.metadata.title;

	if (!screen.id) {
		errors.push(`${label}: id is required`);
	}
	if (!screen.metadata.title) {
		errors.push(`${label}: metadata.title is required`);
	}
	if (!screen.screenVariantId) {
		errors.push(`${label}: screenVariantId is required`);
	}
	if (!screen.minRendererVersion) {
		errors.push(`${label}: minRendererVersion is required`);
	}
	if (screen.minComponentsVersion) {
		errors.push(`${label}: minComponentsVersion is deprecated in screen source`);
	}
	if (screen.patternId || screen.patternVariant) {
		errors.push(`${label}: use pattern.id / pattern.variant instead of patternId / patternVariant`);
	}

	validateScreenSourceRegion(screen, "header", "Screen.Header", errors);
	validateScreenSourceRegion(screen, "contents", "Screen.Contents", errors);
	validateScreenSourceRegion(screen, "bottom", "Screen.Bottom", errors);

	return errors;
}

const REGION_ID_BY_KEY = {
	header: "screen-header",
	contents: "screen-contents",
	bottom: "screen-bottom",
} as const;

const REGION_DEFAULT_PROPS: Record<DatabaseScreenRegion["type"], Record<string, PropValue>> = {
	"Screen.Header": {
		position: "sticky",
		layout: { direction: "column", gap: 0 },
	},
	"Screen.Contents": {
		layout: { direction: "column", gap: 0 },
		scroll: true,
	},
	"Screen.Bottom": {
		position: "sticky",
		layout: { direction: "column", gap: 0 },
		safeArea: true,
	},
};

function tableRegionToRenderNode(
	regionKey: "bottom" | "contents" | "header",
	schemaMetadata: WireframeMetadata,
	region: DatabaseScreenRegion,
	componentById: Map<string, DatabaseComponentRow>,
	areaById: Map<string, DatabaseAreaRow>,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	const regionId = REGION_ID_BY_KEY[regionKey];
	const regionPattern = resolveRegionPattern(regionKey, region, patternById);
	return {
		type: region.type,
		componentVersion: region.componentVersion ?? SCREEN_NODE_COMPONENT_VERSION,
		metadata: completeMetadata({ id: regionId, ...region.metadata }, schemaMetadata),
		props: {
			...REGION_DEFAULT_PROPS[region.type],
			...getPatternOwnedProps(undefined, region.props as Record<string, PropValue> | undefined),
		},
		children: tableRegionChildrenToRenderNodes(
			regionId,
			schemaMetadata,
			region,
			componentById,
			areaById,
			patternById,
			regionPattern,
		),
	};
}

function tableRegionChildrenToRenderNodes(
	regionId: string,
	schemaMetadata: WireframeMetadata,
	region: DatabaseScreenRegion,
	componentById: Map<string, DatabaseComponentRow>,
	areaById: Map<string, DatabaseAreaRow>,
	patternById: Map<string, PatternStorePattern>,
	regionPattern: RegionVariant | undefined,
) {
	const entries = region.children ?? [];
	const nodes = entries.map((entry) =>
		tableEntryToRenderNode(entry, componentById, areaById, patternById),
	);
	return wrapRegionChildren(regionId, schemaMetadata, region, entries, nodes, regionPattern);
}

function resolveRegionPattern(
	regionKey: "bottom" | "contents" | "header",
	region: DatabaseScreenRegion,
	patternById: Map<string, PatternStorePattern>,
) {
	const fallbackPatternId = regionKey === "contents" ? "section-stack" : "plain-stack";
	return getPatternPreset(
		patternById,
		region.pattern?.id ?? fallbackPatternId,
		region.pattern?.variant,
		"region",
	);
}

function wrapRegionChildren(
	regionId: string,
	schemaMetadata: WireframeMetadata,
	region: DatabaseScreenRegion,
	entries: DatabaseRegionChild[],
	children: WireframeNode[],
	pattern: RegionVariant | undefined,
) {
	const childWrap = pattern?.childWrap;
	if (childWrap?.kind !== "page-stack") return children;

	const appliesTo = childWrap.appliesTo ?? ["component", "area"];
	const wrapped: WireframeNode[] = [];
	children.forEach((child, index) => {
		const entry = entries[index];
		if (!entry || !appliesTo.includes(entry.kind)) {
			wrapped.push(child);
			return;
		}
		if (wrapped.length > 0 && childWrap.divider) {
			wrapped.push(createRegionDividerNode(regionId, schemaMetadata, region, childWrap, index));
		}
		wrapped.push(
			createRegionPageStackNode(regionId, schemaMetadata, region, childWrap, index, child),
		);
	});
	return wrapped;
}

function createRegionPageStackNode(
	regionId: string,
	schemaMetadata: WireframeMetadata,
	region: DatabaseScreenRegion,
	childWrap: NonNullable<RegionVariant["childWrap"]>,
	index: number,
	child: WireframeNode,
): WireframeNode {
	return {
		type: "PageStack",
		componentVersion: region.componentVersion ?? SCREEN_NODE_COMPONENT_VERSION,
		metadata: {
			...completeMetadata({ id: regionId, ...region.metadata }, schemaMetadata),
			id: `${regionId}-section-${index + 1}`,
			title: `섹션 ${index + 1}`,
		},
		props: {
			itemPaddingX: childWrap.itemPaddingX ?? 20,
			paddingY: childWrap.paddingY ?? 28,
			sectionPaddingX: childWrap.sectionPaddingX ?? 12,
		},
		children: [child],
	};
}

function createRegionDividerNode(
	regionId: string,
	schemaMetadata: WireframeMetadata,
	region: DatabaseScreenRegion,
	childWrap: NonNullable<RegionVariant["childWrap"]>,
	index: number,
): WireframeNode {
	return {
		type: "Divider",
		componentVersion: "1.0.0",
		metadata: {
			...completeMetadata({ id: regionId, ...region.metadata }, schemaMetadata),
			id: `${regionId}-divider-${index}`,
			title: `섹션 구분선 ${index}`,
		},
		props: {
			type: childWrap.divider?.type ?? "section",
		},
	};
}

function completeMetadata(
	metadata: Pick<WireframeMetadata, "id" | "title"> & Partial<WireframeMetadata>,
	fallback: WireframeMetadata,
): WireframeMetadata {
	return {
		author: fallback.author,
		createdAt: fallback.createdAt,
		updatedAt: fallback.updatedAt,
		...metadata,
	};
}

function validateScreenSourceRegion(
	screen: DatabaseScreenRow,
	regionKey: "bottom" | "contents" | "header",
	expectedType: DatabaseScreenRegion["type"],
	errors: string[],
) {
	const region = screen.screen.regions[regionKey];
	if (!region) {
		errors.push(`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey} is required`);
		return;
	}
	if (region.type !== expectedType) {
		errors.push(
			`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey}.type must be ${expectedType}`,
		);
	}
	if (!region.metadata?.title) {
		errors.push(
			`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey}.metadata.title is required`,
		);
	}
	for (const child of region.children ?? []) {
		if (!child.id) {
			errors.push(
				`${screen.id ?? screen.metadata.title}: ${regionKey} ${child.kind} child requires id`,
			);
		}
	}
}

function tableEntryToRenderNode(
	entry: DatabaseRegionChild,
	componentById: Map<string, DatabaseComponentRow>,
	areaById: Map<string, DatabaseAreaRow>,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	if (entry.kind === "component") {
		return tableComponentToRenderNode(requireComponent(componentById, entry.id), patternById);
	}

	const area = areaById.get(entry.id);
	if (!area) {
		return {
			type: "Area",
			componentVersion: "1.0.0",
			metadata: {
				id: entry.id,
				title: entry.id,
				author: "system",
				createdAt: "2026-05-21T00:00:00Z",
				updatedAt: "2026-05-21T00:00:00Z",
			},
			props: {
				areaCode: entry.id,
				name: entry.id,
				sourceStatus: "missing",
			},
			children: [],
		};
	}

	const areaPattern = getPatternPreset(
		patternById,
		area.pattern?.id,
		area.pattern?.variant,
		"area",
	);

	return {
		type: area.type,
		componentVersion: area.version,
		metadata: {
			id: area.id,
			title: area.metadata.title,
			author: area.metadata.author,
			createdAt: area.metadata.createdAt,
			updatedAt: area.metadata.updatedAt,
			description: area.metadata.description,
		},
		props: mergeProps(
			mergeProps(areaPattern?.props, area.props as Record<string, PropValue> | undefined),
			{ areaCode: area.id },
		),
		children: area.children.map((componentRef) =>
			tableComponentToRenderNode(requireComponent(componentById, componentRef.id), patternById),
		),
	};
}

function tableComponentToRenderNode(
	component: DatabaseComponentRow,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	const componentPattern = getPatternPreset(
		patternById,
		component.pattern?.id,
		component.pattern?.variant,
		"composite",
	);
	const firstChild = component.children[0];
	const childType = firstChild?.component?.type ?? component.type;
	const childProps = (firstChild?.props ?? {}) as Record<string, PropValue>;
	return {
		type: childType,
		componentVersion: component.version,
		metadata: {
			id: component.id,
			title: component.metadata.title,
			author: component.metadata.author,
			createdAt: component.metadata.createdAt,
			updatedAt: component.metadata.updatedAt,
			description: component.metadata.description,
		},
		props: mergeProps(componentPattern?.props, childProps),
		events: component.events as WireframeNode["events"],
	};
}

function requireComponent(componentById: Map<string, DatabaseComponentRow>, componentId: string) {
	const component = componentById.get(componentId);
	if (!component) {
		throw new Error(`Missing component row: ${componentId}`);
	}
	return component;
}

type VariantByTarget<T extends PatternStoreTarget> = T extends "region"
	? RegionVariant
	: T extends "area"
		? AreaVariant
		: CompositeVariant;

function getPatternPreset<T extends PatternStoreTarget>(
	patternById: Map<string, PatternStorePattern>,
	patternId: string | undefined,
	patternVariant: string | undefined,
	target: T,
): VariantByTarget<T> | undefined {
	if (!patternId) return undefined;

	const pattern = patternById.get(patternId);
	if (!pattern || pattern.target !== target) return undefined;

	const variant = patternVariant ?? pattern.defaultVariant;
	const variantEntry = pattern.variants[variant];
	if (!variantEntry) return undefined;
	return variantEntry as VariantByTarget<T>;
}

function mergeProps(
	base: Record<string, PropValue> | undefined,
	override: Record<string, PropValue> | undefined,
) {
	return {
		...(base ?? {}),
		...(override ?? {}),
	};
}

function getPatternOwnedProps(
	patternProps: Record<string, PropValue> | undefined,
	fallbackProps: Record<string, PropValue> | undefined,
) {
	return patternProps ?? fallbackProps ?? {};
}
