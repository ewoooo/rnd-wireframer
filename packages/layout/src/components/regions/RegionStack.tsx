import { VStack, type VStackProps } from "@cx/layout/primitives";
import type { LayoutPatternComponentProps } from "../patterns/types";

export type RegionStackDefaults = {
	gap?: number;
};

// Region 자체는 spacing을 소유하지 않는다(contents.meta 참고). canonical 1종(zero-gap)만 존재.
export const regionStackDefaults = { gap: 0 } as const satisfies RegionStackDefaults;

export const PlainStackRegion = createRegionStack(regionStackDefaults);

/** node/metadata 배관을 제외한 직렬화 가능 props. primitive-target resolver와 공유. */
export function resolveRegionStackProps(
	props: Record<string, unknown>,
	defaults: RegionStackDefaults,
): Pick<VStackProps, "as" | "gap"> {
	return {
		as: "section",
		gap: toNumber(props.gap) ?? defaults.gap,
	};
}

function createRegionStack(defaults: RegionStackDefaults) {
	return function RegionStack({
		children,
		className,
		metadata,
		props = {},
	}: LayoutPatternComponentProps) {
		return (
			<VStack
				{...resolveRegionStackProps(props, defaults)}
				className={className}
				node={{
					type: "Layout.Flex",
					metadata: {
						id: metadata?.id ?? "region-stack",
						title: metadata?.title,
					},
					props: {
						direction: "column",
					},
				}}
			>
				{children}
			</VStack>
		);
	};
}

function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
