import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
	DesignContextBundleContent,
	DesignContextBundleId,
	DesignContextBundleRef,
} from "@cx/schema";

const DEFAULT_DESIGN_CONTEXT_DIR = "packages/agent/docs/design-context";

/** 번들 id -> agent docs 파일명. switch 대신 테이블로 구동한다. */
const BUNDLE_FILE_BY_ID = {
	"interaction-state": "interaction-state.md",
	"layout-composition": "layout-composition.md",
	"quality-review": "quality-review.md",
	"visual-foundation": "visual-foundation.md",
} as const satisfies Record<DesignContextBundleId, string>;

/**
 * Loads the design-context bundle bodies for the selected refs.
 * orchestration이 ref만 선택하고, 본문 IO는 pipeline 경계인 이 함수가 소유한다.
 * 파일이 없는 번들은 조용히 생략한다.
 */
export async function loadDesignContextBundleContents(
	refs: DesignContextBundleRef[],
	rootDir = DEFAULT_DESIGN_CONTEXT_DIR,
): Promise<DesignContextBundleContent[]> {
	const contents: DesignContextBundleContent[] = [];

	for (const ref of refs) {
		const fileName = BUNDLE_FILE_BY_ID[ref.id];
		if (!fileName) continue;

		const fullPath = path.join(rootDir, fileName);
		if (!(await isFile(fullPath))) continue;

		contents.push({ ...ref, body: await readFile(fullPath, "utf8") });
	}

	return contents;
}

async function isFile(filePath: string): Promise<boolean> {
	try {
		return (await stat(filePath)).isFile();
	} catch {
		return false;
	}
}
