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
	compositeCount: number;
	name: string;
	stateCount: number;
	usage: string;
}

export type SampleRenderEntry =
	| { kind: "composite"; id: string }
	| { kind: "area"; id: string };

export interface SampleScreenRegion {
	type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom";
	componentVersion?: string;
	metadata: { title: string } & Partial<WireframeMetadata>;
	pattern?: {
		id: string;
		variant?: string;
	};
	children?: SampleRenderEntry[];
	props?: Record<string, PropValue>;
}

import type {
	CompositeVariant,
	AreaVariant,
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
	CompositeVariant,
	AreaVariant,
	PatternStore,
	PatternStorePattern,
	PatternStoreTarget,
	RegionVariant,
};

export interface SampleScreenMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface SampleScreen {
	id?: string;
	order?: number;
	screenVariantId?: string;
	version: string;
	minRendererVersion?: string;
	minComponentsVersion?: string;
	metadata: SampleScreenMetadata;
	pattern?: {
		id: string;
		variant?: string;
	};
	patternId?: string;
	patternVariant?: string;
	theme?: WireframeSchema["theme"];
	data?: Record<string, unknown>;
	screen: {
		type: SampleScreenSurface;
		regions: {
			bottom: SampleScreenRegion;
			contents: SampleScreenRegion;
			header: SampleScreenRegion;
		};
	};
}

export type SampleScreenSurface = "screen.page" | "screen.bottomSheet" | "screen.popup";

export interface SampleAreaMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface SampleArea {
	id: string;
	type: "area.static" | "area.dynamic";
	version: string;
	metadata: SampleAreaMetadata;
	pattern?: {
		id: string;
		variant?: string;
	};
	props?: Record<string, PropValue>;
	children: Array<{ kind: "composite"; id: string }>;
}

export interface SampleCompositeChildEntry {
	component: { type?: string } & Record<string, unknown>;
	props: Record<string, PropValue>;
}

export interface SampleCompositeMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface SampleComposite {
	id: string;
	type: string;
	version: string;
	metadata: SampleCompositeMetadata;
	pattern?: { id: string; variant?: string };
	children: SampleCompositeChildEntry[];
	events?: Record<string, unknown>;
}

export interface SampleCompositeSet {
	composites: SampleComposite[];
}

export interface SampleAreaSet {
	areas: SampleArea[];
}

export interface SampleScreenSet {
	screens: SampleScreen[];
}

export interface SampleScreenRoute {
	id: string;
	moduleId: string;
	name: string;
	order: number;
	processId?: string | null;
}

export interface SampleScreenRouteSet {
	screenRoutes: SampleScreenRoute[];
}

export interface SampleScreenVariant {
	id: string;
	followUp?: string | null;
	name: string;
	order: number;
	screenRouteId: string;
	variantType: "base" | "edge";
}

export interface SampleScreenVariantSet {
	screenVariants: SampleScreenVariant[];
}

export function tablesToRenderTrees({
	composites,
	areas,
	patternStore,
	screens,
}: {
	composites: SampleComposite[];
	areas: SampleArea[];
	patternStore?: PatternStore;
	screens: SampleScreen[];
}) {
	const compositeById = new Map(composites.map((composite) => [composite.id, composite]));
	const areaById = new Map(areas.map((area) => [area.id, area]));
	const patternById = new Map(
		(patternStore?.patterns ?? []).map((pattern) => [pattern.id, pattern]),
	);

	return screens.map((screen) =>
		tablesToRenderTree({
			compositeById,
			areaById,
			patternById,
			screen,
		}),
	);
}

export const SCREEN_NODE_COMPONENT_VERSION = "1.0.0";

function deriveSchemaMetadata(screen: SampleScreen): WireframeMetadata {
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
	compositeById,
	areaById,
	patternById = new Map(),
	screen,
}: {
	compositeById: Map<string, SampleComposite>;
	areaById: Map<string, SampleArea>;
	patternById?: Map<string, PatternStorePattern>;
	screen: SampleScreen;
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
						compositeById,
						areaById,
						patternById,
					),
					tableRegionToRenderNode(
						"contents",
						schemaMetadata,
						screenBody.regions.contents,
						compositeById,
						areaById,
						patternById,
					),
					tableRegionToRenderNode(
						"bottom",
						schemaMetadata,
						screenBody.regions.bottom,
						compositeById,
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

export function validateSampleScreenSource(screen: SampleScreen) {
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

const REGION_DEFAULT_PROPS: Record<SampleScreenRegion["type"], Record<string, PropValue>> = {
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
	region: SampleScreenRegion,
	compositeById: Map<string, SampleComposite>,
	areaById: Map<string, SampleArea>,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	const regionId = REGION_ID_BY_KEY[regionKey];
	const regionPattern = resolveRegionPattern(regionKey, region, patternById);
	return {
		type: region.type,
		componentVersion: region.componentVersion ?? SCREEN_NODE_COMPONENT_VERSION,
		metadata: completeMetadata({ id: regionId, ...region.metadata }, schemaMetadata),
		props: { ...REGION_DEFAULT_PROPS[region.type], ...getPatternOwnedProps(undefined, region.props) },
		children: tableRegionChildrenToRenderNodes(
			regionId,
			schemaMetadata,
			region,
			compositeById,
			areaById,
			patternById,
			regionPattern,
		),
	};
}

function tableRegionChildrenToRenderNodes(
	regionId: string,
	schemaMetadata: WireframeMetadata,
	region: SampleScreenRegion,
	compositeById: Map<string, SampleComposite>,
	areaById: Map<string, SampleArea>,
	patternById: Map<string, PatternStorePattern>,
	regionPattern: RegionVariant | undefined,
) {
	const entries = region.children ?? [];
	const nodes = entries.map((entry) =>
		tableEntryToRenderNode(entry, compositeById, areaById, patternById),
	);
	return wrapRegionChildren(regionId, schemaMetadata, region, entries, nodes, regionPattern);
}

function resolveRegionPattern(
	regionKey: "bottom" | "contents" | "header",
	region: SampleScreenRegion,
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
	region: SampleScreenRegion,
	entries: SampleRenderEntry[],
	children: WireframeNode[],
	pattern: RegionVariant | undefined,
) {
	const childWrap = pattern?.childWrap;
	if (childWrap?.kind !== "page-stack") return children;

	const appliesTo = childWrap.appliesTo ?? ["composite", "area"];
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
	region: SampleScreenRegion,
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
	region: SampleScreenRegion,
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
	screen: SampleScreen,
	regionKey: "bottom" | "contents" | "header",
	expectedType: SampleScreenRegion["type"],
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
	entry: SampleRenderEntry,
	compositeById: Map<string, SampleComposite>,
	areaById: Map<string, SampleArea>,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	if (entry.kind === "composite") {
		return tableCompositeToRenderNode(requireComposite(compositeById, entry.id), patternById);
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
		props: mergeProps(mergeProps(areaPattern?.props, area.props), {
			areaCode: area.id,
		}),
		children: area.children.map((compositeRef) =>
			tableCompositeToRenderNode(requireComposite(compositeById, compositeRef.id), patternById),
		),
	};
}

function tableCompositeToRenderNode(
	composite: SampleComposite,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	const compositePattern = getPatternPreset(
		patternById,
		composite.pattern?.id,
		composite.pattern?.variant,
		"composite",
	);
	const firstChild = composite.children[0];
	const childType = firstChild?.component?.type ?? composite.type;
	const childProps = (firstChild?.props ?? {}) as Record<string, PropValue>;
	return {
		type: childType,
		componentVersion: composite.version,
		metadata: {
			id: composite.id,
			title: composite.metadata.title,
			author: composite.metadata.author,
			createdAt: composite.metadata.createdAt,
			updatedAt: composite.metadata.updatedAt,
			description: composite.metadata.description,
		},
		props: mergeProps(compositePattern?.props, childProps),
		events: composite.events as WireframeNode["events"],
	};
}

function requireComposite(compositeById: Map<string, SampleComposite>, compositeId: string) {
	const composite = compositeById.get(compositeId);
	if (!composite) {
		throw new Error(`Missing composite sample: ${compositeId}`);
	}
	return composite;
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
