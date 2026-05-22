import { toNumber } from "../../normalize-render-props";
import type { RendererDefinition } from "../../registry";
import { toText } from "../../runtime";
import { renderErrorPolicyFallback } from "./error-policy";
import { resolveHasData } from "./has-data";
import type { AreaRenderableProps } from "./types";

/**
 * Area renderer.
 *
 * 분기:
 *   - areaType === "dynamic" + hasData === false  → errorPolicy fallback
 *   - 그 외                                       → 자식 정상 렌더
 *
 * 분기 로직과 fallback JSX는 각각 has-data.ts / error-policy.tsx로 분리.
 */
export const areaRendererDefinition: RendererDefinition = {
	kind: "area",
	render: ({ data, node, renderable, renderChildren }) => {
		const props = renderable.props as AreaRenderableProps;
		const titleGap = toNumber(props.titleGap, 8);
		const componentGap = toNumber(props.componentGap, 12);
		const areaName = toText(props.name, node.metadata.title);

		if (props.areaType === "dynamic" && !resolveHasData(data, node.metadata.id)) {
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
