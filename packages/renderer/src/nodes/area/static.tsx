import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/style";
import type { ReactNode } from "react";
import { toNumber } from "../../tree/coerce";
import { toText } from "../../tree/runtime";
import type { RenderTreeNode } from "../../tree/types";
import { NODE_TYPES } from "../../tree/types";
import { renderAreaChildren } from "./layout";
import type { AreaRenderableProps } from "./types";

/**
 * area.static — 항상 자식 표시. 분기 없음.
 */
export function renderStaticAreaNode({
	node,
	props,
	renderChildren,
}: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
	renderChildren: () => ReactNode;
}) {
	const areaProps = props as AreaRenderableProps;
	const titleGap = toNumber(areaProps.titleGap, 8);
	const areaName = areaProps.name === undefined ? undefined : toText(areaProps.name, "");
	const hideTitle = Boolean(areaProps.hideTitle) || !areaName;

	return (
		<section
			key={node.metadata.id}
			className={cx("flex w-full min-w-0 flex-col", spacingUtilityClass("gap", titleGap))}
			style={{ gap: spacingFallbackStyleValue(titleGap) }}
			data-area-kind={NODE_TYPES.area[0]}
		>
			{hideTitle ? null : (
				<div className="flex w-full min-w-0 flex-col">
					<p className="text-base font-semibold">{areaName}</p>
				</div>
			)}
			{renderAreaChildren(renderChildren(), areaProps)}
		</section>
	);
}
