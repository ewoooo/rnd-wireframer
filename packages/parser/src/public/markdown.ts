import type {
	MarkdownSourceFileInput,
	ParseMarkdownSourceBundleInput,
	ParseMarkdownSourceBundleResult,
	ParserIssue,
	SourceFileKind,
	SourceSpec,
	SourceSpecArea,
	SourceSpecComponent,
	SourceSpecFile,
} from "./types";

const SCHEMA_VERSION = "generation-v2.source-spec.v0.1" as const;

const COMPONENT_KEY_PATTERN = /^\s*(?:-|[*])?\s*(?:component|componentType)\s*[:：]\s*(.+?)\s*$/gim;
const COMPONENT_LINE_PATTERN = /^\s*(?:-|[*])?\s*([A-Z][A-Za-z0-9]+)\s*$/gm;
const SOURCE_SCREEN_CODE_KEYS = ["screenCode", "화면 ID"] as const;
const SOURCE_SCREEN_NAME_KEYS = ["title", "화면 명"] as const;
const SOURCE_ROUTE_KEYS = ["route"] as const;
const SOURCE_AREA_NO_KEYS = ["sourceAreaNo", "areaNo", "area", "영역"] as const;

const SCREEN_COMPOSITION_TABLE = {
	section: "화면 구성",
	columns: {
		areaNo: "no.",
		description: "영역 설명",
		type: "영역 유형",
	},
} as const;

const COMPONENT_DETAIL_TABLE = {
	section: "컴포넌트 상세",
	columns: {
		areaNo: "영역",
		componentId: "컴포넌트 ID",
		description: "컴포넌트 설명",
		displayText: "표시 텍스트",
		name: "컴포넌트 명",
		variant: "variant",
	},
} as const;

export function parseMarkdownSourceBundle(
	input: ParseMarkdownSourceBundleInput,
): ParseMarkdownSourceBundleResult {
	const issues: ParserIssue[] = [];
	const files = input.files.map((file, index) => parseFileMetadata(file, index, issues));
	const screenInput = input.files.find((file) => resolveKind(file) === "screen") ?? input.files[0];

	if (!screenInput) {
		issues.push({
			code: "missing-screen-source",
			message: "At least one markdown source file is required.",
			path: ["files"],
			severity: "error",
		});
		return { ok: false, issues };
	}

	const screenCode = resolveScreenCode(screenInput);
	const screenName = resolveTitle(screenInput);
	const sourceSpec: SourceSpec = {
		schemaVersion: SCHEMA_VERSION,
		sourceImport: {
			importId: input.importId,
			sourceKind: "prdd-markdown-bundle",
			receivedAt: input.receivedAt ?? "1970-01-01T00:00:00.000Z",
			files,
		},
		sourceShape: {
			screen: {
				screenCode,
				name: screenName,
				route: extractRoute(screenInput.content, screenCode),
				areas: extractAreas(input.files),
			},
			components: extractComponents(input.files),
		},
	};

	return {
		ok: issues.every((issue) => issue.severity !== "error"),
		issues,
		sourceSpec,
	};
}

function parseFileMetadata(
	file: MarkdownSourceFileInput,
	index: number,
	issues: ParserIssue[],
): SourceSpecFile {
	const kind = resolveKind(file);
	const title = resolveTitle(file);
	if (file.content.trim().length === 0) {
		issues.push({
			code: "empty-content",
			message: `Markdown source is empty: ${file.path}.`,
			path: ["files", index, "content"],
			severity: "error",
		});
	}
	if (!title) {
		issues.push({
			code: "missing-title",
			message: `Markdown source has no title: ${file.path}.`,
			path: ["files", index, "title"],
			severity: "warning",
		});
	}

	return {
		id: file.id ?? `source-${kind}-${slugFromPath(file.path)}`,
		kind,
		path: file.path,
		title: title || slugFromPath(file.path),
		checksum: stableTextChecksum(file.content),
		...(kind === "screen" ? { screenCode: resolveScreenCode(file) } : {}),
		...(kind === "area" ? { areaCode: resolveAreaCode(file) } : {}),
	};
}

function resolveKind(file: MarkdownSourceFileInput): SourceFileKind {
	if (file.kind) return file.kind;
	const lowerPath = file.path.toLowerCase();
	if (lowerPath.includes("/screen/") || lowerPath.includes("screen")) return "screen";
	if (lowerPath.includes("/area/") || lowerPath.includes("ogn-")) return "area";
	if (lowerPath.includes("/component/")) return "component";
	return "unknown";
}

function resolveTitle(file: MarkdownSourceFileInput): string {
	return (
		file.title ??
		extractFirstValue(file.content, SOURCE_SCREEN_NAME_KEYS) ??
		extractFirstHeading(file.content) ??
		""
	);
}

function resolveScreenCode(file: MarkdownSourceFileInput): string {
	return (
		file.screenCode ??
		extractFirstValue(file.content, SOURCE_SCREEN_CODE_KEYS) ??
		extractCodeLike(file.path, /([A-Z][A-Z0-9]+-[A-Z0-9-]+-\d+(?:-\d+)?)/) ??
		slugFromPath(file.path)
	);
}

function resolveAreaCode(file: MarkdownSourceFileInput): string {
	return (
		file.areaCode ??
		extractKeyValue(file.content, "areaCode") ??
		extractCodeLike(file.path, /(OGN-[A-Z0-9-]+)/) ??
		slugFromPath(file.path)
	);
}

function extractAreas(files: MarkdownSourceFileInput[]): SourceSpecArea[] {
	const explicitAreas = files
		.filter((file) => resolveKind(file) === "area")
		.map((file, index) => ({
			sourceAreaNo: extractAreaNo(file.content) ?? (index + 1) * 10,
			slotHint: inferSlotHint(file.content),
			name: resolveTitle(file) || resolveAreaCode(file),
		}));

	if (explicitAreas.length > 0) return explicitAreas;

	const screen = files.find((file) => resolveKind(file) === "screen") ?? files[0];
	if (!screen) return [];

	const tableAreas = extractAreasFromCompositionTable(screen.content);
	return tableAreas.length > 0 ? tableAreas : extractAreasFromScreenMarkdown(screen.content);
}

function extractAreasFromCompositionTable(content: string): SourceSpecArea[] {
	const rows = extractTableRowsFromSection(content, SCREEN_COMPOSITION_TABLE.section);
	return rows
		.map((row) => {
			const sourceAreaNo = parseNumberCell(row[SCREEN_COMPOSITION_TABLE.columns.areaNo]);
			if (sourceAreaNo === undefined) return undefined;
			const description = row[SCREEN_COMPOSITION_TABLE.columns.description] ?? "";
			const type = row[SCREEN_COMPOSITION_TABLE.columns.type] ?? "";

			return {
				sourceAreaNo,
				slotHint: inferSlotHint(`${description} ${type}`),
				name: normalizeMarkdownCell(description || `영역 ${sourceAreaNo}`),
			} satisfies SourceSpecArea;
		})
		.filter((area): area is SourceSpecArea => Boolean(area));
}

function extractAreasFromScreenMarkdown(content: string): SourceSpecArea[] {
	const headings = extractHeadings(content).filter((heading) =>
		/(area|영역|섹션|ogn|cta|header|bottom|contents|본문|하단|상단)/i.test(heading),
	);
	return headings.map((heading, index) => ({
		sourceAreaNo: (index + 1) * 10,
		slotHint: inferSlotHint(heading),
		name: cleanupHeadingLabel(heading),
	}));
}

function extractComponents(files: MarkdownSourceFileInput[]): SourceSpecComponent[] {
	const components: SourceSpecComponent[] = [];
	for (const file of files) {
		const tableComponents = extractComponentsFromDetailTable(file.content);
		if (tableComponents.length > 0) {
			components.push(...tableComponents);
			continue;
		}

		for (const hint of extractComponentHints(file.content)) {
			components.push({
				sourceComponentId: hint.name,
				sourceAreaNo: extractAreaNo(file.content),
				label: extractNearestLabel(file.content, hint.index) ?? hint.name,
				text: extractKeyValue(file.content, "text") ?? extractKeyValue(file.content, "label"),
			});
		}
	}

	return dedupeComponents(components);
}

function extractComponentsFromDetailTable(content: string): SourceSpecComponent[] {
	const rows = extractTableRowsFromSection(content, COMPONENT_DETAIL_TABLE.section);
	return rows
		.map((row) => {
			const sourceComponentId = normalizeMarkdownCell(
				row[COMPONENT_DETAIL_TABLE.columns.componentId] ?? "",
			);
			if (!sourceComponentId || sourceComponentId === "-") return undefined;

			const sourceAreaNo = parseNumberCell(row[COMPONENT_DETAIL_TABLE.columns.areaNo]);
			const label =
				normalizeMarkdownCell(row[COMPONENT_DETAIL_TABLE.columns.name] ?? "") ||
				normalizeMarkdownCell(row[COMPONENT_DETAIL_TABLE.columns.description] ?? "") ||
				sourceComponentId;
			const text = normalizeDisplayText(row[COMPONENT_DETAIL_TABLE.columns.displayText]);
			const variant = normalizeOptionalCell(row[COMPONENT_DETAIL_TABLE.columns.variant]);

			return {
				sourceComponentId,
				...(sourceAreaNo === undefined ? {} : { sourceAreaNo }),
				label,
				...(text ? { text } : {}),
				...(variant ? { variant } : {}),
			} satisfies SourceSpecComponent;
		})
		.filter((component): component is SourceSpecComponent => Boolean(component));
}

function extractComponentHints(content: string): Array<{ index: number; name: string }> {
	const explicitHints = [...content.matchAll(COMPONENT_KEY_PATTERN)].flatMap((match) => {
		const rawValue = match[1] ?? "";
		const names = rawValue
			.split(/[,/]/)
			.map((value) => value.trim())
			.filter(Boolean);
		return names.map((name) => ({ index: match.index ?? 0, name }));
	});
	if (explicitHints.length > 0) return explicitHints;

	return [...content.matchAll(COMPONENT_LINE_PATTERN)]
		.map((match) => ({ index: match.index ?? 0, name: match[1] ?? "" }))
		.filter((hint) => hint.name.length > 0);
}

function extractRoute(content: string, screenCode: string): string {
	return (
		extractFirstValue(content, SOURCE_ROUTE_KEYS) ??
		`/${screenCode.toLowerCase().replaceAll("-", "/")}`
	);
}

function extractFirstHeading(content: string): string | undefined {
	return extractHeadings(content)[0];
}

function extractHeadings(content: string): string[] {
	return content
		.split(/\r?\n/)
		.map(extractHeadingFromLine)
		.filter((heading): heading is string => Boolean(heading));
}

function extractHeadingFromLine(line: string): string | undefined {
	return line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/)?.[1]?.trim();
}

function extractKeyValue(content: string, key: string): string | undefined {
	const pattern = new RegExp(`^\\s*(?:-|\\*)?\\s*${key}\\s*[:：]\\s*(.+?)\\s*$`, "im");
	return content.match(pattern)?.[1]?.trim();
}

function extractFirstValue(content: string, keys: readonly string[]): string | undefined {
	for (const key of keys) {
		const value = extractKeyValue(content, key);
		if (value) return value;
	}
	return undefined;
}

function extractAreaNo(content: string): number | undefined {
	return parseNumberCell(extractFirstValue(content, SOURCE_AREA_NO_KEYS));
}

function inferSlotHint(content: string): SourceSpecArea["slotHint"] {
	const lower = content.toLowerCase();
	if (/header|상단|앱바/.test(lower)) return "header";
	if (/bottom|하단|cta|버튼/.test(lower)) return "bottom";
	if (/contents|content|본문|요약|상세/.test(lower)) return "contents";
	return "unknown";
}

function extractCodeLike(value: string, pattern: RegExp): string | undefined {
	return value.match(pattern)?.[1];
}

function extractNearestLabel(content: string, index: number): string | undefined {
	const before = content.slice(0, index).split(/\r?\n/).slice(-3).join("\n");
	return extractKeyValue(before, "label") ?? extractFirstHeading(before);
}

function cleanupHeadingLabel(value: string): string {
	return value.replace(/^(area|영역|섹션|ogn)\s*[:：-]?\s*/i, "").trim();
}

function dedupeComponents(components: SourceSpecComponent[]): SourceSpecComponent[] {
	const seen = new Set<string>();
	return components.filter((component) => {
		const key = `${component.sourceComponentId}:${component.sourceAreaNo ?? "unknown"}:${component.label}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

type MarkdownTableRow = Record<string, string>;

function extractTableRowsFromSection(content: string, sectionTitle: string): MarkdownTableRow[] {
	const section = extractSectionContent(content, sectionTitle);
	if (!section) return [];

	const tableLines = section
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.startsWith("|") && line.endsWith("|"));

	if (tableLines.length < 2) return [];

	const headers = splitMarkdownTableRow(tableLines[0] ?? "");
	const bodyLines = tableLines.slice(2);

	return bodyLines
		.map((line) => splitMarkdownTableRow(line))
		.filter((cells) => cells.some((cell) => cell.length > 0))
		.map((cells) =>
			Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])),
		);
}

function extractSectionContent(content: string, sectionTitle: string): string | undefined {
	const lines = content.split(/\r?\n/);
	const startIndex = lines.findIndex((line) => extractHeadingFromLine(line) === sectionTitle);
	if (startIndex < 0) return undefined;

	const nextSectionIndex = lines.findIndex(
		(line, index) => index > startIndex && /^\s{0,3}#{1,6}\s+/.test(line),
	);

	return lines
		.slice(startIndex + 1, nextSectionIndex < 0 ? undefined : nextSectionIndex)
		.join("\n");
}

function splitMarkdownTableRow(line: string): string[] {
	return line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(normalizeMarkdownCell);
}

function normalizeMarkdownCell(value: string | undefined): string {
	return (value ?? "")
		.replaceAll("<br>", "\n")
		.replaceAll("<br/>", "\n")
		.replaceAll("<br />", "\n")
		.trim();
}

function normalizeOptionalCell(value: string | undefined): string | undefined {
	const normalized = normalizeMarkdownCell(value);
	return normalized && normalized !== "-" ? normalized : undefined;
}

function normalizeDisplayText(value: string | undefined): string | undefined {
	return normalizeOptionalCell(value);
}

function parseNumberCell(value: string | undefined): number | undefined {
	const normalized = normalizeMarkdownCell(value);
	const parsed = normalized ? Number.parseInt(normalized, 10) : Number.NaN;
	return Number.isFinite(parsed) ? parsed : undefined;
}

function slugFromPath(path: string): string {
	const name =
		path
			.split(/[\\/]/)
			.at(-1)
			?.replace(/\.[^.]+$/, "") ?? "source";
	return name.replace(/[^A-Za-z0-9가-힣_-]+/g, "-").replace(/^-+|-+$/g, "") || "source";
}

function stableTextChecksum(value: string): string {
	let hash = 5381;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 33) ^ value.charCodeAt(index);
	}
	return `mvp-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
