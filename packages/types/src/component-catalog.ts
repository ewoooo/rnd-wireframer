import type { AreaType } from "./node-types";
import type { TokenRole, TokenSlot } from "./tokens";

/**
 * Renderer dispatch kind. component-catalog와 renderer kind contract가 공유하는 어휘다.
 * 새 kind를 추가하면 @cx/renderer의 RendererRegistry가 처리하도록 매핑도 같이 갱신한다.
 */
export type RenderTreeNodeKind =
	| "accordion"
	| "accordion-info"
	| "action"
	| "badge"
	| "banner-indicator"
	| "card-contents"
	| "card-summary"
	| "checkbox"
	| "divider"
	| "fallback"
	| "filter-sorting"
	| "footer"
	| "header"
	| "legal-text"
	| "layout-flex"
	| "layout-grid"
	| "list-cell"
	| "map"
	| "option-card"
	| AreaType
	| "page-stack"
	| "product-card"
	| "product-info"
	| "section-header"
	| "section-message"
	| "search-bar"
	| "store-card"
	| "text-link"
	| "text-field"
	| "thumbnail-large"
	| "title-section";

export type ComponentCatalogSource =
	| "react-component"
	| "renderer-composite"
	| "layout-primitive"
	| "kiki-barrel"      // kiki 공식 barrel export
	| "kiki-draft";      // kiki 비공식 (barrel 미등록)

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
	/**
	 * 이 prop의 값이 디자인 토큰 스케일에서 와야 한다고 선언한다.
	 * 예: gap/padding 류는 tokenRole: "spacing", 반경류는 "radius".
	 * Validation은 tokenRole이 수치 스케일일 때 값이 해당 스케일 안에 있는지 검사한다.
	 */
	tokenRole?: TokenRole;
	/**
	 * enum/styleVariant prop의 각 variant가 슬롯별로 어떤 token role을 선택하는지 선언.
	 * 예: { primary: { surface: "color.surface.brand", text: "color.text.inverse" } }.
	 * variantTokens 키는 반드시 values에 포함되어야 한다 (validation이 검사).
	 */
	variantTokens?: Record<string, Partial<Record<TokenSlot, TokenRole>>>;
}

export interface ComponentCatalogEntry {
	type: string;
	source: ComponentCatalogSource;
	version: string;
	/** UI 표시용 이름. 미지정 시 type을 그대로 사용. 예: "[kiki] Button", "[kiki/draft] CardSection" */
	label?: string;
	description?: string;
	aliases?: readonly string[];
	/**
	 * Renderer kind. 분기 신호가 아니라 그룹 태그.
	 * 미지정 시 runtime이 "fallback" kind로 처리.
	 */
	kind?: RenderTreeNodeKind;
	props: Record<string, ComponentPropContract>;
	/**
	 * 컴포넌트 자체가 사용하는 token slot → role 매핑.
	 * 예: BrandHero는 { surface: "color.surface.brand", text: "color.text.inverse" }.
	 * 슬롯별 variant는 향후 variantTokens(per-prop)로 확장한다.
	 */
	tokens?: Partial<Record<TokenSlot, TokenRole>>;
}

export type ComponentCatalog = Record<string, ComponentCatalogEntry>;
