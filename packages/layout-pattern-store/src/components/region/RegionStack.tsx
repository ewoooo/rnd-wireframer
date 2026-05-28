import { BottomFixedArea, VStack, type VStackProps } from "@cx/layout/primitives";
import type { CSSProperties } from "react";
import type { LayoutPatternComponentProps } from "../types";

type RegionStackDefaults = {
	bottomSafeArea?: number;
	contentWidth?: number;
	gap?: number;
	paddingX?: number;
	paddingY?: number;
	sticky?: boolean;
};

const defaultContentWidth = 393;
const defaultZeroGap = { gap: 0 } as const satisfies RegionStackDefaults;
const detailContentDefaults = {
	contentWidth: defaultContentWidth,
	gap: 0,
} as const satisfies RegionStackDefaults;

export const SectionStackRegion = createRegionStack(defaultZeroGap);
export const PlainStackRegion = createRegionStack(defaultZeroGap);
export const CommerceDetailContentStackRegion = createRegionStack(detailContentDefaults);
export const CommerceDetailBottomActionRegion = createRegionStack({
	bottomSafeArea: 36,
	gap: 10,
	paddingX: 12,
	paddingY: 10,
	sticky: true,
});
export const SubscriptionDetailRichContentRegion = createRegionStack(detailContentDefaults);
export const GifticonDetailCompactContentRegion = createRegionStack(detailContentDefaults);
export const BenefitBrandDetailContentRegion = createRegionStack(detailContentDefaults);
export const DeviceDetailOptionContentRegion = createRegionStack(detailContentDefaults);
export const SummaryTextListContentRegion = createRegionStack(detailContentDefaults);
export const SummaryTitleFilterTextListContentRegion = createRegionStack(detailContentDefaults);
export const FilterableTextListContentRegion = createRegionStack(detailContentDefaults);
export const PlainNoticeListContentRegion = createRegionStack(detailContentDefaults);
export const FaqGuideListContentRegion = createRegionStack(detailContentDefaults);
export const ProductCardSectionedListContentRegion = createRegionStack(detailContentDefaults);
export const ProductCardFlatRowListContentRegion = createRegionStack(detailContentDefaults);
export const ProductCardFlatHorizontalListContentRegion = createRegionStack(detailContentDefaults);

function createRegionStack(defaults: RegionStackDefaults) {
	return function RegionStack({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const stackProps = toStackProps(props, defaults, metadata);
		const style = toRegionStyle(props, defaults);
		const Component = (toBoolean(props.sticky) ?? defaults.sticky) ? BottomFixedArea : VStack;

		return (
			<Component {...stackProps} className={className} style={style}>
				{children}
			</Component>
		);
	};
}

function toStackProps(
	props: Record<string, unknown>,
	defaults: RegionStackDefaults,
	metadata: LayoutPatternComponentProps["metadata"],
): VStackProps {
	const paddingY = toNumber(props.paddingY) ?? defaults.paddingY;
	const bottomSafeArea = toNumber(props.bottomSafeArea) ?? defaults.bottomSafeArea;

	return {
		as: "section",
		gap: toNumber(props.gap) ?? defaults.gap,
		node: {
			type: "Layout.Flex",
			metadata: {
				id: metadata?.id ?? "region-stack",
				title: metadata?.title,
			},
			props: {
				direction: "column",
			},
		},
		paddingX: toNumber(props.paddingX) ?? defaults.paddingX,
		paddingY:
			bottomSafeArea !== undefined && paddingY !== undefined ? paddingY + bottomSafeArea : paddingY,
	};
}

function toRegionStyle(
	props: Record<string, unknown>,
	defaults: RegionStackDefaults,
): CSSProperties | undefined {
	const contentWidth = toNumber(props.contentWidth) ?? defaults.contentWidth;
	if (contentWidth === undefined) return undefined;

	return {
		marginInline: "auto",
		maxWidth: contentWidth,
		width: "100%",
	};
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}
