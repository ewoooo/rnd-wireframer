"use client";

import {
	applyPuckScreenData,
	type PuckScreenData,
	type PuckScreenItem,
	renderTreeToPuckScreenData,
} from "@cx/adapters/puck";
import { RenderNodeView, type RenderTreeScreenNode } from "@cx/renderer";
import { type Config, type Data, Puck } from "@puckeditor/core";

type ScreenPuckEditorProps = {
	onCandidateChange?: (node: RenderTreeScreenNode) => void;
	onPublishCandidate?: (node: RenderTreeScreenNode) => void | Promise<void>;
	screen: RenderTreeScreenNode;
};

export function ScreenPuckEditor({
	onCandidateChange,
	onPublishCandidate,
	screen,
}: ScreenPuckEditorProps) {
	const data = renderTreeToPuckScreenData(screen);
	const config = buildScreenPuckConfig(screen);

	function handleChange(nextData: Data) {
		const puckData = normalizePuckData(nextData);
		const result = applyPuckScreenData({ data: puckData, screen });
		onCandidateChange?.(result.node);
	}

	function handlePublish(nextData: Data) {
		const puckData = normalizePuckData(nextData);
		const result = applyPuckScreenData({ data: puckData, screen });
		void onPublishCandidate?.(result.node);
	}

	return (
		<div className="h-full min-h-0 w-full overflow-hidden bg-background">
			<Puck
				config={config}
				data={data as Data}
				headerTitle={screen.metadata.title}
				onChange={handleChange}
				onPublish={handlePublish}
				permissions={{
					delete: false,
					drag: true,
					duplicate: false,
					edit: false,
					insert: false,
				}}
			/>
		</div>
	);
}

function buildScreenPuckConfig(screen: RenderTreeScreenNode): Config {
	const contents = screen.children.find((child) => child.type === "Screen.Contents");
	const nodes = contents?.children ?? [];
	const components: Config["components"] = {};

	for (const node of nodes) {
		components[node.metadata.id] = {
			label: node.metadata.title,
			fields: editableNodeFields,
			render: () => (
				<div className="min-h-8 bg-background">
					<RenderNodeView node={node} />
				</div>
			),
		};
	}

	return { components, root: { fields: {} } };
}

function normalizePuckData(data: Data): PuckScreenData {
	return {
		content: data.content.map(normalizePuckItem),
		root: { props: {} },
		zones: {},
	};
}

function normalizePuckItem(item: Data["content"][number]): PuckScreenItem {
	const props = item.props as Partial<PuckScreenItem["props"]>;
	const nodeId = props.nodeId ?? item.type;

	return {
		type: item.type,
		props: {
			id: props.id ?? nodeId,
			itemKind: props.itemKind ?? "screen-region-child",
			nodeId,
			nodePropsJson: props.nodePropsJson,
			orderIndex: props.orderIndex,
			parentId: props.parentId,
			relationId: props.relationId,
			title: props.title,
			variant: props.variant,
		},
	};
}

const editableNodeFields: Config["components"][string]["fields"] = {
	title: {
		type: "text",
		label: "Title",
	},
	nodePropsJson: {
		type: "textarea",
		label: "Props JSON",
	},
	variant: {
		type: "text",
		label: "Variant",
	},
};
