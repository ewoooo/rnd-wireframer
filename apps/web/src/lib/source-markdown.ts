/**
 * Source md → 표시용 블록 변환 규칙 (deterministic, 단일 출처).
 *
 * 화면 소스 md를 미리보기 표로 바꿀 때 매번 즉흥 파싱하지 않고, 이 한 규칙만 따른다.
 * 인식 대상:
 *   - frontmatter: 파일 맨 위 `---` … `---` 사이의 `key: value` 줄.
 *   - heading: `#` ~ `######`.
 *   - GFM table: `|`로 시작하는 행 + 바로 다음 줄이 `|---|---|` 구분선.
 *   - 그 외 비어있지 않은 줄: paragraph.
 * 규칙:
 *   - 셀 안의 `<br>` 는 줄바꿈(`\n`)으로 바꾼다.
 *   - frontmatter 밖의 단독 `---` 는 섹션 구분선이므로 무시한다.
 */

export type SourceMarkdownBlock =
	| { kind: "frontmatter"; rows: Array<{ key: string; value: string }> }
	| { kind: "heading"; level: number; text: string }
	| { kind: "table"; headers: string[]; rows: string[][] }
	| { kind: "paragraph"; text: string };

export function parseSourceMarkdown(markdown: string): SourceMarkdownBlock[] {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	const blocks: SourceMarkdownBlock[] = [];
	let index = 0;

	// 1) frontmatter — 파일 첫 줄이 `---`이면 다음 `---`까지 key: value.
	if (lines[index]?.trim() === "---") {
		index += 1;
		const rows: Array<{ key: string; value: string }> = [];
		while (index < lines.length && lines[index].trim() !== "---") {
			const colon = lines[index].indexOf(":");
			if (colon > -1) {
				rows.push({
					key: lines[index].slice(0, colon).trim(),
					value: lines[index].slice(colon + 1).trim(),
				});
			}
			index += 1;
		}
		if (index < lines.length) index += 1; // 닫는 `---` 소비
		if (rows.length) blocks.push({ kind: "frontmatter", rows });
	}

	// 2) 본문 — heading / table / paragraph.
	while (index < lines.length) {
		const line = lines[index].trim();
		if (!line || line === "---") {
			index += 1;
			continue;
		}

		const heading = /^(#{1,6})\s+(.*)$/.exec(line);
		if (heading) {
			blocks.push({ kind: "heading", level: heading[1].length, text: heading[2].trim() });
			index += 1;
			continue;
		}

		if (line.startsWith("|") && isSeparatorRow(lines[index + 1])) {
			const headers = splitTableRow(line);
			index += 2; // header + separator
			const rows: string[][] = [];
			while (index < lines.length && lines[index].trim().startsWith("|")) {
				rows.push(splitTableRow(lines[index]));
				index += 1;
			}
			blocks.push({ kind: "table", headers, rows });
			continue;
		}

		blocks.push({ kind: "paragraph", text: line });
		index += 1;
	}

	return blocks;
}

function isSeparatorRow(line: string | undefined): boolean {
	if (line === undefined) return false;
	const cells = splitTableRow(line);
	return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell.trim()));
}

function splitTableRow(line: string): string[] {
	let trimmed = line.trim();
	if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
	if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
	return trimmed.split("|").map((cell) => cell.trim().replace(/<br\s*\/?>/gi, "\n"));
}
