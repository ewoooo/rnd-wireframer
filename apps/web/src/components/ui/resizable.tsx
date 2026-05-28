"use client";

import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/components/utils";

const ResizablePanelGroup = ({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof Group>) => (
	<Group
		orientation={orientation}
		className={cn(
			"flex h-full w-full",
			orientation === "vertical" ? "flex-col" : "flex-row",
			className,
		)}
		{...props}
	/>
);

const ResizablePanel = Panel;

const ResizableHandle = ({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) => (
	<Separator
		className={cn(
			"relative flex items-center justify-center bg-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
			// horizontal handle (between vertical panels)
			"h-px w-full after:absolute after:inset-x-0 after:h-1",
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="z-10 flex h-3 w-4 rotate-90 items-center justify-center rounded-sm border bg-border">
				<GripVertical className="h-2.5 w-2.5" />
			</div>
		)}
	</Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
