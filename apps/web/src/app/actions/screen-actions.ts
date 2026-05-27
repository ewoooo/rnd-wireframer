"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ScreenRow = Database["public"]["Tables"]["screens"]["Row"];
type VariantRow = Database["public"]["Tables"]["screen_variants"]["Row"];

// Supabase workspace 환경에서 generic 타입 추론이 깨지는 경우 대비 헬퍼
function asRow<T>(data: unknown): T {
	return data as T;
}
function asRows<T>(data: unknown): T[] {
	return (data ?? []) as T[];
}

export async function cloneScreen(screenId: string): Promise<{ error?: string; newScreenId?: string; newVariantId?: string }> {
	const db = createServerClient();

	const { data: _original, error: fetchError } = await db
		.from("screens")
		.select("*")
		.eq("id", screenId)
		.single();

	if (fetchError || !_original) {
		return { error: `Screen not found: ${screenId}` };
	}
	const original = asRow<ScreenRow>(_original);

	const { data: _originalVariant } = await db
		.from("screen_variants")
		.select("*")
		.eq("id", original.screen_variant_id)
		.single();

	if (!_originalVariant) {
		return { error: `Variant not found: ${original.screen_variant_id}` };
	}
	const originalVariant = asRow<VariantRow>(_originalVariant);

	const { data: _existingVariants } = await db
		.from("screen_variants")
		.select("id, order")
		.eq("screen_route_id", originalVariant.screen_route_id)
		.eq("variant_type", "edge");

	const existingVariants = asRows<Pick<VariantRow, "id" | "order">>(_existingVariants);
	const maxOrder = existingVariants.reduce((max, v) => Math.max(max, v.order), 0);
	const timestamp = Date.now();
	const newVariantId = `${originalVariant.id}-clone-${timestamp}`;
	const newScreenId = `${screenId}-clone-${timestamp}`;

	const { error: variantError } = await db.from("screen_variants").insert({
		id: newVariantId,
		screen_route_id: originalVariant.screen_route_id,
		name: `${originalVariant.name} (복제본)`,
		order: maxOrder + 1,
		variant_type: "edge",
		follow_up: null,
	} as never);

	if (variantError) {
		return { error: `Failed to create variant: ${variantError.message}` };
	}

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
	} as never);

	if (screenError) {
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
		.update({ title } as never)
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
		.update({ screen } as never)
		.eq("id", screenId);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function updateScreenAreaOrder(
	screenId: string,
	areaCodes: string[],
): Promise<{ error?: string }> {
	const db = createServerClient();

	const { data: _row, error: fetchError } = await db
		.from("screens")
		.select("screen")
		.eq("id", screenId)
		.single();

	if (fetchError || !_row) return { error: `Screen not found: ${screenId}` };

	const row = asRow<Pick<ScreenRow, "screen">>(_row);
	const body = row.screen as {
		type: string;
		regions: Record<string, { type: string; metadata: unknown; children: { kind: string; id: string }[] }>;
	};

	const orderMap = new Map(areaCodes.map((id, i) => [id, i]));

	for (const region of Object.values(body.regions)) {
		region.children = [...region.children].sort((a, b) => {
			const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
			const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
			return ai - bi;
		});
	}

	const { error } = await db.from("screens").update({ screen: body } as never).eq("id", screenId);
	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function deleteScreen(screenId: string): Promise<{ error?: string }> {
	const db = createServerClient();

	const { data: _screen } = await db
		.from("screens")
		.select("screen_variant_id")
		.eq("id", screenId)
		.single();

	const screen = _screen ? asRow<Pick<ScreenRow, "screen_variant_id">>(_screen) : null;

	const { error } = await db.from("screens").delete().eq("id", screenId);
	if (error) return { error: error.message };

	if (screen?.screen_variant_id) {
		const { data: _remaining } = await db
			.from("screens")
			.select("id")
			.eq("screen_variant_id", screen.screen_variant_id);

		const remaining = asRows<Pick<ScreenRow, "id">>(_remaining);
		if (!remaining.length) {
			await db.from("screen_variants").delete().eq("id", screen.screen_variant_id);
		}
	}

	revalidatePath("/");
	return {};
}
