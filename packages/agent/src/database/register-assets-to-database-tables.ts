import type {
	DecoratedAreaNode,
	DecoratedComponentNode,
	DecoratedNodeTree,
	DecoratedRouteNode,
	DecoratedScreenNode,
	DecoratedVariantNode,
	NodeHook,
} from "../types";

export interface DatabaseScreenRouteRow {
	id: string;
	moduleId: string;
	name: string;
	order: number;
	processId: string | null;
}

export interface DatabaseScreenVariantRow {
	id: string;
	screenRouteId: string;
	name: string;
	order: number;
	variantType: "base" | "edge";
	followUp: string | null;
}

export interface DatabaseRegionChild {
	kind: "component" | "area";
	id: string;
}

import { normalizeComponentType } from "../normalize-component-type";
import type { ScreenSurfaceType } from "../types";
import { REGION_METADATA_TITLE, REGION_NODE_TYPE } from "./region-constants";
export type AreaTypeLiteral = "area.static" | "area.dynamic";

export interface DatabaseScreenRegion {
	type: string;
	componentVersion?: string;
	metadata: { title: string; description?: string };
	pattern?: { id: string; variant?: string };
	props?: Record<string, unknown>;
	children: DatabaseRegionChild[];
}

export interface DatabaseScreenRowMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface DatabaseScreenBody {
	type: ScreenSurfaceType;
	regions: {
		header: DatabaseScreenRegion;
		contents: DatabaseScreenRegion;
		bottom: DatabaseScreenRegion;
	};
}

export interface DatabaseScreenRow {
	id: string;
	screenVariantId: string;
	minRendererVersion?: string;
	minComponentsVersion?: string;
	version: string;
	/** JSON 영속 데이터엔 항상 존재하지만, in-flight 구성 중엔 미정일 수 있음. */
	order?: number;
	pattern?: { id: string; variant?: string };
	patternId?: string;
	patternVariant?: string;
	metadata: DatabaseScreenRowMetadata;
	theme?: { mode?: "light" | "dark" | "system"; primaryColor?: string; fontFamily?: string };
	/** 워크벤치 mock data 주입용 optional 슬롯. JSON 영속 데이터엔 없음. */
	data?: Record<string, unknown>;
	screen: DatabaseScreenBody;
}

export interface DatabaseAreaMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

/**
 * Canonical area DB row. Legacy와 PRDD pipeline 양쪽 다 이 shape으로 발행.
 * PRDD 출처는 key + 풍부한 props (layout, areaType, errorPolicy 등) 채움.
 * Legacy 출처는 name만 채우고 나머지 optional 비움.
 */
export interface DatabaseAreaRow {
	id: string;
	type: AreaTypeLiteral;
	version: string;
	/** PRDD 영역 no. (legacy 출처일 때 undefined). */
	key?: number;
	metadata: DatabaseAreaMetadata;
	/** Legacy 출처는 비어있거나 name만, PRDD는 풍부한 메타. */
	props?: {
		name?: string;
		layout?: string;
		areaType?: string;
		visibility?: string;
		minCount?: number;
		maxCount?: number;
		priority?: number;
		errorPolicy?: string;
		policyAnchors?: string[];
		/** Dynamic area trigger entity (PRDD pipeline 발행). */
		trigger?: { type: "boolean-state"; source: string; defaultValue?: boolean };
		[k: string]: unknown;
	};
	pattern?: { id: string; variant?: string };
	children: Array<{ kind: "component"; id: string }>;
}

export interface DatabaseComponentChildEntry {
	component: { type?: string } & Record<string, unknown>;
	props: Record<string, unknown>;
}

export interface DatabaseComponentMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
}

export interface DatabaseComponentRow {
	id: string;
	type: string;
	version: string;
	metadata: DatabaseComponentMetadata;
	pattern: { id: string; variant: string };
	children: DatabaseComponentChildEntry[];
	hooks?: NodeHook[];
	events?: Record<string, unknown>;
}

export interface MaterializedDatabaseNodeTables {
	screenRoutes: DatabaseScreenRouteRow[];
	screenVariants: DatabaseScreenVariantRow[];
	screens: DatabaseScreenRow[];
	areas: DatabaseAreaRow[];
	components: DatabaseComponentRow[];
	warnings: string[];
}

export interface MaterializedDatabaseNodeTablesOptions {
	author?: string;
	componentVersion?: string;
	minRendererVersion?: string;
	themeMode?: string;
	version?: string;
	now?: () => string;
	pendingPatternId?: string;
	areaPrefix?: string;
}

const DEFAULT_AUTHOR = "plus_x_athor_1";
const DEFAULT_COMPONENT_VERSION = "1.0.0";
const DEFAULT_VERSION = "1.0.0";
const DEFAULT_MIN_RENDERER_VERSION = "0.1.0";
const DEFAULT_THEME_MODE = "light";
const DEFAULT_PENDING_PATTERN_ID = "screen-shell";
const DEFAULT_AREA_PREFIX = "ogn-";

export function materializeDecoratedAssetsToDatabaseTables(
	decorated: DecoratedNodeTree,
	options: MaterializedDatabaseNodeTablesOptions = {},
): MaterializedDatabaseNodeTables {
	const author = options.author ?? DEFAULT_AUTHOR;
	const componentVersion = options.componentVersion ?? DEFAULT_COMPONENT_VERSION;
	const version = options.version ?? DEFAULT_VERSION;
	const minRendererVersion = options.minRendererVersion ?? DEFAULT_MIN_RENDERER_VERSION;
	const themeMode = options.themeMode ?? DEFAULT_THEME_MODE;
	const pendingPatternId = options.pendingPatternId ?? DEFAULT_PENDING_PATTERN_ID;
	const areaPrefix = options.areaPrefix ?? DEFAULT_AREA_PREFIX;
	const now = options.now ?? (() => new Date().toISOString());
	const timestamp = now();
	const warnings = [...decorated.warnings];

	const variantById = new Map(decorated.variants.map((variant) => [variant.id, variant]));
	const screenById = new Map(decorated.screens.map((screen) => [screen.id, screen]));

	const screenRoutes = decorated.routes.map((route) => toRouteRow(route));
	const screenVariants: DatabaseScreenVariantRow[] = [];
	const screens: DatabaseScreenRow[] = [];

	for (const route of decorated.routes) {
		for (const variantRef of route.children) {
			const variant = variantById.get(variantRef.variantId);
			if (!variant) {
				warnings.push(`Missing decorated variant: ${variantRef.variantId}`);
				continue;
			}
			screenVariants.push(toVariantRow(route, variant));

			for (const screenRef of variant.children) {
				const screen = screenById.get(screenRef.screenId);
				if (!screen) {
					warnings.push(`Missing decorated screen: ${screenRef.screenId}`);
					continue;
				}
				screens.push(
					toScreenRow(variant.id, screen, {
						author,
						componentVersion,
						minRendererVersion,
						themeMode,
						version,
						pendingPatternId,
						timestamp,
					}),
				);
			}
		}
	}

	const areas = decorated.areas.map((area) =>
		toAreaRow(area, {
			author,
			componentVersion,
			areaPrefix,
			timestamp,
		}),
	);
	const components = decorated.components.map((component) =>
		toComponentRow(component, { author, componentVersion, timestamp }),
	);

	return {
		screenRoutes,
		screenVariants,
		screens,
		areas,
		components,
		warnings,
	};
}

/**
 * @deprecated Use materializeDecoratedAssetsToDatabaseTables.
 */
export const decoratedAssetsToDatabaseTables = materializeDecoratedAssetsToDatabaseTables;

function toRouteRow(route: DecoratedRouteNode): DatabaseScreenRouteRow {
	return {
		id: slugify(route.id),
		moduleId: deriveModule(route.id),
		name: route.name ?? route.id,
		order: route.order ?? 1,
		processId: null,
	};
}

function toVariantRow(
	route: DecoratedRouteNode,
	variant: DecoratedVariantNode,
): DatabaseScreenVariantRow {
	return {
		id: slugify(variant.id),
		screenRouteId: slugify(route.id),
		name: variant.name ?? variant.id,
		order: variant.order ?? 1,
		variantType: "base",
		followUp: null,
	};
}

interface ScreenRowContext {
	author: string;
	componentVersion: string;
	minRendererVersion: string;
	themeMode: string;
	version: string;
	pendingPatternId: string;
	timestamp: string;
}

function toScreenRow(
	variantId: string,
	screen: DecoratedScreenNode,
	ctx: ScreenRowContext,
): DatabaseScreenRow {
	return {
		id: screen.id,
		screenVariantId: slugify(variantId),
		minRendererVersion: ctx.minRendererVersion,
		version: ctx.version,
		order: screen.order ?? 1,
		pattern: { id: screen.pattern.id ?? ctx.pendingPatternId, variant: screen.pattern.variant },
		metadata: {
			title: screen.name ?? screen.id,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		theme: { mode: ctx.themeMode as "light" | "dark" | "system" },
		screen: {
			type: "screen.page",
			regions: {
				header: {
					type: REGION_NODE_TYPE.header,
					metadata: { title: REGION_METADATA_TITLE.header },
					children: toRegionChildren(screen.children.header),
				},
				contents: {
					type: REGION_NODE_TYPE.contents,
					metadata: { title: REGION_METADATA_TITLE.contents },
					children: toRegionChildren(screen.children.contents),
				},
				bottom: {
					type: REGION_NODE_TYPE.bottom,
					metadata: { title: REGION_METADATA_TITLE.bottom },
					children: toRegionChildren(screen.children.bottom),
				},
			},
		},
	};
}

function toRegionChildren(
	refs: DecoratedScreenNode["children"]["contents"],
): DatabaseRegionChild[] {
	return (refs ?? []).map((ref) => ({
		kind: "area",
		id: ref.areaId,
	}));
}

interface AreaRowContext {
	author: string;
	componentVersion: string;
	areaPrefix: string;
	timestamp: string;
}

function toAreaRow(area: DecoratedAreaNode, ctx: AreaRowContext): DatabaseAreaRow {
	return {
		id: area.id,
		// Legacy organism path — area.dynamic 정보가 없으므로 static으로 강제.
		type: "area.static",
		version: ctx.componentVersion,
		metadata: {
			title: area.name ?? area.id,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		props: { name: area.name ?? area.id },
		pattern: {
			id: area.pattern.id ?? derivePatternId(area.id, ctx.areaPrefix),
			variant: area.pattern.variant,
		},
		children: [...(area.children ?? [])]
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
	const type = normalizeComponentType(component.type || "Generic") ?? "Generic";
	return {
		id: component.id,
		type,
		version: ctx.componentVersion,
		metadata: {
			title: component.name ?? component.id,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		pattern: { id: component.pattern.id, variant: component.pattern.variant },
		children: [{ component: { type }, props: { ...(component.props ?? {}) } }],
		hooks: [...(component.hooks ?? [])],
	};
}

function slugify(id: string): string {
	return id.toLowerCase();
}

function deriveModule(id: string): string {
	const segments = id.split("-");
	for (const segment of segments) {
		if (/^[A-Za-z]{3,}$/.test(segment)) return segment.toLowerCase();
	}
	return segments[0]?.toLowerCase() ?? id.toLowerCase();
}

function derivePatternId(areaId: string, areaPrefix: string): string {
	let remainder = areaId;
	if (remainder.startsWith(areaPrefix)) {
		remainder = remainder.slice(areaPrefix.length);
	}
	const firstDash = remainder.indexOf("-");
	if (firstDash <= 0) return remainder;
	const head = remainder.slice(0, firstDash);
	if (/^[a-z]{2,4}$/.test(head)) {
		return remainder.slice(firstDash + 1);
	}
	return remainder;
}
