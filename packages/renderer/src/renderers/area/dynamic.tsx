import { toNumber } from "../../normalize-render-props";
import type { RendererDefinition } from "../../registry";
import { toText } from "../../runtime";
import { renderErrorPolicyFallback } from "./error-policy";
import { resolveHasData } from "./has-data";
import type { AreaRenderableProps } from "./types";

/**
 * area.dynamic — hasData 평가 후 errorPolicy로 분기.
 *
 *   hasData = data.__areaData__[areaId].hasData ?? true
 *   hasData === false → errorPolicy fallback (영역 전체 숨김 / 오류 항목 미노출 / 기본값 표시)
 *   그 외             → 자식 정상 렌더
 */
export const areaDynamicRendererDefinition: RendererDefinition = {
	kind: "area.dynamic",
	render: ({ data, node, renderable, renderChildren }) => {
		const props = renderable.props as AreaRenderableProps;
		const titleGap = toNumber(props.titleGap, 8);
		const componentGap = toNumber(props.componentGap, 12);
		const areaName = toText(props.name, node.metadata.title);

		if (!resolveHasData(data, node.metadata.id)) {
			const fallback = renderErrorPolicyFallback(props.errorPolicy, {
				areaId: node.metadata.id,
				areaName,
				titleGap,
			});
			if (fallback !== undefined) return fallback;
		}

		return (
			<section
				key={node.metadata.id}
				className="flex w-full min-w-0 flex-col"
				style={{ gap: titleGap }}
				data-area-kind="dynamic"
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
