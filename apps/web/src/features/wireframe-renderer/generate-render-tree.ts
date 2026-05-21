import {
	type PropValue,
	resolveDisplayWhen,
	resolveProps,
	validateWireframeSchemaFull,
	type WireframeMetadata,
	type WireframeNode,
	type WireframeSchema,
	type WireframeScreenNode,
} from "@cx/wireframe";

export const DEFAULT_WIREFRAME_SCREEN_CODE = "NOVA-MBR-FP-002-0";

export interface WireframeWorkbenchScreen {
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

export interface WireframeWorkbenchOrganism {
	code: string;
	componentCount: number;
	name: string;
	stateCount: number;
	usage: string;
}

export type WireframeNodeKind =
	| "accordion"
	| "action"
	| "divider"
	| "fallback"
	| "header"
	| "layout-flex"
	| "layout-grid"
	| "list-cell"
	| "organism-section"
	| "page-stack"
	| "section-header"
	| "section-message"
	| "text-field";

export interface RenderableWireframeNode {
	kind: WireframeNodeKind;
	node: WireframeNode;
	props: Record<string, unknown>;
}

export type SampleRenderEntry =
	| {
			componentId: string;
			kind: "component";
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

export type SamplePatternTarget = "component" | "organism" | "screen";

export interface SamplePatternPreset {
	component?: {
		props?: Record<string, PropValue>;
		type?: string;
	};
	organism?: {
		componentOrder?: "explicit";
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

export interface SamplePageStackPattern {
	enabled: boolean;
	divider?: {
		type: "contents" | "section";
	};
	itemPaddingX?: number;
	paddingY?: number;
	sectionPaddingX?: number;
}

export interface SamplePattern {
	defaultVariant: string;
	id: string;
	name: string;
	targetHierarchy: SamplePatternTarget;
	description?: string;
	variants: Record<string, SamplePatternPreset>;
}

export interface SampleScreen {
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
	type: "Organism.Section" | "OrganismSection";
	componentVersion: string;
	metadata: WireframeNode["metadata"];
	patternId?: string;
	patternVariant?: string;
	props?: Record<string, PropValue>;
	components: Array<{
		componentId: string;
		order: number;
	}>;
}

export interface SampleComponentSet {
	components: WireframeNode[];
}

export interface SampleOrganismSet {
	organisms: SampleOrganism[];
}

export interface SamplePatternSet {
	patterns: SamplePattern[];
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

export function generateRenderTrees({
	components,
	organisms,
	patterns = [],
	screens,
}: {
	components: WireframeNode[];
	organisms: SampleOrganism[];
	patterns?: SamplePattern[];
	screens: SampleScreen[];
}) {
	const componentById = new Map(components.map((component) => [component.metadata.id, component]));
	const organismById = new Map(organisms.map((organism) => [organism.id, organism]));
	const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));

	return screens.map((screen) =>
		generateRenderTree({
			componentById,
			organismById,
			patternById,
			screen,
		}),
	);
}

export function generateRenderTree({
	componentById,
	organismById,
	patternById = new Map(),
	screen,
}: {
	componentById: Map<string, WireframeNode>;
	organismById: Map<string, SampleOrganism>;
	patternById?: Map<string, SamplePattern>;
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
					generateRegionNode(
						"header",
						screenNode,
						screenNode.regions.header,
						componentById,
						organismById,
						patternById,
						screenPattern,
					),
					generateRegionNode(
						"contents",
						screenNode,
						screenNode.regions.contents,
						componentById,
						organismById,
						patternById,
						screenPattern,
					),
					generateRegionNode(
						"bottom",
						screenNode,
						screenNode.regions.bottom,
						componentById,
						organismById,
						patternById,
						screenPattern,
					),
				],
			},
		],
	};
}

export function getInitialScreenCode(screens: WireframeWorkbenchScreen[]) {
	return (
		screens.find((screen) => screen.code === DEFAULT_WIREFRAME_SCREEN_CODE)?.code ??
		screens[0]?.code ??
		""
	);
}

export function getSelectedScreen(screens: WireframeWorkbenchScreen[], selectedScreenCode: string) {
	return screens.find((screen) => screen.code === selectedScreenCode) ?? screens[0];
}

export function getScreenNode(screen?: WireframeWorkbenchScreen) {
	return screen?.schema.children.find((node) => node.type === "Screen") as
		| WireframeScreenNode
		| undefined;
}

export function getValidationErrors(screen?: WireframeWorkbenchScreen) {
	if (!screen) return [];
	return [
		...screen.sourceValidationErrors,
		...validateWireframeSchemaFull(screen.schema).errors.map((error) => `render tree: ${error}`),
	];
}

export function getValidationStatus(screen?: WireframeWorkbenchScreen) {
	const errors = getValidationErrors(screen);
	return {
		errors,
		label: errors.length === 0 ? "screen source + render tree valid" : "validation failed",
		success: errors.length === 0,
	};
}

export function validateSampleScreenSource(screen: SampleScreen) {
	const errors: string[] = [];

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

export function getScreenRegions(node: WireframeScreenNode) {
	const [headerNode, contentsNode, bottomNode] = node.children;

	return {
		bottomNode,
		contentsNode,
		headerNode,
	};
}

export function getRenderableWireframeNode(
	node: WireframeNode,
	data: Record<string, unknown>,
): RenderableWireframeNode | undefined {
	if (!resolveDisplayWhen(node.display?.when, data)) return undefined;

	return {
		kind: getWireframeNodeKind(node),
		node,
		props: resolveProps(node.props, data),
	};
}

export function toText(value: unknown, fallback = "") {
	if (value === undefined || value === null) return fallback;
	return String(value);
}

export function toBoolean(value: unknown, fallback = false) {
	if (value === undefined || value === null) return fallback;
	return Boolean(value);
}

function getWireframeNodeKind(node: WireframeNode): WireframeNodeKind {
	if (node.type === "HeaderBase") return "header";
	if (node.type === "Layout.Flex") return "layout-flex";
	if (node.type === "Layout.Grid") return "layout-grid";
	if (node.type === "PageStack") return "page-stack";
	if (node.type === "Divider") return "divider";
	if (node.type === "SectionHeader") return "section-header";
	if (node.type === "OrganismSection" || node.type === "Organism.Section") {
		return "organism-section";
	}
	if (node.type === "ListCell") return "list-cell";
	if (node.type === "Accordion") return "accordion";
	if (node.type === "SectionMessage") return "section-message";
	if (node.type === "TextField") return "text-field";
	if (node.type === "Button" || node.type === "ActionArea") return "action";
	return "fallback";
}

function generateRegionNode(
	regionKey: "bottom" | "contents" | "header",
	screenNode: SampleScreen["screen"],
	region: SampleScreenRegion,
	componentById: Map<string, WireframeNode>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, SamplePattern>,
	screenPattern?: SamplePatternPreset,
): WireframeNode {
	return {
		type: region.type,
		componentVersion: region.componentVersion ?? screenNode.componentVersion,
		metadata: completeMetadata(region.metadata, screenNode.metadata),
		props: getPatternOwnedProps(screenPattern?.screen?.regions?.[regionKey]?.props, region.props),
		children: generateRegionChildren(
			regionKey,
			screenNode,
			region,
			componentById,
			organismById,
			patternById,
			screenPattern,
		),
	};
}

function generateRegionChildren(
	regionKey: "bottom" | "contents" | "header",
	screenNode: SampleScreen["screen"],
	region: SampleScreenRegion,
	componentById: Map<string, WireframeNode>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, SamplePattern>,
	screenPattern?: SamplePatternPreset,
) {
	const entries = region.children ?? [];
	const pageStack = screenPattern?.screen?.regions?.[regionKey]?.pageStack;
	if (regionKey !== "contents" || !pageStack?.enabled) {
		return entries.map((entry) =>
			generateRenderEntryNode(entry, componentById, organismById, patternById),
		);
	}

	const nodes: WireframeNode[] = [];
	entries.forEach((entry, index) => {
		if (index > 0) {
			nodes.push(generateDividerNode(screenNode, region, pageStack, index));
		}
		nodes.push(
			generatePageStackNode(
				screenNode,
				region,
				pageStack,
				index,
				generateRenderEntryNode(entry, componentById, organismById, patternById),
			),
		);
	});
	return nodes;
}

function generatePageStackNode(
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

function generateDividerNode(
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
		if (child.kind === "component" && !child.componentId) {
			errors.push(`${screen.metadata.id}: ${regionKey} component child requires componentId`);
		}
		if (child.kind === "organism" && !child.organismId) {
			errors.push(`${screen.metadata.id}: ${regionKey} organism child requires organismId`);
		}
	}
}

function generateRenderEntryNode(
	entry: SampleRenderEntry,
	componentById: Map<string, WireframeNode>,
	organismById: Map<string, SampleOrganism>,
	patternById: Map<string, SamplePattern>,
): WireframeNode {
	if (entry.kind === "component") {
		return generateComponentNode(requireComponent(componentById, entry.componentId), patternById);
	}

	const organism = organismById.get(entry.organismId);
	if (!organism) {
		return {
			type: "OrganismSection",
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
		props: mergeProps(organismPattern?.organism?.props, organism.props),
		children: [...organism.components]
			.sort((a, b) => a.order - b.order)
			.map((componentRef) =>
				generateComponentNode(
					requireComponent(componentById, componentRef.componentId),
					patternById,
				),
			),
	};
}

function generateComponentNode(
	component: WireframeNode & { patternId?: string },
	patternById: Map<string, SamplePattern>,
) {
	const componentPattern = getPatternPreset(
		patternById,
		component.patternId,
		undefined,
		"component",
	);
	const node = cloneNode(component);
	node.props = mergeProps(componentPattern?.component?.props, node.props);
	return node;
}

function requireComponent(componentById: Map<string, WireframeNode>, componentId: string) {
	const component = componentById.get(componentId);
	if (!component) {
		throw new Error(`Missing component sample: ${componentId}`);
	}
	return component;
}

function cloneNode(node: WireframeNode): WireframeNode {
	return JSON.parse(JSON.stringify(node)) as WireframeNode;
}

function getPatternPreset(
	patternById: Map<string, SamplePattern>,
	patternId: string | undefined,
	patternVariant: string | undefined,
	target: SamplePatternTarget,
) {
	if (!patternId) return undefined;

	const pattern = patternById.get(patternId);
	if (!pattern) {
		throw new Error(`Missing ${target} pattern sample: ${patternId}`);
	}
	if (pattern.targetHierarchy !== target) {
		throw new Error(
			`Pattern ${patternId} targetHierarchy must be ${target}, got ${pattern.targetHierarchy}`,
		);
	}

	const variant = patternVariant ?? pattern.defaultVariant;
	const preset = pattern.variants[variant];
	if (!preset) {
		throw new Error(`Missing pattern variant: ${patternId}.${variant}`);
	}
	return preset;
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
