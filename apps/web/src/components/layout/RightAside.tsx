import { Puck } from "@measured/puck";
import { Workflow } from "lucide-react";
import { AgentRegistryInspection } from "@/components/agent/AgentRegistryInspection";
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
			{activeTab === "agent" ? (
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
				</>
			)}
		</Aside>
	);
}
