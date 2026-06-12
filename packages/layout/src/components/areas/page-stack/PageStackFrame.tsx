import { PageStack, type PageStackProps } from "@cx/layout/primitives";
import {
	type LayoutDivider,
	renderChildrenWithDividers,
	resolveDividerContract,
	withTrailingSectionDivider,
} from "../../patterns/shared/divider";
import { toNumber, toPageStackItemTemplate } from "../../patterns/shared/props";
import type { LayoutPatternComponentProps } from "../../patterns/types";

export type AreaPageStackDefaults = {
	divider?: LayoutDivider;
	gap: number;
	itemPaddingX?: number;
	itemTemplate?: PageStackProps["itemTemplate"];
	paddingY?: number;
	sectionPaddingX?: number;
	slotInsetX?: number;
	titleGap?: number;
};

export type AreaPageStackFrameProps = LayoutPatternComponentProps & {
	content?: "children" | "nested-stack";
	defaults: AreaPageStackDefaults;
	fallbackId?: string;
};

export const pageStackBaseDefaults = {
	itemPaddingX: 20,
	itemTemplate: "default-20",
	paddingY: 28,
	sectionPaddingX: 12,
	titleGap: 8,
} as const satisfies Omit<AreaPageStackDefaults, "gap">;

export function createPageStackArea(defaults: AreaPageStackDefaults) {
	return function PageStackArea(props: LayoutPatternComponentProps) {
		return <AreaPageStackFrame {...props} defaults={defaults} />;
	};
}

export function AreaPageStackFrame({
	children,
	className,
	content = "children",
	defaults,
	fallbackId = "page-stack-area",
	metadata,
	props = {},
}: AreaPageStackFrameProps) {
	const { rows, trailingSection } = resolveDividerContract(props, defaults);
	const framedChildren =
		content === "nested-stack" ? children : renderChildrenWithDividers(children, rows);

	return withTrailingSectionDivider(
		<PageStack
			{...resolveAreaPageStackProps(props, defaults, content)}
			className={className}
			node={{
				type: "PageStack",
				metadata: {
					id: metadata?.id ?? fallbackId,
					title: metadata?.title,
				},
			}}
		>
			{framedChildren}
		</PageStack>,
		trailingSection,
	);
}

export function resolveAreaPageStackProps(
	props: Record<string, unknown>,
	defaults: AreaPageStackDefaults,
	content: AreaPageStackFrameProps["content"] = "children",
): Partial<PageStackProps> {
	const gap =
		content === "nested-stack"
			? 0
			: (toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap);

	return {
		gap,
		itemPaddingX: toNumber(props.itemPaddingX) ?? defaults.itemPaddingX,
		itemTemplate: toPageStackItemTemplate(props.itemTemplate) ?? defaults.itemTemplate,
		paddingX: toNumber(props.paddingX),
		paddingY: toNumber(props.paddingY) ?? defaults.paddingY,
		sectionGap: toNumber(props.sectionGap) ?? toNumber(props.titleGap) ?? defaults.titleGap,
		sectionPaddingX: toNumber(props.sectionPaddingX) ?? defaults.sectionPaddingX,
		slotInsetX: toNumber(props.slotInsetX) ?? defaults.slotInsetX,
	};
}
