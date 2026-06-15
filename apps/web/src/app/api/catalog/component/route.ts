import { execFileSync } from "node:child_process";

import { NextResponse } from "next/server";

import { readErrorMessage } from "@/lib/api-error";
import { REPO_ROOT } from "@/lib/server-paths";

// cmp 삭제는 디스크의 packages/external 을 변경하므로 Node 런타임 + dev 로컬 전용.
export const runtime = "nodejs";

/**
 * DELETE /api/catalog/component?type=kiki.<Name>
 * 로컬 @cx/external 카탈로그에서 컴포넌트 하나를 제거한다(round-trip: sync:kiki 로 복원).
 * 실제 작업(dir 삭제 + catalog.source prune + 재생성)은 delete-component 스크립트가 한다.
 */
export async function DELETE(request: Request) {
	const type = new URL(request.url).searchParams.get("type");
	if (!type || !/^kiki\.[A-Za-z][A-Za-z0-9]*$/.test(type)) {
		return NextResponse.json({ error: "유효하지 않은 type (kiki.<Name> 형식 필요)" }, { status: 400 });
	}
	try {
		const output = execFileSync(
			"pnpm",
			["exec", "tsx", "scripts/sync-catalog/delete-component.ts", type],
			{ cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
		);
		return NextResponse.json({ ok: true, type, output });
	} catch (error) {
		// 스크립트가 stderr로 남긴 메시지(예: 의존성 가드)를 그대로 전달한다.
		const stderr = (error as { stderr?: unknown })?.stderr;
		const detail = typeof stderr === "string" ? stderr.trim() : "";
		return NextResponse.json(
			{ error: detail || readErrorMessage(error, "컴포넌트 삭제에 실패했습니다.") },
			{ status: 500 },
		);
	}
}
