import type {
	GeneratedComponentNode,
	GeneratedNodeTree,
	GeneratedOrganismNode,
	GeneratedRouteNode,
	GeneratedScreenNode,
	GeneratedVariantNode,
	RegisteredComponentNode,
	RegisteredNodeTree,
	RegisteredOrganismChildRef,
	RegisteredOrganismNode,
	RegisteredRouteNode,
	RegisteredScreenNode,
	RegisteredScreenOrganismRef,
	RegisteredVariantNode,
} from "../types";

export function registerAssets(input: GeneratedNodeTree): RegisteredNodeTree {
	const warnings: string[] = [];
	const components = orderByIndex(input.components ?? []).map((component, index) =>
		registerComponent(component, index, warnings),
	);
	const componentById = new Map(components.map((component) => [component.id, component]));
	const organisms = orderByIndex(input.organisms ?? []).map((organism, index) => {
		return registerOrganism(organism, index, componentById, warnings);
	});
	const organismById = new Map(organisms.map((organism) => [organism.id, organism]));
	const routes = orderByIndex(input.routes).map((route, index) => {
		return registerRoute(route, index, organismById, warnings);
	});

	return {
		routes,
		organisms,
		components,
		warnings,
	};
}

function registerRoute(
	route: GeneratedRouteNode,
	index: number,
	organismById: Map<string, RegisteredOrganismNode>,
	warnings: string[],
): RegisteredRouteNode {
	return {
		level: "route",
		id: route.id,
		name: route.name ?? route.id,
		order: normalizeOrder(route.order, index),
		...(route.description ? { description: route.description } : {}),
		variants: orderByIndex(route.variants).map((variant, variantIndex) => {
			return registerVariant(variant, variantIndex, organismById, warnings);
		}),
	};
}

function registerVariant(
	variant: GeneratedVariantNode,
	index: number,
	organismById: Map<string, RegisteredOrganismNode>,
	warnings: string[],
): RegisteredVariantNode {
	return {
		level: "variant",
		id: variant.id,
		name: variant.name ?? variant.id,
		order: normalizeOrder(variant.order, index),
		...(variant.description ? { description: variant.description } : {}),
		screens: orderByIndex(variant.screens).map((screen, screenIndex) => {
			return registerScreen(screen, screenIndex, organismById, warnings);
		}),
	};
}

function registerScreen(
	screen: GeneratedScreenNode,
	index: number,
	organismById: Map<string, RegisteredOrganismNode>,
	warnings: string[],
): RegisteredScreenNode {
	return {
		level: "screen",
		id: screen.id,
		name: screen.name ?? screen.id,
		order: normalizeOrder(screen.order, index),
		...(screen.description ? { description: screen.description } : {}),
		...(screen.surface ? { surface: screen.surface } : {}),
		organisms: orderRefs(screen.organisms ?? [], "organismId").map((ref, refIndex) => {
			const organism = organismById.get(ref.organismId);
			if (!organism) {
				warnings.push(`Missing organism: ${ref.organismId}`);
			}

			const registeredRef: RegisteredScreenOrganismRef = {
				organismId: ref.organismId,
				order: normalizeOrder(ref.order, refIndex),
				...(organism ? { organism } : {}),
			};

			return registeredRef;
		}),
	};
}

function registerOrganism(
	organism: GeneratedOrganismNode,
	index: number,
	componentById: Map<string, RegisteredComponentNode>,
	warnings: string[],
): RegisteredOrganismNode {
	return {
		level: "organism",
		id: organism.id,
		name: organism.name ?? organism.id,
		order: normalizeOrder(organism.order, index),
		...(organism.description ? { description: organism.description } : {}),
		...(organism.layout ? { layout: organism.layout } : {}),
		children: orderRefs(getOrganismChildren(organism), "componentId").map((ref, refIndex) => {
			const component = componentById.get(ref.componentId);
			if (!component) {
				warnings.push(`Missing component: ${ref.componentId}`);
			}

			const registeredRef: RegisteredOrganismChildRef = {
				componentId: ref.componentId,
				order: normalizeOrder(ref.order, refIndex),
				...(component ? { component } : {}),
			};

			return registeredRef;
		}),
	};
}

function getOrganismChildren(organism: GeneratedOrganismNode) {
	const legacy = organism as GeneratedOrganismNode & {
		components?: GeneratedOrganismNode["children"];
	};
	return organism.children ?? legacy.components ?? [];
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
