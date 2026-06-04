import { PageStack, type PageStackProps } from "@cx/layout/primitives";
import {
	type LayoutDivider,
	renderChildrenWithDividers,
	resolveDivider,
	withTrailingSectionDivider,
} from "../../shared/divider";
import {
	toNumber,
	toPageStackItemTemplate,
	toPageStackTitleMode,
	toTitleModeFromLegacyProps,
} from "../../shared/props";
import type { LayoutPatternComponentProps } from "../../types";

export type AreaPageStackDefaults = {
	divider?: LayoutDivider;
	gap: number;
	itemPaddingX?: number;
	itemTemplate?: PageStackProps["itemTemplate"];
	paddingY?: number;
	sectionPaddingX?: number;
	slotInsetX?: number;
	titleGap?: number;
	titleMode?: PageStackProps["titleMode"];
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
	titleMode: "visible",
} as const satisfies Omit<AreaPageStackDefaults, "gap">;

export function AreaPageStackFrame({
	children,
	className,
	content = "children",
	defaults,
	fallbackId = "page-stack-area",
	metadata,
	props = {},
}: AreaPageStackFrameProps) {
	const divider = resolveDivider(props.divider, defaults.divider);
	const framedChildren =
		content === "nested-stack" ? children : renderChildrenWithDividers(children, divider);

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
		props.sectionDivider,
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
		titleMode:
			toPageStackTitleMode(props.titleMode) ??
			toTitleModeFromLegacyProps(props) ??
			defaults.titleMode,
	};
}
