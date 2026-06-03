import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import type { Sidebar } from "@/components/ui/sidebar";
import type { NavigatorTab } from "@/model/workbench-view-model";

export type NavigationService = {
	description: string;
	icon: LucideIcon;
	id: NavigatorTab;
	label: string;
};

export type NavigationSidebarProps = React.ComponentProps<typeof Sidebar> & {
	activeTab: NavigatorTab;
	onSelectTab: (tab: NavigatorTab) => void;
};
