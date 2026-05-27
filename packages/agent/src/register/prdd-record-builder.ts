import type { ScreenSurfaceType } from "@cx/types/node-types";
import type { EventHook, PrddArea, PrddAreaChange, PrddAreaSlot, PrddBinding, PrddBindingOrigin, PrddComponentEntry, PrddScreenFlow, PrddScreenRecord, PrddScreenState, PrddVisibilityHint } from "@cx/types/prdd-screen-record";
import type {
	ParsedAreaRow,
	ParsedBindingSource,
	ParsedComponentRow,
	ParsedFlowRow,
	ParsedPrddDocument,
	ParsedStateRow,
} from "./prdd-parser";
import { PRDD_AREA_SLOT_RULES, PRDD_AREA_SLOTS } from "./prdd-register-contracts";

/**
 * ParsedPrddDocument → PrddScreenRecord (Schema A).
 * `register-prdd.registerPrddDocument` 가 runtime tree를 만드는 것과 짝지어
 * 같은 PRDD 에서 두 표상이 함께 생성되도록 사용한다. (SPEC §2.1 cross-table invariant)
 *
 * 본 단계는 PRDD prose 보존이 책임. 카탈로그 매칭(primitiveId)은 여기서 하지 않고 null.
 */

export interface BuildPrddScreenRecordOptions {
	/** 한 PRDD import 호출에서 부여하는 ID. runtime tree 와 공유해 cross-table 매칭. */
	importJobId: string;
	/** 기본 screen surface type. 미지정 시 "screen.page". */
	defaultScreenType?: ScreenSurfaceType;
	/** 화면 ordering. 미지정 시 1. */
	order?: number;
}

export function buildPrddScreenRecord(
	parsed: ParsedPrddDocument,
	options: BuildPrddScreenRecordOptions,
): PrddScreenRecord {
	const screenId = parsed.meta.screenId || "screen__unknown";
	const screenName = parsed.meta.screenName ?? screenId;

	const componentsByArea = groupByArea(parsed.components);
	const areaMetaByNo = new Map<number, ParsedAreaRow>(parsed.areas.map((a) => [a.no, a]));
	const allAreaNos = new Set<number>([
		...parsed.areas.map((a) => a.no),
		...parsed.components.map((c) => c.area),
	]);
	const sortedAreaNos = [...allAreaNos].sort((a, b) => a - b);

	const areas: PrddArea[] = sortedAreaNos.map((no, idx) =>
		buildArea({
			no,
			indexOrder: idx + 1,
			meta: areaMetaByNo.get(no),
			components: componentsByArea.get(no) ?? [],
			screenId,
		}),
	);

	return {
		level: "screen",
		id: screenId,
		name: screenName,
		order: options.order ?? 1,
		screenType: options.defaultScreenType ?? "screen.page",
		description: parsed.meta.description ?? "",
		importJobId: options.importJobId,
		states: parsed.states.map(buildState),
		flow: parsed.flows.map(buildFlow),
		policyGroups: parsed.meta.policyGroups,
		useCases: parsed.meta.useCases,
		features: parsed.meta.functions,
		areas,
	};
}

// ─── helpers ─────────────────────────────────────────────────────────────

function groupByArea(rows: ParsedComponentRow[]): Map<number, ParsedComponentRow[]> {
	const map = new Map<number, ParsedComponentRow[]>();
	for (const row of rows) {
		const list = map.get(row.area);
		if (list) list.push(row);
		else map.set(row.area, [row]);
	}
	for (const list of map.values()) list.sort((a, b) => a.order - b.order);
	return map;
}

function classifyAreaSlot(no: number): PrddAreaSlot {
	const slot = PRDD_AREA_SLOT_RULES.find((rule) => rule.matches(no))?.slot;
	return (slot ?? PRDD_AREA_SLOTS.contents) as PrddAreaSlot;
}

function buildArea(args: {
	no: number;
	indexOrder: number;
	meta: ParsedAreaRow | undefined;
	components: ParsedComponentRow[];
	screenId: string;
}): PrddArea {
	const areaId = `${args.screenId}__area${args.no}`;
	const meta = args.meta;
	const visibilityRuleRaw = meta?.visibility ?? "";
	const hint = inferVisibilityHint(visibilityRuleRaw);
	const layoutRaw = meta?.layout ?? "";
	const serverControls = meta?.serverControl
		? meta.serverControl.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
		: [];
	const notes = collectAreaNotes(args.components);

	return {
		areaId,
		order: meta?.priority ?? args.indexOrder,
		slot: classifyAreaSlot(args.no),
		area: {
			level: "area",
			id: areaId,
			name: meta?.description ?? `area-${args.no}`,
			description: meta?.description ?? "",
			layout: layoutRaw,
			visibilityRuleRaw,
			...(hint ? { visibilityRuleHint: hint } : {}),
			serverControls,
			...(meta?.minCount !== undefined ? { countMin: meta.minCount } : {}),
			...(meta?.maxCount !== undefined ? { countMax: meta.maxCount } : {}),
			...(meta?.priority !== undefined ? { priority: meta.priority } : {}),
			...(meta?.errorPolicy ? { errorHandling: meta.errorPolicy } : {}),
			notes,
			children: args.components.map(buildComponentEntry),
		},
	};
}

function inferVisibilityHint(raw: string): PrddVisibilityHint | undefined {
	const trimmed = raw.trim();
	if (!trimmed) return undefined;
	if (/^항상$|^always$/i.test(trimmed)) return { kind: "always" };
	const apiMatch = trimmed.match(/(FN-[A-Z0-9-]+)/);
	if (apiMatch) return { kind: "api", ref: apiMatch[1] };
	const policyMatch = trimmed.match(/(P[IG]-[A-Z0-9-]+)/);
	if (policyMatch) return { kind: "policy", ref: policyMatch[1] };
	return undefined;
}

function collectAreaNotes(components: ParsedComponentRow[]): string[] {
	const notes: string[] = [];
	for (const row of components) {
		if (row.notes) notes.push(row.notes);
	}
	return notes;
}

function buildComponentEntry(row: ParsedComponentRow): PrddComponentEntry {
	return {
		primitiveId: null,
		semanticName: row.name || row.componentId || `c${row.order}`,
		rawComponentId: row.componentId || "",
		variantHint: row.variant ?? null,
		displayTextTemplate: serializeTexts(row.texts),
		bindings: row.bindings.map(buildBinding),
		events: buildEvents(row),
		notes: row.notes ? [row.notes] : [],
		policyIds: row.policyTags,
		order: row.order,
	};
}

function serializeTexts(texts: Record<string, string>): string {
	const entries = Object.entries(texts);
	if (entries.length === 0) return "";
	return entries.map(([k, v]) => `${k}: ${v}`).join("\n");
}

function buildBinding(src: ParsedBindingSource): PrddBinding {
	const origin = deriveBindingOrigin(src);
	const ref = src.api ?? src.policy ?? src.stateName ?? "-";
	return { origin, ref, description: src.raw };
}

function deriveBindingOrigin(src: ParsedBindingSource): PrddBindingOrigin {
	if (src.api) return "api";
	if (src.policy) return "policy";
	if (src.state) return "state";
	return "static";
}

function buildEvents(row: ParsedComponentRow): EventHook[] {
	if (!row.event) return [];
	const event: EventHook = {
		trigger: row.event,
		action: row.action ?? "",
	};
	if (row.actionParams) {
		event.target = row.actionParams;
	}
	return [event];
}

function buildState(row: ParsedStateRow): PrddScreenState {
	return {
		state: row.state,
		trigger: row.trigger ?? "",
		changes: parseStateChanges(row.componentChange ?? ""),
		...(row.action ? { action: row.action } : {}),
	};
}

/**
 * "[영역 1] skeleton 표시 · [영역 2] ..." 같은 문자열을 changes 로 쪼갠다.
 * 구분이 명확하지 않으면 한 항목으로 보존.
 */
function parseStateChanges(raw: string): PrddAreaChange[] {
	if (!raw.trim()) return [];
	const tokens = raw.split(/\s*(?=\[영역[\s\d]+\])/);
	const out: PrddAreaChange[] = [];
	for (const token of tokens) {
		const trimmed = token.trim();
		if (!trimmed) continue;
		const match = trimmed.match(/^\[영역[\s]*(\d+)\]\s*(.*)$/);
		if (match) {
			out.push({ areaRef: `영역 ${match[1]}`, description: match[2].trim() });
		} else {
			out.push({ areaRef: "*", description: trimmed });
		}
	}
	return out;
}

function buildFlow(row: ParsedFlowRow): PrddScreenFlow {
	const kind = normalizeFlowKind(row.kind);
	return {
		kind,
		targetScreenId: row.screenId ?? "",
		targetScreenName: row.screenName ?? "",
		condition: row.condition ?? "",
		...(row.payload ? { payload: row.payload } : {}),
		...(row.followup ? { postProcess: row.followup } : {}),
	};
}

function normalizeFlowKind(raw: string | undefined): "transition" | "case-branch" {
	if (!raw) return "transition";
	if (raw.includes("케이스") || raw.toLowerCase().includes("case")) return "case-branch";
	return "transition";
}
