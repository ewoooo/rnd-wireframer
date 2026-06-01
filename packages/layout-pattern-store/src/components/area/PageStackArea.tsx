import { PageStack, type PageStackProps } from "@cx/layout/primitives";
import {
	type LayoutDivider,
	renderChildrenWithDividers,
	resolveDivider,
	withTrailingSectionDivider,
} from "../shared/divider";
import type { LayoutPatternComponentProps } from "../types";

type PageStackAreaDefaults = {
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

const pageStackDefaults = {
	itemPaddingX: 20,
	itemTemplate: "default-20",
	paddingY: 28,
	sectionPaddingX: 12,
	titleGap: 8,
	titleMode: "visible",
} as const satisfies Omit<PageStackAreaDefaults, "gap">;

// PageStack 기반 area는 모두 이 파일이 소유한다. 비-PageStack area는 GeneralArea.tsx.
export const ListStackArea = createPageStackArea({ ...pageStackDefaults, gap: 8 });
export const FieldStackArea = createPageStackArea({ ...pageStackDefaults, gap: 12 });
export const CheckboxStackArea = createPageStackArea({ ...pageStackDefaults, gap: 12 });
export const AccordionListArea = createPageStackArea({ ...pageStackDefaults, gap: 0 });
export const MessageStackArea = createPageStackArea({ ...pageStackDefaults, gap: 12 });
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
export const ProductInfoSectionArea = createPageStackArea({
	...pageStackDefaults,
	gap: 16,
	titleGap: 16,
});
export const ProductDisclosureAccordionArea = createPageStackArea({
	...pageStackDefaults,
	divider: "contents",
	gap: 0,
	titleGap: 0,
	titleMode: "none",
});
export const PriceAccordionStackArea = createPageStackArea({
	...pageStackDefaults,
	divider: "between-accordion-rows",
	gap: 0,
	titleGap: 0,
});
export const DeliveryInfoAccordionArea = createPageStackArea({
	...pageStackDefaults,
	divider: "between-accordion-rows",
	gap: 0,
	titleGap: 0,
	titleMode: "none",
});
export const NoticeAccordionStackArea = createPageStackArea({
	...pageStackDefaults,
	divider: "between-accordion-rows",
	gap: 0,
	titleMode: "none",
});
export const PagestackInfoTextSectionArea = createPageStackArea({
	...pageStackDefaults,
	divider: "between-info-text-rows",
	gap: 0,
	titleGap: 12,
});
export const TextListGroupArea = createPageStackArea({
	...pageStackDefaults,
	divider: "between-info-text-rows",
	gap: 0,
	titleGap: 12,
});
export const PlainInfoTextListArea = createPageStackArea({
	...pageStackDefaults,
	divider: "between-info-text-rows",
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
	divider: "between-accordion-rows",
	gap: 0,
	titleMode: "none",
});

function createPageStackArea(defaults: PageStackAreaDefaults) {
	return function PageStackArea({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		const divider = resolveDivider(props.divider, defaults.divider);
		return withTrailingSectionDivider(
			<PageStack
				{...toPageStackProps(props, defaults)}
				className={className}
				node={{
					type: "PageStack",
					metadata: {
						id: metadata?.id ?? "page-stack-area",
						title: metadata?.title,
					},
				}}
			>
				{renderChildrenWithDividers(children, divider)}
			</PageStack>,
			props.sectionDivider,
		);
	};
}

function toPageStackProps(
	props: Record<string, unknown>,
	defaults: PageStackAreaDefaults,
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
