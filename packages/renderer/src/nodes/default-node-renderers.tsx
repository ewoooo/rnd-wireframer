import { AppBar, Callout, ListSelected, ListText } from "@cx/components";
import type { ComponentCatalogEntry } from "@cx/components/catalog";
import { componentCatalog, getComponentCatalogEntry } from "@cx/components/catalog";
import { Flex, Grid } from "@cx/layout/primitives";
import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/style";
import { createElement } from "react";
import type { NodeRenderer, NodeRendererDefinition } from "../registry/node-renderer-registry";
import { toNumber } from "../tree/coerce";
import { toText } from "../tree/runtime";
import type {
	RenderTreeFlexLayoutProps,
	RenderTreeGridLayoutProps,
	RenderTreeLayoutFlexNode,
	RenderTreeLayoutGridNode,
	RenderTreeNodeKind,
} from "../tree/types";
import { areaNodeRenderers } from "./area";
import { buildComponentProps } from "./component/props-from-catalog";
import { resolveComponentByType } from "./component/resolve-component";

/**
 * Default renderer 정의.
 *
 * 구조적 컴포넌트(Flex, Grid, page-stack, area)는 children을 다루므로 명시 정의.
 * 그 외 leaf 컴포넌트는 catalog의 type→component·props 정보로 **자동 렌더**한다.
 * 새 leaf 컴포넌트를 추가할 때 이 파일을 만지지 않는다 — catalog만 갱신.
 */

const autoRenderLeaf: NodeRenderer = (context) => {
	const { node, renderable } = context;
	const Component = resolveComponentByType(node.type);
	if (!Component) {
		const compositeRenderer = resolveCompositeRenderer(node.type);
		if (compositeRenderer) return compositeRenderer(context);

		return createElement(
			"div",
			{
				key: node.metadata.id,
				className: "rounded-lg border bg-background p-3 text-sm",
			},
			node.metadata.title,
		);
	}
	const props = buildComponentProps(node.type, renderable.props, {
		title: node.metadata.title,
		description: node.metadata.description,
	});
	return createElement(Component, { key: node.metadata.id, ...props });
};

function resolveCompositeRenderer(type: string): NodeRenderer | undefined {
	const canonicalType = getComponentCatalogEntry(type)?.type ?? type;
	return RENDERER_COMPOSITE_RENDERERS[canonicalType] ?? RENDERER_COMPOSITE_RENDERERS[type];
}

const RENDERER_COMPOSITE_RENDERERS: Record<string, NodeRenderer> = {
	Accordion: ({ node, renderable }) => {
		const props = buildComponentProps(node.type, renderable.props, {
			title: node.metadata.title,
			description: node.metadata.description,
		});
		return (
			<Callout key={node.metadata.id} title={toText(props.title, node.metadata.title)}>
				{toText(props.description, "")}
			</Callout>
		);
	},
	SectionMessage: ({ node, renderable }) => {
		const props = buildComponentProps(node.type, renderable.props, {
			title: node.metadata.title,
			description: node.metadata.description,
		});
		return (
			<Callout key={node.metadata.id} title={toText(props.title, node.metadata.title)}>
				{toText(props.description, "")}
			</Callout>
		);
	},
	ListCell: ({ node, renderable }) => {
		const props = buildComponentProps(node.type, renderable.props, {
			title: node.metadata.title,
			subText: node.metadata.description,
		});
		return (
			<ListText
				key={node.metadata.id}
				title={toText(props.title, node.metadata.title)}
				subText={toText(props.subText, "")}
			/>
		);
	},
	Checkbox: ({ node, renderable }) => {
		const props = buildComponentProps(node.type, renderable.props, {
			label: node.metadata.title,
		});
		return (
			<ListSelected
				key={node.metadata.id}
				type="checkbox"
				label={toText(props.label, node.metadata.title)}
				checked={
					renderable.props.checked !== undefined ? Boolean(renderable.props.checked) : undefined
				}
				showButton={false}
				showPrice={false}
			/>
		);
	},
	HeaderBase: ({ node, renderable }) => {
		const props = buildComponentProps(node.type, renderable.props, {
			titleContent: node.metadata.title,
		});
		return (
			<AppBar
				key={node.metadata.id}
				title={toText(props.titleContent, node.metadata.title)}
				showBack={Boolean(props.showBackButton)}
				showLogo={Boolean(props.showLogo)}
			/>
		);
	},
	SectionHeader: ({ node, renderable }) => {
		const props = buildComponentProps(node.type, renderable.props, {
			title: node.metadata.title,
			description: node.metadata.description,
		});
		return (
			<section key={node.metadata.id} className="flex flex-col gap-1">
				<h2 className="text-title-20 font-semibold text-foreground">
					{toText(props.title, node.metadata.title)}
				</h2>
				{props.description !== undefined && (
					<p className="text-body-14 text-muted-foreground">{toText(props.description, "")}</p>
				)}
			</section>
		);
	},
};

// catalog 안의 leaf 컴포넌트 kind 집합. layout-primitive는 구조 처리하므로 제외.
const STRUCTURAL_KINDS = new Set<string>(["layout-flex", "layout-grid", "page-stack"]);

const leafKinds = new Set<RenderTreeNodeKind>();
for (const entry of Object.values(componentCatalog) as ComponentCatalogEntry[]) {
	if (!entry.kind) continue;
	if (entry.source === "layout-primitive") continue;
	if (STRUCTURAL_KINDS.has(entry.kind)) continue;
	leafKinds.add(entry.kind);
}

const leafDefinitions: NodeRendererDefinition[] = Array.from(leafKinds).map((kind) => ({
	kind,
	render: autoRenderLeaf,
}));

export const defaultNodeRenderers: NodeRendererDefinition[] = [
	{
		kind: "layout-flex",
		render: ({ node, renderable, renderChildren }) => (
			<Flex
				key={node.metadata.id}
				layout={renderable.props as RenderTreeFlexLayoutProps}
				node={node as RenderTreeLayoutFlexNode}
			>
				{renderChildren()}
			</Flex>
		),
	},
	{
		kind: "layout-grid",
		render: ({ node, renderable, renderChildren }) => (
			<Grid
				key={node.metadata.id}
				layout={renderable.props as RenderTreeGridLayoutProps}
				node={node as RenderTreeLayoutGridNode}
			>
				{renderChildren()}
			</Grid>
		),
	},
	{
		kind: "page-stack",
		render: ({ node, renderable, renderChildren }) => {
			const { props } = renderable;
			const sectionPaddingX = toNumber(props.sectionPaddingX, 12);
			const itemPaddingX = toNumber(props.itemPaddingX, 20);
			const paddingY = toNumber(props.paddingY, 28);
			const slotInsetX = toNumber(props.slotInsetX, 0);
			const sectionGap = toNumber(props.sectionGap, 0);
			const itemGap = toNumber(props.gap, 0);
			const titleMode = String(props.titleMode ?? "none");
			const itemTemplate = String(props.itemTemplate ?? "default-20");
			const showTitle = titleMode === "visible";

			return (
				<section
					key={node.metadata.id}
					className={cx(
						"box-border flex w-full flex-col",
						spacingUtilityClass("gap", sectionGap),
						spacingUtilityClass("py", paddingY),
						spacingUtilityClass("px", sectionPaddingX),
						itemTemplate === "card-0" ? "rounded-[20px] bg-white" : undefined,
					)}
					data-node-id={node.metadata.id}
					data-node-type={node.type}
					data-page-stack-template={itemTemplate}
					data-page-stack-title={titleMode}
					style={{
						gap: spacingFallbackStyleValue(sectionGap),
						paddingBlock: spacingFallbackStyleValue(paddingY),
						paddingInline: spacingFallbackStyleValue(sectionPaddingX),
					}}
				>
					{showTitle ? (
						<div
							className={cx("box-border w-full", spacingUtilityClass("px", itemPaddingX))}
							style={{ paddingInline: spacingFallbackStyleValue(itemPaddingX) }}
						>
							<h2 className="m-0 text-title-20 font-semibold text-foreground">
								{toText(node.metadata.title)}
							</h2>
						</div>
					) : null}
					<div
						className={cx(
							"box-border flex w-full flex-col",
							spacingUtilityClass("gap", itemGap),
							spacingUtilityClass("px", itemPaddingX),
						)}
						style={{
							gap: spacingFallbackStyleValue(itemGap),
							paddingInline: itemPaddingX + slotInsetX,
						}}
					>
						{renderChildren()}
					</div>
				</section>
			);
		},
	},
	...areaNodeRenderers,
	...leafDefinitions,
	{
		kind: "fallback",
		render: ({ node }) => (
			<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
				{toText(node.metadata.title)}
			</div>
		),
	},
];
