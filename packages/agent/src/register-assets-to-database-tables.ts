import { findPattern, isCompositePattern, isScreenPattern } from "./pattern-store";
import { registerAssets } from "./register-assets";
import type {
	AssetRegistry,
	DecoratedAssetRegistry,
	RegisterAssetsInput,
	RegisteredComponentAsset,
	RegisteredOrganismAsset,
	RegisteredScreenAsset,
	RegisteredScreenRouteAsset,
	RegisteredScreenVariantAsset,
} from "./types";

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

export interface DatabaseAssetMetadata {
	id: string;
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
}

export type DatabaseRegionChild =
	| { kind: "composite"; id: string }
	| { kind: "organism"; id: string };

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
	events: Record<string, unknown>;
}

export interface DatabaseTables {
	screenRoutes: DatabaseScreenRouteRow[];
	screenVariants: DatabaseScreenVariantRow[];
	screens: DatabaseScreenRow[];
	organisms: DatabaseOrganismRow[];
	components: DatabaseComponentRow[];
	warnings: string[];
}

export interface DatabaseTablesOptions {
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
const DEFAULT_PENDING_PATTERN_ID = "__pending__";
const DEFAULT_ORGANISM_PREFIX = "ogn-";

export function registerAssetsToDatabaseTables(
	input: RegisterAssetsInput,
	options: DatabaseTablesOptions = {},
): DatabaseTables {
	return buildDatabaseTables(registerAssets(input), options);
}

export function decoratedAssetsToDatabaseTables(
	decorated: DecoratedAssetRegistry,
	options: DatabaseTablesOptions = {},
): DatabaseTables {
	const overrides: PatternIdOverrides = {
		screenPatternByScreenId: new Map(),
		organismPatternById: new Map(),
	};
	for (const org of decorated.organisms) {
		overrides.organismPatternById.set(org.asset.id, org.decoration.patternId);
	}
	for (const route of decorated.routes) {
		for (const variant of route.asset.variants) {
			for (const screen of variant.asset.screens) {
				overrides.screenPatternByScreenId.set(screen.asset.id, screen.decoration.patternId);
			}
		}
	}
	const tables = buildDatabaseTables(unwrapDecorated(decorated), options, overrides);
	const timestamp = options.now?.() ?? new Date().toISOString();
	applyStructuralPatterns(tables, timestamp);
	validateExpects(tables, overrides);
	return tables;
}

function applyStructuralPatterns(tables: DatabaseTables, timestamp: string): void {
	const componentsById = new Map(tables.components.map((c) => [c.id, c]));
	for (const screen of tables.screens) {
		const screenPattern = findPattern(screen.pattern.id, "screen");
		if (!screenPattern || !isScreenPattern(screenPattern)) continue;
		const chrome = screenPattern.chrome;
		if (!chrome) continue;
		applyChromeSlot(screen.screen.regions.header, chrome.header, tables, componentsById, timestamp);
		applyChromeSlot(screen.screen.regions.bottom, chrome.bottom, tables, componentsById, timestamp);
	}
}

function applyChromeSlot(
	region: DatabaseScreenRegion,
	slots: ReadonlyArray<{ compositePattern: string }> | undefined,
	tables: DatabaseTables,
	componentsById: Map<string, DatabaseComponentRow>,
	timestamp: string,
): void {
	if (!slots || slots.length === 0) return;
	region.children = slots.map((slot) => ({
		kind: "composite" as const,
		id: slot.compositePattern,
	}));
	for (const slot of slots) {
		ensureCompositeFromPattern(tables, componentsById, slot.compositePattern, timestamp);
	}
}

function ensureCompositeFromPattern(
	tables: DatabaseTables,
	componentsById: Map<string, DatabaseComponentRow>,
	patternId: string,
	timestamp: string,
): void {
	if (componentsById.has(patternId)) return;
	const pattern = findPattern(patternId, "composite");
	if (!pattern || !isCompositePattern(pattern)) return;
	const variant = pattern.variants[pattern.defaultVariant];
	if (!variant) return;
	const type = variant.type ?? "Generic";
	const row: DatabaseComponentRow = {
		id: pattern.id,
		type,
		version: DEFAULT_COMPONENT_VERSION,
		metadata: {
			title: pattern.name,
			author: "system",
			createdAt: timestamp,
			updatedAt: timestamp,
		},
		pattern: { id: pattern.id, variant: pattern.defaultVariant },
		children: [
			{
				component: { type },
				props: { ...(variant.props ?? {}) } as Record<string, unknown>,
			},
		],
		events: {},
	};
	tables.components.push(row);
	componentsById.set(row.id, row);
}

function validateExpects(tables: DatabaseTables, overrides: PatternIdOverrides): void {
	for (const screen of tables.screens) {
		const screenPattern = findPattern(screen.pattern.id, "screen");
		if (!screenPattern || !isScreenPattern(screenPattern)) continue;
		const allowed = screenPattern.expects?.contents?.organismPatterns;
		if (!allowed || allowed.length === 0) continue;
		for (const child of screen.screen.regions.contents.children) {
			if (child.kind !== "organism") continue;
			const orgPattern = overrides.organismPatternById.get(child.id);
			if (!orgPattern) continue;
			if (!allowed.includes(orgPattern)) {
				tables.warnings.push(
					`screen ${screen.id} (${screen.pattern.id}): organism ${child.id} pattern '${orgPattern}' is not in expects.contents.organismPatterns (${allowed.join(", ")})`,
				);
			}
		}
	}
}

interface PatternIdOverrides {
	screenPatternByScreenId: Map<string, string>;
	organismPatternById: Map<string, string>;
}

function buildDatabaseTables(
	registry: AssetRegistry,
	options: DatabaseTablesOptions,
	overrides?: PatternIdOverrides,
): DatabaseTables {
	const author = options.author ?? DEFAULT_AUTHOR;
	const componentVersion = options.componentVersion ?? DEFAULT_COMPONENT_VERSION;
	const version = options.version ?? DEFAULT_VERSION;
	const minRendererVersion = options.minRendererVersion ?? DEFAULT_MIN_RENDERER_VERSION;
	const themeMode = options.themeMode ?? DEFAULT_THEME_MODE;
	const pendingPatternId = options.pendingPatternId ?? DEFAULT_PENDING_PATTERN_ID;
	const organismPrefix = options.organismPrefix ?? DEFAULT_ORGANISM_PREFIX;
	const now = options.now ?? (() => new Date().toISOString());
	const timestamp = now();

	const screenRoutes = registry.routes.map((route) => toRouteRow(route));
	const screenVariants = registry.routes.flatMap((route) =>
		route.variants.map((variant) => toVariantRow(route, variant)),
	);
	const screens = registry.routes.flatMap((route) =>
		route.variants.flatMap((variant) =>
			variant.screens.map((screen) =>
				toScreenRow(variant, screen, {
					author,
					componentVersion,
					minRendererVersion,
					themeMode,
					version,
					pendingPatternId,
					patternId: overrides?.screenPatternByScreenId.get(screen.id),
					timestamp,
				}),
			),
		),
	);
	const organisms = registry.organisms.map((organism) =>
		toOrganismRow(organism, {
			author,
			componentVersion,
			organismPrefix,
			patternId: overrides?.organismPatternById.get(organism.id),
			timestamp,
		}),
	);
	const components = registry.components.map((component) =>
		toComponentRow(component, { author, componentVersion, timestamp }),
	);

	return {
		screenRoutes,
		screenVariants,
		screens,
		organisms,
		components,
		warnings: [...registry.warnings],
	};
}

function unwrapDecorated(decorated: DecoratedAssetRegistry): AssetRegistry {
	return {
		routes: decorated.routes.map((route) => ({
			...route.asset,
			variants: route.asset.variants.map((variant) => ({
				...variant.asset,
				screens: variant.asset.screens.map((screen) => ({
					...screen.asset,
					organisms: screen.asset.organisms.map((ref) => ({
						organismId: ref.organismId,
						order: ref.order,
					})),
				})),
			})),
		})) as unknown as AssetRegistry["routes"],
		organisms: decorated.organisms.map((organism) => ({
			...organism.asset,
			components: organism.asset.components.map((ref) => ({
				componentId: ref.componentId,
				order: ref.order,
			})),
		})) as unknown as AssetRegistry["organisms"],
		components: decorated.components.map((component) => component.asset),
		warnings: [...decorated.warnings],
	};
}

function toRouteRow(route: RegisteredScreenRouteAsset): DatabaseScreenRouteRow {
	return {
		id: slugify(route.id),
		moduleId: deriveModule(route.id),
		name: route.name,
		order: route.order,
		processId: null,
	};
}

function toVariantRow(
	route: RegisteredScreenRouteAsset,
	variant: RegisteredScreenVariantAsset,
): DatabaseScreenVariantRow {
	return {
		id: slugify(variant.id),
		screenRouteId: slugify(route.id),
		name: variant.name,
		order: variant.order,
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
	patternId?: string;
	timestamp: string;
}

function toScreenRow(
	variant: RegisteredScreenVariantAsset,
	screen: RegisteredScreenAsset,
	ctx: ScreenRowContext,
): DatabaseScreenRow {
	const contentsChildren: DatabaseRegionChild[] = screen.organisms.map((ref) => ({
		kind: "organism",
		id: ref.organismId,
	}));

	return {
		id: screen.id,
		screenVariantId: slugify(variant.id),
		minRendererVersion: ctx.minRendererVersion,
		version: ctx.version,
		order: screen.order,
		pattern: { id: ctx.patternId ?? ctx.pendingPatternId, variant: "default" },
		metadata: {
			title: screen.name,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		theme: { mode: ctx.themeMode },
		screen: {
			type: "page",
			regions: {
				header: emptyRegion("Screen.Header", "고정 상단 영역"),
				contents: {
					type: "Screen.Contents",
					metadata: { title: "스크롤 콘텐츠 영역" },
					children: contentsChildren,
				},
				bottom: emptyRegion("Screen.Bottom", "고정 하단 영역"),
			},
		},
	};
}

function emptyRegion(type: string, title: string): DatabaseScreenRegion {
	return {
		type,
		metadata: { title },
		children: [],
	};
}

interface OrganismRowContext {
	author: string;
	componentVersion: string;
	organismPrefix: string;
	patternId?: string;
	timestamp: string;
}

function toOrganismRow(
	organism: RegisteredOrganismAsset,
	ctx: OrganismRowContext,
): DatabaseOrganismRow {
	return {
		id: organism.id,
		type: "Organism",
		version: ctx.componentVersion,
		metadata: {
			title: organism.name,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		props: { name: organism.name },
		pattern: {
			id: ctx.patternId ?? derivePatternId(organism.id, ctx.organismPrefix),
			variant: "default",
		},
		children: [...organism.components]
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
	component: RegisteredComponentAsset,
	ctx: ComponentRowContext,
): DatabaseComponentRow {
	const type = normalizeContentComponentType(component.type || "Generic");
	return {
		id: component.id,
		type,
		version: ctx.componentVersion,
		metadata: {
			title: component.name,
			author: ctx.author,
			createdAt: ctx.timestamp,
			updatedAt: ctx.timestamp,
		},
		pattern: { id: "default", variant: "default" },
		children: [{ component: { type }, props: { ...component.props } }],
		events: {},
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
