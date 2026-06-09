import { type LayoutCatalogObject, SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";
import type {
	LayoutCatalogEntry,
	LayoutCatalogStatus,
	LayoutPatternTarget,
} from "./catalog-types";
import { layoutCatalog } from "./catalog.generated";

// @cx/layout 카탈로그 읽기 전용 API. @cx/external/resolver와 동형(type↔id, kind↔target).
// component 해석은 여기 두지 않는다 — renderer가 registry + canonicalize로 직접 한다.

export { layoutCatalog };

export function getLayoutCatalogEntry(id: string): LayoutCatalogEntry | undefined {
	return layoutCatalog[id];
}

export function getLayoutCatalogIds(): string[] {
	return Object.keys(layoutCatalog).sort();
}

export function getLayoutCatalogStatus(id: string): LayoutCatalogStatus | undefined {
	return layoutCatalog[id]?.status;
}

export function listLayoutCatalog(
	options: { target?: LayoutPatternTarget; status?: LayoutCatalogStatus } = {},
): LayoutCatalogEntry[] {
	return Object.values(layoutCatalog).filter((entry) => {
		if (options.target && entry.target !== options.target) return false;
		if (options.status && entry.status !== options.status) return false;
		return true;
	});
}

export function resolveLayoutCatalogForInference(): LayoutCatalogObject {
	return {
		kind: "layout-catalog",
		id: "default",
		owner: "@cx/layout",
		sourceRef: "catalog",
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			screen: listLayoutCatalog({ target: "screen" }),
			region: listLayoutCatalog({ target: "region" }),
			area: listLayoutCatalog({ target: "area" }),
			composite: listLayoutCatalog({ target: "composite" }),
		},
	};
}
