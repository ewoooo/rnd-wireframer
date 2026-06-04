import { NODE_TYPES } from "@cx/types/node-types";
import type {
	DecoratedAreaNode,
	DecoratedComponentNode,
	DecoratedPrddScreen,
	NodeHook,
} from "../types";
import { REGION_METADATA_TITLE, REGION_NODE_TYPE } from "./region-constants";
import type {
	DatabaseAreaRow,
	DatabaseComponentMetadata,
	DatabaseComponentRow,
	DatabaseRegionChild,
	DatabaseScreenBody,
	DatabaseScreenRegion,
	DatabaseScreenRegionType,
	DatabaseScreenRow,
} from "./register-assets-to-database-tables";

export interface MaterializedPrddTables {
	screen: DatabaseScreenRow;
	areas: DatabaseAreaRow[];
	components: DatabaseComponentRow[];
	warnings: string[];
}

export interface MaterializePrddOptions {
	author?: string;
	componentVersion?: string;
	minRendererVersion?: string;
	themeMode?: string;
	version?: string;
	now?: () => string;
	pendingPatternId?: string;
	screenVariantId?: string;
}

const DEFAULT_AUTHOR = "plus_x_athor_1";
const DEFAULT_COMPONENT_VERSION = "1.0.0";
const DEFAULT_VERSION = "1.0.0";
const DEFAULT_MIN_RENDERER_VERSION = "0.1.0";
const DEFAULT_THEME_MODE = "light";
const DEFAULT_PENDING_PATTERN_ID = "screen-shell";

export function materializePrddScreenToTables(
	decorated: DecoratedPrddScreen,
	options: MaterializePrddOptions = {},
): MaterializedPrddTables {
	const author = options.author ?? DEFAULT_AUTHOR;
	const componentVersion = options.componentVersion ?? DEFAULT_COMPONENT_VERSION;
	const version = options.version ?? DEFAULT_VERSION;
	const minRendererVersion = options.minRendererVersion ?? DEFAULT_MIN_RENDERER_VERSION;
	const themeMode = options.themeMode ?? DEFAULT_THEME_MODE;
	const pendingPatternId = options.pendingPatternId ?? DEFAULT_PENDING_PATTERN_ID;
	const now = options.now ?? (() => new Date().toISOString());
	const timestamp = now();
	const warnings = [...decorated.warnings];

	const components = decorated.components.map((c) =>
		toComponentRow(c, { author, componentVersion, timestamp }),
	);
	const areas = decorated.areas.map((a) =>
		toAreaRow(a, { author, componentVersion: version, timestamp }),
	);

	const screenBody: DatabaseScreenBody = {
		// Register가 결정한 type을 단순 통과. materializer는 의사결정 안 함.
		type: decorated.screen.screenType ?? NODE_TYPES.screenSurface[0],
		regions: {
			header: toRegion(
				REGION_NODE_TYPE.header,
				REGION_METADATA_TITLE.header,
				decorated.header.children.map(toComponentChild),
			),
			contents: toRegion(
				REGION_NODE_TYPE.contents,
				REGION_METADATA_TITLE.contents,
				decorated.contents.children.map(toAreaChild),
			),
			bottom: toRegion(
				REGION_NODE_TYPE.bottom,
				REGION_METADATA_TITLE.bottom,
				decorated.bottom.children.map(toComponentChild),
			),
		},
	};

	const screen: DatabaseScreenRow = {
		id: decorated.screen.id,
		screenVariantId: options.screenVariantId ?? "default",
		minRendererVersion,
		version,
		order: decorated.screen.order ?? 1,
		pattern: {
			id: decorated.screen.pattern.id ?? pendingPatternId,
			variant: decorated.screen.pattern.variant,
		},
		metadata: {
			title: decorated.screen.name ?? decorated.screen.id,
			author,
			createdAt: timestamp,
			updatedAt: timestamp,
		},
		theme: { mode: themeMode as "light" | "dark" | "system" },
		screen: screenBody,
	};

	return { screen, areas, components, warnings };
}

function toRegion(
	type: DatabaseScreenRegionType,
	title: string,
	children: DatabaseRegionChild[],
): DatabaseScreenRegion {
	return { type, metadata: { title }, children };
}

function toComponentChild(ref: { componentId: string }): DatabaseRegionChild {
	return { kind: "component", id: ref.componentId };
}

function toAreaChild(area: DecoratedAreaNode): DatabaseRegionChild {
	return { kind: "area", id: area.id };
}

interface AreaRowContext {
	author: string;
	componentVersion: string;
	timestamp: string;
}

function toAreaRow(area: DecoratedAreaNode, ctx: AreaRowContext): DatabaseAreaRow {
	const [STATIC_AREA, DYNAMIC_AREA] = NODE_TYPES.area;
	const type = area.areaType === "dynamic" ? DYNAMIC_AREA : STATIC_AREA;
	return {
		id: area.id,
		type,
		version: ctx.componentVersion,
		key: area.key,
		metadata: {
			title: area.name ?? area.id,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		props: {
			name: area.name ?? area.id,
			...(area.layout ? { layout: area.layout } : {}),
			...(area.areaType ? { areaType: area.areaType } : {}),
			...(area.visibility ? { visibility: area.visibility } : {}),
			...(area.minCount !== undefined ? { minCount: area.minCount } : {}),
			...(area.maxCount !== undefined ? { maxCount: area.maxCount } : {}),
			...(area.priority !== undefined ? { priority: area.priority } : {}),
			...(area.errorPolicy ? { errorPolicy: area.errorPolicy } : {}),
			...(area.policyAnchors ? { policyAnchors: [...area.policyAnchors] } : {}),
		},
		pattern: { id: area.pattern.id, variant: area.pattern.variant },
		children: [...area.children]
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map((ref) => ({ kind: "component" as const, id: ref.componentId })),
	};
}

interface ComponentRowContext {
	author: string;
	componentVersion: string;
	timestamp: string;
}

function toComponentRow(
	component: DecoratedComponentNode,
	ctx: ComponentRowContext,
): DatabaseComponentRow {
	const meta: DatabaseComponentMetadata = {
		title: component.name ?? component.id,
		author: ctx.author,
		createdAt: ctx.timestamp,
		updatedAt: ctx.timestamp,
	};
	const hooks: NodeHook[] = [...(component.hooks ?? [])];
	return {
		id: component.id,
		type: component.type || "Generic",
		version: ctx.componentVersion,
		metadata: meta,
		pattern: { id: component.pattern.id, variant: component.pattern.variant },
		children: [
			{
				component: { type: component.type || "Generic" },
				props: { ...(component.props ?? {}) },
			},
		],
		hooks,
	};
}
