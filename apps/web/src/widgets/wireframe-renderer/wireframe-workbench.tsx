"use client";

import { useEffect } from "react";

import type {
	WireframeWorkbenchOrganism,
	WireframeWorkbenchScreen,
} from "@/features/wireframe-renderer/generate-render-tree";
import { useWorkbenchStore } from "./model/workbench-store";
import { WorkbenchPanelCanvas } from "./ui/workbench-panel-canvas";
import { WorkbenchPanelInspection } from "./ui/workbench-panel-inspection";
import { WorkbenchPanelNavigation } from "./ui/workbench-panel-navigation";

interface WireframeWorkbenchProps {
	organisms: WireframeWorkbenchOrganism[];
	screens: WireframeWorkbenchScreen[];
}

export function WireframeWorkbench({ organisms, screens }: WireframeWorkbenchProps) {
	const initializeWorkbench = useWorkbenchStore((state) => state.initializeWorkbench);

	useEffect(() => {
		initializeWorkbench({ organisms, screens });
	}, [initializeWorkbench, organisms, screens]);

	return (
		<main className="min-h-screen bg-muted/40">
			<div className="grid w-screen min-h-screen grid-cols-[320px_minmax(420px,1fr)_360px] gap-4 p-4">
				<WorkbenchPanelNavigation />
				<WorkbenchPanelCanvas />
				<WorkbenchPanelInspection />
			</div>
		</main>
	);
}
