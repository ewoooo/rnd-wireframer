import type {
	DecoratedComponentNode,
	DecoratedNodeTree,
	DecoratedOrganismNode,
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
	variantType: string;
	followUp: string | null;
}

export interface DatabaseRegionChild {
	kind: "composite" | "organism" | "area";
	id: string;
}

export interface DatabaseScreenRegion {
	type: string;
	metadata: { title: string };
	children: DatabaseRegionChild[];
}

export interface DatabaseScreenRowMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
}

export interface DatabaseScreenBody {
	type: "page" | "bottomsheet" | "popup";
	regions: {
		header: DatabaseScreenRegion;
		contents: DatabaseScreenRegion;
		bottom: DatabaseScreenRegion;
	};
}

export interface DatabaseScreenRow {
	id: string;
	screenVariantId: string;
	minRendererVersion: string;
	version: string;
	order: number;
	pattern: { id: string; variant: string };
	metadata: DatabaseScreenRowMetadata;
	theme: { mode: string };
	screen: DatabaseScreenBody;
}

export interface DatabaseOrganismMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
}

export interface DatabaseOrganismRow {
	id: string;
	type: "Organism";
	version: string;
	metadata: DatabaseOrganismMetadata;
	props: { name: string };
	pattern: { id: string; variant: string };
	children: Array<{ kind: "composite"; id: string }>;
}

export interface DatabaseCompositeChildEntry {
	component: { type?: string } & Record<string, unknown>;
	props: Record<string, unknown>;
}

export interface DatabaseCompositeMetadata {
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
}

export interface DatabaseComponentRow {
	id: string;
	type: string;
	version: string;
	metadata: DatabaseCompositeMetadata;
	pattern: { id: string; variant: string };
	children: DatabaseCompositeChildEntry[];
	hooks: NodeHook[];
}

export interface MaterializedDatabaseNodeTables {
	screenRoutes: DatabaseScreenRouteRow[];
	screenVariants: DatabaseScreenVariantRow[];
	screens: DatabaseScreenRow[];
	organisms: DatabaseOrganismRow[];
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
	organismPrefix?: string;
}

const DEFAULT_AUTHOR = "plus_x_athor_1";
const DEFAULT_COMPONENT_VERSION = "1.0.0";
const DEFAULT_VERSION = "1.0.0";
const DEFAULT_MIN_RENDERER_VERSION = "0.1.0";
const DEFAULT_THEME_MODE = "light";
const DEFAULT_PENDING_PATTERN_ID = "screen-shell";
const DEFAULT_ORGANISM_PREFIX = "ogn-";

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
	const organismPrefix = options.organismPrefix ?? DEFAULT_ORGANISM_PREFIX;
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

	const organisms = decorated.organisms.map((organism) =>
		toOrganismRow(organism, {
			author,
			componentVersion,
			organismPrefix,
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
		organisms,
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
		theme: { mode: ctx.themeMode },
		screen: {
			type: "page",
			regions: {
				header: {
					type: "Screen.Header",
					metadata: { title: "고정 상단 영역" },
					children: toRegionChildren(screen.children.header),
				},
				contents: {
					type: "Screen.Contents",
					metadata: { title: "스크롤 콘텐츠 영역" },
					children: toRegionChildren(screen.children.contents),
				},
				bottom: {
					type: "Screen.Bottom",
					metadata: { title: "고정 하단 영역" },
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
		kind: "organism",
		id: ref.organismId,
	}));
}

interface OrganismRowContext {
	author: string;
	componentVersion: string;
	organismPrefix: string;
	timestamp: string;
}

function toOrganismRow(
	organism: DecoratedOrganismNode,
	ctx: OrganismRowContext,
): DatabaseOrganismRow {
	return {
		id: organism.id,
		type: "Organism",
		version: ctx.componentVersion,
		metadata: {
			title: organism.name ?? organism.id,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		props: { name: organism.name ?? organism.id },
		pattern: {
			id: organism.pattern.id ?? derivePatternId(organism.id, ctx.organismPrefix),
			variant: organism.pattern.variant,
		},
		children: [...(organism.children ?? [])]
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.map((ref) => ({ kind: "composite" as const, id: ref.componentId })),
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
	const type = normalizeContentComponentType(component.type || "Generic");
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

function normalizeContentComponentType(type: string): string {
	if (type.toLowerCase() === "action-area") return "button";
	return type;
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

function derivePatternId(organismId: string, organismPrefix: string): string {
	let remainder = organismId;
	if (remainder.startsWith(organismPrefix)) {
		remainder = remainder.slice(organismPrefix.length);
	}
	const firstDash = remainder.indexOf("-");
	if (firstDash <= 0) return remainder;
	const head = remainder.slice(0, firstDash);
	if (/^[a-z]{2,4}$/.test(head)) {
		return remainder.slice(firstDash + 1);
	}
	return remainder;
}
