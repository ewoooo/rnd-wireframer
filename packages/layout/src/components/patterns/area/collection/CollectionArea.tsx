import {
	Grid,
	type GridProps,
	HStack,
	type HStackProps,
	VStack,
	type VStackProps,
} from "@cx/layout/primitives";
import { Children, type ReactNode } from "react";
import { toNumber } from "../../shared/props";
import type { LayoutPatternComponentProps } from "../../types";
import { type AreaPageStackDefaults, AreaPageStackFrame } from "../page-stack/frame";

type CollectionFlow = "grid" | "horizontal" | "stack";

type CollectionAreaDefaults = AreaPageStackDefaults & {
	columns?: number;
	flow: CollectionFlow;
	mapHeight?: number;
};

const sectionDefaults = {
	itemPaddingX: 20,
	itemTemplate: "default-20",
	paddingY: 28,
	sectionPaddingX: 12,
} as const satisfies Pick<
	CollectionAreaDefaults,
	"itemPaddingX" | "itemTemplate" | "paddingY" | "sectionPaddingX"
>;

export const ProductOptionGridArea = createCollectionArea({
	...sectionDefaults,
	columns: 2,
	flow: "grid",
	gap: 8,
	titleGap: 12,});
export const BenefitBrandListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 12,
	titleGap: 16,});
export const NearbyStoreListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 8,
	mapHeight: 172,
	titleGap: 16,});
export const ProductMoreLinkArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 0,
	paddingY: 0,
});
export const RichImageTabArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 0,
	paddingY: 0,
});
export const OptionListSectionArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 8,
	titleGap: 12,});
export const CouponBenefitArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 12,
});
export const MapCardInfoListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 8,
	mapHeight: 172,
});
export const CardInfoBrandListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 12,
});
export const ListSummaryCardArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 0,
	paddingY: 0,});
export const FilterChipTextListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 16,
	titleGap: 12,});
export const ProductListGroupArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 16,
	titleGap: 12,});
export const ProductListChipSortArea = createCollectionArea({
	...sectionDefaults,
	flow: "horizontal",
	gap: 8,
	paddingY: 0,
});
export const ProductListSortOnlyArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 0,
	paddingY: 0,
});
export const HorizontalCardListArea = createCollectionArea({
	...sectionDefaults,
	flow: "horizontal",
	gap: 12,
	paddingY: 0,
});
export const RowCardListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 0,
	paddingY: 0,
});
export const HiddenTitlePagestackCardListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 12,
	itemTemplate: "card-0",});

function createCollectionArea(defaults: CollectionAreaDefaults) {
	return function CollectionArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const flow = toCollectionFlow(props.flow) ?? defaults.flow;
		if (flow === "grid") {
			const layout = toGridLayoutProps(props, defaults);
			return (
				<Grid
					className={className}
					layout={layout}
					node={{
						type: "Layout.Grid",
						metadata: {
							id: metadata?.id ?? "collection-grid",
							title: metadata?.title,
						},
						props: layout,
					}}
				>
					{children}
				</Grid>
			);
		}

		if (flow === "horizontal") {
			return (
				<HStack
					{...toHorizontalStackProps(props, defaults, metadata)}
					className={className}
					style={{ overflowX: "auto" }}
				>
					{children}
				</HStack>
			);
		}

		const content = renderCollectionContent({ children, defaults, metadata, props });

		return (
			<AreaPageStackFrame
				className={className}
				content="nested-stack"
				defaults={defaults}
				fallbackId="collection-area"
				metadata={metadata}
				props={props}
			>
				{content}
			</AreaPageStackFrame>
		);
	};
}

function renderCollectionContent({
	children,
	defaults,
	metadata,
	props,
}: {
	children?: ReactNode;
	defaults: CollectionAreaDefaults;
	metadata: LayoutPatternComponentProps["metadata"];
	props: Record<string, unknown>;
}) {
	return (
		<VStack {...toVerticalStackProps(props, defaults, metadata)}>
			{applyMapHeight(children, props, defaults)}
		</VStack>
	);
}

function toGridLayoutProps(
	props: Record<string, unknown>,
	defaults: CollectionAreaDefaults,
): GridProps["layout"] {
	const columns = toNumber(props.columns) ?? defaults.columns ?? 2;
	const gap =
		toNumber(props.gap) ??
		toNumber(props.componentGap) ??
		toNumber(props.controlGap) ??
		toNumber(props.filterGap) ??
		defaults.gap;

	return {
		align: "stretch",
		columns: `repeat(${columns}, minmax(0, 1fr))`,
		gap,
		justify: "stretch",
	};
}

function toHorizontalStackProps(
	props: Record<string, unknown>,
	defaults: CollectionAreaDefaults,
	metadata: LayoutPatternComponentProps["metadata"],
): HStackProps {
	const gap =
		toNumber(props.controlGap) ??
		toNumber(props.filterGap) ??
		toNumber(props.gap) ??
		toNumber(props.componentGap) ??
		defaults.gap;

	return {
		as: "div",
		gap,
		node: stackNode(metadata, "collection-horizontal", "row", false),
	};
}

function toVerticalStackProps(
	props: Record<string, unknown>,
	defaults: CollectionAreaDefaults,
	metadata: LayoutPatternComponentProps["metadata"],
): VStackProps {
	return {
		as: "div",
		gap:
			toNumber(props.gap) ??
			toNumber(props.componentGap) ??
			toNumber(props.filterGap) ??
			defaults.gap,
		node: stackNode(metadata, "collection-stack", "column", true),
	};
}

function stackNode(
	metadata: LayoutPatternComponentProps["metadata"],
	fallbackId: string,
	direction: "column" | "row",
	useContentsSuffix: boolean,
): VStackProps["node"] {
	return {
		type: "Layout.Flex",
		metadata: {
			id: metadata?.id ? `${metadata.id}${useContentsSuffix ? ".contents" : ""}` : fallbackId,
			title: metadata?.title,
		},
		props: {
			direction,
		},
	};
}

function applyMapHeight(
	children: ReactNode,
	props: Record<string, unknown>,
	defaults: CollectionAreaDefaults,
) {
	const mapHeight = toNumber(props.mapHeight) ?? defaults.mapHeight;
	if (mapHeight === undefined) return children;

	const [firstChild, ...restChildren] = Children.toArray(children);
	if (!firstChild) return children;

	return [
		<div key="map-height-slot" style={{ minHeight: mapHeight }}>
			{firstChild}
		</div>,
		...restChildren,
	];
}

function toCollectionFlow(value: unknown): CollectionFlow | undefined {
	return value === "grid" || value === "horizontal" || value === "stack" ? value : undefined;
}
