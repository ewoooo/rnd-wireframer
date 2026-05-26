import { NODE_TYPES } from "@cx/types";
import type {
	GeneratedAreaNode,
	GeneratedComponentNode,
	GeneratedNodeTree,
	GeneratedRouteNode,
	GeneratedScreenNode,
	GeneratedVariantNode,
	RegionSlot,
	RegisteredAreaChildRef,
	RegisteredAreaNode,
	RegisteredComponentNode,
	RegisteredNodeTree,
	RegisteredRouteNode,
	RegisteredScreenAreaRef,
	RegisteredScreenNode,
	RegisteredVariantNode,
} from "../types";

/**
 * 2026-05-26: keyword 기반 inferAreaSlot 제거.
 *
 * 옛 휴리스틱은 description 자연어("완료 여부" 등)에서 false positive를 만들어
 * organism content area를 잘못 bottom으로 슬롯팅했다. Client-import organism은
 * 본질적으로 content area이므로 항상 contents 반환한다. chrome(header/bottom CTA)은
 * Composer-AI synthesis가 담당.
 */
function inferAreaSlot(_ref: { areaId: string }, _area: RegisteredAreaNode | undefined): RegionSlot {
	return "contents";
}

export function registerAssets(input: GeneratedNodeTree): RegisteredNodeTree {
	const warnings: string[] = [];
	const registeredComponents = orderByIndex(input.components ?? []).map((component, index) =>
		registerComponent(component, index, warnings),
	);
	const components = dedupeComponentsById(registeredComponents, warnings);
	const componentById = new Map(components.map((component) => [component.id, component]));
	const areas = orderByIndex(input.areas ?? []).map((area, index) => {
		return registerArea(area, index, componentById, warnings);
	});
	const areaById = new Map(areas.map((area) => [area.id, area]));
	const routes = orderByIndex(input.routes).map((route, index) => {
		return registerRoute(route, index, areaById, warnings);
	});

	return {
		routes,
		areas,
		components,
		warnings,
	};
}

function dedupeComponentsById(
	components: RegisteredComponentNode[],
	warnings: string[],
): RegisteredComponentNode[] {
	const latestById = new Map<string, RegisteredComponentNode>();
	const duplicateIds = new Set<string>();
	for (const component of components) {
		if (latestById.has(component.id)) duplicateIds.add(component.id);
		latestById.set(component.id, component);
	}

	for (const id of [...duplicateIds].sort()) {
		warnings.push(`Duplicate component id collapsed: ${id}`);
	}

	return components.filter((component) => latestById.get(component.id) === component);
}

function registerRoute(
	route: GeneratedRouteNode,
	index: number,
	areaById: Map<string, RegisteredAreaNode>,
	warnings: string[],
): RegisteredRouteNode {
	return {
		level: "route",
		id: route.id,
		name: route.name ?? route.id,
		order: normalizeOrder(route.order, index),
		...(route.description ? { description: route.description } : {}),
		variants: orderByIndex(route.variants).map((variant, variantIndex) => {
			return registerVariant(variant, variantIndex, areaById, warnings);
		}),
	};
}

function registerVariant(
	variant: GeneratedVariantNode,
	index: number,
	areaById: Map<string, RegisteredAreaNode>,
	warnings: string[],
): RegisteredVariantNode {
	return {
		level: "variant",
		id: variant.id,
		name: variant.name ?? variant.id,
		order: normalizeOrder(variant.order, index),
		...(variant.description ? { description: variant.description } : {}),
		screens: orderByIndex(variant.screens).map((screen, screenIndex) => {
			return registerScreen(screen, screenIndex, areaById, warnings);
		}),
	};
}

function registerScreen(
	screen: GeneratedScreenNode,
	index: number,
	areaById: Map<string, RegisteredAreaNode>,
	warnings: string[],
): RegisteredScreenNode {
	return {
		level: "screen",
		id: screen.id,
		name: screen.name ?? screen.id,
		order: normalizeOrder(screen.order, index),
		// Legacy organism path: screen type 정보 없음. Register 책임에 따라 기본값 강제.
		screenType: NODE_TYPES.screenSurface[0],
		...(screen.description ? { description: screen.description } : {}),
		...(screen.surface ? { surface: screen.surface } : {}),
		areas: orderRefs(screen.areas ?? [], "areaId").map((ref, refIndex) => {
			const area = areaById.get(ref.areaId);
			if (!area) {
				warnings.push(`Missing area: ${ref.areaId}`);
			}

			const registeredRef: RegisteredScreenAreaRef = {
				areaId: ref.areaId,
				order: normalizeOrder(ref.order, refIndex),
				slot: inferAreaSlot(ref, area),
				...(area ? { area } : {}),
			};

			return registeredRef;
		}),
	};
}

function registerArea(
	area: GeneratedAreaNode,
	index: number,
	componentById: Map<string, RegisteredComponentNode>,
	warnings: string[],
): RegisteredAreaNode {
	return {
		level: "area",
		id: area.id,
		name: area.name ?? area.id,
		order: normalizeOrder(area.order, index),
		...(area.key !== undefined ? { key: area.key } : {}),
		...(area.description ? { description: area.description } : {}),
		...(area.layout ? { layout: area.layout } : {}),
		...(area.areaType ? { areaType: area.areaType } : {}),
		...(area.visibility ? { visibility: area.visibility } : {}),
		...(area.serverControl ? { serverControl: area.serverControl } : {}),
		...(area.minCount !== undefined ? { minCount: area.minCount } : {}),
		...(area.maxCount !== undefined ? { maxCount: area.maxCount } : {}),
		...(area.priority !== undefined ? { priority: area.priority } : {}),
		...(area.errorPolicy ? { errorPolicy: area.errorPolicy } : {}),
		children: orderRefs(getAreaChildren(area), "componentId").map((ref, refIndex) => {
			const component = componentById.get(ref.componentId);
			if (!component) {
				warnings.push(`Missing component: ${ref.componentId}`);
			}

			const registeredRef: RegisteredAreaChildRef = {
				componentId: ref.componentId,
				order: normalizeOrder(ref.order, refIndex),
				...(component ? { component } : {}),
			};

			return registeredRef;
		}),
	};
}

function getAreaChildren(area: GeneratedAreaNode) {
	const legacy = area as GeneratedAreaNode & {
		components?: GeneratedAreaNode["children"];
	};
	return area.children ?? legacy.components ?? [];
}

const POLICY_REF_PATTERN = /\[정책:([^\]]+)\]/g;

function extractPolicyRefs(note: string | undefined): {
	policyID: string[];
	description: string | undefined;
} {
	if (!note) return { policyID: [], description: undefined };
	const policyID: string[] = [];
	for (const match of note.matchAll(POLICY_REF_PATTERN)) {
		for (const id of match[1].split(",")) {
			const trimmed = id.trim();
			if (trimmed) policyID.push(trimmed);
		}
	}
	const stripped = note.replace(POLICY_REF_PATTERN, "").trim();
	return { policyID, description: stripped || undefined };
}

function registerComponent(
	component: GeneratedComponentNode,
	index: number,
	warnings: string[],
): RegisteredComponentNode {
	const type = component.type?.trim();
	if (!type) {
		warnings.push(`Missing component.type: ${component.id}`);
	}
	const { policyID, description: noteDescription } = extractPolicyRefs(component.raw?.note);
	const description = noteDescription ?? component.description ?? component.raw?.description;
	return {
		level: "component",
		id: component.id,
		name: component.name ?? component.id,
		order: normalizeOrder(component.order, index),
		type: type || "Unknown",
		...(description ? { description } : {}),
		...(policyID.length > 0 ? { policyID } : {}),
		props: { ...(component.props ?? {}) },
		...(component.raw ? { raw: component.raw } : {}),
	};
}

function orderByIndex<T extends { order?: number }>(items: T[]): T[] {
	return items
		.map((item, index) => ({ item, index }))
		.sort(
			(left, right) =>
				normalizeOrder(left.item.order, left.index) - normalizeOrder(right.item.order, right.index),
		)
		.map(({ item }) => item);
}

function orderRefs<T extends Record<TKey, string> & { order?: number }, TKey extends string>(
	items: T[],
	idKey: TKey,
): T[] {
	return items
		.map((item, index) => ({ item, index }))
		.sort((left, right) => {
			const orderDiff =
				normalizeOrder(left.item.order, left.index) - normalizeOrder(right.item.order, right.index);
			if (orderDiff !== 0) return orderDiff;
			return left.item[idKey].localeCompare(right.item[idKey]);
		})
		.map(({ item }) => item);
}

function normalizeOrder(order: number | undefined, index: number): number {
	return Number.isFinite(order) ? Number(order) : index + 1;
}
