"use client";

import {
	applyPuckAreaData,
	type PuckScreenData,
	type PuckScreenItem,
	renderTreeToPuckAreaData,
} from "@cx/adapters/puck";
import { RenderNodeView, type RenderTreeNode } from "@cx/renderer";
import { type Config, type Data, Puck } from "@puckeditor/core";

type AreaPuckEditorProps = {
	area: RenderTreeNode;
	onCandidateChange?: (node: RenderTreeNode) => void;
	onPublishCandidate?: (node: RenderTreeNode) => void | Promise<void>;
};

export function AreaPuckEditor({
	area,
	onCandidateChange,
	onPublishCandidate,
}: AreaPuckEditorProps) {
	const data = renderTreeToPuckAreaData(area);
	const config = buildAreaPuckConfig(area);

	function handleChange(nextData: Data) {
		const puckData = normalizePuckData(nextData);
		const result = applyPuckAreaData({ area, data: puckData });
		onCandidateChange?.(result.node);
	}

	function handlePublish(nextData: Data) {
		const puckData = normalizePuckData(nextData);
		const result = applyPuckAreaData({ area, data: puckData });
		void onPublishCandidate?.(result.node);
	}

	return (
		<div className="h-full min-h-0 w-full overflow-hidden bg-background">
			<Puck
				config={config}
				data={data as Data}
				headerTitle={area.metadata.title}
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

function buildAreaPuckConfig(area: RenderTreeNode): Config {
	const components: Config["components"] = {};

	for (const node of area.children ?? []) {
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
			itemKind: props.itemKind ?? "area-child",
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
