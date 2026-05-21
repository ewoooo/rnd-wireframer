import {
	type PropValue,
	validateWireframeSchemaFull,
	type WireframeMetadata,
	type WireframeNode,
	type WireframeSchema,
	type WireframeScreenNode,
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
	screenRouteCode: string;
	screenRouteName: string;
	schema: WireframeSchema;
	screenVariantId: string;
	screenVariantName: string;
	screenVariantType: "base" | "edge";
	sourceValidationErrors: string[];
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
	| {
			compositeId: string;
			kind: "composite";
	  }
	| {
			kind: "organism";
			organismId: string;
	  };

export interface SampleScreenRegion {
	type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom";
	componentVersion?: string;
	metadata: Pick<WireframeMetadata, "id" | "title"> & Partial<WireframeMetadata>;
	props?: Record<string, PropValue>;
	children?: SampleRenderEntry[];
}

export type PatternStoreTarget = "composite" | "organism" | "screen";

export interface PatternStoreRecipe {
	composite?: {
		props?: Record<string, PropValue>;
		type?: string;
	};
	organism?: {
		compositeOrder?: "explicit";
		props?: Record<string, PropValue>;
	};
	screen?: {
		regions?: Partial<
			Record<
				"bottom" | "contents" | "header",
				{
					pageStack?: SamplePageStackPattern;
					props?: Record<string, PropValue>;
				}
			>
		>;
	};
}

export interface PatternStoreVariant {
	recipe: PatternStoreRecipe;
}

export interface SamplePageStackPattern {
	enabled: boolean;
	divider?: {
		type: "contents" | "section";
	};
	itemPaddingX?: number;
	paddingY?: number;
	sectionPaddingX?: number;
}

export interface PatternStorePattern {
	defaultVariant: string;
	id: string;
	name: string;
	target: PatternStoreTarget;
	description?: string;
	variants: Record<string, PatternStoreVariant>;
	guidance?: {
		keywords?: string[];
		rules?: string[];
	};
	examples?: Array<Record<string, unknown>>;
}

export interface PatternStore {
	patterns: PatternStorePattern[];
}

export interface SampleScreen {
	id?: string;
	order?: number;
	screenVariantCode?: string;
	version: string;
	minRendererVersion?: string;
	minComponentsVersion?: string;
	metadata: WireframeSchema["metadata"];
	pattern?: {
		id: string;
		variant?: string;
	};
	patternId?: string;
	patternVariant?: string;
	theme?: WireframeSchema["theme"];
	data?: Record<string, unknown>;
	screen: {
		type: "Screen";
		componentVersion: string;
		metadata: WireframeNode["metadata"];
		props?: Record<string, PropValue>;
		regions: {
			bottom: SampleScreenRegion;
			contents: SampleScreenRegion;
			header: SampleScreenRegion;
		};
	};
}

export interface SampleOrganism {
	id: string;
	type: "Organism";
	componentVersion: string;
	metadata: WireframeNode["metadata"];
	patternId?: string;
	patternVariant?: string;
	props?: Record<string, PropValue>;
	composites: Array<{
		compositeId: string;
		order: number;
	}>;
}

export interface SampleCompositeSet {
	composites: WireframeNode[];
}

export interface SampleOrganismSet {
	organisms: SampleOrganism[];
}

export interface SampleScreenSet {
	screens: SampleScreen[];
}

export interface SampleScreenRoute {
	code: string;
	module: string;
	name: string;
	order: number;
	processCode?: string;
}

export interface SampleScreenRouteSet {
	screenRoutes: SampleScreenRoute[];
}

export interface SampleScreenVariant {
	code: string;
	followUp?: string | null;
	name: string;
	order: number;
	screenRouteCode: string;
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
	composites: WireframeNode[];
	organisms: SampleOrganism[];
	patternStore?: PatternStore;
	screens: SampleScreen[];
}) {
	const compositeById = new Map(composites.map((composite) => [composite.metadata.id, composite]));
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

export function tablesToRenderTree({
	compositeById,
	organismById,
	patternById = new Map(),
	screen,
}: {
	compositeById: Map<string, WireframeNode>;
	organismById: Map<string, SampleOrganism>;
	patternById?: Map<string, PatternStorePattern>;
	screen: SampleScreen;
}): WireframeSchema {
	const patternId = screen.pattern?.id ?? screen.patternId;
	const patternVariant = screen.pattern?.variant ?? screen.patternVariant;
	const screenPattern = getPatternPreset(patternById, patternId, patternVariant, "screen");
	const screenNode = screen.screen;

	return {
		version: screen.version,
		minRendererVersion: screen.minRendererVersion,
		minComponentsVersion: screen.minComponentsVersion,
		metadata: screen.metadata,
		theme: screen.theme,
		data: screen.data,
		children: [
			{
				type: "Screen",
				componentVersion: screenNode.componentVersion,
				metadata: screenNode.metadata,
				props: screenNode.props,
				children: [
					tableRegionToRenderNode(
						"header",
						screenNode,
						screenNode.regions.header,
						compositeById,
						organismById,
						patternById,
						screenPattern,
					),
					tableRegionToRenderNode(
						"contents",
						screenNode,
						screenNode.regions.contents,
						compositeById,
						organismById,
						patternById,
						screenPattern,
					),
					tableRegionToRenderNode(
						"bottom",
						screenNode,
						screenNode.regions.bottom,
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
	return [
		...screen.sourceValidationErrors,
		...validateWireframeSchemaFull(screen.schema).errors.map((error) => `render tree: ${error}`),
	];
}

export function getValidationStatus(screen?: AppScreen) {
	const errors = getValidationErrors(screen);
	return {
		errors,
		label: errors.length === 0 ? "screen source + render tree valid" : "validation failed",
		success: errors.length === 0,
	};
}

export function validateSampleScreenSource(screen: SampleScreen) {
	const errors: string[] = [];

	if (!screen.id) {
		errors.push(`${screen.metadata.id}: id is required`);
	}
	if (screen.id && screen.id !== screen.metadata.id) {
		errors.push(`${screen.metadata.id}: id must match metadata.id`);
	}
	if (!screen.screenVariantCode) {
		errors.push(`${screen.metadata.id}: screenVariantCode is required`);
	}
	if (!screen.minRendererVersion) {
		errors.push(`${screen.metadata.id}: minRendererVersion is required`);
	}
	if (screen.minComponentsVersion) {
		errors.push(`${screen.metadata.id}: minComponentsVersion is deprecated in screen source`);
	}
	if (!screen.pattern?.id) {
		errors.push(`${screen.metadata.id}: pattern.id is required`);
	}
	if (screen.patternId || screen.patternVariant) {
		errors.push(
			`${screen.metadata.id}: use pattern.id / pattern.variant instead of patternId / patternVariant`,
		);
	}

	validateScreenSourceRegion(screen, "header", "Screen.Header", errors);
	validateScreenSourceRegion(screen, "contents", "Screen.Contents", errors);
	validateScreenSourceRegion(screen, "bottom", "Screen.Bottom", errors);

	return errors;
}

function tableRegionToRenderNode(
	regionKey: "bottom" | "contents" | "header",
	screenNode: SampleScreen["screen"],
	region: SampleScreenRegion,
	compositeById: Map<string, WireframeNode>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, PatternStorePattern>,
	screenPattern?: PatternStoreRecipe,
): WireframeNode {
	return {
		type: region.type,
		componentVersion: region.componentVersion ?? screenNode.componentVersion,
		metadata: completeMetadata(region.metadata, screenNode.metadata),
		props: getPatternOwnedProps(screenPattern?.screen?.regions?.[regionKey]?.props, region.props),
		children: tableRegionChildrenToRenderNodes(
			regionKey,
			screenNode,
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
	screenNode: SampleScreen["screen"],
	region: SampleScreenRegion,
	compositeById: Map<string, WireframeNode>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, PatternStorePattern>,
	screenPattern?: PatternStoreRecipe,
) {
	const entries = region.children ?? [];
	const pageStack = screenPattern?.screen?.regions?.[regionKey]?.pageStack;
	if (regionKey !== "contents" || !pageStack?.enabled) {
		return entries.map((entry) =>
			tableEntryToRenderNode(entry, compositeById, organismById, patternById),
		);
	}

	const nodes: WireframeNode[] = [];
	entries.forEach((entry, index) => {
		if (index > 0) {
			nodes.push(createDividerNode(screenNode, region, pageStack, index));
		}
		nodes.push(
			createPageStackNode(
				screenNode,
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
	screenNode: SampleScreen["screen"],
	region: SampleScreenRegion,
	pageStack: SamplePageStackPattern,
	index: number,
	child: WireframeNode,
): WireframeNode {
	return {
		type: "PageStack",
		componentVersion: region.componentVersion ?? screenNode.componentVersion,
		metadata: {
			...completeMetadata(region.metadata, screenNode.metadata),
			id: `${region.metadata.id}-pagestack-${index + 1}`,
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
	screenNode: SampleScreen["screen"],
	region: SampleScreenRegion,
	pageStack: SamplePageStackPattern,
	index: number,
): WireframeNode {
	return {
		type: "Divider",
		componentVersion: "1.0.0",
		metadata: {
			...completeMetadata(region.metadata, screenNode.metadata),
			id: `${region.metadata.id}-divider-${index}`,
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
		errors.push(`${screen.metadata.id}: screen.regions.${regionKey} is required`);
		return;
	}
	if (region.type !== expectedType) {
		errors.push(`${screen.metadata.id}: screen.regions.${regionKey}.type must be ${expectedType}`);
	}
	if (!region.metadata?.id || !region.metadata?.title) {
		errors.push(
			`${screen.metadata.id}: screen.regions.${regionKey}.metadata.id/title are required`,
		);
	}
	for (const child of region.children ?? []) {
		if (child.kind === "composite" && !child.compositeId) {
			errors.push(`${screen.metadata.id}: ${regionKey} composite child requires compositeId`);
		}
		if (child.kind === "organism" && !child.organismId) {
			errors.push(`${screen.metadata.id}: ${regionKey} organism child requires organismId`);
		}
	}
}

function tableEntryToRenderNode(
	entry: SampleRenderEntry,
	compositeById: Map<string, WireframeNode>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, PatternStorePattern>,
): WireframeNode {
	if (entry.kind === "composite") {
		return tableCompositeToRenderNode(
			requireComposite(compositeById, entry.compositeId),
			patternById,
		);
	}

	const organism = organismById.get(entry.organismId);
	if (!organism) {
		return {
			type: "Organism",
			componentVersion: "1.0.0",
			metadata: {
				id: entry.organismId,
				title: entry.organismId,
				author: "system",
				createdAt: "2026-05-21T00:00:00Z",
				updatedAt: "2026-05-21T00:00:00Z",
			},
			props: {
				organismCode: entry.organismId,
				name: entry.organismId,
				sourceStatus: "missing",
			},
			children: [],
		};
	}

	const organismPattern = getPatternPreset(
		patternById,
		organism.patternId,
		organism.patternVariant,
		"organism",
	);

	return {
		type: organism.type,
		componentVersion: organism.componentVersion,
		metadata: organism.metadata,
		props: mergeProps(mergeProps(organismPattern?.organism?.props, organism.props), {
			organismCode: organism.id,
		}),
		children: [...organism.composites]
			.sort((a, b) => a.order - b.order)
			.map((compositeRef) =>
				tableCompositeToRenderNode(
					requireComposite(compositeById, compositeRef.compositeId),
					patternById,
				),
			),
	};
}

function tableCompositeToRenderNode(
	composite: WireframeNode & { patternId?: string },
	patternById: Map<string, PatternStorePattern>,
) {
	const compositePattern = getPatternPreset(
		patternById,
		composite.patternId,
		undefined,
		"composite",
	);
	const node = cloneNode(composite);
	node.props = mergeProps(compositePattern?.composite?.props, node.props);
	return node;
}

function requireComposite(compositeById: Map<string, WireframeNode>, compositeId: string) {
	const composite = compositeById.get(compositeId);
	if (!composite) {
		throw new Error(`Missing composite sample: ${compositeId}`);
	}
	return composite;
}

function cloneNode(node: WireframeNode): WireframeNode {
	return JSON.parse(JSON.stringify(node)) as WireframeNode;
}

function getPatternPreset(
	patternById: Map<string, PatternStorePattern>,
	patternId: string | undefined,
	patternVariant: string | undefined,
	target: PatternStoreTarget,
) {
	if (!patternId) return undefined;

	const pattern = patternById.get(patternId);
	if (!pattern) {
		throw new Error(`Missing ${target} pattern sample: ${patternId}`);
	}
	if (pattern.target !== target) {
		throw new Error(`Pattern ${patternId} target must be ${target}, got ${pattern.target}`);
	}

	const variant = patternVariant ?? pattern.defaultVariant;
	const variantEntry = pattern.variants[variant];
	if (!variantEntry) {
		throw new Error(`Missing pattern variant: ${patternId}.${variant}`);
	}
	return variantEntry.recipe;
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
