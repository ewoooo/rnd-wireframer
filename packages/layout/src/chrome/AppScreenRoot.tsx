import type { WireframeScreenNode } from "@cx/wireframe";
import type { CSSProperties, ReactNode } from "react";

import { cx } from "../primitives";

export type AppScreenRootProps = {
	children: ReactNode;
	className?: string;
	node?: WireframeScreenNode;
	style?: CSSProperties;
};

export function AppScreenRoot({ children, className, node, style }: AppScreenRootProps) {
	return (
		<div
			className={cx(
				"flex h-[min(100%,var(--cx-app-screen-max-height,844px))] max-h-[var(--cx-app-screen-max-height,844px)] min-h-0 w-[min(100%,var(--cx-app-screen-max-width,390px))] max-w-[var(--cx-app-screen-max-width,390px)] flex-col overflow-hidden bg-[var(--semantic-surface-page-normal,#ffffff)]",
				className,
			)}
			data-node-id={node?.metadata.id}
			data-node-type={node?.type ?? "Screen"}
			style={style}
		>
			{children}
		</div>
	);
}
