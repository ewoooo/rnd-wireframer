import { Boxes, Component, Database, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import type { NavigatorTab } from "@/model/store";

interface NavigationRailProps {
	activeTab: NavigatorTab;
	onSelectTab: (tab: NavigatorTab) => void;
}

const navigationItems: Array<{
	icon: typeof Layers3;
	label: string;
	value: NavigatorTab;
}> = [
	{
		icon: Layers3,
		label: "SCN",
		value: "scn",
	},
	{
		icon: Boxes,
		label: "OGN",
		value: "ogn",
	},
	{
		icon: Component,
		label: "CMP",
		value: "comp",
	},
	{
		icon: Database,
		label: "AGT",
		value: "agent",
	},
];

export function NavigationRail({ activeTab, onSelectTab }: NavigationRailProps) {
	return (
		<nav
			aria-label="Workbench navigation"
			className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar p-2"
		>
			{navigationItems.map((item) => {
				const Icon = item.icon;
				const isActive = item.value === activeTab;

				return (
					<Button
						key={item.value}
						type="button"
						size="icon"
						variant={isActive ? "secondary" : "ghost"}
						aria-label={item.label}
						aria-pressed={isActive}
						title={item.label}
						className={cn(
							"size-10 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
							isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-none",
						)}
						onClick={() => onSelectTab(item.value)}
					>
						<Icon className="size-4" data-icon="inline-start" />
					</Button>
				);
			})}
		</nav>
	);
}
