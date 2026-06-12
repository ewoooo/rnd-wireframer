import type { CSSProperties, ReactNode } from "react";
import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "../../internal/style";
import type { LayoutNode } from "../../types";
import type { StackProps } from "./Stack";

export type PageStackItemTemplate = "card-0" | "default-20" | "plain";

export type PageStackProps = Omit<StackProps, "node" | "paddingX" | "paddingY"> & {
	children?: ReactNode;
	itemPaddingX?: number;
	itemTemplate?: PageStackItemTemplate;
	node?: LayoutNode;
	paddingX?: number;
	paddingY?: number;
	sectionGap?: number;
	sectionPaddingX?: number;
	slotInsetX?: number;
};

export function PageStack({
	as: Element = "section",
	children,
	className,
	gap = 0,
	itemPaddingX = 20,
	itemTemplate = "default-20",
	node,
	paddingX,
	paddingY = 28,
	sectionGap = 0,
	sectionPaddingX,
	slotInsetX = 0,
	style,
}: PageStackProps) {
	const resolvedSectionPaddingX = sectionPaddingX ?? paddingX ?? 12;
	const rootStyle: CSSProperties = {
		gap: spacingFallbackStyleValue(sectionGap),
		paddingBlock: spacingFallbackStyleValue(paddingY),
		paddingInline: spacingFallbackStyleValue(resolvedSectionPaddingX),
		...style,
	};

	return (
		<Element
			className={cx(
				"box-border flex w-full flex-col",
				spacingUtilityClass("gap", sectionGap),
				spacingUtilityClass("py", paddingY),
				spacingUtilityClass("px", resolvedSectionPaddingX),
				itemTemplate === "card-0" ? "rounded-[20px] bg-white" : undefined,
				className,
			)}
			data-node-id={node?.metadata.id}
			data-node-type={node?.type ?? "PageStack"}
			data-page-stack-template={itemTemplate}
			style={rootStyle}
		>
			<div
				className={cx(
					"box-border flex w-full flex-col",
					spacingUtilityClass("gap", gap),
					spacingUtilityClass("px", itemPaddingX),
				)}
				style={{
					gap: spacingFallbackStyleValue(gap),
					paddingInline: itemPaddingX + slotInsetX,
				}}
			>
				{children}
			</div>
		</Element>
	);
}
