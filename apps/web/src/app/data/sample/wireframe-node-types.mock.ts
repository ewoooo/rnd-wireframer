import type { PropValue, WireframeEvents } from "@cx/renderer";

export type CXUINode = ScreenNode | ScreenRegionNode | LayoutNode | OrganismNode | ComponentNode;

export type CXUIMetadata = {
	id: string;
	title: string;
	author: string;
	createdAt: string;
	updatedAt: string;
	description?: string;
};

export type ScreenNode = {
	type: "Screen";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: ScreenProps;
	children: ScreenRegionNode[];
};

export type ScreenProps = {
	surface: "page" | "bottomSheet" | "popup";
	mode: "light" | "dark";
};

export type ScreenRegionNode = ScreenHeaderNode | ScreenContentsNode | ScreenBottomNode;

export type ScreenHeaderNode = {
	type: "Screen.Header";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: ScreenHeaderProps;
	children: ComponentNode[];
};

export type ScreenContentsNode = {
	type: "Screen.Contents";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: ScreenContentsProps;
	children: Array<OrganismNode | ComponentNode | LayoutNode>;
};

export type ScreenBottomNode = {
	type: "Screen.Bottom";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: ScreenBottomProps;
	children: ComponentNode[];
};

export type ScreenHeaderProps = {
	position: "fixed" | "sticky" | "static";
	layout: FlexProps;
	height?: number;
	zIndex?: number;
};

export type ScreenContentsProps = {
	layout: FlexProps;
	scroll: boolean;
};

export type ScreenBottomProps = {
	position: "fixed" | "sticky" | "static";
	layout: FlexProps;
	safeArea?: boolean;
	zIndex?: number;
};

export type LayoutNode = LayoutFlexNode | LayoutGridNode;

export type LayoutFlexNode = {
	type: "Layout.Flex";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: FlexProps;
	children: CXUINode[];
};

export type LayoutGridNode = {
	type: "Layout.Grid";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: GridProps;
	children: CXUINode[];
};

export type OrganismNode = {
	type: "Organism";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: OrganismProps;
	children: CXUINode[];
};

export type ComponentNode =
	| SystemHeaderNode
	| TopNavigationNode
	| ProgressBarNode
	| GlobalNavigationNode
	| CardNode
	| ButtonNode
	| ListCellNode
	| AccordionNode
	| SectionMessageNode;

export type SystemHeaderNode = {
	type: "Component.SystemHeader";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: SystemHeaderProps;
	events?: WireframeEvents;
};

export type TopNavigationNode = {
	type: "Component.TopNavigation";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: TopNavigationProps;
	events?: WireframeEvents;
};

export type ProgressBarNode = {
	type: "Component.ProgressBar";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: ProgressBarProps;
};

export type GlobalNavigationNode = {
	type: "Component.GlobalNavigation";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: GlobalNavigationProps;
	events?: WireframeEvents;
};

export type CardNode = {
	type: "Component.Card";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: CardProps;
	events?: WireframeEvents;
};

export type ButtonNode = {
	type: "Component.Button";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: ButtonProps;
	events?: WireframeEvents;
};

export type ListCellNode = {
	type: "Component.ListCell";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: ListCellProps;
	events?: WireframeEvents;
};

export type AccordionNode = {
	type: "Component.Accordion";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: AccordionProps;
	events?: WireframeEvents;
};

export type SectionMessageNode = {
	type: "Component.SectionMessage";
	componentVersion: string;
	metadata: CXUIMetadata;
	props: SectionMessageProps;
};

export type FlexProps = {
	direction: "row" | "column";
	gap?: SpacingToken;
	paddingX?: SpacingToken;
	paddingY?: SpacingToken;
	align?: "start" | "center" | "end" | "stretch";
	justify?: "start" | "center" | "end" | "between";
};

export type GridProps = {
	columns: number;
	gap?: SpacingToken;
	paddingX?: SpacingToken;
	paddingY?: SpacingToken;
};

export type SystemHeaderProps = {
	statusBarStyle: "light" | "dark";
};

export type TopNavigationProps = {
	titleContent: PropValue;
	titleSize?: "title1" | "title2" | "title3";
	showBackButton?: boolean;
};

export type ProgressBarProps = {
	current: number;
	total: number;
};

export type GlobalNavigationProps = {
	activeKey: string;
	items: Array<{
		key: string;
		label: string;
		iconName?: string;
	}>;
};

export type OrganismProps = {
	organismCode: string;
	name: string;
};

export type CardProps = {
	title: PropValue;
	description?: PropValue;
	badge?: PropValue;
};

export type ButtonProps = {
	label: PropValue;
	variant?: "primary" | "secondary" | "text";
	disabled?: PropValue;
};

export type ListCellProps = {
	title: PropValue;
	description?: PropValue;
	required?: boolean;
	checked?: PropValue;
};

export type AccordionProps = {
	title: PropValue;
	description?: PropValue;
};

export type SectionMessageProps = {
	variant: "info" | "negative" | "positive";
	title: PropValue;
	description?: PropValue;
};

export type SpacingToken = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

const nodeMetadata = (id: string, title: string): CXUIMetadata => ({
	id,
	title,
	author: "plus_x_author_1",
	createdAt: "2026-05-21T00:00:00Z",
	updatedAt: "2026-05-21T00:00:00Z",
});

export const typedNodeTreeExample: ScreenNode = {
	type: "Screen",
	componentVersion: "1.0.0",
	metadata: nodeMetadata("screen-root", "약관 동의 화면"),
	props: {
		surface: "page",
		mode: "light",
	},
	children: [
		{
			type: "Screen.Header",
			componentVersion: "1.0.0",
			metadata: nodeMetadata("screen-header", "고정 상단 영역"),
			props: {
				position: "fixed",
				layout: {
					direction: "column",
					gap: 0,
				},
				height: 96,
				zIndex: 10,
			},
			children: [
				{
					type: "Component.SystemHeader",
					componentVersion: "1.0.0",
					metadata: nodeMetadata("system-header", "시스템 헤더"),
					props: {
						statusBarStyle: "dark",
					},
				},
				{
					type: "Component.TopNavigation",
					componentVersion: "1.0.0",
					metadata: nodeMetadata("top-navigation", "상단 내비게이션"),
					props: {
						titleContent: "약관 동의",
						titleSize: "title3",
						showBackButton: true,
					},
				},
				{
					type: "Component.ProgressBar",
					componentVersion: "1.0.0",
					metadata: nodeMetadata("progress-bar", "진행률"),
					props: {
						current: 1,
						total: 3,
					},
				},
			],
		},
		{
			type: "Screen.Contents",
			componentVersion: "1.0.0",
			metadata: nodeMetadata("screen-contents", "스크롤 콘텐츠 영역"),
			props: {
				layout: {
					direction: "column",
					gap: 4,
					paddingX: 5,
					paddingY: 4,
				},
				scroll: true,
			},
			children: [
				{
					type: "Organism",
					componentVersion: "1.0.0",
					metadata: nodeMetadata("ogn-mbr-term-list", "약관 목록 조회"),
					props: {
						organismCode: "ogn-mbr-term-list",
						name: "약관 목록 조회",
					},
					children: [
						{
							type: "Layout.Flex",
							componentVersion: "1.0.0",
							metadata: nodeMetadata("term-list-layout", "약관 목록 내부 그룹"),
							props: {
								direction: "column",
								gap: 3,
							},
							children: [
								{
									type: "Component.ListCell",
									componentVersion: "1.0.0",
									metadata: nodeMetadata("required-term", "필수 약관 항목"),
									props: {
										title: {
											bind: "termList.requiredTerm.title",
											default: "필수 약관 항목",
										},
										description: {
											bind: "termList.requiredTerm.description",
											default: "필수 약관 항목",
										},
										required: true,
										checked: {
											bind: "termList.requiredTerm.checked",
											default: false,
										},
									},
								},
								{
									type: "Component.Accordion",
									componentVersion: "1.0.0",
									metadata: nodeMetadata("term-detail", "약관 전문 펼치기"),
									props: {
										title: {
											bind: "termList.termDetail.title",
											default: "약관 전문 펼치기",
										},
										description: {
											bind: "termList.termDetail.description",
											default: "약관 전문 펼치기",
										},
									},
								},
							],
						},
					],
				},
				{
					type: "Organism",
					componentVersion: "1.0.0",
					metadata: nodeMetadata("ogn-mbr-term-agree", "약관 동의 CTA"),
					props: {
						organismCode: "ogn-mbr-term-agree",
						name: "약관 동의 CTA",
					},
					children: [
						{
							type: "Component.Button",
							componentVersion: "1.0.0",
							metadata: nodeMetadata("submit-button", "다음 버튼"),
							props: {
								label: "다음",
								variant: "primary",
								disabled: {
									bind: "termList.requiredTerm.checked",
									default: true,
								},
							},
						},
					],
				},
			],
		},
		{
			type: "Screen.Bottom",
			componentVersion: "1.0.0",
			metadata: nodeMetadata("screen-bottom", "고정 하단 영역"),
			props: {
				position: "fixed",
				layout: {
					direction: "column",
					gap: 0,
				},
				safeArea: true,
				zIndex: 10,
			},
			children: [
				{
					type: "Component.GlobalNavigation",
					componentVersion: "1.0.0",
					metadata: nodeMetadata("global-navigation", "글로벌 내비게이션"),
					props: {
						activeKey: "home",
						items: [
							{ key: "home", label: "홈", iconName: "home" },
							{ key: "benefit", label: "혜택", iconName: "gift" },
							{ key: "my", label: "MY", iconName: "user" },
						],
					},
				},
			],
		},
	],
};
