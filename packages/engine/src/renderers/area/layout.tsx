import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/primitives";
import { Children, type ReactNode } from "react";
import { toNumber } from "../../normalize-render-props";
import type { AreaRenderableProps } from "./types";

export function renderAreaChildren(children: ReactNode, props: AreaRenderableProps) {
	const componentGap = toNumber(props.componentGap, 12);
	const listPresentation = props.listPresentation;

	if (listPresentation === "selection-list") {
		const itemPaddingX = toNumber(props.itemPaddingX, 0);
		const itemPaddingY = toNumber(props.itemPaddingY, 0);
		const childItems = Children.toArray(children);

		return (
			<div
				className="flex w-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-[var(--semantic-line-normal,#e5e7eb)] bg-[var(--semantic-surface-base,#ffffff)]"
				data-area-list-presentation="selection-list"
			>
				{childItems.map((child, index) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: rendered child order is the data contract here.
						key={index}
						className={cx(
							"min-w-0",
							index > 0 ? "border-t border-[var(--semantic-line-normal,#e5e7eb)]" : undefined,
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
				))}
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
