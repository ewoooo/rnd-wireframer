"use server";

import type { SampleArea } from "@/adapters/tables-to-render-tree";
import { createServerClient } from "@/lib/supabase/server";

// area(organism)의 자식 component 구성/순서를 저장한다.
// 캔버스에서 드래그 재정렬·복제·삭제한 결과를 organisms.children 에 반영.
// component 행 자체는 건드리지 않는다(순서/멤버십만 갱신).
//
// 수동 저장이므로 revalidatePath 를 호출하지 않는다. 저장 시점에 클라이언트
// 스토어는 이미 최신 상태이고, revalidate 는 라우터 refresh → 스토어 재초기화
// → Puck content 재빌드를 유발해 캔버스 스크롤이 맨 위로 튀게 만든다.
// DB write 만 수행하고 다음 풀 로드에서 자연히 반영된다.
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

	return {};
}
