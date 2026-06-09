import type { ReactNode } from "react";

export type LayoutPatternComponentProps = {
	children?: ReactNode;
	className?: string;
	metadata?: {
		id: string;
		title?: string;
	};
	props?: Record<string, unknown>;
};
