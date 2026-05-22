import { toNumber } from "../../normalize-render-props";
import type { RendererDefinition } from "../../registry";
import { toText } from "../../runtime";
import type { AreaRenderableProps } from "./types";

/**
 * area.static — 항상 자식 표시. 분기 없음.
 */
export const areaStaticRendererDefinition: RendererDefinition = {
	kind: "area.static",
	render: ({ node, renderable, renderChildren }) => {
		const props = renderable.props as AreaRenderableProps;
		const titleGap = toNumber(props.titleGap, 8);
		const componentGap = toNumber(props.componentGap, 12);
		const areaName = toText(props.name, node.metadata.title);

		return (
			<section
				key={node.metadata.id}
				className="flex w-full min-w-0 flex-col"
				style={{ gap: titleGap }}
				data-area-kind="static"
			>
				<div className="flex w-full min-w-0 flex-col">
					<p className="text-base font-semibold">{areaName}</p>
				</div>
				<div className="flex w-full min-w-0 flex-col" style={{ gap: componentGap }}>
					{renderChildren()}
				</div>
			</section>
		);
	},
};
