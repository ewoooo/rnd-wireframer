import {
	type RenderTree,
	type RenderTreeNode,
	type RenderTreeTableAreaRow,
	type RenderTreeTableComponentRow,
	type RenderTreeTableScreenRow,
	tablesToRenderTrees,
} from "@cx/renderer";
import {
	type AppArea,
	type AppComponent,
	type DatabaseScreenRouteSet,
	type DatabaseScreenVariantSet,
} from "@/adapters/tables-to-render-tree";
import { loadPatternStoreForWorkbench } from "@/data/pattern-store-loader";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type RouteRow = Database["public"]["Tables"]["screen_routes"]["Row"];
type VariantRow = Database["public"]["Tables"]["screen_variants"]["Row"];
type ScreenRow = Database["public"]["Tables"]["screens"]["Row"];
type AreaRow = Database["public"]["Tables"]["organisms"]["Row"];
type ComponentRow = Database["public"]["Tables"]["components"]["Row"];

function toISOFallback(date: string | null | undefined) {
	return date ?? new Date(0).toISOString();
}

// Supabase seed uses "organism"/"composite", main types use "area"/"component"
function normalizeRegionChildren(
	children: Array<{ kind: string; id: string }>,
): Array<{ kind: "area" | "component"; id: string }> {
	return children.map((c) => ({
		id: c.id,
		kind: c.kind === "organism" ? "area" : c.kind === "composite" ? "component" : (c.kind as "area" | "component"),
	}));
}

export async function loadDbWorkbenchData() {
	const db = createServerClient();

	const [
		{ data: routeRows },
		{ data: variantRows },
		{ data: screenRows },
		{ data: areaRows },
		{ data: componentRows },
	] = await Promise.all([
		db.from("screen_routes").select("*").order("order") as unknown as Promise<{ data: RouteRow[] | null }>,
		db.from("screen_variants").select("*").order("order") as unknown as Promise<{ data: VariantRow[] | null }>,
		db.from("screens").select("*").order("order") as unknown as Promise<{ data: ScreenRow[] | null }>,
		db.from("organisms").select("*") as unknown as Promise<{ data: AreaRow[] | null }>,
		db.from("components").select("*") as unknown as Promise<{ data: ComponentRow[] | null }>,
	]);

	// ── DB rows → main 타입 ─────────────────────────────────────

	const screenRouteSet: DatabaseScreenRouteSet = {
		screenRoutes: (routeRows ?? []).map((r) => ({
			id: r.id,
			moduleId: r.module_id,
			name: r.name,
			order: r.order,
			processId: r.process_id,
		})),
	};

	const screenVariantSet: DatabaseScreenVariantSet = {
		screenVariants: (variantRows ?? []).map((r) => ({
			id: r.id,
			screenRouteId: r.screen_route_id,
			name: r.name,
			order: r.order,
			variantType: r.variant_type as "base" | "edge",
			followUp: r.follow_up,
		})),
	};

	const areas: RenderTreeTableAreaRow[] = (areaRows ?? []).map((r) => ({
		id: r.id,
		// Supabase organisms use "Organism" type; map to valid area type
		type: "area.static" as const,
		version: r.version ?? "1.0.0",
		metadata: {
			title: r.title ?? r.id,
			author: r.author ?? "",
			createdAt: toISOFallback(r.created_at),
			updatedAt: toISOFallback(r.updated_at),
		},
		pattern: r.pattern_id ? { id: r.pattern_id, variant: r.pattern_variant ?? undefined } : undefined,
		props: (r.props as RenderTreeTableAreaRow["props"]) ?? undefined,
		children: normalizeRegionChildren(
			(r.children as Array<{ kind: string; id: string }>) ?? [],
		) as Array<{ kind: "component"; id: string }>,
	}));

	const components: RenderTreeTableComponentRow[] = (componentRows ?? []).map((r) => ({
		id: r.id,
		type: r.type,
		version: r.version ?? "1.0.0",
		metadata: {
			title: r.title ?? r.id,
			author: r.author ?? "",
			createdAt: toISOFallback(r.created_at),
			updatedAt: toISOFallback(r.updated_at),
		},
		pattern: { id: r.pattern_id ?? "unknown", variant: r.pattern_variant ?? undefined },
		children: (r.children as RenderTreeTableComponentRow["children"]) ?? [],
	}));

	const screens: RenderTreeTableScreenRow[] = (screenRows ?? []).map((r) => {
		const rawBody = r.screen as {
			type: string;
			regions: Record<string, { type: string; metadata: unknown; children: Array<{ kind: string; id: string }> }>;
		};
		return {
			id: r.id,
			version: r.version ?? "1.0.0",
			minRendererVersion: r.min_renderer_version ?? "0.1.0",
			screenVariantId: r.screen_variant_id,
			order: r.order,
			metadata: {
				title: r.title ?? r.id,
				author: r.author ?? "",
				createdAt: toISOFallback(r.created_at),
				updatedAt: toISOFallback(r.updated_at),
			},
			pattern: r.pattern_id ? { id: r.pattern_id, variant: r.pattern_variant ?? undefined } : undefined,
			theme: { mode: (r.theme_mode ?? "light") as "light" | "dark" },
			screen: {
				type: (rawBody.type === "page" ? "screen.page" : rawBody.type) as "screen.page",
				regions: {
					header: {
						...rawBody.regions.header,
						type: rawBody.regions.header?.type as "Screen.Header",
						children: normalizeRegionChildren(rawBody.regions.header?.children ?? []),
					},
					contents: {
						...rawBody.regions.contents,
						type: rawBody.regions.contents?.type as "Screen.Contents",
						children: normalizeRegionChildren(rawBody.regions.contents?.children ?? []),
					},
					bottom: {
						...rawBody.regions.bottom,
						type: rawBody.regions.bottom?.type as "Screen.Bottom",
						children: normalizeRegionChildren(rawBody.regions.bottom?.children ?? []),
					},
				},
			},
		} as RenderTreeTableScreenRow;
	});

	// ── 정렬 ────────────────────────────────────────────────────
	const routeOrderById = new Map(screenRouteSet.screenRoutes.map((r) => [r.id, r.order]));
	const variantById = new Map(screenVariantSet.screenVariants.map((v) => [v.id, v]));

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

	// ── render tree 생성 ─────────────────────────────────────────
	const patternStore = loadPatternStoreForWorkbench();
	const renderTrees = tablesToRenderTrees({ screens: orderedScreens, areas, components, patternStore });

	// ── AppScreen[] 빌드 ─────────────────────────────────────────
	const processedScreens = renderTrees.map((tree, index) => {
		const raw = orderedScreens[index];
		const variant = raw.screenVariantId ? variantById.get(raw.screenVariantId) : undefined;
		const route = variant
			? screenRouteSet.screenRoutes.find((r) => r.id === variant.screenRouteId)
			: undefined;

		return {
			code: tree.metadata.id,
			name: tree.metadata.title,
			description: tree.metadata.description ?? tree.children[0]?.metadata.title,
			module: route?.moduleId ?? tree.metadata.id.split("-")[1]?.toLowerCase() ?? "unknown",
			areas: extractAreas(tree),
			screenOrder: raw.order ?? index + 1,
			screenRouteId: route?.id ?? "unknown-route",
			screenRouteName: route?.name ?? "Unknown route",
			screenVariantId: variant?.id ?? raw.screenVariantId ?? tree.metadata.id,
			screenVariantName: variant?.name ?? tree.metadata.title,
			screenVariantOrder: variant?.order ?? raw.order ?? index + 1,
			screenVariantType: (variant?.variantType ?? "base") as "base" | "edge",
			sourceValidationErrors: [] as string[],
			warnings: [] as string[],
		};
	});

	// ── Area / Component 카탈로그 ────────────────────────────────
	const areaCatalog = getAreaCatalog(renderTrees);
	const componentCatalog = getComponentCatalog(renderTrees);

	return {
		screens: processedScreens,
		areas: areaCatalog,
		components: componentCatalog,
	};
}

function extractAreas(tree: RenderTree) {
	const result: Array<{ order: number; areaCode: string }> = [];
	forEachNode(tree.children, (node) => {
		if (!isAreaNode(node)) return;
		result.push({ order: result.length + 1, areaCode: node.metadata.id });
	});
	return result;
}

function getAreaCatalog(trees: RenderTree[]): AppArea[] {
	const byCode = new Map<string, AppArea>();
	for (const tree of trees) {
		forEachNode(tree.children, (node) => {
			if (!isAreaNode(node)) return;
			const code = node.metadata.id;
			byCode.set(code, {
				code,
				name: node.metadata.title,
				usage: "section",
				stateCount: 1,
				componentCount: node.children?.length ?? 0,
			});
		});
	}
	return Array.from(byCode.values());
}

function getComponentCatalog(trees: RenderTree[]): AppComponent[] {
	const byCode = new Map<string, AppComponent>();
	for (const tree of trees) {
		let currentAreaCode: string | undefined;
		forEachNode(tree.children, (node) => {
			if (isAreaNode(node)) { currentAreaCode = node.metadata.id; return; }
			if (byCode.has(node.metadata.id)) return;
			if (isAreaNode(node) || isSystemNode(node)) return;
			byCode.set(node.metadata.id, {
				code: node.metadata.id,
				name: node.metadata.title,
				parentAreaCode: currentAreaCode,
				sourceScreenCode: tree.metadata.id,
				type: node.type,
			});
		});
	}
	return Array.from(byCode.values());
}

function isAreaNode(node: RenderTreeNode) {
	return node.type === "area.static" || node.type === "area.dynamic";
}

function isSystemNode(node: RenderTreeNode) {
	return node.type.startsWith("Screen") || node.type.startsWith("screen.");
}

function forEachNode(nodes: RenderTreeNode[], cb: (n: RenderTreeNode) => void) {
	for (const n of nodes) {
		cb(n);
		if (n.children) forEachNode(n.children, cb);
	}
}
