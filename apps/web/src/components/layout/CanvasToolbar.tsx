"use client";

import { Moon, PanelTop, PanelTopDashed, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkbenchStore } from "@/model/store";
import { SaveButton } from "./SaveButton";

export function CanvasToolbar() {
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);
	const showStatusBar = useWorkbenchStore((state) => state.showStatusBar);
	const toggleStatusBar = useWorkbenchStore((state) => state.toggleStatusBar);
	const darkMode = useWorkbenchStore((state) => state.darkMode);
	const toggleDarkMode = useWorkbenchStore((state) => state.toggleDarkMode);

	return (
		<TooltipProvider>
			<div className="flex items-center gap-0.5 rounded-full border bg-background/95 p-1 shadow-sm backdrop-blur">
				<SaveButton />
				<ToolbarIconButton
					icon={darkMode ? <Moon className="size-4" /> : <Sun className="size-4" />}
					label={darkMode ? "라이트 모드" : "다크 모드"}
					onClick={toggleDarkMode}
				/>
				<ToolbarIconButton
					disabled={!selectedScreen}
					icon={showStatusBar ? <PanelTop className="size-4" /> : <PanelTopDashed className="size-4" />}
					label={showStatusBar ? "상태바 숨기기" : "상태바 표시"}
					onClick={toggleStatusBar}
				/>
			</div>
		</TooltipProvider>
	);
}

function ToolbarIconButton({
	disabled,
	icon,
	label,
	onClick,
}: {
	disabled?: boolean;
	icon: ReactNode;
	label: string;
	onClick?: () => void;
}) {
	return (
		<Tooltip delayDuration={300}>
			<TooltipTrigger asChild>
				<span>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="size-8 rounded-full"
						disabled={disabled}
						onClick={onClick}
					>
						{icon}
					</Button>
				</span>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}
