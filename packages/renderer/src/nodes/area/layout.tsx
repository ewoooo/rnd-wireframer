import { Divider } from "@cx/external/registry";
import { classifyDividerChild, contentsDividerBoundaries } from "@cx/layout";
import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/style";
import { Children, type ReactNode } from "react";
import { toNumber } from "../../tree/coerce";
import type { AreaRenderableProps } from "./types";

export function renderAreaChildren(children: ReactNode, props: AreaRenderableProps) {
	const componentGap = toNumber(props.componentGap, 12);
	const listPresentation = props.listPresentation;

	if (listPresentation === "selection-list") {
		const itemPaddingX = toNumber(props.itemPaddingX, 0);
		const itemPaddingY = toNumber(props.itemPaddingY, 0);
		const childItems = Children.toArray(children);
		// 행 경계는 공유 divider 계약(@cx/layout)으로 계산 — 제목(exempt) 양쪽에는 미삽입.
		const boundaries = contentsDividerBoundaries(childItems.map(classifyDividerChild));

		return (
			<div
				className="flex w-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-[var(--semantic-line-normal,#e5e7eb)] bg-[var(--semantic-surface-base,#ffffff)]"
				data-area-list-presentation="selection-list"
			>
				{childItems.flatMap((child, index) => {
					const row = (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: rendered child order is the data contract here.
							key={index}
							className={cx(
								"min-w-0",
								spacingUtilityClass("px", itemPaddingX),
								spacingUtilityClass("py", itemPaddingY),
							)}
							style={{
								paddingInline: spacingFallbackStyleValue(itemPaddingX),
								paddingBlock: spacingFallbackStyleValue(itemPaddingY),
							}}
						>
							{child}
						</div>
					);
					return index > 0 && boundaries[index - 1]
						? [
								// biome-ignore lint/suspicious/noArrayIndexKey: rendered child order is the data contract here.
								<Divider key={`row-divider-${index}`} type="contents" />,
								row,
							]
						: [row];
				})}
			</div>
		);
	}

	return (
		<div
			className={cx("flex w-full min-w-0 flex-col", spacingUtilityClass("gap", componentGap))}
			style={{ gap: spacingFallbackStyleValue(componentGap) }}
		>
			{children}
		</div>
	);
}
