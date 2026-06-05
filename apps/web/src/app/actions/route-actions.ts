"use server";

import { revalidatePath } from "next/cache";
import { copyScreenRows, deleteScreensCascade } from "@/lib/render-screen-write";
import { createServerClient } from "@/lib/supabase/server";

export async function createRoute(input?: {
	name?: string;
	moduleId?: string;
}): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	const { data: rows } = await db
		.from("render_screen_routes")
		.select("order_index")
		.eq("module_id", input?.moduleId ?? "new")
		.order("order_index", { ascending: false })
		.limit(1);

	const nextOrder = (rows?.[0]?.order_index ?? 0) + 1;
	const id = `route-${crypto.randomUUID().slice(0, 8)}`;
	const ts = new Date().toISOString();

	const { error } = await db.from("render_screen_routes").insert({
		id,
		name: input?.name ?? "새 루트",
		module_id: input?.moduleId ?? "new",
		order_index: nextOrder,
		process_id: null,
		created_at: ts,
		updated_at: ts,
	});

	if (error) return { error: error.message };

	revalidatePath("/");
	return { id };
}

export async function updateRoute(
	id: string,
	input: { name?: string; code?: string; moduleId?: string },
): Promise<{ error?: string }> {
	const db = createServerClient();

	const newCode = input.code?.trim();
	const newName = input.name?.trim();
	const newModuleId = input.moduleId?.trim();

	// code(id) 변경 시 — FK cascade 수동 처리
	if (newCode && newCode !== id) {
		const { error: variantError } = await db
			.from("render_screen_variants")
			.update({ screen_route_id: newCode })
			.eq("screen_route_id", id);
		if (variantError) return { error: variantError.message };

		const { data: original } = await db
			.from("render_screen_routes")
			.select("*")
			.eq("id", id)
			.single();
		if (!original) return { error: "Route not found" };

		const { error: insertError } = await db.from("render_screen_routes").insert({
			...original,
			id: newCode,
			name: newName ?? original.name,
			module_id: newModuleId ?? original.module_id,
			updated_at: new Date().toISOString(),
		});

		if (insertError) {
			await db
				.from("render_screen_variants")
				.update({ screen_route_id: id })
				.eq("screen_route_id", newCode);
			return { error: insertError.message };
		}

		await db.from("render_screen_routes").delete().eq("id", id);

		revalidatePath("/");
		return {};
	}

	const updates: Record<string, string> = {};
	if (newName) updates.name = newName;
	if (newModuleId) updates.module_id = newModuleId;

	if (Object.keys(updates).length === 0) return {};
	updates.updated_at = new Date().toISOString();

	const { error } = await db.from("render_screen_routes").update(updates).eq("id", id);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function duplicateRoute(id: string): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	const { data: original } = await db
		.from("render_screen_routes")
		.select("*")
		.eq("id", id)
		.single();
	if (!original) return { error: "Route not found" };

	const newRouteId = `route-${crypto.randomUUID().slice(0, 8)}`;
	const { data: rows } = await db
		.from("render_screen_routes")
		.select("order_index")
		.order("order_index", { ascending: false })
		.limit(1);
	const nextOrder = (rows?.[0]?.order_index ?? 0) + 1;
	const ts = new Date().toISOString();

	const { error: routeErr } = await db.from("render_screen_routes").insert({
		id: newRouteId,
		name: `${original.name} (복제본)`,
		module_id: original.module_id,
		order_index: nextOrder,
		process_id: original.process_id,
		created_at: ts,
		updated_at: ts,
	});
	if (routeErr) return { error: routeErr.message };

	const { data: variants } = await db
		.from("render_screen_variants")
		.select("*")
		.eq("screen_route_id", id);

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

	revalidatePath("/");
	return { id: newRouteId };
}

export async function deleteRoute(id: string): Promise<{
	error?: string;
	deletedScreenCount?: number;
	deletedVariantCount?: number;
}> {
	const db = createServerClient();

	const { data: variants } = await db
		.from("render_screen_variants")
		.select("id")
		.eq("screen_route_id", id);
	const variantIds = (variants ?? []).map((variant) => variant.id);

	let deletedScreenCount = 0;
	if (variantIds.length > 0) {
		const { data: screens } = await db
			.from("render_screens")
			.select("id")
			.in("screen_variant_id", variantIds);
		const screenIds = (screens ?? []).map((screen) => screen.id);
		deletedScreenCount = screenIds.length;

		const cascade = await deleteScreensCascade(db, screenIds);
		if (cascade.error) return { error: cascade.error };

		const { error: variantError } = await db
			.from("render_screen_variants")
			.delete()
			.eq("screen_route_id", id);
		if (variantError) return { error: variantError.message };
	}

	const { error: routeError } = await db.from("render_screen_routes").delete().eq("id", id);
	if (routeError) return { error: routeError.message };

	revalidatePath("/");
	return { deletedScreenCount, deletedVariantCount: variantIds.length };
}
