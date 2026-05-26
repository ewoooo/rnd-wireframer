"use client";

import type { RegisteredNodeTree } from "@cx/agent";
import { useEffect } from "react";
import { mockAgentAssetRegistry } from "@/agent/mock-agent-assets";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { AppOrganism, AppScreen } from "@/adapters/tables-to-render-tree";
import { useWorkbenchStore } from "@/model/store";
import { Canvas } from "./layout/Canvas";
import { InspectionPanel } from "./layout/InspectionPanel";
import { NavigationPanel } from "./layout/NavigationPanel";

interface AppProps {
	agentRegistry?: RegisteredNodeTree;
	initialData: {
		screens: AppScreen[];
		organisms: AppOrganism[];
	};
}

export function App({ agentRegistry = mockAgentAssetRegistry, initialData }: AppProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);

	useEffect(() => {
		initializeWorkbench({
			agentRegistry,
			organisms: initialData.organisms,
			screens: initialData.screens,
		});
	}, [agentRegistry, initializeWorkbench, initialData]);

	return (
		<SidebarProvider>
			<div className="grid min-h-screen w-screen grid-cols-[380px_minmax(420px,1fr)_360px]">
				<NavigationPanel />
				<Canvas />
				<InspectionPanel />
			</div>
		</SidebarProvider>
	);
}
