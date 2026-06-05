"use server";

import type { SampleArea } from "@/adapters/tables-to-render-tree";
import { createServerClient } from "@/lib/supabase/server";

// area의 자식 component 구성/순서를 render_area_children(정규화 junction)에 저장한다.
// 캔버스에서 드래그 재정렬·복제·삭제한 결과를 반영. component 행 자체는 건드리지 않는다.
// 해당 area의 기존 junction 행을 모두 지우고 순서대로 다시 삽입한다(replace).
//
// 수동 저장이므로 revalidatePath 를 호출하지 않는다. 저장 시점에 클라이언트
// 스토어는 이미 최신 상태이고, revalidate 는 라우터 refresh → 스토어 재초기화
// → Puck content 재빌드를 유발해 캔버스 스크롤이 맨 위로 튀게 만든다.
export async function updateAreaChildren(
	areaCode: string,
	children: SampleArea["children"],
): Promise<{ error?: string }> {
	const db = createServerClient();

	const { error: deleteError } = await db
		.from("render_area_children")
		.delete()
		.eq("area_id", areaCode);
	if (deleteError) return { error: deleteError.message };

	const rows = children.map((child, index) => ({
		id: crypto.randomUUID(),
		area_id: areaCode,
		component_id: child.id,
		order_index: index,
	}));

	if (rows.length > 0) {
		const { error: insertError } = await db.from("render_area_children").insert(rows);
		if (insertError) return { error: insertError.message };
	}

	return {};
}
