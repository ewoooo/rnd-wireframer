"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function createModule(): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	// 현재 최대 order + 1 → 맨 아래에 삽입
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

	const { error } = await db
		.from("screen_modules")
		.update({ name })
		.eq("id", id);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function duplicateModule(id: string): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	const { data: original } = await db.from("screen_modules").select("*").eq("id", id).single();
	if (!original) return { error: "Module not found" };

	// 현재 최대 order + 1 → 맨 아래에 삽입
	const { data: rows } = await db
		.from("screen_modules")
		.select("order")
		.order("order", { ascending: false })
		.limit(1);
	const newOrder = (rows?.[0]?.order ?? 0) + 1;

	const newModuleId = `mod-${crypto.randomUUID().slice(0, 8)}`;

	const { error: modErr } = await db.from("screen_modules").insert({
		id: newModuleId,
		name: `${original.name} (복제본)`,
		order: newOrder,
	});
	if (modErr) return { error: modErr.message };

	// 소속 루트 복제
	const { data: routes } = await db.from("screen_routes").select("*").eq("module_id", id);
	for (const route of routes ?? []) {
		const newRouteId = `route-${crypto.randomUUID().slice(0, 8)}`;

		await db.from("screen_routes").insert({
			id: newRouteId,
			name: route.name,
			module_id: newModuleId,
			order: route.order,
			process_id: route.process_id,
		});

		// 각 루트의 variants 복제
		const { data: variants } = await db
			.from("screen_variants")
			.select("*")
			.eq("screen_route_id", route.id);

		const variantIdMap = new Map<string, string>();
		for (const v of variants ?? []) {
			const newVarId = `var-${crypto.randomUUID().slice(0, 8)}`;
			variantIdMap.set(v.id, newVarId);
			await db.from("screen_variants").insert({
				id: newVarId,
				screen_route_id: newRouteId,
				name: v.name,
				order: v.order,
				variant_type: v.variant_type,
				follow_up: v.follow_up,
			});
		}

		// screens 복제
		for (const [oldVarId, newVarId] of variantIdMap) {
			const { data: screens } = await db
				.from("screens")
				.select("*")
				.eq("screen_variant_id", oldVarId);
			for (const s of screens ?? []) {
				await db.from("screens").insert({
					id: `scr-${crypto.randomUUID().slice(0, 8)}`,
					screen_variant_id: newVarId,
					version: s.version,
					min_renderer_version: s.min_renderer_version,
					order: s.order,
					pattern_id: s.pattern_id,
					pattern_variant: s.pattern_variant,
					theme_mode: s.theme_mode,
					title: s.title,
					author: s.author,
					screen: s.screen,
				});
			}
		}
	}

	revalidatePath("/");
	return { id: newModuleId };
}

export async function deleteModule(id: string): Promise<{ error?: string }> {
	const db = createServerClient();

	// 소속 루트를 "unknown" 모듈로 이관 (데이터 손실 방지)
	await db.from("screen_routes").update({ module_id: "unknown" }).eq("module_id", id);

	const { error } = await db.from("screen_modules").delete().eq("id", id);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}
