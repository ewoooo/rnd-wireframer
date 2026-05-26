import {
	ActionButton,
	AppBar,
	Button,
	Callout,
	Divider,
	ListText,
	TextField,
} from "@cx/components";
import {
	cx,
	Flex,
	Grid,
	spacingFallbackStyleValue,
	spacingUtilityClass,
} from "@cx/layout/primitives";
import { toButtonSize, toButtonVariant, toDividerType, toNumber } from "./normalize-render-props";
import type { RendererDefinition } from "./registry";
import { areaRendererDefinitions } from "./renderers/area";
import { toBoolean, toText } from "./runtime";
import type {
	RenderTreeFlexLayoutProps,
	RenderTreeGridLayoutProps,
	RenderTreeLayoutFlexNode,
	RenderTreeLayoutGridNode,
} from "./schema";

export const defaultRendererDefinitions: RendererDefinition[] = [
	{
		kind: "header",
		render: ({ node, renderable }) => {
			const { props } = renderable;
			return (
				<AppBar
					key={node.metadata.id}
					title={toText(props.titleContent)}
					showBack={toBoolean(props.showBackButton, true)}
				/>
			);
		},
	},
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

			return (
				<section
					key={node.metadata.id}
					className={cx(
						"box-border flex w-full flex-col",
						spacingUtilityClass("py", paddingY),
						spacingUtilityClass("px", sectionPaddingX),
					)}
					data-node-id={node.metadata.id}
					data-node-type={node.type}
					style={{
						paddingBlock: spacingFallbackStyleValue(paddingY),
						paddingInline: spacingFallbackStyleValue(sectionPaddingX),
					}}
				>
					<div
						className={cx(
							"box-border flex w-full flex-col",
							spacingUtilityClass("px", itemPaddingX),
						)}
						style={{ paddingInline: spacingFallbackStyleValue(itemPaddingX) }}
					>
						{renderChildren()}
					</div>
				</section>
			);
		},
	},
	{
		kind: "divider",
		render: ({ node, renderable }) => (
			<div key={node.metadata.id} data-node-id={node.metadata.id} data-node-type={node.type}>
				<Divider type={toDividerType(renderable.props.type)} />
			</div>
		),
	},
	{
		kind: "section-header",
		render: ({ node, renderable }) => {
			const { props } = renderable;
			return (
				<section key={node.metadata.id} className="flex flex-col gap-2">
					<h2 className="text-[22px] font-semibold leading-7 text-foreground">
						{toText(props.title, node.metadata.title)}
					</h2>
					{props.description ? (
						<p className="text-sm leading-5 text-muted-foreground">{toText(props.description)}</p>
					) : null}
				</section>
			);
		},
	},
	...areaRendererDefinitions,
	{
		kind: "list-cell",
		render: ({ node, renderable }) => {
			const { props } = renderable;
			return (
				<div key={node.metadata.id} className="w-full min-w-0 rounded-lg border bg-background">
					<ListText table="off" title={toText(props.title, node.metadata.title)} showRightItem />
					{props.description ? (
						<p className="px-4 pb-3 text-xs leading-5 text-muted-foreground">
							{toText(props.description)}
						</p>
					) : null}
				</div>
			);
		},
	},
	{
		kind: "accordion",
		render: ({ node, renderable }) => (
			<Callout key={node.metadata.id} title={toText(renderable.props.title, node.metadata.title)}>
				{toText(renderable.props.description, node.metadata.description)}
			</Callout>
		),
	},
	{
		kind: "section-message",
		render: ({ node, renderable }) => {
			const { props } = renderable;
			const heading = toText(props.title) || toText(props.message) || toText(node.metadata.title);
			const body = props.title && props.message ? toText(props.message) : toText(props.description);
			return (
				<div key={node.metadata.id} className={getSectionMessageClassName(toText(props.variant))}>
					<p className="text-sm font-semibold">{heading}</p>
					{body ? <p className="mt-1 text-xs leading-5 opacity-80">{body}</p> : null}
				</div>
			);
		},
	},
	{
		kind: "text-field",
		render: ({ node, renderable }) => {
			const { props } = renderable;
			return (
				<TextField
					key={node.metadata.id}
					label={toText(props.label, node.metadata.title)}
					placeholder={toText(props.placeholder, "입력해주세요")}
					helperText={toText(props.helperText)}
					value={toText(props.value)}
					type={toText(props.inputType, "text")}
					error={toBoolean(props.error)}
				/>
			);
		},
	},
	{
		kind: "action",
		render: ({ node, renderable }) => {
			const { props } = renderable;
			const label = toText(props.title) || toText(props.label, node.metadata.title);
			if (node.type === "ActionButton") {
				return (
					<div key={node.metadata.id} className="w-full min-w-0">
						<ActionButton
							fullWidth={toBoolean(props.fullWidth, true)}
							size={toButtonSize(props.size)}
							variant={toButtonVariant(props.variant)}
						>
							{label}
						</ActionButton>
					</div>
				);
			}

			return (
				<div key={node.metadata.id} className="w-full min-w-0">
					<Button
						fullWidth={toBoolean(props.fullWidth, true)}
						size={toButtonSize(props.size)}
						variant={toButtonVariant(props.variant)}
					>
						{label}
					</Button>
				</div>
			);
		},
	},
	{
		kind: "fallback",
		render: ({ node }) => (
			<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
				{node.metadata.title}
			</div>
		),
	},
];

function getSectionMessageClassName(variant: string) {
	if (variant === "negative") {
		return "w-full min-w-0 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive";
	}

	if (variant === "positive") {
		return "w-full min-w-0 rounded-lg border border-emerald-500/30 bg-emerald-50 p-4 text-emerald-900";
	}

	if (variant === "cautionary") {
		return "w-full min-w-0 rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-amber-900";
	}

	return "w-full min-w-0 rounded-lg border border-primary/20 bg-primary/5 p-4 text-foreground";
}
