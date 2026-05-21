"use client";

import type { AssetRegistry } from "@cx/agent";
import { useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import type {
	WireframeWorkbenchOrganism,
	WireframeWorkbenchScreen,
} from "@/features/wireframe-renderer/tables-to-render-tree";
import { useWorkbenchStore } from "./model/workbench-store";
import { WorkBenchCanvas } from "./ui/WorkBenchCanvas";
import { WorkBenchInspectionPanel } from "./ui/WorkBenchInspectionPanel";
import { WorkBenchNavigationPanel } from "./ui/WorkBenchNavigationPanel";

interface WireframeWorkbenchProps {
	agentRegistry?: AssetRegistry;
	organisms: WireframeWorkbenchOrganism[];
	screens: WireframeWorkbenchScreen[];
}

export function WireframeWorkbench({ agentRegistry, organisms, screens }: WireframeWorkbenchProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);

	useEffect(() => {
		initializeWorkbench({ agentRegistry, organisms, screens });
	}, [agentRegistry, initializeWorkbench, organisms, screens]);

	return (
		<SidebarProvider>
			<div className="grid min-h-screen w-screen grid-cols-[380px_minmax(420px,1fr)_360px]">
				<WorkBenchNavigationPanel />
				<WorkBenchCanvas />
				<WorkBenchInspectionPanel />
			</div>
		</SidebarProvider>
	);
}
