"use client";

import { Children, Fragment, isValidElement, type ReactNode } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";

/**
 * 레이아웃 규칙: Aside는 100vh의 수직 영역이며,
 * n-1개의 divider로 인해 n개의 panel로 분할된다.
 *
 * 자식으로 받은 n개의 <Panel> 사이에 <Divider>를 자동으로 끼워넣는다.
 */
export function Aside({
	side,
	children,
}: {
	side: "left" | "right";
	children: ReactNode;
}) {
	const panels = Children.toArray(children).filter(isValidElement);

	return (
		<Sidebar side={side}>
			<ResizablePanelGroup orientation="vertical" className="h-full">
				{panels.map((panel, index) => (
					<Fragment key={index}>
						{index > 0 ? <Divider /> : null}
						{panel}
					</Fragment>
				))}
			</ResizablePanelGroup>
		</Sidebar>
	);
}

export function Panel({
	title,
	footer,
	defaultSize,
	minSize,
	bodyClassName,
	children,
}: {
	title?: ReactNode;
	footer?: ReactNode;
	defaultSize?: number;
	minSize?: number;
	bodyClassName?: string;
	children: ReactNode;
}) {
	return (
		<ResizablePanel defaultSize={defaultSize} minSize={minSize}>
			<div className="flex h-full flex-col overflow-hidden">
				{title ? (
					<div className="border-b px-3 py-2">
						<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
							{title}
						</span>
					</div>
				) : null}
				<div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>{children}</div>
				{footer ? <div className="shrink-0">{footer}</div> : null}
			</div>
		</ResizablePanel>
	);
}

export const Divider = ResizableHandle;
