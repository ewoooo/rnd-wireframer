import { AppBar, Callout, Button as CxButton, Divider, ListText, TextField } from "@cx/components";
import { Flex, Grid } from "@cx/layout/primitives";
import type {
	WireframeFlexLayoutProps,
	WireframeGridLayoutProps,
	WireframeLayoutFlexNode,
	WireframeLayoutGridNode,
	WireframeNode,
} from "@cx/wireframe";
import type { ReactNode } from "react";

import {
	getRenderableWireframeNode,
	toBoolean,
	toText,
} from "@/features/wireframe-renderer/generate-render-tree";

import { toButtonSize, toButtonVariant, toDividerType, toNumber } from "./normalize-render-props";

export function renderNode(node: WireframeNode, data: Record<string, unknown>): ReactNode {
	const renderableNode = getRenderableWireframeNode(node, data);
	if (!renderableNode) return null;

	const { kind, props } = renderableNode;

	if (kind === "header") {
		return (
			<AppBar
				key={node.metadata.id}
				title={toText(props.titleContent)}
				showBack={toBoolean(props.showBackButton, true)}
			/>
		);
	}

	if (kind === "layout-flex") {
		return (
			<Flex
				key={node.metadata.id}
				layout={props as WireframeFlexLayoutProps}
				node={node as WireframeLayoutFlexNode}
			>
				{node.children?.map((child) => renderNode(child, data))}
			</Flex>
		);
	}

	if (kind === "layout-grid") {
		return (
			<Grid
				key={node.metadata.id}
				layout={props as WireframeGridLayoutProps}
				node={node as WireframeLayoutGridNode}
			>
				{node.children?.map((child) => renderNode(child, data))}
			</Grid>
		);
	}

	if (kind === "page-stack") {
		const sectionPaddingX = toNumber(props.sectionPaddingX, 12);
		const itemPaddingX = toNumber(props.itemPaddingX, 20);
		const paddingY = toNumber(props.paddingY, 28);

		return (
			<section
				key={node.metadata.id}
				className="box-border flex w-full flex-col"
				data-node-id={node.metadata.id}
				data-node-type={node.type}
				style={{ padding: `${paddingY}px ${sectionPaddingX}px` }}
			>
				<div className="box-border flex w-full flex-col" style={{ paddingInline: itemPaddingX }}>
					{node.children?.map((child) => renderNode(child, data))}
				</div>
			</section>
		);
	}

	if (kind === "divider") {
		return (
			<div key={node.metadata.id} data-node-id={node.metadata.id} data-node-type={node.type}>
				<Divider type={toDividerType(props.type)} />
			</div>
		);
	}

	if (kind === "section-header") {
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
	}

	if (kind === "organism-section") {
		const titleGap = toNumber(props.titleGap, 8);
		const componentGap = toNumber(props.componentGap, 12);

		return (
			<section key={node.metadata.id} className="flex flex-col" style={{ gap: titleGap }}>
				<div className="flex flex-col">
					<p className="text-base font-semibold">{toText(props.name, node.metadata.title)}</p>
				</div>
				<div className="flex flex-col" style={{ gap: componentGap }}>
					{node.children?.map((child) => renderNode(child, data))}
				</div>
			</section>
		);
	}

	if (kind === "list-cell") {
		return (
			<div key={node.metadata.id} className="rounded-lg border bg-background">
				<ListText table="off" title={toText(props.title, node.metadata.title)} showRightItem />
				{props.description ? (
					<p className="px-4 pb-3 text-xs leading-5 text-muted-foreground">
						{toText(props.description)}
					</p>
				) : null}
			</div>
		);
	}

	if (kind === "accordion") {
		return (
			<Callout key={node.metadata.id} title={toText(props.title, node.metadata.title)}>
				{toText(props.description, node.metadata.description)}
			</Callout>
		);
	}

	if (kind === "section-message") {
		return (
			<div key={node.metadata.id} className={getSectionMessageClassName(toText(props.variant))}>
				<p className="text-sm font-semibold">{toText(props.title, node.metadata.title)}</p>
				{props.description ? (
					<p className="mt-1 text-xs leading-5 opacity-80">{toText(props.description)}</p>
				) : null}
			</div>
		);
	}

	if (kind === "text-field") {
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
	}

	if (kind === "action") {
		return (
			<div key={node.metadata.id} className="px-5">
				<CxButton
					fullWidth={toBoolean(props.fullWidth, true)}
					size={toButtonSize(props.size)}
					variant={toButtonVariant(props.variant)}
				>
					{toText(props.title, node.metadata.title)}
				</CxButton>
			</div>
		);
	}

	return (
		<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
			{node.metadata.title}
		</div>
	);
}

function getSectionMessageClassName(variant: string) {
	if (variant === "negative") {
		return "rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive";
	}

	if (variant === "positive") {
		return "rounded-lg border border-emerald-500/30 bg-emerald-50 p-4 text-emerald-900";
	}

	if (variant === "cautionary") {
		return "rounded-lg border border-amber-500/30 bg-amber-50 p-4 text-amber-900";
	}

	return "rounded-lg border border-primary/20 bg-primary/5 p-4 text-foreground";
}
