import { PageStack, type PageStackProps } from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../types";

export function PageStackAreaPattern({
	children,
	className,
	metadata,
	props = {},
}: LayoutPatternComponentProps) {
	return (
		<PageStack
			{...toPageStackProps(props)}
			className={className}
			node={{
				type: "PageStack",
				metadata: {
					id: metadata?.id ?? "page-stack-area",
					title: metadata?.title,
				},
			}}
		>
			{children}
		</PageStack>
	);
}

function toPageStackProps(props: Record<string, unknown>): Partial<PageStackProps> {
	const gap = toNumber(props.gap) ?? toNumber(props.componentGap);
	const sectionGap = toNumber(props.sectionGap) ?? toNumber(props.titleGap);

	return {
		gap,
		itemPaddingX: toNumber(props.itemPaddingX),
		itemTemplate: toPageStackItemTemplate(props.itemTemplate),
		paddingX: toNumber(props.paddingX),
		paddingY: toNumber(props.paddingY),
		sectionGap,
		sectionPaddingX: toNumber(props.sectionPaddingX),
		slotInsetX: toNumber(props.slotInsetX),
		titleMode: toPageStackTitleMode(props.titleMode),
	};
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toPageStackItemTemplate(value: unknown): PageStackProps["itemTemplate"] | undefined {
	return value === "card-0" || value === "default-20" || value === "plain" ? value : undefined;
}

function toPageStackTitleMode(value: unknown): PageStackProps["titleMode"] | undefined {
	return value === "hidden" || value === "none" || value === "visible" ? value : undefined;
}
