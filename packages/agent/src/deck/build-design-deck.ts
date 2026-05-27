import type { DesignDeck, DesignDocumentCard } from "@cx/types/ai-deck";
import type { DesignDocumentId } from "@cx/types/composition-output";
import { parseDesignDocument } from "../design/design-parser";
import { readMarkdownDir } from "./fs-utils";

export interface BuildDesignDeckOptions {
	/** docs/design 디렉터리 */
	docsRoot: string;
	version: string;
	builtAt?: string;
}

/**
 * Schema E의 DesignDocumentId 와 일치하는 8개 문서. 그 외 파일은 무시.
 * 문서 내부 heading 블록을 짧은 rule card로 압축해 Composer가 실제 판단 근거로 읽게 한다.
 */
const ID_WHITELIST: ReadonlySet<DesignDocumentId> = new Set([
	"COMPOSITION_LAYERS.md",
	"DESIGN_FOUNDATION.md",
	"LAYOUT_SPACING_CONTRACT.md",
	"SECTION_PATTERNS.md",
	"SCREEN_PATTERN_SUMMARY.md",
	"COMPONENT_INVENTORY.md",
	"INTERACTION_PATTERNS.md",
	"VISUAL_FOUNDATION_OBSERVATIONS.md",
]);

export async function buildDesignDeck(options: BuildDesignDeckOptions): Promise<DesignDeck> {
	const files = await readMarkdownDir(options.docsRoot);
	const documents: DesignDocumentCard[] = [];

	for (const { filename, content } of files) {
		if (!ID_WHITELIST.has(filename as DesignDocumentId)) continue;
		documents.push(parseDesignDocument(filename as DesignDocumentId, content));
	}

	return {
		builtAt: options.builtAt ?? new Date().toISOString(),
		version: options.version,
		documents,
	};
}
