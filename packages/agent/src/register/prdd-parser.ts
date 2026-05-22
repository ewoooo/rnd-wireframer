/**
 * PRDD 마크다운 → 중간 표현 (ParsedPrddDocument).
 *
 * 다음 단계 (Step 3 register-assets)에서 이 중간 표현을 RegisteredNodeTree로
 * 변환한다. Region/Area 분류는 여기서 하지 않고 raw row만 보존한다.
 */

export interface ParsedPrddMeta {
	screenId: string;
	screenName?: string;
	description?: string;
	route?: string;
	implementationType?: string;
	policyGroups: string[];
	useCases: string[];
	functions: string[];
	writtenAt?: string;
	author?: string;
	version?: string;
}

export interface ParsedAreaRow {
	no: number;
	type?: "static" | "dynamic";
	description?: string;
	layout?: string;
	visibility?: string;
	serverControl?: string;
	minCount?: number;
	maxCount?: number;
	priority?: number;
	errorPolicy?: string;
}

export interface ParsedStateRow {
	state: string;
	trigger?: string;
	componentChange?: string;
	action?: string;
}

export interface ParsedBindingSource {
	raw: string;
	api?: string;
	policy?: string;
	state?: boolean;
	stateName?: string;
}

export interface ParsedComponentRow {
	area: number;
	order: number;
	name: string;
	description?: string;
	componentId: string;
	variant?: string;
	event?: string;
	action?: string;
	actionParams?: string;
	texts: Record<string, string>;
	bindings: ParsedBindingSource[];
	notes?: string;
	policyTags: string[];
}

export interface ParsedFlowRow {
	kind?: string;
	screenId?: string;
	screenName?: string;
	condition?: string;
	payload?: string;
	followup?: string;
}

export interface ParsedPrddDocument {
	meta: ParsedPrddMeta;
	areas: ParsedAreaRow[];
	states: ParsedStateRow[];
	components: ParsedComponentRow[];
	flows: ParsedFlowRow[];
	warnings: string[];
}

export function parsePrddMarkdown(source: string): ParsedPrddDocument {
	const warnings: string[] = [];
	const { frontmatter, body } = splitFrontmatter(source);
	const meta = parseFrontmatter(frontmatter, warnings);
	const sections = splitSections(body);

	const areas = parseAreaTable(sections.get("화면 구성") ?? "", warnings);
	const states = parseStateTable(sections.get("컴포넌트 상태") ?? "", warnings);
	const components = parseComponentTable(sections.get("컴포넌트 상세") ?? "", warnings);
	const flows = parseFlowTable(sections.get("화면 흐름") ?? "", warnings);

	return { meta, areas, states, components, flows, warnings };
}

// ---------- frontmatter ----------

function splitFrontmatter(source: string): { frontmatter: string; body: string } {
	const trimmed = source.replace(/^﻿/, "");
	const match = trimmed.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
	if (!match) {
		return { frontmatter: "", body: trimmed };
	}
	return { frontmatter: match[1] ?? "", body: match[2] ?? "" };
}

function parseFrontmatter(text: string, warnings: string[]): ParsedPrddMeta {
	const map = new Map<string, string>();
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const idx = trimmed.indexOf(":");
		if (idx < 0) continue;
		const key = trimmed.slice(0, idx).trim();
		const value = trimmed.slice(idx + 1).trim();
		map.set(key, value);
	}

	const screenId = map.get("화면 ID") ?? "";
	if (!screenId) warnings.push("frontmatter: 화면 ID 누락");

	return {
		screenId,
		screenName: map.get("화면 명") || undefined,
		description: map.get("화면 설명") || undefined,
		route: map.get("화면 경로") || undefined,
		implementationType: map.get("구현 유형") || undefined,
		policyGroups: splitCsv(map.get("관련 정책 그룹")),
		useCases: splitCsv(map.get("관련 유즈케이스")),
		functions: splitCsv(map.get("관련 기능")),
		writtenAt: map.get("작성일") || undefined,
		author: map.get("작성자") || undefined,
		version: map.get("버전") || undefined,
	};
}

function splitCsv(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.split(/[,，]/)
		.map((s) => s.trim())
		.filter(Boolean);
}

// ---------- section split ----------

function splitSections(body: string): Map<string, string> {
	const sections = new Map<string, string>();
	const lines = body.split(/\r?\n/);
	let currentTitle: string | null = null;
	let buffer: string[] = [];
	for (const line of lines) {
		const heading = line.match(/^##\s+(.+?)\s*$/);
		if (heading) {
			if (currentTitle) sections.set(currentTitle, buffer.join("\n"));
			currentTitle = heading[1] ?? null;
			buffer = [];
		} else if (currentTitle) {
			buffer.push(line);
		}
	}
	if (currentTitle) sections.set(currentTitle, buffer.join("\n"));
	return sections;
}

// ---------- table parsing ----------

interface RawTable {
	headers: string[];
	rows: string[][];
}

function parseTable(text: string): RawTable | null {
	const lines = text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l.startsWith("|"));
	if (lines.length < 2) return null;
	const headers = splitRow(lines[0]!);
	// lines[1] = separator row (---|---), skip
	const rows = lines.slice(2).map((l) => splitRow(l));
	return { headers, rows };
}

function splitRow(line: string): string[] {
	const inner = line.replace(/^\|/, "").replace(/\|$/, "");
	return inner.split("|").map((c) => c.trim());
}

function cell(row: string[], headers: string[], name: string): string {
	const idx = headers.findIndex((h) => h === name);
	if (idx < 0) return "";
	return row[idx] ?? "";
}

function emptyToUndef(v: string): string | undefined {
	if (!v || v === "-") return undefined;
	return v;
}

function parseIntOrUndef(v: string): number | undefined {
	const cleaned = v.trim();
	if (!cleaned || cleaned === "-") return undefined;
	const n = Number.parseInt(cleaned, 10);
	return Number.isFinite(n) ? n : undefined;
}

// ---------- 화면 구성 ----------

function parseAreaTable(text: string, warnings: string[]): ParsedAreaRow[] {
	const table = parseTable(text);
	if (!table) return [];
	const out: ParsedAreaRow[] = [];
	for (const row of table.rows) {
		const noStr = cell(row, table.headers, "no.");
		const no = parseIntOrUndef(noStr);
		if (no === undefined) {
			warnings.push(`화면 구성: no. 파싱 실패 (${noStr})`);
			continue;
		}
		const typeRaw = cell(row, table.headers, "영역 유형");
		const type =
			typeRaw === "static" || typeRaw === "dynamic" ? (typeRaw as "static" | "dynamic") : undefined;
		out.push({
			no,
			type,
			description: emptyToUndef(cell(row, table.headers, "영역 설명")),
			layout: emptyToUndef(cell(row, table.headers, "영역 레이아웃")),
			visibility: emptyToUndef(cell(row, table.headers, "노출 조건")),
			serverControl: emptyToUndef(cell(row, table.headers, "서버 제어 항목")),
			minCount: parseIntOrUndef(cell(row, table.headers, "노출 개수 (최소)")),
			maxCount: parseIntOrUndef(cell(row, table.headers, "노출 개수 (최대)")),
			priority: parseIntOrUndef(cell(row, table.headers, "노출 우선순위")),
			errorPolicy: emptyToUndef(cell(row, table.headers, "오류 처리 방식")),
		});
	}
	return out;
}

// ---------- 컴포넌트 상태 ----------

function parseStateTable(text: string, _warnings: string[]): ParsedStateRow[] {
	const table = parseTable(text);
	if (!table) return [];
	const out: ParsedStateRow[] = [];
	for (const row of table.rows) {
		const state = cell(row, table.headers, "상태");
		if (!state) continue;
		out.push({
			state,
			trigger: emptyToUndef(cell(row, table.headers, "트리거")),
			componentChange: emptyToUndef(cell(row, table.headers, "컴포넌트 변화")),
			action: emptyToUndef(cell(row, table.headers, "액션")),
		});
	}
	return out;
}

// ---------- 컴포넌트 상세 ----------

function parseComponentTable(text: string, warnings: string[]): ParsedComponentRow[] {
	const table = parseTable(text);
	if (!table) return [];
	const out: ParsedComponentRow[] = [];
	for (const row of table.rows) {
		const area = parseIntOrUndef(cell(row, table.headers, "영역"));
		const order = parseIntOrUndef(cell(row, table.headers, "no."));
		if (area === undefined || order === undefined) {
			warnings.push(`컴포넌트 상세: 영역/no. 파싱 실패 (${JSON.stringify(row)})`);
			continue;
		}
		const notes = emptyToUndef(cell(row, table.headers, "비고"));
		out.push({
			area,
			order,
			name: cell(row, table.headers, "컴포넌트 명"),
			description: emptyToUndef(cell(row, table.headers, "컴포넌트 설명")),
			componentId: cell(row, table.headers, "컴포넌트 ID"),
			variant: emptyToUndef(cell(row, table.headers, "variant")),
			event: emptyToUndef(cell(row, table.headers, "이벤트")),
			action: emptyToUndef(cell(row, table.headers, "액션")),
			actionParams: emptyToUndef(cell(row, table.headers, "액션 파라미터")),
			texts: parseTexts(cell(row, table.headers, "표시 텍스트")),
			bindings: parseBindings(cell(row, table.headers, "바인딩(소스)")),
			notes,
			policyTags: extractPolicyTags(notes ?? ""),
		});
	}
	return out;
}

function parseTexts(value: string): Record<string, string> {
	const out: Record<string, string> = {};
	if (!value || value === "-") return out;
	for (const segment of value.split(/<br\s*\/?>/i)) {
		const trimmed = segment.trim();
		if (!trimmed) continue;
		const idx = trimmed.indexOf(":");
		if (idx < 0) continue;
		const key = trimmed.slice(0, idx).trim();
		const val = trimmed.slice(idx + 1).trim();
		if (key) out[key] = val;
	}
	return out;
}

function parseBindings(value: string): ParsedBindingSource[] {
	if (!value || value === "-") return [];
	const out: ParsedBindingSource[] = [];
	for (const segment of value.split(/<br\s*\/?>/i)) {
		const raw = segment.trim();
		if (!raw) continue;
		const source: ParsedBindingSource = { raw };
		const api = raw.match(/api:([A-Z0-9\-_]+)/i);
		if (api) source.api = api[1];
		const policy = raw.match(/policy:([A-Z0-9\-_]+)/i);
		if (policy) source.policy = policy[1];
		const stateMatch = raw.match(/^(\w+)\s*\(state\)/);
		if (stateMatch) {
			source.state = true;
			source.stateName = stateMatch[1];
		} else if (/\(state\)/.test(raw)) {
			source.state = true;
		}
		out.push(source);
	}
	return out;
}

function extractPolicyTags(notes: string): string[] {
	if (!notes) return [];
	const out: string[] = [];
	const re = /\[정책:([^\]]+)\]/g;
	let match: RegExpExecArray | null;
	// biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop
	while ((match = re.exec(notes)) !== null) {
		const tag = match[1]?.trim();
		if (tag) out.push(tag);
	}
	return out;
}

// ---------- 화면 흐름 ----------

function parseFlowTable(text: string, _warnings: string[]): ParsedFlowRow[] {
	const table = parseTable(text);
	if (!table) return [];
	const out: ParsedFlowRow[] = [];
	for (const row of table.rows) {
		const kind = emptyToUndef(cell(row, table.headers, "구분"));
		const screenId = emptyToUndef(cell(row, table.headers, "화면 ID"));
		if (!kind && !screenId) continue;
		out.push({
			kind,
			screenId,
			screenName: emptyToUndef(cell(row, table.headers, "화면 명")),
			condition: emptyToUndef(cell(row, table.headers, "조건")),
			payload: emptyToUndef(cell(row, table.headers, "전달 데이터")),
			followup: emptyToUndef(cell(row, table.headers, "후속 처리")),
		});
	}
	return out;
}
