import {
	type ComponentCatalogEntry,
	componentCatalog,
	componentCatalogAliases,
} from "./component-catalog";
import type { RenderTreeNodeKind } from "./runtime";

const structuralRendererKinds = {
	"Layout.Flex": "layout-flex",
	"Layout.Grid": "layout-grid",
	PageStack: "page-stack",
	"area.static": "area.static",
	"area.dynamic": "area.dynamic",
	Accordion: "accordion",
	accordion: "accordion",
	ActionArea: "action",
	"action-area": "action",
} as const satisfies Record<string, RenderTreeNodeKind>;

export function createRendererKindMap() {
	const kindByType = new Map<string, RenderTreeNodeKind>(
		Object.entries(structuralRendererKinds) as Array<[string, RenderTreeNodeKind]>,
	);

	for (const entry of Object.values(componentCatalog) as ComponentCatalogEntry[]) {
		registerCatalogEntry(kindByType, entry);
	}

	for (const [alias, type] of Object.entries(componentCatalogAliases)) {
		const entry = (componentCatalog as Record<string, ComponentCatalogEntry>)[type];
		if (entry?.kind && !kindByType.has(alias)) kindByType.set(alias, entry.kind);
	}

	return kindByType;
}

function registerCatalogEntry(
	kindByType: Map<string, RenderTreeNodeKind>,
	entry: ComponentCatalogEntry,
) {
	if (!entry.kind) return;

	kindByType.set(entry.type, entry.kind);
	for (const alias of entry.aliases ?? []) {
		kindByType.set(alias, entry.kind);
	}
}
