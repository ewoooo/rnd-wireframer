import { Table2 } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu } from "@/components/ui/sidebar";
import type { NavigatorTab } from "@/model/workbench-view-model";
import { NavigationServiceLink } from "./NavigationServiceLink";
import type { NavigationService } from "./types";

type NavigationServicesProps = {
	activeTab: NavigatorTab;
	onSelectTab: (tab: NavigatorTab) => void;
};

const navigationServices: NavigationService[] = [
	{
		description: "AI 에이전트 노드와 실행 상태",
		icon: Table2,
		id: "agent",
		label: "새 화면",
	},
];

export function NavigationServices({ activeTab, onSelectTab }: NavigationServicesProps) {
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{navigationServices.map((service) => (
						<NavigationServiceLink
							isActive={activeTab === service.id}
							key={service.id}
							onSelect={onSelectTab}
							service={service}
						/>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
