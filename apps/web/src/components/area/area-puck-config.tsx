import { RenderTreeNodeRenderer } from "@cx/renderer";
import type { Config, Data } from "@measured/puck";
import type { RenderTreeNode } from "@cx/renderer";

// Area 캔버스용 Puck 설정.
// screen/puck-config 의 buildPuckConfig/buildPuckData 를 area 레벨로 미러한 것.
// config.components = 전체 component 카탈로그(드로어 팔레트). screen 이 config 에
// 전체 area 카탈로그를 담아 우하단 드로어로 보여주는 것과 구조적으로 동일하다.
// data.content(buildAreaPuckData)는 현재 선택 area 의 자식만(캔버스에 놓인 부분집합).
export function buildAreaPuckConfig(catalog: Map<string, RenderTreeNode>): Config {
	const components: Config["components"] = {};

	for (const [id, node] of catalog) {
		components[id] = {
			label: node.metadata.title,
			fields: {},
			render: () => <RenderTreeNodeRenderer node={node} />,
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
