import type { CSSProperties, ElementType, ReactNode } from "react";
import type { FlexLayoutProps, LayoutFlexNode } from "../types";
import { Flex } from "./Flex";

export type StackProps = {
	align?: FlexLayoutProps["align"];
	as?: ElementType;
	children?: ReactNode;
	className?: string;
	gap?: number;
	justify?: FlexLayoutProps["justify"];
	node?: LayoutFlexNode;
	paddingX?: number;
	paddingY?: number;
	style?: CSSProperties;
};

export type VStackProps = StackProps;
export type HStackProps = StackProps;

export function VStack({
	align,
	as,
	children,
	className,
	gap,
	justify,
	node,
	paddingX,
	paddingY,
	style,
}: VStackProps) {
	return (
		<Flex
			as={as}
			className={className}
			layout={{ align, direction: "column", gap, justify, paddingX, paddingY }}
			node={node}
			style={style}
		>
			{children}
		</Flex>
	);
}

export function HStack({
	align,
	as,
	children,
	className,
	gap,
	justify,
	node,
	paddingX,
	paddingY,
	style,
}: HStackProps) {
	return (
		<Flex
			as={as}
			className={className}
			layout={{ align, direction: "row", gap, justify, paddingX, paddingY }}
			node={node}
			style={style}
		>
			{children}
		</Flex>
	);
}
