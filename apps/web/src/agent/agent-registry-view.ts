import type {
	NodeLevel,
	RegisteredComponentNode,
	RegisteredNodeTree,
	RegisteredAreaNode,
	RegisteredRouteNode,
	RegisteredScreenNode,
	RegisteredVariantNode,
} from "@cx/agent";

export interface AgentNodeSelection {
	id: string;
	level: NodeLevel;
}

export type SelectedAgentAsset =
	| {
			level: "route";
			item: RegisteredRouteNode;
	  }
	| {
			level: "variant";
			item: RegisteredVariantNode;
	  }
	| {
			level: "screen";
			item: RegisteredScreenNode;
	  }
	| {
			level: "area";
			item: RegisteredAreaNode;
	  }
	| {
			level: "component";
			item: RegisteredComponentNode;
	  };

export function getDefaultAgentSelection(
	registry: RegisteredNodeTree | undefined,
): AgentNodeSelection {
	const screen = registry?.routes[0]?.variants[0]?.screens[0];
	if (screen) {
		return {
			level: "screen",
			id: screen.id,
		};
	}

	const route = registry?.routes[0];
	return {
		level: route ? "route" : "screen",
		id: route?.id ?? "",
	};
}

export function findSelectedAgentAsset(
	registry: RegisteredNodeTree | undefined,
	selection: AgentNodeSelection | undefined,
): SelectedAgentAsset | undefined {
	if (!registry || !selection?.id) return undefined;

	for (const route of registry.routes) {
		if (selection.level === "route" && route.id === selection.id) {
			return { level: "route", item: route };
		}

		for (const variant of route.variants) {
			if (selection.level === "variant" && variant.id === selection.id) {
				return { level: "variant", item: variant };
			}

			for (const screen of variant.screens) {
				if (selection.level === "screen" && screen.id === selection.id) {
					return { level: "screen", item: screen };
				}
			}
		}
	}

	for (const area of registry.areas) {
		if (selection.level === "area" && area.id === selection.id) {
			return { level: "area", item: area };
		}
	}

	for (const component of registry.components) {
		if (selection.level === "component" && component.id === selection.id) {
			return { level: "component", item: component };
		}
	}

	return undefined;
}
