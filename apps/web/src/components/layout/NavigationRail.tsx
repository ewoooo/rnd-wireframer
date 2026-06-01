import { Box, Boxes, FlaskConical, Smartphone, Table2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/components/utils";
import type { NavigatorTab } from "@/model/workbench-view-model";

type NavigationRailProps = {
	activeHref?: string;
	activeTab?: NavigatorTab;
	onSelectTab?: (tab: NavigatorTab) => void;
};

type NavigationTab = {
	description: string;
	id: NavigatorTab;
	icon: typeof Smartphone;
	label: string;
	name: string;
};

type NavigationLink = {
	description: string;
	href: string;
	icon: typeof Smartphone;
	label: string;
	name: string;
};

const primaryNavigationTabs: NavigationTab[] = [
	{
		description: "화면 목록 및 라우트별 변형 탐색",
		id: "scn",
		icon: Smartphone,
		label: "SCN",
		name: "Screen",
	},
	{
		description: "재사용 가능한 섹션 단위 컴포넌트 목록",
		id: "ogn",
		icon: Boxes,
		label: "ARE",
		name: "Area",
	},
	{
		description: "영역을 구성하는 컴포넌트 목록",
		id: "comp",
		icon: Box,
		label: "CMP",
		name: "Component",
	},
];

const secondaryNavigationTabs: NavigationTab[] = [
	{
		description: "AI 에이전트 노드 레지스트리 및 생성 현황",
		id: "agent",
		icon: Table2,
		label: "AGT",
		name: "Agent",
	},
];

const utilityNavigationLinks: NavigationLink[] = [
	{
		description: "스모크 실행 결과 조회 및 품질 비교",
		href: "/smoke",
		icon: FlaskConical,
		label: "SMK",
		name: "Smoke",
	},
];

export function NavigationRail({ activeHref, activeTab, onSelectTab }: NavigationRailProps) {
	return (
		<nav
			aria-label="Workbench navigation"
			className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-sidebar-border bg-sidebar p-2"
		>
			{primaryNavigationTabs.map((tab) => (
				<NavigationButton key={tab.id} activeTab={activeTab} onSelectTab={onSelectTab} tab={tab} />
			))}
			<div className="my-1 w-6 border-t border-sidebar-border" />
			{secondaryNavigationTabs.map((tab) => (
				<NavigationButton key={tab.id} activeTab={activeTab} onSelectTab={onSelectTab} tab={tab} />
			))}
			<div className="my-1 w-6 border-t border-sidebar-border" />
			{utilityNavigationLinks.map((item) => (
				<NavigationLinkButton isActive={activeHref === item.href} item={item} key={item.href} />
			))}
		</nav>
	);
}

function NavigationButton({
	activeTab,
	onSelectTab,
	tab,
}: {
	activeTab?: NavigatorTab;
	onSelectTab?: (tab: NavigatorTab) => void;
	tab: NavigationTab;
}) {
	const Icon = tab.icon;
	const isActive = activeTab === tab.id;
	const className = cn(
		"flex size-10 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
		isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-none",
	);
	const title = `${tab.name} (${tab.label}) - ${tab.description}`;

	if (!onSelectTab) {
		return (
			<Link aria-label={tab.label} className={className} href="/" title={title}>
				<Icon className="size-4" data-icon="inline-start" />
			</Link>
		);
	}

	return (
		<button
			type="button"
			className={className}
			aria-label={tab.label}
			aria-pressed={isActive}
			onClick={() => onSelectTab(tab.id)}
			title={title}
		>
			<Icon className="size-4" data-icon="inline-start" />
		</button>
	);
}

function NavigationLinkButton({ isActive, item }: { isActive: boolean; item: NavigationLink }) {
	const Icon = item.icon;

	return (
		<Link
			aria-label={item.label}
			aria-current={isActive ? "page" : undefined}
			className={cn(
				"flex size-10 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				isActive && "bg-sidebar-accent text-sidebar-accent-foreground shadow-none",
			)}
			href={item.href}
			title={`${item.name} (${item.label}) - ${item.description}`}
		>
			<Icon className="size-4" data-icon="inline-start" />
		</Link>
	);
}
