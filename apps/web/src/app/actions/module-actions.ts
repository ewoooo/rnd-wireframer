"use server";

import { revalidatePath } from "next/cache";
import { copyScreenRows } from "@/lib/render-screen-write";
import { createServerClient } from "@/lib/supabase/server";

// screen_modules 는 양쪽(구/신) 공유 테이블이라 유지한다. 소속 루트/변형/스크린의
// cascade 만 render_* 로 처리한다.

export async function createModule(): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	const { data: rows } = await db
		.from("screen_modules")
		.select("order")
		.order("order", { ascending: false })
		.limit(1);

	const newOrder = (rows?.[0]?.order ?? 0) + 1;
	const id = `mod-${crypto.randomUUID().slice(0, 8)}`;

	const { error } = await db.from("screen_modules").insert({
		id,
		name: "새 도메인",
		order: newOrder,
	});

	if (error) return { error: error.message };

	revalidatePath("/");
	return { id };
}

export async function updateModule(
	id: string,
	input: { name: string },
): Promise<{ error?: string }> {
	const db = createServerClient();

	const name = input.name.trim();
	if (!name) return {};

	const { error } = await db.from("screen_modules").update({ name }).eq("id", id);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function duplicateModule(id: string): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	const { data: original } = await db.from("screen_modules").select("*").eq("id", id).single();
	if (!original) return { error: "Module not found" };

	const { data: rows } = await db
		.from("screen_modules")
		.select("order")
		.order("order", { ascending: false })
		.limit(1);
	const newOrder = (rows?.[0]?.order ?? 0) + 1;
	const newModuleId = `mod-${crypto.randomUUID().slice(0, 8)}`;
	const ts = new Date().toISOString();

	const { error: modErr } = await db.from("screen_modules").insert({
		id: newModuleId,
		name: `${original.name} (복제본)`,
		order: newOrder,
	});
	if (modErr) return { error: modErr.message };

	const { data: routes } = await db
		.from("render_screen_routes")
		.select("*")
		.eq("module_id", id);
	for (const route of routes ?? []) {
		const newRouteId = `route-${crypto.randomUUID().slice(0, 8)}`;
		await db.from("render_screen_routes").insert({
			id: newRouteId,
			name: route.name,
			module_id: newModuleId,
			order_index: route.order_index,
			process_id: route.process_id,
			created_at: ts,
			updated_at: ts,
		});

		const { data: variants } = await db
			.from("render_screen_variants")
			.select("*")
			.eq("screen_route_id", route.id);

		for (const variant of variants ?? []) {
			const newVariantId = `var-${crypto.randomUUID().slice(0, 8)}`;
			await db.from("render_screen_variants").insert({
				id: newVariantId,
				screen_route_id: newRouteId,
				name: variant.name,
				order_index: variant.order_index,
				type: variant.type,
				created_at: ts,
				updated_at: ts,
			});

			const { data: screens } = await db
				.from("render_screens")
				.select("id")
				.eq("screen_variant_id", variant.id);
			for (const screen of screens ?? []) {
				const result = await copyScreenRows(db, {
					sourceScreenId: screen.id,
					newScreenId: `scr-${crypto.randomUUID().slice(0, 8)}`,
					newVariantId,
				});
				if (result.error) return { error: result.error };
			}
		}
	}

	revalidatePath("/");
	return { id: newModuleId };
}

export async function deleteModule(id: string): Promise<{ error?: string }> {
	const db = createServerClient();

	// 소속 루트를 "unknown" 모듈로 이관 (데이터 손실 방지)
	await db.from("render_screen_routes").update({ module_id: "unknown" }).eq("module_id", id);

	const { error } = await db.from("screen_modules").delete().eq("id", id);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}
