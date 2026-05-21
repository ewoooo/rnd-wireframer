import { Layers3, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WireframeWorkbenchScreen } from "@/features/wireframe-renderer/generate-render-tree";
import type { SelectedComponentContext, SelectedOrganismContext } from "../model/workbench-store";
import { useWorkbenchStore } from "../model/workbench-store";
import {
	WireframeNodeRenderer,
	WireframeScreenRenderer,
} from "../renderer/wireframe-screen-renderer";

export function WorkbenchPanelCanvas() {
	const isComponentView = useWorkbenchStore((state) => state.isComponentView);
	const isOrganismView = useWorkbenchStore((state) => state.isOrganismView);
	const screenNode = useWorkbenchStore((state) => state.screenNode);
	const selectedComponent = useWorkbenchStore((state) => state.selectedComponent);
	const selectedOrganism = useWorkbenchStore((state) => state.selectedOrganism);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);

	return (
		<section className="flex min-h-0 flex-col gap-4">
			<Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base">
						<Smartphone data-icon="inline-start" />
						{getCanvasTitle({
							isComponentView,
							isOrganismView,
							selectedComponent,
							selectedOrganism,
						})}
					</CardTitle>
					<CardDescription>
						{getCanvasDescription({
							isComponentView,
							isOrganismView,
							selectedComponent,
							selectedOrganism,
							selectedScreen,
						})}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 items-center justify-center bg-secondary/50 p-6">
					<div className="flex h-211 w-98 max-w-full overflow-hidden rounded-[28px] border bg-background shadow-2xl">
						{isComponentView && selectedComponent ? (
							<div className="size-full overflow-y-auto bg-background p-7">
								<WireframeNodeRenderer
									data={selectedComponent.screen.schema.data}
									node={selectedComponent.node}
								/>
							</div>
						) : isOrganismView && selectedOrganism ? (
							<div className="size-full overflow-y-auto bg-background p-7">
								<WireframeNodeRenderer
									data={selectedOrganism.screen.schema.data}
									node={selectedOrganism.node}
								/>
							</div>
						) : screenNode && selectedScreen ? (
							<WireframeScreenRenderer data={selectedScreen.schema.data} node={screenNode} />
						) : (
							<EmptyCanvas />
						)}
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

function getCanvasTitle({
	isComponentView,
	isOrganismView,
	selectedComponent,
	selectedOrganism,
}: {
	isComponentView: boolean;
	isOrganismView: boolean;
	selectedComponent?: SelectedComponentContext;
	selectedOrganism?: SelectedOrganismContext;
}) {
	if (isComponentView) return selectedComponent?.node.metadata.title;
	if (isOrganismView) return selectedOrganism?.node.metadata.title;
	return null;
}

function getCanvasDescription({
	isComponentView,
	isOrganismView,
	selectedComponent,
	selectedOrganism,
	selectedScreen,
}: {
	isComponentView: boolean;
	isOrganismView: boolean;
	selectedComponent?: SelectedComponentContext;
	selectedOrganism?: SelectedOrganismContext;
	selectedScreen?: WireframeWorkbenchScreen;
}) {
	if (isComponentView && selectedComponent) {
		return `${selectedComponent.code} · ${selectedComponent.node.type} · from ${selectedComponent.screen.code}`;
	}
	if (isOrganismView && selectedOrganism) {
		return `${selectedOrganism.code} · from ${selectedOrganism.screen.code}`;
	}
	return selectedScreen?.description;
}

function EmptyCanvas() {
	return (
		<div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
			<Layers3 data-icon="inline-start" />
			<p className="text-sm text-muted-foreground">렌더링할 Screen 노드가 없습니다.</p>
			<Button variant="outline" size="sm">
				검증 결과 보기
			</Button>
		</div>
	);
}
