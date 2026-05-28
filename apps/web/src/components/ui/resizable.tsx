"use client";

import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/components/utils";

/**
 * shadcn/ui resizable — react-resizable-panels v4 adaptation
 *
 * v4 변경점:
 *   PanelGroup → Group  /  PanelResizeHandle → Separator
 *   direction  → orientation
 *   data-panel-group-direction → aria-orientation (값이 반전: 세로 레이아웃=horizontal)
 *
 * Tailwind modifier:
 *   aria-[orientation=horizontal]: → 패널이 위아래로 쌓인 경우의 가로 바
 *   aria-[orientation=vertical]:   → 패널이 좌우로 나뉜 경우의 세로 바
 */

function ResizablePanelGroup({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof Group>) {
	return (
		<Group
			data-slot="resizable-panel-group"
			orientation={orientation}
			className={cn(
				"flex h-full w-full",
				orientation === "vertical" ? "flex-col" : "flex-row",
				className,
			)}
			{...props}
		/>
	);
}

const ResizablePanel = Panel;

function ResizableHandle({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof Separator> & {
	withHandle?: boolean;
}) {
	return (
		<Separator
			data-slot="resizable-handle"
			className={cn(
				// 공통
				"bg-border focus-visible:ring-ring relative flex items-center justify-center",
				"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-1",
				// 세로 바 (좌우 패널 경계) — aria-orientation="vertical"
				"w-px",
				"after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2",
				// 가로 바 (위아래 패널 경계) — aria-orientation="horizontal"
				"aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full",
				"aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1",
				"aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:-translate-y-1/2",
				"aria-[orientation=horizontal]:after:translate-x-0",
				// 그립 아이콘 회전
				"[&[aria-orientation=horizontal]>div]:rotate-90",
				className,
			)}
			{...props}
		>
			{withHandle && (
				<div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
					<GripVertical className="size-2.5" />
				</div>
			)}
		</Separator>
	);
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
