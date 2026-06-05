import { loadPatternStore } from "@cx/agent/pattern-store";
import {
	buildAreaCatalog,
	tablesToRenderTrees,
	validateSampleScreenSource,
	type SampleComposite,
	type SampleArea,
	type SampleRenderEntry,
	type SampleScreen,
	type SampleScreenRegion,
	type SampleScreenRoute,
	type SampleScreenRouteSet,
	type SampleScreenVariant,
} from "@/adapters/tables-to-render-tree";
import type { PropValue } from "@cx/types/database-tables";
import { isAreaType } from "@cx/types/node-types";
import { createServerClient } from "@/lib/supabase/server";
import { validateRenderTreeFull } from "@cx/renderer";
import type { RenderTreeNode, RenderTree } from "@cx/renderer";

function toISOFallback(date: string | null | undefined) {
	return date ?? new Date(0).toISOString();
}

/**
 * render_* (정규화된 관계 스키마, schema B)에서 워크벤치 데이터를 로드한다.
 *
 * 데이터 소스만 옛 screens/organisms/components(JSON blob 구조)에서 render_*로 바뀌었을 뿐,
 * junction 테이블을 다시 펼쳐 기존 Sample* 모양으로 재조립한 뒤 동일한
 * tablesToRenderTrees / buildAreaCatalog 파이프라인에 투입한다 → store/puck/renderer 무수정.
 */

// ── render_* row 타입 (필요한 컬럼만) ──────────────────────────
type RenderScreenRow = {
	id: string;
	screen_variant_id: string | null;
	version: string;
	type: string;
	order_index: number | null;
	name: string | null;
	description: string | null;
	author: string | null;
	created_at?: string | null;
	updated_at?: string | null;
};
type RenderScreenRegionRow = {
	id: string;
	screen_id: string;
	type: "header" | "contents" | "bottom";
};
type RenderScreenRegionChildRow = {
	screen_region_id: string;
	area_id: string;
	order_index: number | null;
};
type RenderAreaRow = {
	id: string;
	type: string;
	version: string;
	name: string | null;
	description: string | null;
	author: string | null;
	props: Record<string, PropValue> | null;
	created_at?: string | null;
	updated_at?: string | null;
};
type RenderAreaChildRow = {
	area_id: string;
	component_id: string;
	order_index: number | null;
};
type RenderComponentRow = {
	id: string;
	type: string;
	version: string;
	name: string | null;
	description: string | null;
	author: string | null;
	events?: Record<string, unknown> | null;
	created_at?: string | null;
	updated_at?: string | null;
};
type RenderComponentChildRow = {
	component_id: string;
	order_index: number | null;
	catalog_component_type: string | null;
	variant: string | null;
	props: Record<string, PropValue> | null;
};
type RenderScreenRouteRow = {
	id: string;
	module_id: string | null;
	name: string;
	order_index: number;
	process_id: string | null;
};
type RenderScreenVariantRow = {
	id: string;
	name: string;
	order_index: number;
	screen_route_id: string;
	type: string | null;
};

const REGION_NODE_TYPE: Record<RenderScreenRegionRow["type"], SampleScreenRegion["type"]> = {
	header: "Screen.Header",
	contents: "Screen.Contents",
	bottom: "Screen.Bottom",
};

// render_* 는 area 타입을 언더스코어(area_static)로 저장한다. revert 어휘는 점(area.static).
function normalizeAreaType(type: string): SampleArea["type"] {
	return (type.startsWith("area_") ? `area.${type.slice("area_".length)}` : type) as SampleArea["type"];
}

function byOrder<T extends { order_index: number | null }>(a: T, b: T) {
	return (a.order_index ?? Number.MAX_SAFE_INTEGER) - (b.order_index ?? Number.MAX_SAFE_INTEGER);
}

export async function loadDbWorkbenchData() {
	const db = createServerClient();

	// ── 병렬 fetch (render_* + 공유 테이블 screen_modules) ─────────
	const [
		{ data: moduleRows },
		{ data: routeRows },
		{ data: variantRows },
		{ data: screenRows },
		{ data: regionRows },
		{ data: regionChildRows },
		{ data: areaRows },
		{ data: areaChildRows },
		{ data: componentRows },
		{ data: componentChildRows },
	] = await Promise.all([
		db.from("screen_modules").select("*").order("order"),
		db.from("render_screen_routes").select("*").order("order_index"),
		db.from("render_screen_variants").select("*").order("order_index"),
		db.from("render_screens").select("*").order("order_index"),
		db.from("render_screen_regions").select("*"),
		db.from("render_screen_region_children").select("*"),
		db.from("render_areas").select("*"),
		db.from("render_area_children").select("*"),
		db.from("render_components").select("*"),
		db.from("render_component_children").select("*"),
	]);

	// ── 인덱스 구성 ────────────────────────────────────────────
	const regionChildrenByRegionId = new Map<string, RenderScreenRegionChildRow[]>();
	for (const child of (regionChildRows ?? []) as RenderScreenRegionChildRow[]) {
		const list = regionChildrenByRegionId.get(child.screen_region_id) ?? [];
		list.push(child);
		regionChildrenByRegionId.set(child.screen_region_id, list);
	}
	const regionsByScreenId = new Map<string, RenderScreenRegionRow[]>();
	for (const region of (regionRows ?? []) as RenderScreenRegionRow[]) {
		const list = regionsByScreenId.get(region.screen_id) ?? [];
		list.push(region);
		regionsByScreenId.set(region.screen_id, list);
	}
	const areaChildrenByAreaId = new Map<string, RenderAreaChildRow[]>();
	for (const child of (areaChildRows ?? []) as RenderAreaChildRow[]) {
		const list = areaChildrenByAreaId.get(child.area_id) ?? [];
		list.push(child);
		areaChildrenByAreaId.set(child.area_id, list);
	}
	const componentChildrenByComponentId = new Map<string, RenderComponentChildRow[]>();
	for (const child of (componentChildRows ?? []) as RenderComponentChildRow[]) {
		const list = componentChildrenByComponentId.get(child.component_id) ?? [];
		list.push(child);
		componentChildrenByComponentId.set(child.component_id, list);
	}

	// ── render_* → Sample* 재조립 ──────────────────────────────
	const screenModules = (moduleRows ?? []).map((r) => ({ id: r.id, name: r.name, order: r.order }));
	const moduleNameById = new Map(screenModules.map((m) => [m.id, m.name]));

	const screenRoutes: SampleScreenRoute[] = ((routeRows ?? []) as RenderScreenRouteRow[]).map((r) => ({
		id: r.id,
		moduleId: r.module_id ?? "unknown",
		name: r.name,
		order: r.order_index,
		processId: r.process_id,
	}));

	const screenVariants: SampleScreenVariant[] = ((variantRows ?? []) as RenderScreenVariantRow[]).map((r) => ({
		id: r.id,
		screenRouteId: r.screen_route_id,
		name: r.name,
		order: r.order_index,
		variantType: (r.type === "edge" ? "edge" : "base") as "base" | "edge",
	}));

	function buildRegion(
		screenId: string,
		region: RenderScreenRegionRow | undefined,
		regionType: RenderScreenRegionRow["type"],
	): SampleScreenRegion {
		const children: SampleRenderEntry[] = region
			? [...(regionChildrenByRegionId.get(region.id) ?? [])]
					.sort(byOrder)
					.map((c) => ({ kind: "area" as const, id: c.area_id }))
			: [];
		return {
			type: REGION_NODE_TYPE[regionType],
			metadata: { title: "" },
			children,
		};
	}

	const screens: SampleScreen[] = ((screenRows ?? []) as RenderScreenRow[]).map((r) => {
		const regions = regionsByScreenId.get(r.id) ?? [];
		const headerRow = regions.find((x) => x.type === "header");
		const contentsRow = regions.find((x) => x.type === "contents");
		const bottomRow = regions.find((x) => x.type === "bottom");
		return {
			id: r.id,
			order: r.order_index ?? undefined,
			screenVariantId: r.screen_variant_id ?? undefined,
			version: r.version,
			minRendererVersion: r.version,
			metadata: {
				title: r.name ?? "",
				author: r.author ?? "",
				createdAt: toISOFallback(r.created_at),
				updatedAt: toISOFallback(r.updated_at),
				description: r.description ?? undefined,
			},
			theme: { mode: "light" },
			screen: {
				type: (r.type ?? "page") as SampleScreen["screen"]["type"],
				regions: {
					header: buildRegion(r.id, headerRow, "header"),
					contents: buildRegion(r.id, contentsRow, "contents"),
					bottom: buildRegion(r.id, bottomRow, "bottom"),
				},
			},
		};
	});

	const areas: SampleArea[] = ((areaRows ?? []) as RenderAreaRow[]).map((r) => ({
		id: r.id,
		type: normalizeAreaType(r.type),
		version: r.version,
		metadata: {
			title: r.name ?? "",
			author: r.author ?? "",
			createdAt: toISOFallback(r.created_at),
			updatedAt: toISOFallback(r.updated_at),
			description: r.description ?? undefined,
		},
		props: r.props ?? undefined,
		children: [...(areaChildrenByAreaId.get(r.id) ?? [])]
			.sort(byOrder)
			.map((c) => ({ kind: "component" as const, id: c.component_id })),
	}));

	const composites: SampleComposite[] = ((componentRows ?? []) as RenderComponentRow[]).map((r) => ({
		id: r.id,
		type: r.type,
		version: r.version,
		metadata: {
			title: r.name ?? "",
			author: r.author ?? "",
			createdAt: toISOFallback(r.created_at),
			updatedAt: toISOFallback(r.updated_at),
			description: r.description ?? undefined,
		},
		children: [...(componentChildrenByComponentId.get(r.id) ?? [])].sort(byOrder).map((c) => ({
			component: { type: c.catalog_component_type ?? undefined, variant: c.variant ?? undefined },
			props: (c.props ?? {}) as Record<string, PropValue>,
		})),
		events: (r.events as Record<string, unknown>) ?? undefined,
	}));

	// ── 기존 처리 파이프라인 (무수정) ──────────────────────────
	const routeOrderById = new Map(screenRoutes.map((r) => [r.id, r.order]));
	const variantById = new Map(screenVariants.map((v) => [v.id, v]));

	const orderedScreens = [...screens].sort((a, b) => {
		const av = a.screenVariantId ? variantById.get(a.screenVariantId) : undefined;
		const bv = b.screenVariantId ? variantById.get(b.screenVariantId) : undefined;
		const ao = av ? (routeOrderById.get(av.screenRouteId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
		const bo = bv ? (routeOrderById.get(bv.screenRouteId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
		return (
			ao - bo ||
			(av?.order ?? Number.MAX_SAFE_INTEGER) - (bv?.order ?? Number.MAX_SAFE_INTEGER) ||
			(a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
			(a.id ?? "").localeCompare(b.id ?? "")
		);
	});

	const sampleScreens = tablesToRenderTrees({
		screens: orderedScreens,
		areas,
		composites,
		patternStore: loadPatternStore(),
	});

	const routeSet: SampleScreenRouteSet = { screenRoutes };

	const processedScreens = sampleScreens.map((schema, index) => {
		const raw = orderedScreens[index];
		const validation = validateRenderTreeFull(schema);
		const variant = raw.screenVariantId ? variantById.get(raw.screenVariantId) : undefined;
		const route = variant ? routeSet.screenRoutes.find((r) => r.id === variant.screenRouteId) : undefined;
		const screenAreas = extractAreas(schema);

		return {
			code: schema.metadata.id,
			name: schema.metadata.title,
			description: schema.metadata.description ?? schema.children[0]?.metadata.title,
			moduleId: route?.moduleId ?? "unknown",
			module: moduleNameById.get(route?.moduleId ?? "") ?? route?.moduleId ?? schema.metadata.id.split("-")[1]?.toLowerCase() ?? "unknown",
			areas: screenAreas,
			screenOrder: raw.order ?? index + 1,
			screenRouteId: route?.id ?? "unknown-route",
			screenRouteName: route?.name ?? "Unknown route",
			schema,
			screenVariantId: variant?.id ?? raw.screenVariantId ?? schema.metadata.id,
			screenVariantName: variant?.name ?? schema.metadata.title,
			screenVariantOrder: variant?.order ?? raw.order ?? index + 1,
			screenVariantType: (variant?.variantType ?? "base") as "base" | "edge",
			sourceValidationErrors: validateSampleScreenSource(raw),
			validationStats: validation.stats,
			warnings: [],
		};
	});

	const areaCatalog = buildAreaCatalog({ areas, composites, patternStore: loadPatternStore() });

	return {
		modules: screenModules,
		routes: screenRoutes,
		screens: processedScreens,
		areas: areaCatalog,
	};
}

// ── 헬퍼 ───────────────────────────────────────────────────
function extractAreas(schema: RenderTree) {
	const result: Array<{ order: number; areaCode: string }> = [];
	forEachNode(schema.children, (node) => {
		if (!isAreaType(node.type)) return;
		result.push({ order: result.length + 1, areaCode: String(node.props?.areaCode ?? node.metadata.id) });
	});
	return result;
}

function forEachNode(nodes: RenderTreeNode[], cb: (n: RenderTreeNode) => void) {
	for (const n of nodes) {
		cb(n);
		if (n.children) forEachNode(n.children, cb);
	}
}
