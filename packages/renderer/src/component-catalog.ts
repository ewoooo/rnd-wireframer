// Catalog 데이터/타입은 @cx/components/catalog가 소유한다. renderer는 호환 re-export만 유지한다.
export {
	componentCatalog,
	componentCatalogAliases,
	type ComponentCatalogType,
	getComponentCatalogEntry,
	getComponentCatalogTypes,
	getComponentPropContract,
} from "@cx/components/catalog";
export type {
	ComponentCatalog,
	ComponentCatalogEntry,
	ComponentCatalogSource,
	ComponentPropContract,
	ComponentPropRole,
	ComponentPropType,
	RenderTreeNodeKind,
} from "@cx/types";
