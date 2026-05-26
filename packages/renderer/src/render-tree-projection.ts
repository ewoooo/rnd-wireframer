import type {
	AreaVariant as RenderTreeAreaVariant,
	ChildrenLayoutPreset as RenderTreeChildrenLayoutPreset,
	ChildWrapPreset as RenderTreeChildWrapPreset,
	CompositeVariant as RenderTreeCompositeVariant,
	PatternLayoutProps as RenderTreePatternLayoutProps,
	PatternStore as RenderTreePatternStore,
	PatternStorePattern as RenderTreePatternStorePattern,
	PatternStoreTarget as RenderTreePatternStoreTarget,
	RegionVariant as RenderTreeRegionVariant,
	DatabaseAreaRow as RenderTreeTableAreaRow,
	DatabaseComponentRow as RenderTreeTableComponentRow,
	DatabaseRegionChild as RenderTreeTableRegionChild,
	DatabaseScreenRegion as RenderTreeTableScreenRegion,
	DatabaseScreenRow as RenderTreeTableScreenRow,
} from "@cx/types";
import type { PropValue, RenderTree, RenderTreeMetadata, RenderTreeNode } from "./schema";

export const SCREEN_NODE_COMPONENT_VERSION = "1.0.0";

export type {
	RenderTreeAreaVariant,
	RenderTreeChildrenLayoutPreset,
	RenderTreeChildWrapPreset,
	RenderTreeCompositeVariant,
	RenderTreePatternLayoutProps,
	RenderTreePatternStore,
	RenderTreePatternStorePattern,
	RenderTreePatternStoreTarget,
	RenderTreeRegionVariant,
	RenderTreeTableAreaRow,
	RenderTreeTableComponentRow,
	RenderTreeTableRegionChild,
	RenderTreeTableScreenRegion,
	RenderTreeTableScreenRow,
};

export type RenderTreeTableProjectionInput = {
	components: RenderTreeTableComponentRow[];
	areas: RenderTreeTableAreaRow[];
	patternStore?: RenderTreePatternStore;
	screens: RenderTreeTableScreenRow[];
};

export function tablesToRenderTrees({
	components,
	areas,
	patternStore,
	screens,
}: RenderTreeTableProjectionInput) {
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

export function tablesToRenderTree({
	componentById,
	areaById,
	patternById = new Map(),
	screen,
}: {
	componentById: Map<string, RenderTreeTableComponentRow>;
	areaById: Map<string, RenderTreeTableAreaRow>;
	patternById?: Map<string, RenderTreePatternStorePattern>;
	screen: RenderTreeTableScreenRow;
}): RenderTree {
	const screenBody = screen.screen;
	const schemaMetadata = deriveSchemaMetadata(screen);
	const screenNodeMetadata: RenderTreeMetadata = {
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

function deriveSchemaMetadata(screen: RenderTreeTableScreenRow): RenderTreeMetadata {
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

const REGION_ID_BY_KEY = {
	header: "screen-header",
	contents: "screen-contents",
	bottom: "screen-bottom",
} as const;

const REGION_DEFAULT_PROPS: Record<
	RenderTreeTableScreenRegion["type"],
	Record<string, PropValue>
> = {
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
	schemaMetadata: RenderTreeMetadata,
	region: RenderTreeTableScreenRegion,
	componentById: Map<string, RenderTreeTableComponentRow>,
	areaById: Map<string, RenderTreeTableAreaRow>,
	patternById: Map<string, RenderTreePatternStorePattern>,
): RenderTreeNode {
	const regionId = REGION_ID_BY_KEY[regionKey];
	const regionPattern = resolveRegionPattern(regionKey, region, patternById);
	return {
		type: region.type,
		componentVersion: region.componentVersion ?? SCREEN_NODE_COMPONENT_VERSION,
		metadata: completeMetadata({ id: regionId, ...region.metadata }, schemaMetadata),
		props: {
			...REGION_DEFAULT_PROPS[region.type],
			...getPatternOwnedProps(undefined, region.props),
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
	schemaMetadata: RenderTreeMetadata,
	region: RenderTreeTableScreenRegion,
	componentById: Map<string, RenderTreeTableComponentRow>,
	areaById: Map<string, RenderTreeTableAreaRow>,
	patternById: Map<string, RenderTreePatternStorePattern>,
	regionPattern: RenderTreeRegionVariant | undefined,
) {
	const entries = region.children ?? [];
	const nodes = entries.map((entry) =>
		tableEntryToRenderNode(entry, componentById, areaById, patternById),
	);
	return wrapRegionChildren(regionId, schemaMetadata, region, entries, nodes, regionPattern);
}

function resolveRegionPattern(
	regionKey: "bottom" | "contents" | "header",
	region: RenderTreeTableScreenRegion,
	patternById: Map<string, RenderTreePatternStorePattern>,
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
	schemaMetadata: RenderTreeMetadata,
	region: RenderTreeTableScreenRegion,
	entries: RenderTreeTableRegionChild[],
	children: RenderTreeNode[],
	pattern: RenderTreeRegionVariant | undefined,
) {
	const childWrap = pattern?.childWrap;
	if (childWrap?.kind !== "page-stack") return children;

	const appliesTo = childWrap.appliesTo ?? ["component", "area"];
	const wrapped: RenderTreeNode[] = [];
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
	schemaMetadata: RenderTreeMetadata,
	region: RenderTreeTableScreenRegion,
	childWrap: RenderTreeChildWrapPreset,
	index: number,
	child: RenderTreeNode,
): RenderTreeNode {
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
	schemaMetadata: RenderTreeMetadata,
	region: RenderTreeTableScreenRegion,
	childWrap: RenderTreeChildWrapPreset,
	index: number,
): RenderTreeNode {
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
	metadata: Pick<RenderTreeMetadata, "id" | "title"> & Partial<RenderTreeMetadata>,
	fallback: RenderTreeMetadata,
): RenderTreeMetadata {
	return {
		author: fallback.author,
		createdAt: fallback.createdAt,
		updatedAt: fallback.updatedAt,
		...metadata,
	};
}

function tableEntryToRenderNode(
	entry: RenderTreeTableRegionChild,
	componentById: Map<string, RenderTreeTableComponentRow>,
	areaById: Map<string, RenderTreeTableAreaRow>,
	patternById: Map<string, RenderTreePatternStorePattern>,
): RenderTreeNode {
	if (entry.kind === "component") {
		const component = componentById.get(entry.id);
		return component
			? tableComponentToRenderNode(component, patternById)
			: createMissingReferenceNode("component", entry.id);
	}

	const area = areaById.get(entry.id);
	if (!area) {
		return createMissingReferenceNode("area", entry.id);
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
			mergeProps(toPropRecord(areaPattern?.layoutProps), toPropRecord(area.props)),
			{
				areaCode: area.id,
			},
		),
		children: area.children.map((componentRef) => {
			const component = componentById.get(componentRef.id);
			return component
				? tableComponentToRenderNode(component, patternById)
				: createMissingReferenceNode("component", componentRef.id);
		}),
	};
}

function tableComponentToRenderNode(
	component: RenderTreeTableComponentRow,
	patternById: Map<string, RenderTreePatternStorePattern>,
): RenderTreeNode {
	const componentPattern = getPatternPreset(
		patternById,
		component.pattern?.id,
		component.pattern?.variant,
		"composite",
	);
	const firstChild = component.children[0];
	const childType = firstChild?.component?.type ?? component.type;
	const childProps = firstChild?.props ?? {};
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
		props: mergeProps(toPropRecord(componentPattern?.layoutProps), toPropRecord(childProps)),
		events: component.events as RenderTreeNode["events"],
	};
}

function createMissingReferenceNode(kind: "area" | "component", id: string): RenderTreeNode {
	return {
		type: "MissingReference",
		componentVersion: "1.0.0",
		metadata: {
			id,
			title: `Missing ${kind}: ${id}`,
			author: "system",
			createdAt: "2026-05-21T00:00:00Z",
			updatedAt: "2026-05-21T00:00:00Z",
		},
		props: {
			id,
			kind,
			sourceStatus: "missing",
		},
		children: [],
	};
}

type VariantByTarget<T extends RenderTreePatternStoreTarget> = T extends "region"
	? RenderTreeRegionVariant
	: T extends "area"
		? RenderTreeAreaVariant
		: RenderTreeCompositeVariant;

function getPatternPreset<T extends RenderTreePatternStoreTarget>(
	patternById: Map<string, RenderTreePatternStorePattern>,
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

function toPropRecord(
	props: Record<string, unknown> | RenderTreePatternLayoutProps | undefined,
): Record<string, PropValue> | undefined {
	return props as Record<string, PropValue> | undefined;
}
