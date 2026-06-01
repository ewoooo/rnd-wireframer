import { RenderTreeNodeRenderer } from "@cx/renderer";
import type { Config, Data } from "@measured/puck";
import type { RenderTreeNode } from "@cx/renderer";

// Area 캔버스용 Puck 설정.
// screen/puck-config 의 buildPuckConfig/buildPuckData 를 area 레벨로 미러한 것.
// screen 에서는 area 들이 드래그 가능한 Puck content 였다면,
// 여기서는 선택된 area 의 자식 component 들이 드래그 가능한 content 가 된다.
export function buildAreaPuckConfig(areaNode: RenderTreeNode | undefined): Config {
	const components: Config["components"] = {};
	if (!areaNode) return { components, root: { fields: {} } };

	for (const child of areaNode.children ?? []) {
		const key = child.metadata.id;
		if (components[key]) continue;
		components[key] = {
			label: child.metadata.title,
			fields: {},
			render: () => <RenderTreeNodeRenderer node={child} />,
		};
	}

	return { components, root: { fields: {} } };
}

export function buildAreaPuckData(areaNode: RenderTreeNode | undefined): Data {
	if (!areaNode) return { content: [], root: { props: {} }, zones: {} };

	return {
		content: (areaNode.children ?? []).map((child, index) => ({
			type: child.metadata.id,
			props: { id: `${child.metadata.id}-${index}` },
		})),
		root: { props: {} },
		zones: {},
	};
}
