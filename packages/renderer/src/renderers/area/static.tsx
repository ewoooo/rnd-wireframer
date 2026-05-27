import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/primitives";
import { NODE_TYPES } from "@cx/types/node-types";
import { toNumber } from "../../normalize-render-props";
import type { RendererDefinition } from "../../registry";
import { toText } from "../../runtime";
import { renderAreaChildren } from "./layout";
import type { AreaRenderableProps } from "./types";

/**
 * area.static — 항상 자식 표시. 분기 없음.
 */
export const areaStaticRendererDefinition: RendererDefinition = {
	kind: NODE_TYPES.area[0],
	render: ({ node, renderable, renderChildren }) => {
		const props = renderable.props as AreaRenderableProps;
		const titleGap = toNumber(props.titleGap, 8);
		const areaName = props.name === undefined ? undefined : toText(props.name, "");
		const hideTitle = Boolean(props.hideTitle) || !areaName;

		return (
			<section
				key={node.metadata.id}
				className={cx("flex w-full min-w-0 flex-col", spacingUtilityClass("gap", titleGap))}
				style={{ gap: spacingFallbackStyleValue(titleGap) }}
				data-area-kind="static"
			>
				{hideTitle ? null : (
					<div className="flex w-full min-w-0 flex-col">
						<p className="text-base font-semibold">{areaName}</p>
					</div>
				)}
				{renderAreaChildren(renderChildren(), props)}
			</section>
		);
	},
};
