import { execFileSync } from "node:child_process";

import { NextResponse } from "next/server";

import { readErrorMessage } from "@/lib/api-error";
import { REPO_ROOT } from "@/lib/server-paths";

// 카탈로그 sync는 kiki repo clone + packages/external 재생성이라 Node 런타임 + dev 로컬 전용.
export const runtime = "nodejs";
// kiki clone + vendor + 재생성은 수십 초까지 걸릴 수 있다.
export const maxDuration = 300;

/**
 * POST /api/catalog/sync
 * kiki 디자인 시스템에서 컴포넌트를 끌어와 @cx/external 을 재생성한다(pnpm sync:kiki).
 * 실제 작업(fetch→vendor→catalog.source 정리→catalog.generated 재생성)은 sync 스크립트가 한다.
 */
export async function POST() {
	try {
		const output = execFileSync("pnpm", ["sync:kiki"], {
			cwd: REPO_ROOT,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});
		return NextResponse.json({ ok: true, output });
	} catch (error) {
		return NextResponse.json(
			{ error: readErrorMessage(error, "카탈로그 동기화에 실패했습니다.") },
			{ status: 500 },
		);
	}
}
