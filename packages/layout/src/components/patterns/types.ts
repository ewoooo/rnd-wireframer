import type { ReactNode } from "react";
import type { LayoutPatternCatalogEntry, PatternStoreTarget } from "../../public/types";

export type LayoutPatternComponentProps = {
	children?: ReactNode;
	className?: string;
	metadata?: {
		id: string;
		title?: string;
	};
	props?: Record<string, unknown>;
};

export type LayoutPatternComponent = (props: LayoutPatternComponentProps) => ReactNode;

export type LayoutPatternComponentEntry = {
	component: LayoutPatternComponent;
	layoutId: LayoutPatternCatalogEntry["id"];
	pattern: LayoutPatternCatalogEntry;
	target: PatternStoreTarget;
};
