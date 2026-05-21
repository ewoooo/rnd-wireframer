"use client";

import { AppBar, Callout, Button as CxButton, ListText } from "@cx/components";
import { AppScreen } from "@cx/layout/chrome";
import type { WireframeNode, WireframeScreenNode } from "@cx/wireframe";
import type { ReactNode } from "react";

export function WireframeScreenRenderer({ node }: { node: WireframeScreenNode }) {
	const { bottomNode, contentsNode, headerNode } = getScreenRegions(node);

	return (
		<AppScreen
			node={node}
			header={headerNode.children?.map((child) => renderWireframeNode(child))}
			bottom={bottomNode.children?.map((child) => renderWireframeNode(child))}
		>
			{contentsNode.children?.map((child) => renderWireframeNode(child))}
		</AppScreen>
	);
}

function getScreenRegions(node: WireframeScreenNode) {
	const [headerNode, contentsNode, bottomNode] = node.children;

	return {
		bottomNode,
		contentsNode,
		headerNode,
	};
}

function renderWireframeNode(node: WireframeNode): ReactNode {
	if (node.type === "HeaderBase") {
		return (
			<AppBar key={node.metadata.id} title={String(node.props?.titleContent ?? "")} showBack />
		);
	}

	if (node.type === "Organism.Section") {
		return (
			<section key={node.metadata.id} className="flex flex-col gap-3 px-5 py-4">
				<div className="flex flex-col gap-1">
					<p className="text-base font-semibold">{node.metadata.title}</p>
					<p className="text-xs text-muted-foreground">{String(node.props?.organismCode ?? "")}</p>
				</div>
				<div className="flex flex-col gap-2">
					{node.children?.map((child) => renderWireframeNode(child))}
				</div>
			</section>
		);
	}

	if (node.type === "ListCell") {
		return (
			<ListText
				key={node.metadata.id}
				table="on"
				title={String(node.props?.title ?? node.metadata.title)}
				subText={String(node.props?.description ?? node.metadata.description ?? "")}
			/>
		);
	}

	if (node.type === "Accordion") {
		return (
			<Callout key={node.metadata.id} title={String(node.props?.title ?? node.metadata.title)}>
				{String(node.props?.description ?? node.metadata.description ?? "")}
			</Callout>
		);
	}

	if (node.type === "Button") {
		return (
			<div key={node.metadata.id} className="px-5 py-2">
				<CxButton fullWidth>{String(node.props?.title ?? node.metadata.title)}</CxButton>
			</div>
		);
	}

	return (
		<div key={node.metadata.id} className="rounded-lg border bg-background p-3 text-sm">
			{node.metadata.title}
		</div>
	);
}
