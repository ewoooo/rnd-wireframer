import type {
	RenderTreeContract,
	RenderTreeLayoutFlexNodeContract,
	RenderTreeLayoutGridNodeContract,
	RenderTreeMetadata,
	RenderTreeNodeContract,
	RenderTreeNodeMetadata,
	RenderTreeScreenBottomNodeContract,
	RenderTreeScreenContentsNodeContract,
	RenderTreeScreenHeaderNodeContract,
	RenderTreeScreenNodeContract,
	SchemaPropBinding,
	SchemaPropValue,
	RenderTreeFlexLayoutProps as SchemaRenderTreeFlexLayoutProps,
	RenderTreeGridLayoutProps as SchemaRenderTreeGridLayoutProps,
} from "@cx/schema";

export type PropBinding = SchemaPropBinding;
export type PropValue = SchemaPropValue;
export type FlexLayoutProps = SchemaRenderTreeFlexLayoutProps;
export type GridLayoutProps = SchemaRenderTreeGridLayoutProps;

export type RenderTreeDisplay = NonNullable<RenderTreeNodeContract["display"]>;

export interface RenderTreeStyle {
	background?: string;
	opacity?: number;
}

export type { RenderTreeMetadata, RenderTreeNodeMetadata };

export type RenderTreeNode = RenderTreeNodeContract & {
	className?: string;
	style?: RenderTreeStyle;
};

export type RenderTreeScreenHeaderNode = RenderTreeScreenHeaderNodeContract;
export type RenderTreeScreenContentsNode = RenderTreeScreenContentsNodeContract;
export type RenderTreeScreenBottomNode = RenderTreeScreenBottomNodeContract;
export type RenderTreeScreenNode = RenderTreeScreenNodeContract;

export type RenderTreeFlexLayoutProps = SchemaRenderTreeFlexLayoutProps;
export type RenderTreeGridLayoutProps = SchemaRenderTreeGridLayoutProps;
export type RenderTreeLayoutFlexNode = RenderTreeLayoutFlexNodeContract;
export type RenderTreeLayoutGridNode = RenderTreeLayoutGridNodeContract;

export type RenderTree = RenderTreeContract;

export function isBindingValue(value: PropValue): value is PropBinding {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		"bind" in value &&
		typeof (value as PropBinding).bind === "string"
	);
}
