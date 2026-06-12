import type { RenderTreeNode } from "@cx/renderer";

const puckReservedPropNames = new Set(["id", "itemKind", "nodeId", "nodePropsJson", "title"]);

export function stringifyNodeProps(props: RenderTreeNode["props"]): string {
	if (!props) return "{}";
	return JSON.stringify(props, null, 2);
}

export function applyPreviewProps(
	node: RenderTreeNode,
	props: Record<string, unknown>,
): RenderTreeNode {
	const nextNode = {
		...node,
		metadata: {
			...node.metadata,
			title: typeof props.title === "string" ? props.title : node.metadata.title,
		},
	};
	const nodePropsJson = props.nodePropsJson;
	if (typeof nodePropsJson !== "string") {
		return {
			...nextNode,
			props: {
				...(nextNode.props ?? {}),
				...readTypedPreviewProps(props),
			},
		};
	}

	try {
		const parsed = JSON.parse(nodePropsJson) as unknown;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return nextNode;
		return {
			...nextNode,
			props: {
				...(parsed as RenderTreeNode["props"]),
				...readTypedPreviewProps(props),
			},
		};
	} catch {
		return {
			...nextNode,
			props: {
				...(nextNode.props ?? {}),
				...readTypedPreviewProps(props),
			},
		};
	}
}

export function readTypedPreviewProps(props: Record<string, unknown>): RenderTreeNode["props"] {
	const typedProps: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (puckReservedPropNames.has(key) || value === undefined) continue;
		typedProps[key] = value;
	}
	return typedProps as RenderTreeNode["props"];
}
