import { createServerClient } from "@/lib/supabase/server";

/**
 * render_* (정규화 스키마)에 스크린 트리를 쓰는 서버 측 공용 헬퍼.
 * 관리용 CRUD 서버 액션(screen/route/module-actions)이 공유한다.
 *
 * 참고: revert 로더는 layout_id 를 읽지 않으므로(렌더는 pattern fallback 사용),
 * 신규 생성 시 layout_id 는 non-null 기본값만 채우면 된다.
 */

type Db = ReturnType<typeof createServerClient>;

const REGION_TYPES = ["header", "contents", "bottom"] as const;
export const DEFAULT_SCREEN_LAYOUT_ID = "layout.screen.default";
export const DEFAULT_AREA_LAYOUT_ID = "layout.area.default";

function nowIso(): string {
	return new Date().toISOString();
}

/** 빈 스크린: render_screens + 3개 region(자식 없음). */
export async function insertBlankScreenRows(
	db: Db,
	input: { screenId: string; variantId: string; name: string; order: number },
): Promise<{ error?: string }> {
	const ts = nowIso();
	const { error: screenError } = await db.from("render_screens").insert({
		id: input.screenId,
		screen_variant_id: input.variantId,
		version: "0.1.0",
		type: "page",
		layout_id: DEFAULT_SCREEN_LAYOUT_ID,
		order_index: input.order,
		name: input.name,
		created_at: ts,
		updated_at: ts,
	});
	if (screenError) return { error: screenError.message };

	const regions = REGION_TYPES.map((type) => ({
		id: `${input.screenId}.${type}`,
		screen_id: input.screenId,
		type,
		layout_id: `layout.region.${type}`,
		created_at: ts,
		updated_at: ts,
	}));
	const { error: regionError } = await db.from("render_screen_regions").insert(regions);
	if (regionError) return { error: regionError.message };
	return {};
}

/** 스크린 트리 복제: render_screens + regions + region_children(area 참조). */
export async function copyScreenRows(
	db: Db,
	input: {
		name?: string;
		newScreenId: string;
		newVariantId: string;
		order?: number;
		sourceScreenId: string;
	},
): Promise<{ error?: string }> {
	const ts = nowIso();
	const { data: src } = await db
		.from("render_screens")
		.select("*")
		.eq("id", input.sourceScreenId)
		.single();
	if (!src) return { error: `Screen not found: ${input.sourceScreenId}` };

	const { error: screenError } = await db.from("render_screens").insert({
		id: input.newScreenId,
		screen_variant_id: input.newVariantId,
		version: src.version,
		type: src.type,
		layout_id: src.layout_id,
		order_index: input.order ?? src.order_index,
		name: input.name ?? src.name,
		description: src.description,
		author: src.author,
		created_at: ts,
		updated_at: ts,
	});
	if (screenError) return { error: screenError.message };

	const { data: regions } = await db
		.from("render_screen_regions")
		.select("*")
		.eq("screen_id", input.sourceScreenId);
	const oldRegionIds = (regions ?? []).map((region) => region.id);
	if (regions?.length) {
		const { error } = await db.from("render_screen_regions").insert(
			regions.map((region) => ({
				id: `${input.newScreenId}.${region.type}`,
				screen_id: input.newScreenId,
				type: region.type,
				layout_id: region.layout_id,
				created_at: ts,
				updated_at: ts,
			})),
		);
		if (error) return { error: error.message };
	}

	if (oldRegionIds.length) {
		const { data: children } = await db
			.from("render_screen_region_children")
			.select("*")
			.in("screen_region_id", oldRegionIds);
		if (children?.length) {
			const { error } = await db.from("render_screen_region_children").insert(
				children.map((child) => ({
					id: crypto.randomUUID(),
					screen_region_id: `${input.newScreenId}.${child.screen_region_id.split(".").pop()}`,
					area_id: child.area_id,
					order_index: child.order_index,
					created_at: ts,
				})),
			);
			if (error) return { error: error.message };
		}
	}
	return {};
}

/** 스크린들을 자식부터 수동 cascade 삭제(region_children → regions → screens). */
export async function deleteScreensCascade(
	db: Db,
	screenIds: string[],
): Promise<{ error?: string }> {
	if (screenIds.length === 0) return {};
	const { data: regions } = await db
		.from("render_screen_regions")
		.select("id")
		.in("screen_id", screenIds);
	const regionIds = (regions ?? []).map((region) => region.id);
	if (regionIds.length) {
		const { error: childError } = await db
			.from("render_screen_region_children")
			.delete()
			.in("screen_region_id", regionIds);
		if (childError) return { error: childError.message };
		const { error: regionError } = await db
			.from("render_screen_regions")
			.delete()
			.in("screen_id", screenIds);
		if (regionError) return { error: regionError.message };
	}
	const { error: screenError } = await db.from("render_screens").delete().in("id", screenIds);
	if (screenError) return { error: screenError.message };
	return {};
}
