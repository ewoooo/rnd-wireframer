import {
	BottomFixedArea,
	HStack,
	type HStackProps,
	PageStack,
	type PageStackProps,
	VStack,
	type VStackProps,
} from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../types";

type StackAreaDefaults = {
	gap: number;
	itemPaddingX?: number;
	itemTemplate?: PageStackProps["itemTemplate"];
	paddingY?: number;
	sectionPaddingX?: number;
	slotInsetX?: number;
	titleGap?: number;
	titleMode?: PageStackProps["titleMode"];
};

const pageStackDefaults = {
	itemPaddingX: 20,
	itemTemplate: "default-20",
	paddingY: 28,
	sectionPaddingX: 12,
	titleGap: 8,
	titleMode: "visible",
} as const satisfies Omit<StackAreaDefaults, "gap">;

export const AreaVerticalArea = createPlainStack({ gap: 0 });
export const AuthMethodListArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	itemPaddingX: 0,
	titleGap: 8,
});
export const AuthCodeEntryArea = createPageStackArea({
	...pageStackDefaults,
	gap: 12,
	titleGap: 8,
});
export const ActionStackArea = createPageStackArea({
	...pageStackDefaults,
	gap: 12,
	paddingY: 0,
	titleGap: 0,
	titleMode: "none",
});
export const BottomActionArea = createBottomActionArea({ gap: 12, paddingY: 0 });
export const ProductHeroSummaryArea = createHeroArea({
	gap: 12,
	infoPaddingBottom: 16,
	infoPaddingTop: 32,
	infoPaddingX: 32,
	thumbnailHeight: 480,
});
export const ProductInfoSectionArea = createPageStackArea({
	...pageStackDefaults,
	gap: 16,
	titleGap: 16,
});
export const ProductDisclosureAccordionArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleGap: 0,
	titleMode: "none",
});
export const ProductFooterLegalArea = createPlainStack({
	bottomPadding: 120,
	gap: 30,
	paddingX: 32,
	paddingY: 32,
});
export const PriceAccordionStackArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleGap: 0,
});
export const DeliveryInfoAccordionArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleGap: 0,
	titleMode: "none",
});
export const NoticeAccordionStackArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleGap: 0,
	titleMode: "none",
});
export const PagestackInfoTextSectionArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleGap: 12,
});
export const TextListGroupArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleGap: 12,
});
export const PlainInfoTextListArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleMode: "hidden",
});
export const TabChipSearchAccordionArea = createPageStackArea({
	...pageStackDefaults,
	gap: 12,
	titleMode: "none",
});
export const AccordionNoticeListArea = createPageStackArea({
	...pageStackDefaults,
	gap: 0,
	titleMode: "none",
});
export const AreaAppBarArea = createAppBarArea({ gap: 0 });

function createPageStackArea(defaults: StackAreaDefaults) {
	return function PageStackArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<PageStack
				{...toPageStackProps(props, defaults)}
				className={className}
				node={{
					type: "PageStack",
					metadata: {
						id: metadata?.id ?? "general-area",
						title: metadata?.title,
					},
				}}
			>
				{children}
			</PageStack>
		);
	};
}

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

function toPageStackProps(
	props: Record<string, unknown>,
	defaults: StackAreaDefaults,
): Partial<PageStackProps> {
	return {
		gap: toNumber(props.gap) ?? toNumber(props.componentGap) ?? defaults.gap,
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

function toPageStackItemTemplate(value: unknown): PageStackProps["itemTemplate"] | undefined {
	return value === "card-0" || value === "default-20" || value === "plain" ? value : undefined;
}

function toPageStackTitleMode(value: unknown): PageStackProps["titleMode"] | undefined {
	return value === "hidden" || value === "none" || value === "visible" ? value : undefined;
}

function toTitleModeFromLegacyProps(props: Record<string, unknown>): PageStackProps["titleMode"] {
	return props.hideTitle === true ? "hidden" : undefined;
}
