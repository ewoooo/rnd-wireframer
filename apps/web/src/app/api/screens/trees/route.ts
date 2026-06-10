import { NextResponse } from "next/server";

import { readErrorMessage } from "@/lib/api-error";
import { listScreens, loadAllScreenTrees } from "@/lib/screen-db-loader";

/**
 * 목록 + 전 화면 렌더 트리를 한 응답으로 반환한다.
 * (기존: 클라가 /api/screens 1회 + /api/screens/{id}/tree 를 화면 수만큼 호출 → 직렬 워터폴 폭발)
 */
export async function GET() {
	try {
		const [summaries, trees] = await Promise.all([listScreens(), loadAllScreenTrees()]);
		const screens = summaries.map((summary) => ({
			...summary,
			renderTree: trees.get(summary.id)?.node,
		}));
		return NextResponse.json({ screens });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "Failed to load screens with trees.") },
			{ status: 500 },
		);
	}
}
