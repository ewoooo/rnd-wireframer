import {
	BottomFixedArea,
	HStack,
	type HStackProps,
	VStack,
	type VStackProps,
} from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../types";

// 비-PageStack area만 이 파일이 소유한다. PageStack 기반 area는 PageStackArea.tsx.
export const AreaVerticalArea = createPlainStack({ gap: 0 });
export const BottomActionArea = createBottomActionArea({ gap: 12, paddingY: 0 });
export const ProductHeroSummaryArea = createHeroArea({
	gap: 12,
	infoPaddingBottom: 16,
	infoPaddingTop: 32,
	infoPaddingX: 32,
	thumbnailHeight: 480,
});
export const ProductFooterLegalArea = createPlainStack({
	bottomPadding: 120,
	gap: 30,
	paddingX: 32,
	paddingY: 32,
});
export const AreaAppBarArea = createAppBarArea({ gap: 0 });

function createBottomActionArea(defaults: { gap: number; paddingY?: number }) {
	return function BottomActionArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<BottomFixedArea
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "bottom-action-area", "column")}
				paddingY={toNumber(props.paddingY) ?? defaults.paddingY}
			>
				{children}
			</BottomFixedArea>
		);
	};
}

function createHeroArea(defaults: {
	gap: number;
	infoPaddingBottom: number;
	infoPaddingTop: number;
	infoPaddingX: number;
	thumbnailHeight: number;
}) {
	return function HeroArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const infoPaddingX = toNumber(props.infoPaddingX) ?? defaults.infoPaddingX;
		const infoPaddingTop = toNumber(props.infoPaddingTop) ?? defaults.infoPaddingTop;
		const infoPaddingBottom = toNumber(props.infoPaddingBottom) ?? defaults.infoPaddingBottom;
		return (
			<VStack
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "hero-area", "column")}
				style={{
					height: toNumber(props.thumbnailHeight) ?? defaults.thumbnailHeight,
					paddingBottom: infoPaddingBottom,
					paddingInline: infoPaddingX,
					paddingTop: infoPaddingTop,
				}}
			>
				{children}
			</VStack>
		);
	};
}

function createPlainStack(defaults: {
	bottomPadding?: number;
	gap: number;
	paddingX?: number;
	paddingY?: number;
}) {
	return function PlainStackArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const paddingY = toNumber(props.paddingY) ?? defaults.paddingY;
		const bottomPadding = toNumber(props.bottomPadding) ?? defaults.bottomPadding;
		return (
			<VStack
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "plain-stack-area", "column")}
				paddingX={toNumber(props.paddingX) ?? defaults.paddingX}
				paddingY={paddingY}
				style={bottomPadding !== undefined ? { paddingBottom: bottomPadding } : undefined}
			>
				{children}
			</VStack>
		);
	};
}

function createAppBarArea(defaults: { gap: number }) {
	return function AppBarArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<HStack
				className={className}
				gap={toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap}
				node={flexNode(metadata, "app-bar-area", "row")}
			>
				{children}
			</HStack>
		);
	};
}

function flexNode(
	metadata: LayoutPatternComponentProps["metadata"],
	fallbackId: string,
	direction: "column" | "row",
): NonNullable<VStackProps["node"] | HStackProps["node"]> {
	return {
		type: "Layout.Flex",
		metadata: {
			id: metadata?.id ?? fallbackId,
			title: metadata?.title,
		},
		props: {
			direction,
		},
	};
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
