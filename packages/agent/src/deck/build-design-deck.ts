import type { DesignDeck, DesignDocumentAppliesTo, DesignDocumentCard } from "@cx/types/ai-deck";
import type { DesignDocumentId } from "@cx/types/composition-output";
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
		documents.push(parseDocument(filename as DesignDocumentId, content));
	}

	return {
		builtAt: options.builtAt ?? new Date().toISOString(),
		version: options.version,
		documents,
	};
}

function parseDocument(id: DesignDocumentId, content: string): DesignDocumentCard {
	const title = extractTitle(content) ?? id.replace(/\.md$/, "").replace(/_/g, " ");
	const responsibility = extractResponsibility(content);
	return {
		id,
		title,
		responsibility,
		rules: extractRules(id, content),
	};
}

function extractTitle(content: string): string | undefined {
	const match = /^#\s+(.+)$/m.exec(content);
	return match?.[1]?.trim();
}

/**
 * 문서 첫 비제목 단락을 책임 요약으로 본다.
 * v1 휴리스틱 — 정교화는 후속 단계.
 */
function extractResponsibility(content: string): string {
	const lines = content.split(/\r?\n/);
	let pastTitle = false;
	const buffer: string[] = [];
	for (const line of lines) {
		const trimmed = line.trim();
		if (!pastTitle) {
			if (trimmed.startsWith("#")) pastTitle = true;
			continue;
		}
		if (trimmed.startsWith("#")) break;
		if (trimmed.length === 0) {
			if (buffer.length > 0) break;
			continue;
		}
		buffer.push(trimmed);
	}
	return buffer.join(" ");
}

interface HeadingBlock {
	level: number;
	title: string;
	body: string[];
}

const MAX_RULES_PER_DOC = 24;
const MAX_SUMMARY_LENGTH = 220;

function extractRules(id: DesignDocumentId, content: string): DesignDocumentCard["rules"] {
	const blocks = parseHeadingBlocks(content).filter(
		(block) => block.level >= 2 && block.level <= 3,
	);
	const rules: DesignDocumentCard["rules"] = [];
	for (const block of blocks) {
		const summary = summarizeBlock(block);
		if (!summary) continue;
		rules.push({
			id: makeRuleId(id, block.title, rules.length + 1),
			section: block.title,
			summary,
			appliesTo: inferAppliesTo(id, block.title, summary),
		});
		if (rules.length >= MAX_RULES_PER_DOC) break;
	}
	return rules;
}

function parseHeadingBlocks(content: string): HeadingBlock[] {
	const lines = content.split(/\r?\n/);
	const blocks: HeadingBlock[] = [];
	let current: HeadingBlock | undefined;

	for (const line of lines) {
		const heading = /^(#{1,4})\s+(.+)$/.exec(line);
		if (heading) {
			if (current) blocks.push(current);
			current = {
				level: heading[1].length,
				title: cleanupInlineMarkdown(heading[2]),
				body: [],
			};
			continue;
		}
		current?.body.push(line);
	}
	if (current) blocks.push(current);
	return blocks;
}

function summarizeBlock(block: HeadingBlock): string {
	const candidates: string[] = [];
	for (const rawLine of block.body) {
		const line = cleanupLine(rawLine);
		if (!line) continue;
		if (line.startsWith("|")) continue;
		if (/^[-:]+$/.test(line)) continue;
		candidates.push(line);
		if (candidates.join(" ").length >= MAX_SUMMARY_LENGTH) break;
	}
	return truncate(candidates.join(" "), MAX_SUMMARY_LENGTH);
}

function cleanupLine(line: string): string {
	const trimmed = line.trim();
	if (!trimmed) return "";
	if (trimmed.startsWith("```")) return "";
	if (trimmed.startsWith(">")) return cleanupInlineMarkdown(trimmed.replace(/^>\s*/, ""));
	return cleanupInlineMarkdown(trimmed.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""));
}

function cleanupInlineMarkdown(text: string): string {
	return text
		.replace(/\\_/g, "_")
		.replace(/\*\*/g, "")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.trim();
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function makeRuleId(id: DesignDocumentId, section: string, index: number): string {
	const slug = section
		.toLowerCase()
		.replace(/[^a-z0-9가-힣]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return `${id.replace(/\.md$/, "").toLowerCase()}-${slug || index}`;
}

function inferAppliesTo(
	id: DesignDocumentId,
	section: string,
	summary: string,
): DesignDocumentAppliesTo[] {
	const text = `${id} ${section} ${summary}`.toLowerCase();
	const tags = new Set<DesignDocumentAppliesTo>();

	if (/screen|스크린|화면|page|pagestack|popup|bottom sheet|바텀시트|팝업/.test(text)) {
		tags.add("screen");
	}
	if (/area|section|섹션|영역|slot|region|con 슬롯/.test(text)) {
		tags.add("area");
	}
	if (/component|컴포넌트|accordion|button|badge|card|list|field|chip|icon/.test(text)) {
		tags.add("componentPattern");
	}
	if (/interaction|인터랙션|state|상태|cta|form|폼|overlay|오버레이|click|선택/.test(text)) {
		tags.add("interaction");
	}
	if (
		/layout|spacing|grid|width|rail|chrome|radius|token|color|typography|타이포|간격|마진|패딩/.test(
			text,
		)
	) {
		tags.add("layoutPattern");
	}

	if (tags.size === 0) {
		if (id === "INTERACTION_PATTERNS.md") tags.add("interaction");
		else if (id === "COMPONENT_INVENTORY.md") tags.add("componentPattern");
		else if (id === "LAYOUT_SPACING_CONTRACT.md" || id === "DESIGN_FOUNDATION.md") {
			tags.add("layoutPattern");
		} else {
			tags.add("screen");
			tags.add("area");
		}
	}

	return [...tags];
}
