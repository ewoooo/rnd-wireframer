"use server";

import { revalidatePath } from "next/cache";
import {
	copyScreenRows,
	deleteScreensCascade,
	insertBlankScreenRows,
} from "@/lib/render-screen-write";
import { createServerClient } from "@/lib/supabase/server";

export async function createVariant(input: {
	routeId: string;
	name?: string;
}): Promise<{ error?: string; variantId?: string; screenId?: string }> {
	const db = createServerClient();

	const { data: rows } = await db
		.from("render_screen_variants")
		.select("order_index")
		.eq("screen_route_id", input.routeId)
		.order("order_index", { ascending: false })
		.limit(1);

	const nextOrder = (rows?.[0]?.order_index ?? 0) + 1;
	const variantId = `var-${crypto.randomUUID().slice(0, 8)}`;
	const screenId = `scr-${crypto.randomUUID().slice(0, 8)}`;
	const name = input.name ?? "새 스크린";
	const ts = new Date().toISOString();

	const { error: variantError } = await db.from("render_screen_variants").insert({
		id: variantId,
		screen_route_id: input.routeId,
		name,
		order_index: nextOrder,
		type: "base",
		created_at: ts,
		updated_at: ts,
	});
	if (variantError) return { error: variantError.message };

	const blank = await insertBlankScreenRows(db, { screenId, variantId, name, order: 1 });
	if (blank.error) {
		await db.from("render_screen_variants").delete().eq("id", variantId);
		return { error: blank.error };
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
		.from("render_screen_variants")
		.update({ name, updated_at: new Date().toISOString() })
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
		.from("render_screen_variants")
		.select("*")
		.eq("id", variantId)
		.single();
	if (!original) return { error: "Variant not found" };

	const { data: rows } = await db
		.from("render_screen_variants")
		.select("order_index")
		.eq("screen_route_id", original.screen_route_id)
		.order("order_index", { ascending: false })
		.limit(1);

	const newVariantId = `var-${crypto.randomUUID().slice(0, 8)}`;
	const nextOrder = (rows?.[0]?.order_index ?? 0) + 1;
	const ts = new Date().toISOString();

	const { error: variantError } = await db.from("render_screen_variants").insert({
		id: newVariantId,
		screen_route_id: original.screen_route_id,
		name: `${original.name} (복제본)`,
		order_index: nextOrder,
		type: original.type,
		created_at: ts,
		updated_at: ts,
	});
	if (variantError) return { error: variantError.message };

	const { data: screens } = await db
		.from("render_screens")
		.select("id")
		.eq("screen_variant_id", variantId);

	for (const screen of screens ?? []) {
		const result = await copyScreenRows(db, {
			sourceScreenId: screen.id,
			newScreenId: `scr-${crypto.randomUUID().slice(0, 8)}`,
			newVariantId,
		});
		if (result.error) return { error: result.error };
	}

	revalidatePath("/");
	return { variantId: newVariantId };
}

export async function deleteVariant(variantId: string): Promise<{ error?: string }> {
	const db = createServerClient();

	const { data: screens } = await db
		.from("render_screens")
		.select("id")
		.eq("screen_variant_id", variantId);

	const cascade = await deleteScreensCascade(
		db,
		(screens ?? []).map((screen) => screen.id),
	);
	if (cascade.error) return { error: cascade.error };

	const { error: variantError } = await db
		.from("render_screen_variants")
		.delete()
		.eq("id", variantId);
	if (variantError) return { error: variantError.message };

	revalidatePath("/");
	return {};
}

export async function cloneScreen(
	screenId: string,
): Promise<{ error?: string; newScreenId?: string; newVariantId?: string }> {
	const db = createServerClient();

	const { data: original, error: fetchError } = await db
		.from("render_screens")
		.select("*")
		.eq("id", screenId)
		.single();
	if (fetchError || !original) return { error: `Screen not found: ${screenId}` };

	const { data: originalVariant } = await db
		.from("render_screen_variants")
		.select("*")
		.eq("id", original.screen_variant_id)
		.single();
	if (!originalVariant) {
		return { error: `Variant not found: ${original.screen_variant_id}` };
	}

	const { data: existingVariants } = await db
		.from("render_screen_variants")
		.select("order_index")
		.eq("screen_route_id", originalVariant.screen_route_id)
		.eq("type", "edge");

	const maxOrder = existingVariants?.reduce((max, v) => Math.max(max, v.order_index ?? 0), 0) ?? 0;
	const timestamp = Date.now();
	const newVariantId = `${originalVariant.id}-clone-${timestamp}`;
	const newScreenId = `${screenId}-clone-${timestamp}`;
	const ts = new Date().toISOString();

	const { error: variantError } = await db.from("render_screen_variants").insert({
		id: newVariantId,
		screen_route_id: originalVariant.screen_route_id,
		name: `${originalVariant.name} (복제본)`,
		order_index: maxOrder + 1,
		type: "edge",
		created_at: ts,
		updated_at: ts,
	});
	if (variantError) return { error: `Failed to create variant: ${variantError.message}` };

	const result = await copyScreenRows(db, {
		sourceScreenId: screenId,
		newScreenId,
		newVariantId,
		name: `${original.name ?? screenId} (복제본)`,
		order: 1,
	});
	if (result.error) {
		await db.from("render_screen_variants").delete().eq("id", newVariantId);
		return { error: `Failed to clone screen: ${result.error}` };
	}

	revalidatePath("/");
	return { newScreenId, newVariantId };
}

export async function updateScreenTitle(
	screenId: string,
	title: string,
): Promise<{ error?: string }> {
	const db = createServerClient();

	const { error } = await db
		.from("render_screens")
		.update({ name: title, updated_at: new Date().toISOString() })
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

	// screen.regions 의 각 영역 children(area 참조, 순서)을
	// render_screen_region_children(정규화 junction)에 replace 한다.
	const regions =
		(screen as { regions?: Record<string, { children?: Array<{ id: string }> }> })?.regions ?? {};
	const regionTypes = ["header", "contents", "bottom"] as const;
	const regionIds = regionTypes.map((type) => `${screenId}.${type}`);

	const { error: deleteError } = await db
		.from("render_screen_region_children")
		.delete()
		.in("screen_region_id", regionIds);
	if (deleteError) return { error: deleteError.message };

	const ts = new Date().toISOString();
	const rows: Array<{
		id: string;
		screen_region_id: string;
		area_id: string;
		order_index: number;
		created_at: string;
	}> = [];
	for (const type of regionTypes) {
		const children = regions[type]?.children ?? [];
		children.forEach((child, index) => {
			rows.push({
				id: crypto.randomUUID(),
				screen_region_id: `${screenId}.${type}`,
				area_id: child.id,
				order_index: index,
				created_at: ts,
			});
		});
	}

	if (rows.length > 0) {
		const { error: insertError } = await db
			.from("render_screen_region_children")
			.insert(rows);
		if (insertError) return { error: insertError.message };
	}

	// 수동 저장이므로 revalidatePath 를 호출하지 않는다.
	return {};
}

export async function cloneArea(
	areaCode: string,
	screenCode: string,
): Promise<{ error?: string; newAreaId?: string }> {
	const db = createServerClient();

	const { data: original, error: fetchError } = await db
		.from("render_areas")
		.select("*")
		.eq("id", areaCode)
		.single();
	if (fetchError || !original) return { error: `Area not found: ${areaCode}` };

	const ts = new Date().toISOString();
	const newAreaId = `${areaCode}-clone-${Date.now()}`;

	const { error: insertError } = await db.from("render_areas").insert({
		id: newAreaId,
		type: original.type,
		version: original.version,
		layout_id: original.layout_id,
		name: `${original.name ?? areaCode} (복제본)`,
		description: original.description,
		author: original.author,
		props: original.props,
		created_at: ts,
		updated_at: ts,
	});
	if (insertError) return { error: `Failed to create area: ${insertError.message}` };

	// area 자식(component 참조) 복제
	const { data: areaChildren } = await db
		.from("render_area_children")
		.select("*")
		.eq("area_id", areaCode);
	if (areaChildren?.length) {
		const { error } = await db.from("render_area_children").insert(
			areaChildren.map((child) => ({
				id: crypto.randomUUID(),
				area_id: newAreaId,
				component_id: child.component_id,
				order_index: child.order_index,
				created_at: ts,
			})),
		);
		if (error) {
			await db.from("render_areas").delete().eq("id", newAreaId);
			return { error: `Failed to copy area children: ${error.message}` };
		}
	}

	// 현재 스크린 contents 영역에서 원본 다음 위치에 새 area 참조 삽입(전체 재색인)
	const regionId = `${screenCode}.contents`;
	const { data: regionChildren } = await db
		.from("render_screen_region_children")
		.select("*")
		.eq("screen_region_id", regionId);
	const orderedAreaIds = [...(regionChildren ?? [])]
		.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
		.map((child) => child.area_id);
	const originalIndex = orderedAreaIds.indexOf(areaCode);
	const insertIndex = originalIndex >= 0 ? originalIndex + 1 : orderedAreaIds.length;
	const nextAreaIds = [
		...orderedAreaIds.slice(0, insertIndex),
		newAreaId,
		...orderedAreaIds.slice(insertIndex),
	];

	await db.from("render_screen_region_children").delete().eq("screen_region_id", regionId);
	const { error: regionInsertError } = await db.from("render_screen_region_children").insert(
		nextAreaIds.map((areaId, index) => ({
			id: crypto.randomUUID(),
			screen_region_id: regionId,
			area_id: areaId,
			order_index: index,
			created_at: ts,
		})),
	);
	if (regionInsertError) {
		await db.from("render_areas").delete().eq("id", newAreaId);
		return { error: `Failed to update screen: ${regionInsertError.message}` };
	}

	revalidatePath("/");
	return { newAreaId };
}

export async function deleteScreen(screenId: string): Promise<{ error?: string }> {
	const db = createServerClient();

	const { data: screen } = await db
		.from("render_screens")
		.select("screen_variant_id")
		.eq("id", screenId)
		.single();

	const cascade = await deleteScreensCascade(db, [screenId]);
	if (cascade.error) return { error: cascade.error };

	if (screen?.screen_variant_id) {
		const { data: remaining } = await db
			.from("render_screens")
			.select("id")
			.eq("screen_variant_id", screen.screen_variant_id);

		if (!remaining?.length) {
			await db.from("render_screen_variants").delete().eq("id", screen.screen_variant_id);
		}
	}

	revalidatePath("/");
	return {};
}
