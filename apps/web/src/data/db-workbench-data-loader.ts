import { loadPatternStore } from "@cx/agent/pattern-store";
import { registerWireframeNodeKinds, type WireframeNodeKind } from "@cx/renderer";
import {
	tablesToRenderTrees,
	validateSampleScreenSource,
	type SampleComposite,
	type SampleOrganism,
	type SampleScreen,
	type SampleScreenRoute,
	type SampleScreenRouteSet,
	type SampleScreenVariant,
	type SampleScreenVariantSet,
} from "@/adapters/tables-to-render-tree";
import { createServerClient } from "@/lib/supabase/server";
import { validateWireframeSchemaFull } from "@cx/renderer";

function toISOFallback(date: string | null | undefined) {
	return date ?? new Date(0).toISOString();
}

export async function loadDbWorkbenchData() {
	const db = createServerClient();

	// ── 병렬 fetch ─────────────────────────────────────────────
	const [
		{ data: routeRows },
		{ data: variantRows },
		{ data: screenRows },
		{ data: organismRows },
		{ data: componentRows },
		{ data: kindRows },
	] = await Promise.all([
		db.from("screen_routes").select("*").order("order"),
		db.from("screen_variants").select("*").order("order"),
		db.from("screens").select("*").order("order"),
		db.from("organisms").select("*"),
		db.from("components").select("*"),
		db.from("component_renderer_kinds").select("*"),
	]);

	// ── renderer kind 등록 ─────────────────────────────────────
	if (kindRows?.length) {
		registerWireframeNodeKinds(
			kindRows.map((r) => ({ type: r.type, kind: r.kind as WireframeNodeKind })),
		);
	}

	// ── DB row → Sample* 타입 변환 ─────────────────────────────
	const screenRoutes: SampleScreenRoute[] = (routeRows ?? []).map((r) => ({
		id: r.id,
		moduleId: r.module_id,
		name: r.name,
		order: r.order,
		processId: r.process_id,
	}));

	const screenVariants: SampleScreenVariant[] = (variantRows ?? []).map((r) => ({
		id: r.id,
		screenRouteId: r.screen_route_id,
		name: r.name,
		order: r.order,
		variantType: r.variant_type as "base" | "edge",
		followUp: r.follow_up,
	}));

	const screens: SampleScreen[] = (screenRows ?? []).map((r) => ({
		id: r.id,
		order: r.order,
		screenVariantId: r.screen_variant_id,
		version: r.version,
		minRendererVersion: r.min_renderer_version,
		metadata: {
			title: r.title ?? "",
			author: r.author ?? "",
			createdAt: toISOFallback(r.created_at),
			updatedAt: toISOFallback(r.updated_at),
		},
		pattern: r.pattern_id ? { id: r.pattern_id, variant: r.pattern_variant ?? undefined } : undefined,
		theme: { mode: (r.theme_mode ?? "light") as "light" | "dark" },
		screen: r.screen as SampleScreen["screen"],
	}));

	const organisms: SampleOrganism[] = (organismRows ?? []).map((r) => ({
		id: r.id,
		type: "Organism" as const,
		version: r.version,
		metadata: {
			title: r.title ?? "",
			author: r.author ?? "",
			createdAt: toISOFallback(r.created_at),
			updatedAt: toISOFallback(r.updated_at),
		},
		pattern: r.pattern_id ? { id: r.pattern_id, variant: r.pattern_variant ?? undefined } : undefined,
		props: (r.props as Record<string, unknown>) ?? undefined,
		children: (r.children as SampleOrganism["children"]) ?? [],
	}));

	const composites: SampleComposite[] = (componentRows ?? []).map((r) => ({
		id: r.id,
		type: r.type,
		version: r.version,
		metadata: {
			title: r.title ?? "",
			author: r.author ?? "",
			createdAt: toISOFallback(r.created_at),
			updatedAt: toISOFallback(r.updated_at),
		},
		pattern: r.pattern_id ? { id: r.pattern_id, variant: r.pattern_variant ?? undefined } : undefined,
		children: (r.children as SampleComposite["children"]) ?? [],
	}));

	// ── 기존 로더와 동일한 처리 파이프라인 ─────────────────────
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
		organisms,
		composites,
		patternStore: loadPatternStore(),
	});

	const routeSet: SampleScreenRouteSet = { screenRoutes };
	const variantSet: SampleScreenVariantSet = { screenVariants };

	const processedScreens = sampleScreens.map((schema, index) => {
		const raw = orderedScreens[index];
		const validation = validateWireframeSchemaFull(schema);
		const variant = raw.screenVariantId ? variantById.get(raw.screenVariantId) : undefined;
		const route = variant ? routeSet.screenRoutes.find((r) => r.id === variant.screenRouteId) : undefined;
		const ogns = extractOrganisms(schema);

		return {
			code: schema.metadata.id,
			name: schema.metadata.title,
			description: schema.metadata.description ?? schema.children[0]?.metadata.title,
			module: route?.moduleId ?? schema.metadata.id.split("-")[1]?.toLowerCase() ?? "unknown",
			areas: ogns,
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

	const organismCatalog = getOrganismCatalog(sampleScreens);

	return {
		screens: processedScreens,
		areas: organismCatalog,
		rendererKinds: (kindRows ?? []).map((r) => ({ type: r.type, kind: r.kind as WireframeNodeKind })),
	};
}

// ── 헬퍼 (local-workbench-data-loader 와 동일) ──────────────
import type { WireframeNode, WireframeSchema } from "@cx/renderer";

function extractOrganisms(schema: WireframeSchema) {
	const result: Array<{ order: number; areaCode: string }> = [];
	forEachNode(schema.children, (node) => {
		if (node.type !== "Organism") return;
		result.push({ order: result.length + 1, areaCode: String(node.props?.organismCode ?? node.metadata.id) });
	});
	return result;
}

function getOrganismCatalog(schemas: WireframeSchema[]) {
	const byCode = new Map<string, { code: string; componentCount: number; name: string; stateCount: number; usage: string }>();
	for (const schema of schemas) {
		forEachNode(schema.children, (node) => {
			if (node.type !== "Organism") return;
			const code = String(node.props?.organismCode ?? node.metadata.id);
			byCode.set(code, { code, name: String(node.props?.name ?? node.metadata.title), usage: "section", stateCount: 1, componentCount: node.children?.length ?? 0 });
		});
	}
	return Array.from(byCode.values());
}

function forEachNode(nodes: WireframeNode[], cb: (n: WireframeNode) => void) {
	for (const n of nodes) { cb(n); if (n.children) forEachNode(n.children, cb); }
}
