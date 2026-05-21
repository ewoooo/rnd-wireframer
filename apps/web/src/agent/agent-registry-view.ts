import type {
	AssetLevel,
	AssetRegistry,
	RegisteredComponentAsset,
	RegisteredOrganismAsset,
	RegisteredScreenAsset,
	RegisteredScreenRouteAsset,
	RegisteredScreenVariantAsset,
} from "@cx/agent";

export interface AgentNodeSelection {
	id: string;
	level: AssetLevel;
}

export type SelectedAgentAsset =
	| {
			level: "route";
			item: RegisteredScreenRouteAsset;
	  }
	| {
			level: "variant";
			item: RegisteredScreenVariantAsset;
	  }
	| {
			level: "screen";
			item: RegisteredScreenAsset;
	  }
	| {
			level: "organism";
			item: RegisteredOrganismAsset;
	  }
	| {
			level: "component";
			item: RegisteredComponentAsset;
	  };

export function getDefaultAgentSelection(registry: AssetRegistry | undefined): AgentNodeSelection {
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
	registry: AssetRegistry | undefined,
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

	for (const organism of registry.organisms) {
		if (selection.level === "organism" && organism.id === selection.id) {
			return { level: "organism", item: organism };
		}
	}

	for (const component of registry.components) {
		if (selection.level === "component" && component.id === selection.id) {
			return { level: "component", item: component };
		}
	}

	return undefined;
}
