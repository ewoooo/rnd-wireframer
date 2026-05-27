import { Box, Boxes, Smartphone, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/components/utils";
import type { NavigatorTab } from "@/model/store";

interface NavigationRailProps {
	activeTab: NavigatorTab;
	onSelectTab: (tab: NavigatorTab) => void;
}

type NavItem = {
	icon: typeof Smartphone;
	label: string;
	name: string;
	description: string;
	value: NavigatorTab;
};

const primaryItems: NavItem[] = [
	{
		icon: Smartphone,
		label: "SCN",
		name: "Screen",
		description: "화면 목록 및 라우트별 변형 탐색",
		value: "scn",
	},
	{
		icon: Boxes,
		label: "ARE",
		name: "Area",
		description: "재사용 가능한 섹션 단위 컴포넌트 목록",
		value: "ogn",
	},
	{
		icon: Box,
		label: "CMP",
		name: "Component",
		description: "오가니즘을 구성하는 컴포지트 목록",
		value: "comp",
	},
];

const secondaryItems: NavItem[] = [
	{
		icon: Table2,
		label: "AGT",
		name: "Agent",
		description: "AI 에이전트 노드 레지스트리 및 생성 현황",
		value: "agent",
	},
];

function NavButton({ item, isActive, onSelectTab }: { item: NavItem; isActive: boolean; onSelectTab: (tab: NavigatorTab) => void }) {
	const Icon = item.icon;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					size="icon"
					variant={isActive ? "secondary" : "ghost"}
					aria-label={item.label}
					aria-pressed={isActive}
					className={cn(
						"size-10 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
						isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-none",
					)}
					onClick={() => onSelectTab(item.value)}
				>
					<Icon className="size-4" data-icon="inline-start" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="right">
				<p className="font-semibold">{item.name}<span className="text-muted-foreground font-normal ml-1">({item.label})</span></p>
				<p className="text-muted-foreground mt-0.5">{item.description}</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function NavigationRail({ activeTab, onSelectTab }: NavigationRailProps) {
	return (
		<TooltipProvider delayDuration={400}>
			<nav
				aria-label="Workbench navigation"
				className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar p-2"
			>
				{primaryItems.map((item) => (
					<NavButton key={item.value} item={item} isActive={activeTab === item.value} onSelectTab={onSelectTab} />
				))}

				<div className="my-1 w-6 border-t border-sidebar-border" />

				{secondaryItems.map((item) => (
					<NavButton key={item.value} item={item} isActive={activeTab === item.value} onSelectTab={onSelectTab} />
				))}
			</nav>
		</TooltipProvider>
	);
}
