import { NODE_TYPES } from "@cx/types";
import {
	type ComponentCatalogEntry,
	componentCatalog,
	componentCatalogAliases,
} from "./component-catalog";
import type { RenderTreeNodeKind } from "./runtime";

const structuralRendererKinds = {
	ActionArea: "action",
	"action-area": "action",
} as const satisfies Record<string, RenderTreeNodeKind>;

export function createRendererKindMap() {
	const kindByType = new Map<string, RenderTreeNodeKind>(
		Object.entries(structuralRendererKinds) as Array<[string, RenderTreeNodeKind]>,
	);

	registerKnownNodeTypes(kindByType);

	for (const entry of Object.values(componentCatalog) as ComponentCatalogEntry[]) {
		registerCatalogEntry(kindByType, entry);
	}

	for (const [alias, type] of Object.entries(componentCatalogAliases)) {
		const entry = (componentCatalog as Record<string, ComponentCatalogEntry>)[type];
		if (entry?.kind && !kindByType.has(alias)) kindByType.set(alias, entry.kind);
	}

	return kindByType;
}

function registerKnownNodeTypes(kindByType: Map<string, RenderTreeNodeKind>) {
	const structuralKindEntries = [
		[NODE_TYPES.layout[0], "layout-flex"],
		[NODE_TYPES.layout[1], "layout-grid"],
		[NODE_TYPES.layout[2], "page-stack"],
		[NODE_TYPES.area[0], NODE_TYPES.area[0]],
		[NODE_TYPES.area[1], NODE_TYPES.area[1]],
	] as const satisfies ReadonlyArray<readonly [string, RenderTreeNodeKind]>;

	for (const [type, kind] of structuralKindEntries) {
		kindByType.set(type, kind);
	}
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
