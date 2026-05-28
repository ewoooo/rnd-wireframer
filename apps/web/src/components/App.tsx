"use client";

import type { RegisteredNodeTree } from "@cx/agent";
import { useEffect } from "react";
import { mockAgentAssetRegistry } from "@/agent/mock-agent-assets";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AppArea, AppScreen } from "@/adapters/tables-to-render-tree";
import type { AppScreenModule } from "@/model/store";

import { useWorkbenchStore } from "@/model/store";
import { Canvas } from "./layout/Canvas";
import { InspectionPanel } from "./layout/InspectionPanel";
import { NavigationPanel } from "./layout/NavigationPanel";
import { NavigationRail } from "./layout/NavigationRail";

interface AppProps {
	agentRegistry?: RegisteredNodeTree;
	initialData: {
		modules: AppScreenModule[];
		routes: { id: string; moduleId: string; name: string; order: number }[];
		screens: AppScreen[];
		areas: AppArea[];
	};
}

const ASIDE_WIDTH = "380px";

export function App({ agentRegistry = mockAgentAssetRegistry, initialData }: AppProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const selectTab = useWorkbenchStore((state) => state.selectTab);

	useEffect(() => {
		initializeWorkbench({
			agentRegistry,
			areas: initialData.areas,
			modules: initialData.modules ?? [],
			routes: initialData.routes ?? [],
			screens: initialData.screens,
		});
	}, [agentRegistry, initializeWorkbench, initialData]);

	return (
		<div className="flex h-screen w-screen overflow-hidden">
			<NavigationRail activeTab={activeTab} onSelectTab={selectTab} />
			<SidebarProvider
				className="flex-1 overflow-hidden"
				style={{ "--sidebar-width": ASIDE_WIDTH } as React.CSSProperties}
			>
				<NavigationPanel />
				<Canvas />
				<InspectionPanel />
			</SidebarProvider>
		</div>
	);
}
