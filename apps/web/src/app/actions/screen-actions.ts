"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

const EMPTY_SCREEN_BODY = {
	type: "page" as const,
	regions: {
		header: { type: "Screen.Header" as const, metadata: { title: "헤더" }, children: [] },
		contents: { type: "Screen.Contents" as const, metadata: { title: "콘텐츠" }, children: [] },
		bottom: { type: "Screen.Bottom" as const, metadata: { title: "바텀" }, children: [] },
	},
};

export async function createVariant(input: {
	routeId: string;
	name?: string;
}): Promise<{ error?: string; variantId?: string; screenId?: string }> {
	const db = createServerClient();

	const { data: rows } = await db
		.from("screen_variants")
		.select("order")
		.eq("screen_route_id", input.routeId)
		.order("order", { ascending: false })
		.limit(1);

	const nextOrder = (rows?.[0]?.order ?? 0) + 1;
	const variantId = `var-${crypto.randomUUID().slice(0, 8)}`;
	const screenId = `scr-${crypto.randomUUID().slice(0, 8)}`;
	const name = input.name ?? "새 스크린";

	const { error: variantError } = await db.from("screen_variants").insert({
		id: variantId,
		screen_route_id: input.routeId,
		name,
		order: nextOrder,
		variant_type: "base",
		base_variant_id: null,
		trigger: null,
		difference_from_base: null,
		follow_up: null,
		source_ref: null,
	});

	if (variantError) return { error: variantError.message };

	const { error: screenError } = await db.from("screens").insert({
		id: screenId,
		screen_variant_id: variantId,
		version: "1.0.0",
		min_renderer_version: "1.0.0",
		order: 1,
		pattern_id: null,
		pattern_variant: null,
		theme_mode: "light",
		title: name,
		author: null,
		screen: EMPTY_SCREEN_BODY,
		source_ref: null,
	});

	if (screenError) {
		await db.from("screen_variants").delete().eq("id", variantId);
		return { error: screenError.message };
	}

	revalidatePath("/");
	return { variantId, screenId };
}

export async function updateVariant(
	variantId: string,
	input: { name: string },
): Promise<{ error?: string }> {
	const db = createServerClient();

	const name = input.name.trim();
	if (!name) return {};

	const { error } = await db
		.from("screen_variants")
		.update({ name })
		.eq("id", variantId);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function duplicateVariant(
	variantId: string,
): Promise<{ error?: string; variantId?: string }> {
	const db = createServerClient();

	const { data: original } = await db
		.from("screen_variants")
		.select("*")
		.eq("id", variantId)
		.single();

	if (!original) return { error: "Variant not found" };

	const { data: rows } = await db
		.from("screen_variants")
		.select("order")
		.eq("screen_route_id", original.screen_route_id)
		.order("order", { ascending: false })
		.limit(1);

	const newVariantId = `var-${crypto.randomUUID().slice(0, 8)}`;
	const nextOrder = (rows?.[0]?.order ?? 0) + 1;

	const { error: variantError } = await db.from("screen_variants").insert({
		id: newVariantId,
		screen_route_id: original.screen_route_id,
		name: `${original.name} (복제본)`,
		order: nextOrder,
		variant_type: original.variant_type,
		base_variant_id: original.base_variant_id,
		trigger: original.trigger,
		difference_from_base: original.difference_from_base,
		follow_up: original.follow_up,
		source_ref: original.source_ref,
	});

	if (variantError) return { error: variantError.message };

	const { data: screens } = await db
		.from("screens")
		.select("*")
		.eq("screen_variant_id", variantId);

	for (const s of screens ?? []) {
		await db.from("screens").insert({
			id: `scr-${crypto.randomUUID().slice(0, 8)}`,
			screen_variant_id: newVariantId,
			version: s.version,
			min_renderer_version: s.min_renderer_version,
			order: s.order,
			pattern_id: s.pattern_id,
			pattern_variant: s.pattern_variant,
			theme_mode: s.theme_mode,
			title: s.title,
			author: s.author,
			screen: s.screen,
			source_ref: s.source_ref,
		});
	}

	revalidatePath("/");
	return { variantId: newVariantId };
}

export async function deleteVariant(
	variantId: string,
): Promise<{ error?: string }> {
	const db = createServerClient();

	const { error: screenError } = await db
		.from("screens")
		.delete()
		.eq("screen_variant_id", variantId);

	if (screenError) return { error: screenError.message };

	const { error: variantError } = await db
		.from("screen_variants")
		.delete()
		.eq("id", variantId);

	if (variantError) return { error: variantError.message };

	revalidatePath("/");
	return {};
}

export async function cloneScreen(screenId: string): Promise<{ error?: string; newScreenId?: string; newVariantId?: string }> {
	const db = createServerClient();

	// 원본 screen 조회
	const { data: original, error: fetchError } = await db
		.from("screens")
		.select("*")
		.eq("id", screenId)
		.single();

	if (fetchError || !original) {
		return { error: `Screen not found: ${screenId}` };
	}

	// 원본 variant 조회
	const { data: originalVariant } = await db
		.from("screen_variants")
		.select("*")
		.eq("id", original.screen_variant_id)
		.single();

	if (!originalVariant) {
		return { error: `Variant not found: ${original.screen_variant_id}` };
	}

	// 같은 route에서 edge variant 번호 계산
	const { data: existingVariants } = await db
		.from("screen_variants")
		.select("id, order")
		.eq("screen_route_id", originalVariant.screen_route_id)
		.eq("variant_type", "edge");

	const maxOrder = existingVariants?.reduce((max, v) => Math.max(max, v.order), 0) ?? 0;
	const timestamp = Date.now();
	const newVariantId = `${originalVariant.id}-clone-${timestamp}`;
	const newScreenId = `${screenId}-clone-${timestamp}`;

	// 새 edge variant 생성
	const { error: variantError } = await db.from("screen_variants").insert({
		id: newVariantId,
		screen_route_id: originalVariant.screen_route_id,
		name: `${originalVariant.name} (복제본)`,
		order: maxOrder + 1,
		variant_type: "edge",
		follow_up: null,
	});

	if (variantError) {
		return { error: `Failed to create variant: ${variantError.message}` };
	}

	// 새 screen 생성 (원본 데이터 복사)
	const { error: screenError } = await db.from("screens").insert({
		id: newScreenId,
		screen_variant_id: newVariantId,
		version: original.version,
		min_renderer_version: original.min_renderer_version,
		order: 1,
		pattern_id: original.pattern_id,
		pattern_variant: original.pattern_variant,
		theme_mode: original.theme_mode,
		title: `${original.title ?? screenId} (복제본)`,
		author: original.author,
		screen: original.screen,
	});

	if (screenError) {
		// 롤백
		await db.from("screen_variants").delete().eq("id", newVariantId);
		return { error: `Failed to create screen: ${screenError.message}` };
	}

	revalidatePath("/");
	return { newScreenId, newVariantId };
}

export async function updateScreenTitle(screenId: string, title: string): Promise<{ error?: string }> {
	const db = createServerClient();

	const { error } = await db
		.from("screens")
		.update({ title })
		.eq("id", screenId);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function updateScreenRegions(
	screenId: string,
	screen: unknown,
): Promise<{ error?: string }> {
	const db = createServerClient();

	const { error } = await db
		.from("screens")
		.update({ screen })
		.eq("id", screenId);

	if (error) return { error: error.message };

	// 수동 저장이므로 revalidatePath 를 호출하지 않는다. 저장 시점에 클라이언트
	// 스토어가 이미 최신이고, revalidate 는 라우터 refresh → 스토어 재초기화 →
	// 캔버스 스크롤이 맨 위로 튀게 만든다. 다음 풀 로드에서 자연히 반영된다.
	return {};
}

export async function cloneArea(
	areaCode: string,
	screenCode: string,
): Promise<{ error?: string; newAreaId?: string }> {
	const db = createServerClient();

	const { data: original, error: fetchError } = await db
		.from("organisms")
		.select("*")
		.eq("id", areaCode)
		.single();

	if (fetchError || !original) {
		return { error: `Area not found: ${areaCode}` };
	}

	const timestamp = Date.now();
	const newAreaId = `${areaCode}-clone-${timestamp}`;

	const { error: insertError } = await db.from("organisms").insert({
		id: newAreaId,
		type: original.type,
		version: original.version,
		pattern_id: original.pattern_id,
		pattern_variant: original.pattern_variant,
		title: `${original.title ?? areaCode} (복제본)`,
		author: original.author,
		props: original.props,
		children: original.children,
	});

	if (insertError) {
		return { error: `Failed to create area: ${insertError.message}` };
	}

	// 현재 screen의 contents에 원본 다음 위치에 삽입
	const { data: screenRow, error: screenFetchError } = await db
		.from("screens")
		.select("screen")
		.eq("id", screenCode)
		.single();

	if (screenFetchError || !screenRow) {
		await db.from("organisms").delete().eq("id", newAreaId);
		return { error: `Screen not found: ${screenCode}` };
	}

	const screenData = screenRow.screen as Record<string, unknown>;
	const regions = screenData?.regions as Record<string, unknown> | undefined;
	const contents = regions?.contents as Record<string, unknown> | undefined;
	const contentsChildren = (contents?.children as Array<{ kind: string; id: string }>) ?? [];

	const originalIndex = contentsChildren.findIndex((c) => c.id === areaCode);
	const insertIndex = originalIndex >= 0 ? originalIndex + 1 : contentsChildren.length;

	const newScreenData = {
		...screenData,
		regions: {
			...regions,
			contents: {
				...contents,
				children: [
					...contentsChildren.slice(0, insertIndex),
					{ kind: "area", id: newAreaId },
					...contentsChildren.slice(insertIndex),
				],
			},
		},
	};

	const { error: updateError } = await db
		.from("screens")
		.update({ screen: newScreenData })
		.eq("id", screenCode);

	if (updateError) {
		await db.from("organisms").delete().eq("id", newAreaId);
		return { error: `Failed to update screen: ${updateError.message}` };
	}

	revalidatePath("/");
	return { newAreaId };
}

export async function deleteScreen(screenId: string): Promise<{ error?: string }> {
	const db = createServerClient();

	// screen의 variant_id 조회
	const { data: screen } = await db
		.from("screens")
		.select("screen_variant_id")
		.eq("id", screenId)
		.single();

	// screen 삭제
	const { error } = await db.from("screens").delete().eq("id", screenId);
	if (error) return { error: error.message };

	// variant에 screen이 더 없으면 variant도 삭제
	if (screen?.screen_variant_id) {
		const { data: remaining } = await db
			.from("screens")
			.select("id")
			.eq("screen_variant_id", screen.screen_variant_id);

		if (!remaining?.length) {
			await db.from("screen_variants").delete().eq("id", screen.screen_variant_id);
		}
	}

	revalidatePath("/");
	return {};
}
