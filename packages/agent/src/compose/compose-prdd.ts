import type {
	ComposedAreaChildRef,
	ComposedAreaNode,
	ComposedBottomRegion,
	ComposedComponentNode,
	ComposedContentsRegion,
	ComposedHeaderRegion,
	ComposedPrddScreen,
	ComposedScreenNode,
	RegisteredAreaNode,
	RegisteredComponentNode,
} from "../types";
import type { RegisteredPrddScreen } from "../register/register-prdd";

/**
 * RegisteredPrddScreen → ComposedPrddScreen.
 *
 * PRDD 파이프라인은 props가 이미 register 단계에서 채워져 있으므로
 * Composer는 트리 구조만 평탄화/복제한다 (raw → synth 단계 없음).
 */
export function composePrddScreen(input: RegisteredPrddScreen): ComposedPrddScreen {
	const warnings: string[] = [...input.warnings];
	const components = input.components.map(toComposedComponent);
	const areas = input.areas.map(toComposedArea);

	const screen: ComposedScreenNode = {
		id: input.screen.id,
		name: input.screen.name,
		order: input.screen.order,
		...(input.screen.description ? { description: input.screen.description } : {}),
		...(input.screen.surface ? { surface: input.screen.surface } : {}),
		children: {
			header: (input.screen.header?.children ?? []).map((ref) => ({
				organismId: ref.componentId,
				order: ref.order,
			})),
			contents: (input.screen.contents?.children ?? []).map((area) => ({
				organismId: area.id,
				order: area.order,
			})),
			bottom: (input.screen.bottom?.children ?? []).map((ref) => ({
				organismId: ref.componentId,
				order: ref.order,
			})),
		},
	};

	const header: ComposedHeaderRegion = {
		level: "region",
		slot: "header",
		children: (input.screen.header?.children ?? []).map(toComposedChildRef),
	};
	const contents: ComposedContentsRegion = {
		level: "region",
		slot: "contents",
		children: areas,
	};
	const bottom: ComposedBottomRegion = {
		level: "region",
		slot: "bottom",
		children: (input.screen.bottom?.children ?? []).map(toComposedChildRef),
	};

	return { screen, header, contents, bottom, components, areas, warnings };
}

function toComposedComponent(c: RegisteredComponentNode): ComposedComponentNode {
	return {
		id: c.id,
		name: c.name,
		order: c.order,
		...(c.description ? { description: c.description } : {}),
		type: c.type,
		...(c.policyID ? { policyID: c.policyID } : {}),
		props: { ...(c.props ?? {}) },
	};
}

function toComposedChildRef(ref: { componentId: string; order: number }): ComposedAreaChildRef {
	return { componentId: ref.componentId, order: ref.order };
}

function toComposedArea(a: RegisteredAreaNode): ComposedAreaNode {
	return {
		level: "area",
		id: a.id,
		key: a.key,
		order: a.order,
		name: a.name,
		...(a.description ? { description: a.description } : {}),
		...(a.layout ? { layout: a.layout } : {}),
		...(a.areaType ? { areaType: a.areaType } : {}),
		...(a.visibility ? { visibility: a.visibility } : {}),
		...(a.serverControl ? { serverControl: a.serverControl } : {}),
		...(a.minCount !== undefined ? { minCount: a.minCount } : {}),
		...(a.maxCount !== undefined ? { maxCount: a.maxCount } : {}),
		...(a.priority !== undefined ? { priority: a.priority } : {}),
		...(a.errorPolicy ? { errorPolicy: a.errorPolicy } : {}),
		...(a.policyAnchors ? { policyAnchors: [...a.policyAnchors] } : {}),
		children: a.children.map(toComposedChildRef),
	};
}
