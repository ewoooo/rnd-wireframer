import type {
	RegisteredAreaChildRef,
	RegisteredAreaNode,
	RegisteredBottomRegion,
	RegisteredComponentNode,
	RegisteredContentsRegion,
	RegisteredHeaderRegion,
	RegisteredScreenNode,
} from "../types";
import type { ParsedAreaRow, ParsedComponentRow, ParsedPrddDocument } from "./prdd-parser";
import {
	PRDD_AREA_SLOT_RULES,
	PRDD_AREA_SLOTS,
	PRDD_DEFAULT_HEADER_COMPONENT,
	PRDD_SCREEN_TYPE_CONTRACT,
	type PrddAreaSlot,
} from "./prdd-register-contracts";

function decideScreenType(_parsed: ParsedPrddDocument) {
	return PRDD_SCREEN_TYPE_CONTRACT.defaultScreenType;
}

/**
 * screen.page 같은 header 필수 type일 때 header가 비어있으면 default AppBar 합성.
 * AGENTS.md "Screen 아래 Screen.Header/Contents/Bottom 3영역 생성" deterministic 책임.
 */
function synthesizeDefaultHeader(screenId: string, screenName: string): RegisteredComponentNode {
	return {
		level: "component",
		id: `${screenId}${PRDD_DEFAULT_HEADER_COMPONENT.idSuffix}`,
		name: screenName,
		order: PRDD_DEFAULT_HEADER_COMPONENT.order,
		type: PRDD_DEFAULT_HEADER_COMPONENT.type,
		props: {
			[PRDD_DEFAULT_HEADER_COMPONENT.props.titleProp]: screenName,
			showBackButton: PRDD_DEFAULT_HEADER_COMPONENT.props.showBackButton,
		},
	};
}

/**
 * PRDD 영역 번호 → Region/Area 분류 contract.
 *
 *   영역 === 0     → header region
 *   영역 >= 999    → bottom region
 *   그 외          → contents region 내부의 Area
 *
 * 이 규칙은 register 단계에 모인다. Composer/Decorator는 결정된 region/area만
 * 보고 숫자를 직접 비교하지 않는다.
 */
function classifyArea(no: number): PrddAreaSlot {
	return PRDD_AREA_SLOT_RULES.find((rule) => rule.matches(no))?.slot ?? PRDD_AREA_SLOTS.contents;
}

export interface RegisteredPrddScreen {
	screen: RegisteredScreenNode;
	/** 화면 안의 모든 component, 평탄화. DB·downstream용. */
	components: RegisteredComponentNode[];
	/** contents region 안의 area, 평탄화. */
	areas: RegisteredAreaNode[];
	warnings: string[];
}

export function registerPrddDocument(parsed: ParsedPrddDocument): RegisteredPrddScreen {
	const warnings: string[] = [...parsed.warnings];
	const screenId = parsed.meta.screenId;
	if (!screenId) warnings.push("registerPrddDocument: screenId 누락 — 임시 ID 사용");
	const stableScreenId = screenId || "screen__unknown";

	// 1) 컴포넌트 row를 RegisteredComponentNode로 변환, 영역별 grouping
	const componentsByArea = new Map<number, RegisteredComponentNode[]>();
	const allComponents: RegisteredComponentNode[] = [];
	for (const row of parsed.components) {
		const component = toComponent(row, stableScreenId);
		allComponents.push(component);
		const bucket = componentsByArea.get(row.area) ?? [];
		bucket.push(component);
		componentsByArea.set(row.area, bucket);
	}

	// 2) Area 메타 lookup (화면 구성 테이블)
	const areaMetaByNo = new Map<number, ParsedAreaRow>();
	for (const a of parsed.areas) areaMetaByNo.set(a.no, a);

	// 3) 영역 번호 집합 (화면 구성 + 컴포넌트 상세 union)
	const areaNumbers = new Set<number>();
	for (const a of parsed.areas) areaNumbers.add(a.no);
	for (const c of parsed.components) areaNumbers.add(c.area);
	const sortedAreaNumbers = [...areaNumbers].sort((a, b) => a - b);

	// 4) Region별 children 채우기
	const headerChildren: RegisteredAreaChildRef[] = [];
	const bottomChildren: RegisteredAreaChildRef[] = [];
	const contentsAreas: RegisteredAreaNode[] = [];

	for (const no of sortedAreaNumbers) {
		const components = sortByOrder(componentsByArea.get(no) ?? []);
		const slot = classifyArea(no);
		const meta = areaMetaByNo.get(no);

		PRDD_SLOT_ACCUMULATORS[slot]({
			bottomChildren,
			components,
			contentsAreas,
			headerChildren,
			meta,
			no,
			screenId: stableScreenId,
		});

		// 메타는 있는데 컴포넌트 없거나, 컴포넌트는 있는데 메타 없는 경우 경고
		pushPrddSlotWarnings(warnings, { components, meta, no, slot });
	}

	// 5) Screen type 결정 + header 추론 (deterministic code 책임)
	const screenType = decideScreenType(parsed);
	const screenName = parsed.meta.screenName ?? stableScreenId;
	if (PRDD_SCREEN_TYPE_CONTRACT.headerRequired[screenType] && headerChildren.length === 0) {
		const defaultHeader = synthesizeDefaultHeader(stableScreenId, screenName);
		allComponents.push(defaultHeader);
		headerChildren.push(toChildRef(defaultHeader));
		warnings.push(`header inferred for ${screenType}: ${stableScreenId}`);
	}

	// 6) Screen 노드 조립
	const header: RegisteredHeaderRegion = {
		level: "region",
		slot: "header",
		children: headerChildren,
	};
	const contents: RegisteredContentsRegion = {
		level: "region",
		slot: "contents",
		children: contentsAreas,
	};
	const bottom: RegisteredBottomRegion = {
		level: "region",
		slot: "bottom",
		children: bottomChildren,
	};

	const screen: RegisteredScreenNode = {
		level: "screen",
		id: stableScreenId,
		name: screenName,
		order: 1,
		screenType,
		...(parsed.meta.description ? { description: parsed.meta.description } : {}),
		...(parsed.meta.route ? { surface: parsed.meta.route } : {}),
		areas: [], // deprecated; PRDD 입력은 region 구조만 채움
		header,
		contents,
		bottom,
	};

	return { screen, components: allComponents, areas: contentsAreas, warnings };
}

interface PrddSlotAccumulatorContext {
	bottomChildren: RegisteredAreaChildRef[];
	components: RegisteredComponentNode[];
	contentsAreas: RegisteredAreaNode[];
	headerChildren: RegisteredAreaChildRef[];
	meta: ParsedAreaRow | undefined;
	no: number;
	screenId: string;
}

const PRDD_SLOT_ACCUMULATORS = {
	header: ({ components, headerChildren }) => {
		for (const component of components) headerChildren.push(toChildRef(component));
	},
	bottom: ({ bottomChildren, components }) => {
		for (const component of components) bottomChildren.push(toChildRef(component));
	},
	contents: ({ components, contentsAreas, meta, no, screenId }) => {
		contentsAreas.push(toArea(no, meta, components, screenId));
	},
} satisfies Record<PrddAreaSlot, (context: PrddSlotAccumulatorContext) => void>;

interface PrddSlotWarningContext {
	components: RegisteredComponentNode[];
	meta: ParsedAreaRow | undefined;
	no: number;
	slot: PrddAreaSlot;
}

const PRDD_SLOT_WARNING_RULES = [
	{
		matches: ({ meta, slot }) => !meta && slot === PRDD_AREA_SLOTS.contents,
		message: ({ no }) => `영역 ${no}: 화면 구성 메타 없음 (컴포넌트만 존재)`,
	},
	{
		matches: ({ components, meta, slot }) =>
			Boolean(meta) && components.length === 0 && slot === PRDD_AREA_SLOTS.contents,
		message: ({ no }) => `영역 ${no}: 메타만 있고 컴포넌트 없음`,
	},
] satisfies Array<{
	matches: (context: PrddSlotWarningContext) => boolean;
	message: (context: PrddSlotWarningContext) => string;
}>;

function pushPrddSlotWarnings(warnings: string[], context: PrddSlotWarningContext) {
	for (const rule of PRDD_SLOT_WARNING_RULES) {
		if (rule.matches(context)) warnings.push(rule.message(context));
	}
}

function toComponent(row: ParsedComponentRow, screenId: string): RegisteredComponentNode {
	const id = `${screenId}__a${row.area}-${row.order}`;
	const props: Record<string, unknown> = {};
	if (row.variant) props.variant = row.variant;
	if (row.event) props.event = row.event;
	if (row.action) props.action = row.action;
	if (row.actionParams) props.actionParams = row.actionParams;
	if (Object.keys(row.texts).length > 0) props.texts = row.texts;
	if (row.bindings.length > 0) props.bindings = row.bindings;
	if (row.notes) props.notes = row.notes;

	return {
		level: "component",
		id,
		name: row.name || row.componentId || id,
		order: row.order,
		type: row.componentId || "Unknown",
		...(row.description ? { description: row.description } : {}),
		...(row.policyTags.length > 0 ? { policyID: row.policyTags } : {}),
		props,
	};
}

function toChildRef(component: RegisteredComponentNode): RegisteredAreaChildRef {
	return {
		componentId: component.id,
		order: component.order,
		component,
	};
}

function toArea(
	no: number,
	meta: ParsedAreaRow | undefined,
	components: RegisteredComponentNode[],
	screenId: string,
): RegisteredAreaNode {
	const anchors = new Set<string>();
	for (const c of components) {
		for (const p of c.policyID ?? []) anchors.add(p);
	}

	return {
		level: "area",
		id: `${screenId}__area${no}`,
		key: no,
		// order: priority가 있으면 사용, 없으면 영역 no. 자체
		order: meta?.priority ?? no,
		name: meta?.description ?? `area-${no}`,
		...(meta?.description ? { description: meta.description } : {}),
		...(meta?.layout ? { layout: meta.layout } : {}),
		...(meta?.type ? { areaType: meta.type } : {}),
		...(meta?.visibility ? { visibility: meta.visibility } : {}),
		...(meta?.serverControl ? { serverControl: meta.serverControl } : {}),
		...(meta?.minCount !== undefined ? { minCount: meta.minCount } : {}),
		...(meta?.maxCount !== undefined ? { maxCount: meta.maxCount } : {}),
		...(meta?.priority !== undefined ? { priority: meta.priority } : {}),
		...(meta?.errorPolicy ? { errorPolicy: meta.errorPolicy } : {}),
		...(anchors.size > 0 ? { policyAnchors: [...anchors] } : {}),
		children: components.map(toChildRef),
	};
}

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
	return [...items].sort((a, b) => a.order - b.order);
}
