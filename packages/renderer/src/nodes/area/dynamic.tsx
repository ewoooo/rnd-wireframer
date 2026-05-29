import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/style";
import type { ReactNode } from "react";
import { toNumber } from "../../tree/coerce";
import { toText } from "../../tree/runtime";
import type { RenderTreeNode } from "../../tree/types";
import { NODE_TYPES } from "../../tree/types";
import { renderErrorPolicyFallback } from "./error-policy";
import { resolveHasData } from "./has-data";
import { renderAreaChildren } from "./layout";
import type { AreaRenderableProps } from "./types";

/**
 * area.dynamic — hasData 평가 후 errorPolicy로 분기.
 *
 *   hasData = data.__areaData__[areaId].hasData ?? true
 *   hasData === false → errorPolicy fallback (영역 전체 숨김 / 오류 항목 미노출 / 기본값 표시)
 *   그 외             → 자식 정상 렌더
 */
export function renderDynamicAreaNode({
	data,
	node,
	props,
	renderChildren,
}: {
	data: Record<string, unknown>;
	node: RenderTreeNode;
	props: Record<string, unknown>;
	renderChildren: () => ReactNode;
}) {
	const areaProps = props as AreaRenderableProps;
	const titleGap = toNumber(areaProps.titleGap, 8);
	const areaName = areaProps.name === undefined ? undefined : toText(areaProps.name, "");
	const hideTitle = Boolean(areaProps.hideTitle) || !areaName;

	if (!resolveHasData(data, node.metadata.id)) {
		const fallback = renderErrorPolicyFallback(areaProps.errorPolicy, {
			areaId: node.metadata.id,
			areaName,
			titleGap,
		});
		if (fallback !== undefined) return fallback;
	}

	return (
		<section
			key={node.metadata.id}
			className={cx("flex w-full min-w-0 flex-col", spacingUtilityClass("gap", titleGap))}
			style={{ gap: spacingFallbackStyleValue(titleGap) }}
			data-area-kind={NODE_TYPES.area[1]}
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
