"use server";

import { revalidatePath } from "next/cache";
import type { SampleArea } from "@/adapters/tables-to-render-tree";
import { createServerClient } from "@/lib/supabase/server";

// area(organism)의 자식 component 구성/순서를 저장한다.
// 캔버스에서 드래그 재정렬·복제·삭제한 결과를 organisms.children 에 반영.
// component 행 자체는 건드리지 않는다(순서/멤버십만 갱신).
export async function updateAreaChildren(
	areaCode: string,
	children: SampleArea["children"],
): Promise<{ error?: string }> {
	const db = createServerClient();

	const { error } = await db
		.from("organisms")
		.update({ children })
		.eq("id", areaCode);

	if (error) return { error: error.message };

	revalidatePath("/");
	return {};
}
