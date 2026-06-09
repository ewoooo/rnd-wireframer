import { Box, Boxes, Smartphone, Table2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/components/utils";
import type { NavigatorTab } from "@/model/workbench-view-model";

interface RailProps {
	activeTab: NavigatorTab;
	onSelectTab: (tab: NavigatorTab) => void;
}

type NavItem = {
	icon: typeof Smartphone;
	label: string;
	description: string;
	value: NavigatorTab;
};

const runItems: NavItem[] = [
	{
		icon: Table2,
		label: "Run",
		description: "새 화면 생성 실행 및 결과 탐색",
		value: "agent",
	},
];

const primaryItems: NavItem[] = [
	{
		icon: Smartphone,
		label: "Screens",
		description: "화면 목록 및 라우트별 변형 탐색",
		value: "scn",
	},
	{
		icon: Boxes,
		label: "Areas",
		description: "재사용 가능한 영역 단위 구성",
		value: "ogn",
	},
	{
		icon: Box,
		label: "Components",
		description: "영역을 구성하는 컴포넌트",
		value: "comp",
	},
];

function NavButton({
	item,
	isActive,
	onSelectTab,
}: {
	item: NavItem;
	isActive: boolean;
	onSelectTab: (tab: NavigatorTab) => void;
}) {
	const Icon = item.icon;
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label={item.label}
					aria-pressed={isActive}
					onClick={() => onSelectTab(item.value)}
					className={cn(
						"group relative flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2.5 transition-colors",
						"text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary",
						isActive &&
							"bg-primary font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground",
					)}
				>
					<Icon className="size-4 shrink-0" />
					<span className="truncate text-button">{item.label}</span>
				</button>
			</TooltipTrigger>
			<TooltipContent side="right">
				<p className="text-muted-foreground">{item.description}</p>
			</TooltipContent>
		</Tooltip>
	);
}

export function Rail({ activeTab, onSelectTab }: RailProps) {
	return (
		<TooltipProvider delayDuration={400}>
			<nav
				aria-label="Workbench navigation"
				className="flex w-44 shrink-0 flex-col gap-1 bg-sidebar p-2"
			>
				{runItems.map((item) => (
					<NavButton
						key={item.value}
						item={item}
						isActive={activeTab === item.value}
						onSelectTab={onSelectTab}
					/>
				))}

				<div className="my-1 h-px w-full bg-sidebar-border" />

				{primaryItems.map((item) => (
					<NavButton
						key={item.value}
						item={item}
						isActive={activeTab === item.value}
						onSelectTab={onSelectTab}
					/>
				))}
			</nav>
		</TooltipProvider>
	);
}
