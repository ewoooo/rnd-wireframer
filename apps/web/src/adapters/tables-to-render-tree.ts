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
	organisms: Array<{
		order: number;
		organismCode: string;
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

export interface AppOrganism {
	code: string;
	compositeCount: number;
	name: string;
	stateCount: number;
	usage: string;
}

export type SampleRenderEntry =
	| { kind: "composite"; id: string }
	| { kind: "organism"; id: string };

export interface SampleScreenRegion {
	type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom";
	componentVersion?: string;
	metadata: { title: string } & Partial<WireframeMetadata>;
	props?: Record<string, PropValue>;
	children?: SampleRenderEntry[];
}

import {
	type CompositeVariant,
	type OrganismVariant,
	type PatternStore,
	type PatternStorePageStack as SamplePageStackPattern,
	type PatternStorePattern,
	type PatternStoreTarget,
	type ScreenVariant,
} from "@cx/agent/pattern-store";
export {
	findPattern as findPatternStorePattern,
	listPatterns as listPatternStorePatterns,
	loadPatternStore,
} from "@cx/agent/pattern-store";
export type {
	CompositeVariant,
	OrganismVariant,
	PatternStore,
	PatternStorePattern,
	PatternStoreTarget,
	SamplePageStackPattern,
	ScreenVariant,
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

export type SampleScreenSurface = "page" | "bottomsheet" | "popup";

export interface SampleOrganismMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface SampleOrganism {
	id: string;
	type: "Organism";
	version: string;
	metadata: SampleOrganismMetadata;
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

export interface SampleOrganismSet {
	organisms: SampleOrganism[];
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
	organisms,
	patternStore,
	screens,
}: {
	composites: SampleComposite[];
	organisms: SampleOrganism[];
	patternStore?: PatternStore;
	screens: SampleScreen[];
}) {
	const compositeById = new Map(composites.map((composite) => [composite.id, composite]));
	const organismById = new Map(organisms.map((organism) => [organism.id, organism]));
	const patternById = new Map(
		(patternStore?.patterns ?? []).map((pattern) => [pattern.id, pattern]),
	);

	return screens.map((screen) =>
		tablesToRenderTree({
			compositeById,
			organismById,
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
	organismById,
	patternById = new Map(),
	screen,
}: {
	compositeById: Map<string, SampleComposite>;
	organismById: Map<string, SampleOrganism>;
	patternById?: Map<string, PatternStorePattern>;
	screen: SampleScreen;
}): WireframeSchema {
	const patternId = screen.pattern?.id ?? screen.patternId;
	const patternVariant = screen.pattern?.variant ?? screen.patternVariant;
	const screenPattern = getPatternPreset(patternById, patternId, patternVariant, "screen");
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
						organismById,
						patternById,
						screenPattern,
					),
					tableRegionToRenderNode(
						"contents",
						schemaMetadata,
						screenBody.regions.contents,
						compositeById,
						organismById,
						patternById,
						screenPattern,
					),
					tableRegionToRenderNode(
						"bottom",
						schemaMetadata,
						screenBody.regions.bottom,
						compositeById,
						organismById,
						patternById,
						screenPattern,
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
	return [
		...screen.warnings,
		...validation.warnings.map((warning) => `render tree: ${warning}`),
	];
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
	if (!screen.pattern?.id) {
		errors.push(`${label}: pattern.id is required`);
	}
	if (screen.patternId || screen.patternVariant) {
		errors.push(
			`${label}: use pattern.id / pattern.variant instead of patternId / patternVariant`,
		);
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

function tableRegionToRenderNode(
	regionKey: "bottom" | "contents" | "header",
	schemaMetadata: WireframeMetadata,
	region: SampleScreenRegion,
	compositeById: Map<string, SampleComposite>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, PatternStorePattern>,
	screenPattern?: ScreenVariant,
): WireframeNode {
	const regionId = REGION_ID_BY_KEY[regionKey];
	return {
		type: region.type,
		componentVersion: region.componentVersion ?? SCREEN_NODE_COMPONENT_VERSION,
		metadata: completeMetadata({ id: regionId, ...region.metadata }, schemaMetadata),
		props: getPatternOwnedProps(screenPattern?.regions?.[regionKey]?.props, region.props),
		children: tableRegionChildrenToRenderNodes(
			regionKey,
			schemaMetadata,
			region,
			compositeById,
			organismById,
			patternById,
			screenPattern,
		),
	};
}

function tableRegionChildrenToRenderNodes(
	regionKey: "bottom" | "contents" | "header",
	schemaMetadata: WireframeMetadata,
	region: SampleScreenRegion,
	compositeById: Map<string, SampleComposite>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, PatternStorePattern>,
	screenPattern?: ScreenVariant,
) {
	const entries = region.children ?? [];
	const pageStack = screenPattern?.regions?.[regionKey]?.pageStack;
	if (regionKey !== "contents" || !pageStack?.enabled) {
		return entries.map((entry) =>
			tableEntryToRenderNode(entry, compositeById, organismById, patternById),
		);
	}

	const regionId = REGION_ID_BY_KEY[regionKey];
	const nodes: WireframeNode[] = [];
	entries.forEach((entry, index) => {
		if (index > 0) {
			nodes.push(createDividerNode(regionId, schemaMetadata, region, pageStack, index));
		}
		nodes.push(
			createPageStackNode(
				regionId,
				schemaMetadata,
				region,
				pageStack,
				index,
				tableEntryToRenderNode(entry, compositeById, organismById, patternById),
			),
		);
	});
	return nodes;
}

function createPageStackNode(
	regionId: string,
	schemaMetadata: WireframeMetadata,
	region: SampleScreenRegion,
	pageStack: SamplePageStackPattern,
	index: number,
	child: WireframeNode,
): WireframeNode {
	return {
		type: "PageStack",
		componentVersion: region.componentVersion ?? SCREEN_NODE_COMPONENT_VERSION,
		metadata: {
			...completeMetadata({ id: regionId, ...region.metadata }, schemaMetadata),
			id: `${regionId}-pagestack-${index + 1}`,
			title: `Pagestack ${index + 1}`,
		},
		props: {
			itemPaddingX: pageStack.itemPaddingX ?? 20,
			paddingY: pageStack.paddingY ?? 28,
			sectionPaddingX: pageStack.sectionPaddingX ?? 12,
		},
		children: [child],
	};
}

function createDividerNode(
	regionId: string,
	schemaMetadata: WireframeMetadata,
	region: SampleScreenRegion,
	pageStack: SamplePageStackPattern,
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
			type: pageStack.divider?.type ?? "section",
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
		errors.push(`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey}.type must be ${expectedType}`);
	}
	if (!region.metadata?.title) {
		errors.push(
			`${screen.id ?? screen.metadata.title}: screen.regions.${regionKey}.metadata.title is required`,
		);
	}
	for (const child of region.children ?? []) {
		if (!child.id) {
			errors.push(`${screen.id ?? screen.metadata.title}: ${regionKey} ${child.kind} child requires id`);
		}
	}
}

function tableEntryToRenderNode(
	entry: SampleRenderEntry,
	compositeById: Map<string, SampleComposite>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	if (entry.kind === "composite") {
		return tableCompositeToRenderNode(
			requireComposite(compositeById, entry.id),
			patternById,
		);
	}

	const organism = organismById.get(entry.id);
	if (!organism) {
		return {
			type: "Organism",
			componentVersion: "1.0.0",
			metadata: {
				id: entry.id,
				title: entry.id,
				author: "system",
				createdAt: "2026-05-21T00:00:00Z",
				updatedAt: "2026-05-21T00:00:00Z",
			},
			props: {
				organismCode: entry.id,
				name: entry.id,
				sourceStatus: "missing",
			},
			children: [],
		};
	}

	const organismPattern = getPatternPreset(
		patternById,
		organism.pattern?.id,
		organism.pattern?.variant,
		"organism",
	);

	return {
		type: organism.type,
		componentVersion: organism.version,
		metadata: {
			id: organism.id,
			title: organism.metadata.title,
			author: organism.metadata.author,
			createdAt: organism.metadata.createdAt,
			updatedAt: organism.metadata.updatedAt,
			description: organism.metadata.description,
		},
		props: mergeProps(mergeProps(organismPattern?.props, organism.props), {
			organismCode: organism.id,
		}),
		children: organism.children.map((compositeRef) =>
			tableCompositeToRenderNode(
				requireComposite(compositeById, compositeRef.id),
				patternById,
			),
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

type VariantByTarget<T extends PatternStoreTarget> = T extends "screen"
	? ScreenVariant
	: T extends "organism"
		? OrganismVariant
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
