import { Sidebar, SidebarContent, SidebarFooter, SidebarRail } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import { NavigationLibrary } from "./NavigationLibrary";
import { NavigationServices } from "./NavigationServices";
import type { NavigationSidebarProps } from "./types";

export function NavigationSidebar({
	activeTab,
	className,
	onSelectTab,
	...props
}: NavigationSidebarProps) {
	return (
		<Sidebar collapsible="icon" className={cn("w-50", className)} {...props}>
			<SidebarContent>
				<NavigationServices activeTab={activeTab} onSelectTab={onSelectTab} />
				<NavigationLibrary activeTab={activeTab} onSelectTab={onSelectTab} />
			</SidebarContent>
			<SidebarFooter>
				<span className="px-1 text-xs text-muted-foreground">version 0.1</span>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
