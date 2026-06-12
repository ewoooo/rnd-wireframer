import {
	Grid,
	type GridProps,
	HStack,
	type HStackProps,
	VStack,
	type VStackProps,
} from "@cx/layout/primitives";
import { Children, type ReactNode } from "react";
import { toNumber } from "../../patterns/shared/props";
import type { LayoutPatternComponentProps } from "../../patterns/types";
import { type AreaPageStackDefaults, AreaPageStackFrame } from "../page-stack/PageStackFrame";

type CollectionFlow = "grid" | "horizontal" | "stack";

export type CollectionAreaDefaults = AreaPageStackDefaults & {
	columns?: number;
	flow: CollectionFlow;
	mapHeight?: number;
};

// 모든 collection canonical 컴포넌트가 공유하는 section 기본값.
export const collectionSectionDefaults = {
	itemPaddingX: 20,
	itemTemplate: "default-20",
	paddingY: 28,
	sectionPaddingX: 12,
} as const satisfies Pick<
	CollectionAreaDefaults,
	"itemPaddingX" | "itemTemplate" | "paddingY" | "sectionPaddingX"
>;

export function createCollectionArea(defaults: CollectionAreaDefaults) {
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
