import { RENDER_TREE_NODE_TYPE, type RenderTreeAreaNodeType, SCHEMA_VERSION } from "@cx/schema";
import type {
	MarkdownSourceFileInput,
	ParseMarkdownSourceBundleInput,
	ParseMarkdownSourceBundleResult,
	ParserIssue,
	SourceFileKind,
	SourceSpec,
	SourceSpecAreaNode,
	SourceSpecComponentNode,
	SourceSpecFile,
	SourceSpecRegion,
	SourceSpecRegionSlot,
} from "./types";

const COMPONENT_KEY_PATTERN = /^\s*(?:-|[*])?\s*(?:component|componentType)\s*[:：]\s*(.+?)\s*$/gim;
const COMPONENT_LINE_PATTERN = /^\s*(?:-|[*])?\s*([A-Z][A-Za-z0-9]+)\s*$/gm;
const SOURCE_SCREEN_CODE_KEYS = ["screenCode", "화면 ID"] as const;
const SOURCE_SCREEN_NAME_KEYS = ["title", "화면 명"] as const;
const SOURCE_ROUTE_KEYS = ["route"] as const;
const SOURCE_AREA_NO_KEYS = ["sourceAreaNo", "areaNo", "area", "영역"] as const;

const SCREEN_COMPOSITION_TABLE = {
	section: "화면 구성",
	columns: {
		areaName: ["섹션 명", "영역 명", "areaName"],
		areaNo: ["no.", "섹션 번호", "영역"],
		description: ["영역 설명", "섹션 설명"],
		errorPolicy: "오류 처리 방식",
		layout: ["영역 레이아웃", "섹션 레이아웃"],
		maxCount: "노출 개수 (최대)",
		minCount: "노출 개수 (최소)",
		type: ["영역 유형", "섹션 유형"],
		visibility: "노출 조건",
	},
} as const;

const COMPONENT_DETAIL_TABLE = {
	section: "컴포넌트 상세",
	columns: {
		areaNo: ["영역", "섹션 명"],
		bindingSource: "바인딩(소스)",
		componentId: "컴포넌트 ID",
		description: "컴포넌트 설명",
		displayText: "표시 텍스트",
		name: "컴포넌트 명",
		note: "비고",
		props: "props",
		variant: "variant",
	},
} as const;

type SourceAreaDraft = {
	areaType?: "dynamic" | "static";
	description?: string;
	errorPolicy?: string;
	layout?: string;
	maxCount?: string;
	minCount?: string;
	renderNodeType?: RenderTreeAreaNodeType;
	sourceAreaId: string;
	sourceAreaName?: string;
	visibility?: string;
};

type SourceComponentDraft = SourceSpecComponentNode & {
	sourceAreaId?: string;
};

// Markdown source bundle 전체를 SourceSpec result envelope로 변환한다.
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
	const components = extractComponents(input.files);
	const areas = appendImplicitAreas(extractAreas(input.files), components);
	const sourceSpec: SourceSpec = {
		schemaVersion: SCHEMA_VERSION.sourceSpec,
		sourceImport: {
			importId: input.importId,
			sourceKind: "markdown",
			receivedAt: input.receivedAt ?? "1970-01-01T00:00:00.000Z",
			files,
		},
		sourceShape: {
			screen: {
				screenCode,
				name: screenName,
				route: extractRoute(screenInput.content, screenCode),
				regions: buildRegions(areas, components),
			},
		},
	};

	return {
		ok: issues.every((issue) => issue.severity !== "error"),
		issues,
		sourceSpec,
	};
}

// 개별 Markdown 파일의 kind, title, checksum 등 SourceSpec 파일 metadata를 만든다.
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

// 명시된 kind가 없을 때 path 힌트로 screen/area/component 파일 유형을 추론한다.
function resolveKind(file: MarkdownSourceFileInput): SourceFileKind {
	if (file.kind) return file.kind;
	const lowerPath = file.path.toLowerCase();
	if (lowerPath.includes("/screen/") || lowerPath.includes("screen")) return "screen";
	if (lowerPath.includes("/area/") || lowerPath.includes("ogn-")) return "area";
	if (lowerPath.includes("/component/")) return "component";
	return "unknown";
}

// 입력 title, front matter key-value, 첫 heading 순서로 화면/영역 제목을 정한다.
function resolveTitle(file: MarkdownSourceFileInput): string {
	return (
		file.title ??
		extractFirstValue(file.content, SOURCE_SCREEN_NAME_KEYS) ??
		extractFirstHeading(file.content) ??
		""
	);
}

// screenCode 명시값, Markdown key-value, 파일명 코드, slug 순서로 화면 코드를 정한다.
function resolveScreenCode(file: MarkdownSourceFileInput): string {
	return (
		file.screenCode ??
		extractFirstValue(file.content, SOURCE_SCREEN_CODE_KEYS) ??
		extractCodeLike(file.path, /([A-Z][A-Z0-9]+-[A-Z0-9-]+-\d+(?:-\d+)?)/) ??
		slugFromPath(file.path)
	);
}

// areaCode 명시값, Markdown key-value, OGN 코드, 파일 slug 순서로 영역 코드를 정한다.
function resolveAreaCode(file: MarkdownSourceFileInput): string {
	return (
		file.areaCode ??
		extractKeyValue(file.content, "areaCode") ??
		extractCodeLike(file.path, /(OGN-[A-Z0-9-]+)/) ??
		slugFromPath(file.path)
	);
}

// area 파일, 화면 구성 표, heading fallback 순서로 source area id 목록을 추출한다.
function extractAreas(files: MarkdownSourceFileInput[]): SourceAreaDraft[] {
	const explicitAreas = files
		.filter((file) => resolveKind(file) === "area")
		.map((file, index) => ({
			sourceAreaId: extractAreaId(file.content) ?? String((index + 1) * 10),
		}));

	if (explicitAreas.length > 0) return explicitAreas;

	const screen = files.find((file) => resolveKind(file) === "screen") ?? files[0];
	if (!screen) return [];

	const tableAreas = extractAreasFromCompositionTable(screen.content);
	return tableAreas.length > 0 ? tableAreas : extractAreasFromScreenMarkdown(screen.content);
}

// PRDD의 "화면 구성" 표를 읽어 region 아래에 놓일 area id를 만든다.
function extractAreasFromCompositionTable(content: string): SourceAreaDraft[] {
	const rows = extractTableRowsFromSection(content, SCREEN_COMPOSITION_TABLE.section);
	return rows
		.map((row) => {
			const sourceAreaId = normalizeAreaIdCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.areaNo),
			);
			if (!sourceAreaId) return undefined;

			const sourceAreaName = normalizeOptionalCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.areaName),
			);
			const areaType = normalizeAreaType(getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.type));
			const description = normalizeOptionalCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.description),
			);
			const layout = normalizeOptionalCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.layout),
			);
			const visibility = normalizeOptionalCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.visibility),
			);
			const minCount = normalizeOptionalCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.minCount),
			);
			const maxCount = normalizeOptionalCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.maxCount),
			);
			const errorPolicy = normalizeOptionalCell(
				getFirstCell(row, SCREEN_COMPOSITION_TABLE.columns.errorPolicy),
			);
			return {
				...(areaType ? { areaType, renderNodeType: toAreaRenderNodeType(areaType) } : {}),
				...(description ? { description } : {}),
				...(errorPolicy ? { errorPolicy } : {}),
				...(layout ? { layout } : {}),
				...(maxCount ? { maxCount } : {}),
				...(minCount ? { minCount } : {}),
				sourceAreaId,
				...(sourceAreaName ? { sourceAreaName } : {}),
				...(visibility ? { visibility } : {}),
			} satisfies SourceAreaDraft;
		})
		.filter((area): area is SourceAreaDraft => Boolean(area));
}

// 표가 없을 때 area/section 관련 heading을 가벼운 area 후보로 사용한다.
function extractAreasFromScreenMarkdown(content: string): SourceAreaDraft[] {
	const headings = extractHeadings(content).filter((heading) =>
		/(area|영역|섹션|ogn|cta|header|bottom|contents|본문|하단|상단)/i.test(heading),
	);
	return headings.map((_heading, index) => ({
		sourceAreaId: String((index + 1) * 10),
	}));
}

// 각 파일에서 컴포넌트 상세 표 또는 component 힌트를 모아 중복 제거된 컴포넌트 목록을 만든다.
function extractComponents(files: MarkdownSourceFileInput[]): SourceComponentDraft[] {
	const components: SourceComponentDraft[] = [];
	const areaIdByName = createAreaIdByName(files);
	for (const file of files) {
		const tableComponents = extractComponentsFromDetailTable(file.content, areaIdByName);
		if (tableComponents.length > 0) {
			components.push(...tableComponents);
			continue;
		}

		for (const hint of extractComponentHints(file.content)) {
			components.push({
				kind: "component",
				sourceComponentId: hint.name,
				sourceAreaId: extractAreaId(file.content),
				label: extractNearestLabel(file.content, hint.index) ?? hint.name,
				text: extractKeyValue(file.content, "text") ?? extractKeyValue(file.content, "label"),
			});
		}
	}

	return dedupeComponents(components);
}

// PRDD의 "컴포넌트 상세" 표를 SourceSpec component 목록으로 변환한다.
function extractComponentsFromDetailTable(
	content: string,
	areaIdByName: Map<string, string> = new Map(),
): SourceComponentDraft[] {
	const rows = extractTableRowsFromSection(content, COMPONENT_DETAIL_TABLE.section);
	return rows
		.map((row) => {
			const componentName = normalizeOptionalCell(row[COMPONENT_DETAIL_TABLE.columns.name]);
			const componentType = normalizeOptionalCell(row[COMPONENT_DETAIL_TABLE.columns.componentId]);
			const sourceComponentId = componentType ?? componentName;
			if (!sourceComponentId || sourceComponentId === "-") return undefined;

			const label =
				componentName ||
				normalizeMarkdownCell(row[COMPONENT_DETAIL_TABLE.columns.description] ?? "") ||
				sourceComponentId;
			const description = normalizeOptionalCell(row[COMPONENT_DETAIL_TABLE.columns.description]);
			const propsText = normalizeOptionalCell(row[COMPONENT_DETAIL_TABLE.columns.props]);
			const text = normalizeDisplayText(row[COMPONENT_DETAIL_TABLE.columns.displayText]);
			const bindingSource = normalizeOptionalCell(
				row[COMPONENT_DETAIL_TABLE.columns.bindingSource],
			);
			const note = normalizeOptionalCell(row[COMPONENT_DETAIL_TABLE.columns.note]);
			const variant = normalizeOptionalCell(row[COMPONENT_DETAIL_TABLE.columns.variant]);
			const areaCell = normalizeOptionalCell(
				getFirstCell(row, COMPONENT_DETAIL_TABLE.columns.areaNo),
			);
			const sourceAreaId =
				normalizeAreaIdCell(areaCell) ?? (areaCell ? areaIdByName.get(areaCell) : undefined);
			const raw = createComponentRawSource({
				bindingSource,
				description,
				displayText: text,
				note,
				propsText,
			});
			const props = parsePropsCell(propsText ?? text);

			return {
				kind: "component",
				sourceComponentId,
				...(componentType ? { componentType } : {}),
				...(componentName ? { roleAlias: componentName, sourceId: componentName } : {}),
				...(description ? { description } : {}),
				...(sourceAreaId ? { sourceAreaId } : {}),
				label,
				...(props ? { props } : {}),
				...(raw ? { raw } : {}),
				...(text ? { text } : {}),
				...(variant ? { variant } : {}),
			} satisfies SourceComponentDraft;
		})
		.filter((component): component is SourceComponentDraft => Boolean(component));
}

function createComponentRawSource(input: {
	bindingSource?: string;
	description?: string;
	displayText?: string;
	note?: string;
	propsText?: string;
}): SourceSpecComponentNode["raw"] | undefined {
	if (
		!input.bindingSource &&
		!input.description &&
		!input.displayText &&
		!input.note &&
		!input.propsText
	) {
		return undefined;
	}

	return {
		...(input.bindingSource ? { bindingSource: input.bindingSource } : {}),
		...(input.description ? { description: input.description } : {}),
		...(input.displayText ? { displayText: input.displayText } : {}),
		...(input.note ? { note: input.note } : {}),
		...(input.propsText ? { propsText: input.propsText } : {}),
	};
}

// 표가 없을 때 component/componentType key-value 또는 대문자 컴포넌트명 라인을 힌트로 수집한다.
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

// route 명시값이 없으면 screenCode를 URL path 형태로 낮춰 기본 route를 만든다.
function extractRoute(content: string, screenCode: string): string {
	return (
		extractFirstValue(content, SOURCE_ROUTE_KEYS) ??
		`/${screenCode.toLowerCase().replaceAll("-", "/")}`
	);
}

// Markdown 문서에서 첫 heading만 반환한다.
function extractFirstHeading(content: string): string | undefined {
	return extractHeadings(content)[0];
}

// Markdown 문서의 모든 ATX heading 텍스트를 순서대로 추출한다.
function extractHeadings(content: string): string[] {
	return content
		.split(/\r?\n/)
		.map(extractHeadingFromLine)
		.filter((heading): heading is string => Boolean(heading));
}

// 한 줄이 Markdown ATX heading이면 heading label만 반환한다.
function extractHeadingFromLine(line: string): string | undefined {
	return line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/)?.[1]?.trim();
}

// "key: value" 또는 "key：value" 형태의 첫 값을 추출한다.
function extractKeyValue(content: string, key: string): string | undefined {
	const pattern = new RegExp(`^\\s*(?:-|\\*)?\\s*${key}\\s*[:：]\\s*(.+?)\\s*$`, "im");
	return content.match(pattern)?.[1]?.trim();
}

// 여러 key 후보 중 가장 먼저 발견되는 key-value 값을 반환한다.
function extractFirstValue(content: string, keys: readonly string[]): string | undefined {
	for (const key of keys) {
		const value = extractKeyValue(content, key);
		if (value) return value;
	}
	return undefined;
}

// area/sourceAreaNo 계열 key-value를 원문 계층형 area id로 보존한다.
function extractAreaId(content: string): string | undefined {
	return normalizeAreaIdCell(extractFirstValue(content, SOURCE_AREA_NO_KEYS));
}

// 컴포넌트 상세 표에만 등장한 area id도 region children의 area 노드로 보강한다.
function appendImplicitAreas(
	areas: SourceAreaDraft[],
	components: SourceComponentDraft[],
): SourceAreaDraft[] {
	const areaIds = new Set(areas.map((area) => area.sourceAreaId));
	const areasById = new Map(areas.map((area) => [area.sourceAreaId, area]));
	const implicitAreas: SourceAreaDraft[] = [];

	for (const component of components) {
		const sourceAreaId = component.sourceAreaId ?? "unknown";
		if (areaIds.has(sourceAreaId)) continue;

		areaIds.add(sourceAreaId);
		implicitAreas.push({ sourceAreaId });
	}

	return [...areasById.values(), ...implicitAreas].sort((left, right) =>
		compareAreaId(left.sourceAreaId, right.sourceAreaId),
	);
}

// area id를 region slot으로 나누고, 각 region children 아래 area 노드를 구성한다.
function buildRegions(
	areas: SourceAreaDraft[],
	components: SourceComponentDraft[],
): SourceSpecRegion[] {
	const regionsBySlot = new Map<SourceSpecRegionSlot, SourceSpecAreaNode[]>();

	for (const area of areas) {
		const slot = inferRegionSlotFromAreaId(area.sourceAreaId);
		const children = components
			.filter((component) => (component.sourceAreaId ?? "unknown") === area.sourceAreaId)
			.map(toComponentNode);
		const areaNode: SourceSpecAreaNode = {
			kind: "area",
			...(area.areaType ? { areaType: area.areaType } : {}),
			...(area.description ? { description: area.description } : {}),
			...(area.errorPolicy ? { errorPolicy: area.errorPolicy } : {}),
			...(area.layout ? { layout: area.layout } : {}),
			...(area.maxCount ? { maxCount: area.maxCount } : {}),
			...(area.minCount ? { minCount: area.minCount } : {}),
			...(area.renderNodeType ? { renderNodeType: area.renderNodeType } : {}),
			sourceAreaId: area.sourceAreaId,
			...(area.sourceAreaName ? { sourceAreaName: area.sourceAreaName } : {}),
			...(area.visibility ? { visibility: area.visibility } : {}),
			children,
		};

		regionsBySlot.set(slot, [...(regionsBySlot.get(slot) ?? []), areaNode]);
	}

	return (["header", "contents", "bottom", "unknown"] as const)
		.map((slot) => ({
			slot,
			children: regionsBySlot.get(slot) ?? [],
		}))
		.filter((region) => region.children.length > 0);
}

// 파서 내부 grouping용 sourceAreaId를 제거하고 공개 component node만 남긴다.
function toComponentNode(component: SourceComponentDraft): SourceSpecComponentNode {
	const { sourceAreaId: _sourceAreaId, ...node } = component;
	return node;
}

// PRDD 예약 번호와 본문 번호 범위를 region slot으로 고정한다.
function inferRegionSlotFromAreaId(sourceAreaId: string): SourceSpecRegionSlot {
	const rootNo = parseAreaRootNo(sourceAreaId);
	if (rootNo === 0) return "header";
	if (rootNo === 999) return "bottom";
	if (rootNo !== undefined && rootNo >= 1 && rootNo <= 998) return "contents";
	return "unknown";
}

// 파일명이나 path에서 특정 코드 패턴의 첫 캡처 값을 꺼낸다.
function extractCodeLike(value: string, pattern: RegExp): string | undefined {
	return value.match(pattern)?.[1];
}

// component 힌트 직전 몇 줄에서 label key-value나 heading을 찾아 사람이 읽는 label로 사용한다.
function extractNearestLabel(content: string, index: number): string | undefined {
	const before = content.slice(0, index).split(/\r?\n/).slice(-3).join("\n");
	return extractKeyValue(before, "label") ?? extractFirstHeading(before);
}

// 같은 component id, area id, label 조합이 반복되면 첫 항목만 남긴다.
function dedupeComponents(components: SourceComponentDraft[]): SourceComponentDraft[] {
	const seen = new Set<string>();
	return components.filter((component) => {
		const key = `${component.sourceComponentId}:${component.sourceAreaId ?? "unknown"}:${component.label}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

type MarkdownTableRow = Record<string, string>;

// 특정 section 아래의 첫 Markdown table을 header-keyed row 객체 배열로 변환한다.
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

// 지정한 heading section의 본문을 다음 heading 전까지 잘라낸다.
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

// Markdown table 한 줄의 양끝 pipe를 제거하고 cell 단위로 정규화한다.
function splitMarkdownTableRow(line: string): string[] {
	return line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(normalizeMarkdownCell);
}

// Markdown table cell의 HTML 줄바꿈을 실제 줄바꿈으로 바꾸고 공백을 정리한다.
function normalizeMarkdownCell(value: string | undefined): string {
	return (value ?? "")
		.replaceAll("<br>", "\n")
		.replaceAll("<br/>", "\n")
		.replaceAll("<br />", "\n")
		.trim();
}

// 비어 있거나 "-"인 table cell은 optional field에서 제외한다.
function normalizeOptionalCell(value: string | undefined): string | undefined {
	const normalized = normalizeMarkdownCell(value);
	return normalized && normalized !== "-" ? normalized : undefined;
}

// 표시 텍스트 cell을 optional text 값으로 정규화한다.
function normalizeDisplayText(value: string | undefined): string | undefined {
	return normalizeOptionalCell(value);
}

function normalizeAreaType(value: string | undefined): "dynamic" | "static" | undefined {
	const normalized = normalizeOptionalCell(value)?.toLowerCase();
	if (normalized === "dynamic" || normalized === "동적") return "dynamic";
	if (normalized === "static" || normalized === "정적") return "static";
	return undefined;
}

function toAreaRenderNodeType(areaType: "dynamic" | "static"): RenderTreeAreaNodeType {
	return areaType === "dynamic"
		? RENDER_TREE_NODE_TYPE.areaDynamic
		: RENDER_TREE_NODE_TYPE.areaStatic;
}

function parsePropsCell(
	value: string | undefined,
): Record<string, string | number | boolean> | undefined {
	const normalized = normalizeOptionalCell(value);
	if (!normalized) return undefined;

	const props = Object.fromEntries(
		normalized
			.split(/\n+/)
			.map((line) => parsePropLine(line))
			.filter((entry): entry is [string, string | number | boolean] => Boolean(entry)),
	);

	return Object.keys(props).length > 0 ? props : undefined;
}

function parsePropLine(line: string): [string, string | number | boolean] | undefined {
	const match = line.match(/^\s*([^:：]+)\s*[:：]\s*(.+?)\s*$/);
	if (!match) return undefined;

	const key = normalizePropKey(match[1]);
	if (!key) return undefined;

	return [key, normalizePropValue(match[2] ?? "")];
}

function normalizePropKey(value: string | undefined): string {
	return normalizeMarkdownCell(value).replace(/\s+/g, "");
}

function normalizePropValue(value: string): string | number | boolean {
	const normalized = normalizeMarkdownCell(value);
	if (/^(true|false)$/i.test(normalized)) return normalized.toLowerCase() === "true";

	const numeric = Number(normalized);
	if (normalized !== "" && Number.isFinite(numeric)) return numeric;

	return normalized;
}

// table cell에서 "1" 또는 "1-2" 같은 PRDD area id만 보존한다.
function normalizeAreaIdCell(value: string | undefined): string | undefined {
	const normalized = normalizeMarkdownCell(value);
	return normalized.match(/\d+(?:-\d+)*/)?.[0];
}

function createAreaIdByName(files: MarkdownSourceFileInput[]): Map<string, string> {
	const areaIdByName = new Map<string, string>();
	for (const file of files) {
		for (const area of extractAreasFromCompositionTable(file.content)) {
			if (!area.sourceAreaName) continue;
			areaIdByName.set(area.sourceAreaName, area.sourceAreaId);
		}
	}
	return areaIdByName;
}

function getFirstCell(row: MarkdownTableRow, keys: readonly string[] | string): string | undefined {
	const keyList = typeof keys === "string" ? [keys] : keys;
	for (const key of keyList) {
		const value = row[key];
		if (value !== undefined) return value;
	}
	return undefined;
}

// area id의 첫 숫자를 region slot 판정용 root 번호로 변환한다.
function parseAreaRootNo(sourceAreaId: string): number | undefined {
	const parsed = Number.parseInt(sourceAreaId.split("-")[0] ?? "", 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

// 계층형 area id를 1, 1-1, 1-2, 2 순서로 정렬한다.
function compareAreaId(left: string, right: string): number {
	const leftParts = left.split("-").map(parseAreaSortPart);
	const rightParts = right.split("-").map(parseAreaSortPart);
	const length = Math.max(leftParts.length, rightParts.length);

	for (let index = 0; index < length; index += 1) {
		const leftPart = leftParts[index] ?? -1;
		const rightPart = rightParts[index] ?? -1;
		if (leftPart !== rightPart) return leftPart - rightPart;
	}

	return left.localeCompare(right);
}

function parseAreaSortPart(part: string): number {
	const parsed = Number.parseInt(part, 10);
	return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

// path의 파일명을 SourceSpec id fallback에 사용할 안전한 slug로 바꾼다.
function slugFromPath(path: string): string {
	const name =
		path
			.split(/[\\/]/)
			.at(-1)
			?.replace(/\.[^.]+$/, "") ?? "source";
	return name.replace(/[^A-Za-z0-9가-힣_-]+/g, "-").replace(/^-+|-+$/g, "") || "source";
}

// 원본 Markdown 변경을 추적하기 위한 가벼운 deterministic checksum을 만든다.
function stableTextChecksum(value: string): string {
	let hash = 5381;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 33) ^ value.charCodeAt(index);
	}
	return `mvp-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
