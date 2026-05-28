import { PageStack, type PageStackProps } from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../types";

type PageStackAreaDefaults = {
	gap: number;
	itemPaddingX?: number;
	itemTemplate?: PageStackProps["itemTemplate"];
	paddingY?: number;
	sectionPaddingX?: number;
	titleGap?: number;
	titleMode?: PageStackProps["titleMode"];
};

const sharedDefaults = {
	itemPaddingX: 20,
	itemTemplate: "default-20",
	paddingY: 28,
	sectionPaddingX: 12,
	titleGap: 8,
	titleMode: "visible",
} as const satisfies Omit<PageStackAreaDefaults, "gap">;

export function ListStackArea(props: LayoutPatternComponentProps) {
	return <PageStackArea {...props} defaults={{ ...sharedDefaults, gap: 8 }} />;
}

export function FieldStackArea(props: LayoutPatternComponentProps) {
	return <PageStackArea {...props} defaults={{ ...sharedDefaults, gap: 12 }} />;
}

export function CheckboxStackArea(props: LayoutPatternComponentProps) {
	return <PageStackArea {...props} defaults={{ ...sharedDefaults, gap: 12 }} />;
}

export function AccordionListArea(props: LayoutPatternComponentProps) {
	return <PageStackArea {...props} defaults={{ ...sharedDefaults, gap: 0 }} />;
}

export function MessageStackArea(props: LayoutPatternComponentProps) {
	return <PageStackArea {...props} defaults={{ ...sharedDefaults, gap: 12 }} />;
}

function PageStackArea({
	children,
	className,
	defaults,
	metadata,
	props = {},
}: LayoutPatternComponentProps & { defaults: PageStackAreaDefaults }) {
	return (
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
			{children}
		</PageStack>
	);
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
		slotInsetX: toNumber(props.slotInsetX),
		titleMode: toPageStackTitleMode(props.titleMode) ?? defaults.titleMode,
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
