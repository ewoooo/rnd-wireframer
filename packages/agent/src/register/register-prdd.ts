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
function classifyArea(no: number): "header" | "bottom" | "contents" {
	if (no === 0) return "header";
	if (no >= 999) return "bottom";
	return "contents";
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

		if (slot === "header") {
			for (const c of components) headerChildren.push(toChildRef(c));
		} else if (slot === "bottom") {
			for (const c of components) bottomChildren.push(toChildRef(c));
		} else {
			contentsAreas.push(toArea(no, areaMetaByNo.get(no), components, stableScreenId));
		}

		// 메타는 있는데 컴포넌트 없거나, 컴포넌트는 있는데 메타 없는 경우 경고
		const meta = areaMetaByNo.get(no);
		if (!meta && slot === "contents") {
			warnings.push(`영역 ${no}: 화면 구성 메타 없음 (컴포넌트만 존재)`);
		}
		if (meta && components.length === 0 && slot === "contents") {
			warnings.push(`영역 ${no}: 메타만 있고 컴포넌트 없음`);
		}
	}

	// 5) Screen 노드 조립
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
		name: parsed.meta.screenName ?? stableScreenId,
		order: 1,
		...(parsed.meta.description ? { description: parsed.meta.description } : {}),
		...(parsed.meta.route ? { surface: parsed.meta.route } : {}),
		organisms: [], // deprecated; PRDD 입력은 region 구조만 채움
		header,
		contents,
		bottom,
	};

	return { screen, components: allComponents, areas: contentsAreas, warnings };
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
