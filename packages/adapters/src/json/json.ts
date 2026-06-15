// 외부 PRDD JSON의 속성 키(한글·공백 포함)를 일관되게 bracket으로 읽는다.
// biome-ignore-all lint/complexity/useLiteralKeys: external JSON property keys
import {
	RENDER_TREE_NODE_TYPE,
	type RenderTreeAreaNodeType,
	SCHEMA_VERSION,
	type SourceSpec,
	type SourceSpecAreaNode,
	type SourceSpecComponentNode,
	type SourceSpecRegion,
	type SourceSpecRegionSlot,
} from "@cx/schema";
import type { JsonParserIssue, ParseJsonSourceBundleInput, ParseJsonSourceBundleResult } from "./types";

/**
 * PRDD JSON 한 화면을 markdown 어댑터와 동일한 SourceSpec envelope로 변환한다.
 * markdown 파서가 표/heading 스크래핑으로 복원하던 구조를 JSON은 이미 들고 있어
 * 매핑이 1:1이다. 최소 retrofit — literal prop은 typed props로, 그 외(binding의
 * 바인딩 소스·sample, state, 원본 props 전체)는 raw에 보존해 무손실로 남긴다.
 * `화면 동작`(인터랙션)은 SourceSpec에 자리가 없어 이번 단계에서는 매핑하지 않는다.
 */
export function parseJsonSourceBundle(
	input: ParseJsonSourceBundleInput,
): ParseJsonSourceBundleResult {
	const issues: JsonParserIssue[] = [];
	const path = input.path ?? "source.json";

	if (input.content.trim().length === 0) {
		issues.push({ code: "empty-content", message: `JSON source is empty: ${path}.`, severity: "error" });
		return { ok: false, issues };
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(input.content);
	} catch (error) {
		issues.push({
			code: "invalid-json",
			message: `JSON source is not valid: ${error instanceof Error ? error.message : String(error)}.`,
			severity: "error",
		});
		return { ok: false, issues };
	}

	if (!isRecord(parsed)) {
		issues.push({ code: "invalid-json", message: "JSON source root must be an object.", severity: "error" });
		return { ok: false, issues };
	}

	const metadata = isRecord(parsed["메타데이터"]) ? parsed["메타데이터"] : undefined;
	if (!metadata) {
		issues.push({ code: "missing-metadata", message: "JSON source has no 메타데이터.", severity: "error" });
		return { ok: false, issues };
	}

	const screenCode = readString(metadata, "화면ID") ?? slugFromPath(path);
	if (!readString(metadata, "화면ID")) {
		issues.push({ code: "missing-screen-code", message: "메타데이터 has no 화면ID.", severity: "warning" });
	}
	const name = readString(metadata, "화면명") ?? "";
	if (!name) {
		issues.push({ code: "missing-title", message: "메타데이터 has no 화면명.", severity: "warning" });
	}

	const areaDrafts = readArray(parsed["화면 구성"]).map(toAreaDraft).filter(isDefined);
	const components = readArray(parsed["컴포넌트 상세"])
		.map((row) => toComponentDraft(row, areaDrafts))
		.filter(isDefined);

	const sourceSpec: SourceSpec = {
		schemaVersion: SCHEMA_VERSION.sourceSpec,
		sourceImport: {
			importId: input.importId,
			sourceKind: "json",
			receivedAt: input.receivedAt ?? "1970-01-01T00:00:00.000Z",
			files: [
				{
					id: `source-screen-${slugFromPath(path)}`,
					kind: "screen",
					path,
					title: name || slugFromPath(path),
					checksum: stableTextChecksum(input.content),
					screenCode,
				},
			],
		},
		sourceShape: {
			screen: {
				screenCode,
				name,
				route: resolveRoute(readString(metadata, "경로"), screenCode),
				regions: buildRegions(appendImplicitAreas(areaDrafts, components), components),
			},
		},
	};

	return { ok: issues.every((issue) => issue.severity !== "error"), issues, sourceSpec };
}

type AreaDraft = {
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

type ComponentDraft = SourceSpecComponentNode & { sourceAreaId?: string };

// 화면 구성 행 하나를 area draft로 — 섹션 번호가 곧 sourceAreaId다.
function toAreaDraft(row: unknown): AreaDraft | undefined {
	if (!isRecord(row)) return undefined;
	const sourceAreaId = readNumberLike(row["섹션 번호"]);
	if (sourceAreaId === undefined) return undefined;

	const areaType = normalizeAreaType(readString(row["섹션 유형"]));
	const description = readString(row["섹션 설명"]);
	const layout = readString(row["섹션 레이아웃"]);
	const visibility = readString(row["노출 조건"]);
	const minCount = readNumberLike(row["노출 개수 (최소)"]);
	const maxCount = readCountLike(row["노출 개수 (최대)"]);
	const errorPolicy = readString(row["오류 처리 방식"]);
	const sourceAreaName = readString(row["섹션 명"]);

	return {
		...(areaType ? { areaType, renderNodeType: toAreaRenderNodeType(areaType) } : {}),
		...(description ? { description } : {}),
		...(errorPolicy ? { errorPolicy } : {}),
		...(layout ? { layout } : {}),
		...(maxCount ? { maxCount } : {}),
		...(minCount !== undefined ? { minCount } : {}),
		sourceAreaId,
		...(sourceAreaName ? { sourceAreaName } : {}),
		...(visibility ? { visibility } : {}),
	};
}

// 컴포넌트 상세 행 하나를 component draft로. 섹션 명으로 area에 귀속시킨다.
function toComponentDraft(row: unknown, areas: AreaDraft[]): ComponentDraft | undefined {
	if (!isRecord(row)) return undefined;
	const componentType = readString(row["컴포넌트 ID"]);
	const componentName = readString(row["컴포넌트 명"]);
	const sourceComponentId = componentType ?? componentName;
	if (!sourceComponentId) return undefined;

	const description = readString(row["컴포넌트 설명"]);
	const variant = readString(row["variant"]);
	const state = readString(row["state"]);
	const sourceAreaId = resolveComponentAreaId(readString(row["섹션 명"]), areas);
	const label = componentName || description || sourceComponentId;

	const { props, bindingSource } = readInitialProps(row["props (초기 데이터)"]);
	const propsText = serializeRawProps(row["props (초기 데이터)"]);
	const raw = createRawSource({ bindingSource, description, propsText, state });

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
		...(variant ? { variant } : {}),
	};
}

// props (초기 데이터): {key: {kind, value, sample}}. literal만 typed props로 올리고
// binding은 raw.bindingSource로 보존한다.
function readInitialProps(value: unknown): {
	props?: Record<string, string | number | boolean>;
	bindingSource?: string;
} {
	if (!isRecord(value)) return {};
	const props: Record<string, string | number | boolean> = {};
	const bindings: string[] = [];

	for (const [key, entry] of Object.entries(value)) {
		if (!isRecord(entry)) continue;
		const kind = readString(entry["kind"]);
		const rawValue = entry["value"];
		if (kind === "binding") {
			const source = readString(rawValue);
			bindings.push(source ? `${key}←${source}` : key);
			continue;
		}
		// kind 미지정 또는 literal — 값을 coerce해 typed props로.
		if (rawValue !== undefined && rawValue !== null) props[key] = coerceLiteral(rawValue);
	}

	return {
		...(Object.keys(props).length > 0 ? { props } : {}),
		...(bindings.length > 0 ? { bindingSource: bindings.join(", ") } : {}),
	};
}

// 2단계에서 binding/sample을 복원할 수 있도록 원본 props를 무손실 직렬화한다.
function serializeRawProps(value: unknown): string | undefined {
	if (!isRecord(value) || Object.keys(value).length === 0) return undefined;
	return JSON.stringify(value);
}

function createRawSource(input: {
	bindingSource?: string;
	description?: string;
	propsText?: string;
	state?: string;
}): SourceSpecComponentNode["raw"] | undefined {
	const note = input.state ? `state: ${input.state}` : undefined;
	if (!input.bindingSource && !input.description && !input.propsText && !note) return undefined;
	return {
		...(input.bindingSource ? { bindingSource: input.bindingSource } : {}),
		...(input.description ? { description: input.description } : {}),
		...(input.propsText ? { propsText: input.propsText } : {}),
		...(note ? { note } : {}),
	};
}

// 컴포넌트 상세 표에만 등장한 area도 region children에 보강한다.
function appendImplicitAreas(areas: AreaDraft[], components: ComponentDraft[]): AreaDraft[] {
	const areasById = new Map(areas.map((area) => [area.sourceAreaId, area]));
	const seen = new Set(areas.map((area) => area.sourceAreaId));
	const implicit: AreaDraft[] = [];

	for (const component of components) {
		const sourceAreaId = component.sourceAreaId ?? "unknown";
		if (seen.has(sourceAreaId)) continue;
		seen.add(sourceAreaId);
		implicit.push({ sourceAreaId });
	}

	return [...areasById.values(), ...implicit].sort((left, right) =>
		compareAreaId(left.sourceAreaId, right.sourceAreaId),
	);
}

// area를 region slot으로 나누고 각 area children 아래 component를 둔다.
function buildRegions(areas: AreaDraft[], components: ComponentDraft[]): SourceSpecRegion[] {
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
		.map((slot) => ({ slot, children: regionsBySlot.get(slot) ?? [] }))
		.filter((region) => region.children.length > 0);
}

function toComponentNode(component: ComponentDraft): SourceSpecComponentNode {
	const { sourceAreaId: _sourceAreaId, ...node } = component;
	return node;
}

// 섹션 명을 area id로 — 이름→id 매핑이 없으면 그대로(implicit area로 처리)한다.
function resolveComponentAreaId(areaName: string | undefined, areas: AreaDraft[]): string | undefined {
	if (!areaName) return undefined;
	const match = areas.find((area) => area.sourceAreaName === areaName);
	return match?.sourceAreaId ?? areaName;
}

// 메타데이터의 경로가 URL이면 그대로, breadcrumb이면 screenCode로 생성한다.
function resolveRoute(route: string | undefined, screenCode: string): string {
	if (route?.startsWith("/")) return route;
	return `/${screenCode.toLowerCase().replaceAll("-", "/")}`;
}

// 섹션 번호 0→header, 999→bottom, 1~998→contents (markdown 어댑터와 동일 규칙).
function inferRegionSlotFromAreaId(sourceAreaId: string): SourceSpecRegionSlot {
	const rootNo = Number.parseInt(sourceAreaId.split("-")[0] ?? "", 10);
	if (!Number.isFinite(rootNo)) return "unknown";
	if (rootNo === 0) return "header";
	if (rootNo === 999) return "bottom";
	if (rootNo >= 1 && rootNo <= 998) return "contents";
	return "unknown";
}

function normalizeAreaType(value: string | undefined): "dynamic" | "static" | undefined {
	const normalized = value?.trim().toLowerCase();
	if (normalized === "dynamic" || normalized === "동적") return "dynamic";
	if (normalized === "static" || normalized === "정적") return "static";
	return undefined;
}

function toAreaRenderNodeType(areaType: "dynamic" | "static"): RenderTreeAreaNodeType {
	return areaType === "dynamic" ? RENDER_TREE_NODE_TYPE.areaDynamic : RENDER_TREE_NODE_TYPE.areaStatic;
}

function coerceLiteral(value: unknown): string | number | boolean {
	if (typeof value === "boolean" || typeof value === "number") return value;
	const text = String(value).trim();
	if (/^(true|false)$/i.test(text)) return text.toLowerCase() === "true";
	const numeric = Number(text);
	if (text !== "" && Number.isFinite(numeric)) return numeric;
	return text;
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function isDefined<T>(value: T | undefined): value is T {
	return value !== undefined;
}

function readString(value: unknown): string | undefined;
function readString(record: Record<string, unknown>, key: string): string | undefined;
function readString(valueOrRecord: unknown, key?: string): string | undefined {
	const value = key === undefined ? valueOrRecord : (valueOrRecord as Record<string, unknown>)?.[key];
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	}
	return undefined;
}

// 섹션 번호(숫자/문자 모두 허용)를 sourceAreaId 문자열로 정규화한다.
function readNumberLike(value: unknown): string | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "string") {
		const match = value.match(/\d+(?:-\d+)*/);
		return match?.[0];
	}
	return undefined;
}

// 노출 개수 (최대)는 "N" 같은 비숫자도 들어와 원문 문자열을 보존한다.
function readCountLike(value: unknown): string | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return String(value);
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : undefined;
	}
	return undefined;
}
