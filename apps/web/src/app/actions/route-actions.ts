"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function createRoute(input?: {
	name?: string;
	moduleId?: string;
}): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	// 해당 모듈 내 최대 order + 1 → 맨 아래에 삽입
	const { data: rows } = await db
		.from("screen_routes")
		.select("order")
		.eq("module_id", input?.moduleId ?? "new")
		.order("order", { ascending: false })
		.limit(1);

	const nextOrder = (rows?.[0]?.order ?? 0) + 1;
	const id = `route-${crypto.randomUUID().slice(0, 8)}`;

	const { error } = await db.from("screen_routes").insert({
		id,
		name: input?.name ?? "새 루트",
		module_id: input?.moduleId ?? "new",
		order: nextOrder,
		process_id: null,
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
		// 연결된 variants 업데이트
		const { error: variantError } = await db
			.from("screen_variants")
			.update({ screen_route_id: newCode })
			.eq("screen_route_id", id);

		if (variantError) return { error: variantError.message };

		// 기존 route 데이터 조회
		const { data: original } = await db
			.from("screen_routes")
			.select("*")
			.eq("id", id)
			.single();

		if (!original) return { error: "Route not found" };

		// 새 id로 insert
		const { error: insertError } = await db.from("screen_routes").insert({
			...original,
			id: newCode,
			name: newName ?? original.name,
			module_id: newModuleId ?? original.module_id,
		});

		if (insertError) {
			// rollback variants
			await db
				.from("screen_variants")
				.update({ screen_route_id: id })
				.eq("screen_route_id", newCode);
			return { error: insertError.message };
		}

		// 기존 row 삭제
		await db.from("screen_routes").delete().eq("id", id);

		revalidatePath("/");
		return {};
	}

	// name / module_id 만 변경
	const updates: Record<string, string> = {};
	if (newName) updates.name = newName;
	if (newModuleId) updates.module_id = newModuleId;

	if (Object.keys(updates).length === 0) return {};

	const { error } = await db
		.from("screen_routes")
		.update(updates)
		.eq("id", id);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}

export async function duplicateRoute(id: string): Promise<{ error?: string; id?: string }> {
	const db = createServerClient();

	// 원본 route 조회
	const { data: original } = await db.from("screen_routes").select("*").eq("id", id).single();
	if (!original) return { error: "Route not found" };

	// 새 ID & order
	const newRouteId = `route-${crypto.randomUUID().slice(0, 8)}`;
	const { data: rows } = await db
		.from("screen_routes")
		.select("order")
		.order("order", { ascending: false })
		.limit(1);
	const nextOrder = (rows?.[0]?.order ?? 0) + 1;

	// route 복제
	const { error: routeErr } = await db.from("screen_routes").insert({
		id: newRouteId,
		name: `${original.name} (복제본)`,
		module_id: original.module_id,
		order: nextOrder,
		process_id: original.process_id,
	});
	if (routeErr) return { error: routeErr.message };

	// variants 조회 & 복제
	const { data: variants } = await db
		.from("screen_variants")
		.select("*")
		.eq("screen_route_id", id);

	const variantIdMap = new Map<string, string>(); // old → new

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
			const newScreenId = `scr-${crypto.randomUUID().slice(0, 8)}`;
			await db.from("screens").insert({
				id: newScreenId,
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

	revalidatePath("/");
	return { id: newRouteId };
}

export async function deleteRoute(id: string): Promise<{
	error?: string;
	deletedScreenCount?: number;
	deletedVariantCount?: number;
}> {
	const db = createServerClient();

	// 연결된 variants 조회
	const { data: variants } = await db
		.from("screen_variants")
		.select("id")
		.eq("screen_route_id", id);

	const variantIds = (variants ?? []).map((v) => v.id);

	// variants에 연결된 screens 삭제
	let deletedScreenCount = 0;
	if (variantIds.length > 0) {
		const { data: screens } = await db
			.from("screens")
			.select("id")
			.in("screen_variant_id", variantIds);

		deletedScreenCount = screens?.length ?? 0;

		const { error: screenError } = await db
			.from("screens")
			.delete()
			.in("screen_variant_id", variantIds);

		if (screenError) return { error: screenError.message };

		// variants 삭제
		const { error: variantError } = await db
			.from("screen_variants")
			.delete()
			.eq("screen_route_id", id);

		if (variantError) return { error: variantError.message };
	}

	// route 삭제
	const { error: routeError } = await db
		.from("screen_routes")
		.delete()
		.eq("id", id);

	if (routeError) return { error: routeError.message };

	revalidatePath("/");
	return {
		deletedScreenCount,
		deletedVariantCount: variantIds.length,
	};
}
