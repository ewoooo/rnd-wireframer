"use client";

import type { RegisteredNodeTree } from "@cx/agent";
import { useEffect } from "react";
import { mockAgentAssetRegistry } from "@/agent/mock-agent-assets";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AppArea, AppScreen } from "@/adapters/tables-to-render-tree";
import { registerWireframeNodeKinds, type WireframeNodeKind } from "@cx/renderer";
import { useWorkbenchStore } from "@/model/store";
import { Canvas } from "./layout/Canvas";
import { InspectionPanel } from "./layout/InspectionPanel";
import { NavigationPanel } from "./layout/NavigationPanel";
import { NavigationRail } from "./layout/NavigationRail";

interface AppProps {
	agentRegistry?: RegisteredNodeTree;
	initialData: {
		screens: AppScreen[];
		areas: AppArea[];
		rendererKinds: Array<{ type: string; kind: WireframeNodeKind }>;
	};
}

// 레이아웃 상수
const NAV_WIDTH = 56;    // NavigationRail (w-14)
const ASIDE_WIDTH = 380; // 좌/우 패널 통일

export function App({ agentRegistry = mockAgentAssetRegistry, initialData }: AppProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const selectTab = useWorkbenchStore((state) => state.selectTab);

	useEffect(() => {
		registerWireframeNodeKinds(initialData.rendererKinds);
		initializeWorkbench({
			agentRegistry,
			areas: initialData.areas,
			screens: initialData.screens,
		});
	}, [agentRegistry, initializeWorkbench, initialData]);

	return (
		<SidebarProvider>
			<div
				className="grid min-h-screen w-screen"
				style={{
					gridTemplateColumns: `${NAV_WIDTH}px ${ASIDE_WIDTH}px 1fr ${ASIDE_WIDTH}px`,
				}}
			>
				<NavigationRail activeTab={activeTab} onSelectTab={selectTab} />
				<NavigationPanel />
				<Canvas />
				<InspectionPanel />
			</div>
		</SidebarProvider>
	);
}
