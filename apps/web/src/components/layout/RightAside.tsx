import { Puck } from "@measured/puck";
import { ChevronRight, Grid3x3, Palette, Type, Workflow } from "lucide-react";
import { AgentRegistryInspection } from "@/components/agent/AgentRegistryInspection";
import { NewScreenReviewSummary } from "@/components/new-screen/NewScreenReviewSummary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkbenchStore } from "@/model/store";
import { Aside, Divider, Panel } from "./Aside";

export function RightAside() {
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const agentWarnings = useWorkbenchStore((state) => state.agentWarnings);
	const screen = useWorkbenchStore((state) => state.activeScreen);
	const isAreaView = useWorkbenchStore((state) => state.isAreaView);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);

	// Properties(Puck.Fields)는 편집 컨텍스트가 있을 때 렌더. area 뷰는 activeScreen 이
	// 없으므로 isAreaView 도 함께 본다.
	const hasEditTarget = !!screen || isAreaView;

	return (
		<Aside side="right">
			{activeTab === "run" ? (
				<Panel title="Review">
					<NewScreenReviewSummary review={{}} />
				</Panel>
			) : activeTab === "agent" ? (
				<Panel
					title={
						<span className="flex items-center gap-1.5">
							<Workflow className="size-3" />
							Agent
						</span>
					}
				>
					<div className="p-3">
						<AgentRegistryInspection
							registry={agentRegistry}
							selectedAsset={selectedAgentAsset}
							warnings={agentWarnings}
						/>
					</div>
				</Panel>
			) : (
				<>
					<Panel title="Properties" defaultSize={50} minSize={20}>
						{hasEditTarget ? (
							<div className="flex flex-col gap-4">
								<Puck.Fields />
							</div>
						) : null}
					</Panel>

					{/* 드로어 패널: 캔버스에 끌어다 놓을 팔레트.
					    Screen(scn)=Area List(area를 화면에 꺼냄), Area(ogn)=Component List(component를 area에 꺼냄).
					    구조적으로 동일하며 Puck.Components 가 config.components 를 드래그 소스로 렌더한다. */}
					{activeTab === "scn" || activeTab === "ogn" ? (
						<>
							<Divider />

							<Panel
								title={activeTab === "ogn" ? "Component List" : "Area List"}
								defaultSize={50}
								minSize={15}
							>
								<TooltipProvider>
									<div className="area-list-drawer">
										<Puck.Components />
									</div>
								</TooltipProvider>
							</Panel>
						</>
					) : null}

					{/* Component(comp) 우하단: 컴포넌트 raw value(토큰) 편집기 자리.
					    팀 합의상 컴포넌트 신규 생성은 없으므로 추후 개발할 토큰 메뉴만 스텁으로 둔다. */}
					{activeTab === "comp" ? (
						<>
							<Divider />

							<Panel title="스타일 편집 (추후 개발)" defaultSize={50} minSize={15}>
								<FutureTokenMenu />
							</Panel>
						</>
					) : null}
				</>
			)}
		</Aside>
	);
}

// 추후 개발 예정인 토큰 편집 메뉴 (비활성 스텁).
const FUTURE_TOKEN_MENU = [
	{ icon: Palette, label: "색상 선택기" },
	{ icon: Type, label: "글자 크기 선택기" },
	{ icon: Grid3x3, label: "그리드 방향 선택기" },
] as const;

function FutureTokenMenu() {
	return (
		<div className="flex flex-col gap-1 p-2">
			{FUTURE_TOKEN_MENU.map(({ icon: Icon, label }) => (
				<div
					key={label}
					className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-accent"
				>
					<Icon className="size-4 shrink-0 text-muted-foreground" />
					<span className="flex-1 text-sm">{label}</span>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
				</div>
			))}
		</div>
	);
}
