import type { AreaType } from "./node-types";

/**
 * Renderer dispatch kind. component-catalog와 renderer kind contract가 공유하는 어휘다.
 * 새 kind를 추가하면 @cx/renderer의 RendererRegistry가 처리하도록 매핑도 같이 갱신한다.
 */
export type RenderTreeNodeKind =
	| "accordion"
	| "action"
	| "checkbox"
	| "divider"
	| "fallback"
	| "header"
	| "layout-flex"
	| "layout-grid"
	| "list-cell"
	| AreaType
	| "page-stack"
	| "section-header"
	| "section-message"
	| "text-field";

export type ComponentCatalogSource = "react-component" | "renderer-composite" | "layout-primitive";

export type ComponentPropType = "array" | "boolean" | "enum" | "node" | "number" | "string";

export type ComponentPropRole =
	| "content"
	| "data"
	| "description"
	| "event"
	| "label"
	| "layout"
	| "slot"
	| "state"
	| "styleVariant"
	| "title"
	| "value"
	| "visibility";

export interface ComponentPropContract {
	type: ComponentPropType;
	role?: ComponentPropRole;
	required?: boolean;
	values?: readonly string[];
	defaultValue?: unknown;
	description?: string;
	aiWritable?: boolean;
}

export interface ComponentCatalogEntry {
	type: string;
	source: ComponentCatalogSource;
	version: string;
	description?: string;
	aliases?: readonly string[];
	/**
	 * Renderer kind. 분기 신호가 아니라 그룹 태그.
	 * 미지정 시 runtime이 "fallback" kind로 처리.
	 */
	kind?: RenderTreeNodeKind;
	props: Record<string, ComponentPropContract>;
}

export type ComponentCatalog = Record<string, ComponentCatalogEntry>;
