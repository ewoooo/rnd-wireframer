import {
	Grid,
	type GridProps,
	HStack,
	type HStackProps,
	PageStack,
	type PageStackProps,
	VStack,
	type VStackProps,
} from "@cx/layout/primitives";
import { Children, type ReactNode } from "react";
import type { LayoutPatternComponentProps } from "../types";

type CollectionFlow = "grid" | "horizontal" | "stack";

type CollectionAreaDefaults = {
	columns?: number;
	flow: CollectionFlow;
	gap: number;
	itemPaddingX?: number;
	itemTemplate?: PageStackProps["itemTemplate"];
	mapHeight?: number;
	paddingY?: number;
	sectionPaddingX?: number;
	titleGap?: number;
	titleMode?: PageStackProps["titleMode"];
};

const sectionDefaults = {
	itemPaddingX: 20,
	itemTemplate: "default-20",
	paddingY: 28,
	sectionPaddingX: 12,
	titleMode: "none",
} as const satisfies Pick<
	CollectionAreaDefaults,
	"itemPaddingX" | "itemTemplate" | "paddingY" | "sectionPaddingX" | "titleMode"
>;

export const ProductOptionGridArea = createCollectionArea({
	...sectionDefaults,
	columns: 2,
	flow: "grid",
	gap: 8,
	titleGap: 12,
	titleMode: "visible",
});
export const BenefitBrandListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 12,
	titleGap: 16,
	titleMode: "visible",
});
export const NearbyStoreListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 8,
	mapHeight: 172,
	titleGap: 16,
	titleMode: "visible",
});
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
	titleGap: 12,
	titleMode: "visible",
});
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
	paddingY: 0,
	titleMode: "hidden",
});
export const FilterChipTextListArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 16,
	titleGap: 12,
	titleMode: "visible",
});
export const ProductListGroupArea = createCollectionArea({
	...sectionDefaults,
	flow: "stack",
	gap: 16,
	titleGap: 12,
	titleMode: "visible",
});
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
	itemTemplate: "card-0",
	titleMode: "hidden",
});

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

		const node = {
			type: "PageStack",
			metadata: {
				id: metadata?.id ?? "collection-area",
				title: metadata?.title,
			},
		};
		const content = renderCollectionContent({ children, defaults, metadata, props });

		return (
			<PageStack {...toPageStackProps(props, defaults)} className={className} node={node}>
				{content}
			</PageStack>
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

function toPageStackProps(
	props: Record<string, unknown>,
	defaults: CollectionAreaDefaults,
): Partial<PageStackProps> {
	return {
		gap: 0,
		itemPaddingX: toNumber(props.itemPaddingX) ?? defaults.itemPaddingX,
		itemTemplate: toPageStackItemTemplate(props.itemTemplate) ?? defaults.itemTemplate,
		paddingY: toNumber(props.paddingY) ?? defaults.paddingY,
		sectionGap: toNumber(props.sectionGap) ?? toNumber(props.titleGap) ?? defaults.titleGap ?? 0,
		sectionPaddingX: toNumber(props.sectionPaddingX) ?? defaults.sectionPaddingX,
		slotInsetX: toNumber(props.slotInsetX),
		titleMode: toPageStackTitleMode(props.titleMode) ?? defaults.titleMode,
	};
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

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toCollectionFlow(value: unknown): CollectionFlow | undefined {
	return value === "grid" || value === "horizontal" || value === "stack" ? value : undefined;
}

function toPageStackItemTemplate(value: unknown): PageStackProps["itemTemplate"] | undefined {
	return value === "card-0" || value === "default-20" || value === "plain" ? value : undefined;
}

function toPageStackTitleMode(value: unknown): PageStackProps["titleMode"] | undefined {
	return value === "hidden" || value === "none" || value === "visible" ? value : undefined;
}
