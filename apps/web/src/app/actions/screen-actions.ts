"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

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

	revalidatePath("/");
	return {};
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
