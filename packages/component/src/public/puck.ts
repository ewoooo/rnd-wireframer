import { getComponentCatalogEntry, getComponentCatalogTypes } from "./resolver";
import type { ComponentCatalogEntry } from "./types";

export type ComponentPuckCatalogItem = {
	componentVersion?: string;
	defaultProps?: Record<string, unknown>;
	nodeId?: string;
	nodeType: string;
	puckType: string;
	title: string;
};

export function getPrimitivePuckCatalogItems(): ComponentPuckCatalogItem[] {
	return getComponentCatalogTypes().map((type) => {
		const entry = getComponentCatalogEntry(type);
		if (!entry) {
			return {
				componentVersion: "1.0.0",
				nodeType: type,
				puckType: createPuckCatalogType(type),
				title: type,
			};
		}
		return componentCatalogEntryToPuckItem(entry);
	});
}

export function componentCatalogEntryToPuckItem(
	entry: ComponentCatalogEntry,
): ComponentPuckCatalogItem {
	return {
		componentVersion: entry.version,
		defaultProps: readDefaultProps(entry),
		nodeType: entry.type,
		puckType: createPuckCatalogType(entry.type),
		title: entry.type,
	};
}

export function createPuckCatalogType(type: string) {
	return `catalog:${type}`;
}

function readDefaultProps(entry: ComponentCatalogEntry): ComponentPuckCatalogItem["defaultProps"] {
	const props = Object.entries(entry.props).reduce<Record<string, unknown>>(
		(defaults, [propName, contract]) => {
			if (contract.defaultValue !== undefined) defaults[propName] = contract.defaultValue;
			return defaults;
		},
		{},
	);

	return Object.keys(props).length > 0 ? props : undefined;
}
