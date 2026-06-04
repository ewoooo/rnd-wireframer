import { Box, Boxes, Smartphone } from "lucide-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
} from "@/components/ui/sidebar";
import type { NavigatorTab } from "@/model/workbench-view-model";
import { NavigationServiceLink } from "./NavigationServiceLink";
import type { NavigationService } from "./types";

type NavigationServicesProps = {
	activeTab: NavigatorTab;
	onSelectTab: (tab: NavigatorTab) => void;
};

const navigationServices: NavigationService[] = [
	{
		description: "화면 목록 및 라우트별 변형 탐색",
		icon: Smartphone,
		id: "scn",
		label: "스크린",
	},
	{
		description: "재사용 가능한 영역 단위 구성",
		icon: Boxes,
		id: "ogn",
		label: "그룹",
	},
	{
		description: "영역을 구성하는 컴포넌트",
		icon: Box,
		id: "comp",
		label: "컴포넌트",
	},
];

export function NavigationLibrary({ activeTab, onSelectTab }: NavigationServicesProps) {
	return (
		<SidebarGroup>
			<div className="flex items-center justify-between gap-1">
				<SidebarGroupLabel>Explore</SidebarGroupLabel>
			</div>
			<SidebarGroupContent>
				<SidebarMenu className="">
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
