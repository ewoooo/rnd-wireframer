import type { WireframeNode } from "@cx/renderer";
import { GripVertical, Workflow } from "lucide-react";
import { useState } from "react";
import { AgentRegistryInspection } from "@/components/agent/AgentRegistryInspection";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import type { SelectedCompositeContext, SelectedOrganismContext } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";

export function InspectionPanel() {
	const composite = useWorkbenchStore((state) => state.selectedComposite);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const agentWarnings = useWorkbenchStore((state) => state.agentWarnings);
	const organism = useWorkbenchStore((state) => state.selectedOrganism);
	const screen = useWorkbenchStore((state) => state.activeScreen);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);
	const validationErrors = useWorkbenchStore((state) => state.validationErrors);
	const validationLabel = useWorkbenchStore((state) => state.validationLabel);
	const validationSuccess = useWorkbenchStore((state) => state.validationSuccess);
	const reorderScreenOrganisms = useWorkbenchStore((state) => state.reorderScreenOrganisms);

	if (activeTab === "agent") {
		return (
			<Sidebar side="right">
				<SidebarHeader className="border-b border-sidebar-border">
					<h2 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
						<Workflow data-icon="inline-start" />
						Agent
					</h2>
				</SidebarHeader>
				<SidebarContent>
					<ScrollArea className="h-[calc(100vh-88px)]">
						<AgentRegistryInspection
							registry={agentRegistry}
							selectedAsset={selectedAgentAsset}
							warnings={agentWarnings}
						/>
					</ScrollArea>
				</SidebarContent>
			</Sidebar>
		);
	}

	if (!screen) {
		return (
			<Sidebar side="right">
				<SidebarHeader>
					<h2 className="text-base font-semibold leading-none tracking-normal">관련 정보</h2>
				</SidebarHeader>
			</Sidebar>
		);
	}

	return (
		<Sidebar side="right">
			<SidebarHeader className="border-b border-sidebar-border">
				<h2 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
					<Workflow data-icon="inline-start" />
					Information
				</h2>
			</SidebarHeader>
			<SidebarContent>
				<ScrollArea className="h-[calc(100vh-88px)]">
					<div className="flex flex-col gap-4 pr-3">
						<div className="flex flex-col gap-2">
							<InfoRow label="Screen code" value={screen.code} />
							<InfoRow
								label="Route"
								value={`${screen.screenRouteName} (${screen.screenRouteCode})`}
							/>
							<InfoRow
								label="Variant"
								value={`${screen.screenVariantName} (${screen.screenVariantId})`}
							/>
							<InfoRow label="Variant type" value={screen.screenVariantType} />
							<InfoRow label="Module" value={screen.module} />
						</div>
						{composite ? <CompositeInspection composite={composite} /> : null}
						{organism ? <OrganismInspection organism={organism} /> : null}
						<Separator />
						<ConnectedOrganismList
							onReorder={reorderScreenOrganisms}
							screenCode={screen.code}
							screenOrganisms={screen.organisms}
						/>
						<Separator />
						<div className="flex flex-col gap-2">
							<h2 className="text-sm font-semibold">검증 상태</h2>
							{validationSuccess ? (
								<Badge>{validationLabel}</Badge>
							) : (
								<div className="flex flex-col gap-2">
									<Badge variant="outline">{validationLabel}</Badge>
									{validationErrors.map((error) => (
										<div key={error} className="rounded-lg border bg-background p-3 text-sm">
											{error}
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</ScrollArea>
			</SidebarContent>
		</Sidebar>
	);
}

function ConnectedOrganismList({
	onReorder,
	screenCode,
	screenOrganisms,
}: {
	onReorder: (screenCode: string, organismCodes: string[]) => void;
	screenCode: string;
	screenOrganisms: Array<{ order: number; organismCode: string }>;
}) {
	const [draggedOrganismCode, setDraggedOrganismCode] = useState("");
	const canReorder = screenOrganisms.length > 1;

	function handleDrop(targetOrganismCode: string) {
		if (!draggedOrganismCode || draggedOrganismCode === targetOrganismCode) {
			setDraggedOrganismCode("");
			return;
		}

		const previousOrganismCodes = screenOrganisms.map((organism) => organism.organismCode);
		const nextOrganismCodes = moveItemBefore(
			previousOrganismCodes,
			draggedOrganismCode,
			targetOrganismCode,
		);

		onReorder(screenCode, nextOrganismCodes);
		setDraggedOrganismCode("");
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-sm font-semibold">연결 OGN</h2>
				<Badge variant="outline">local order</Badge>
			</div>
			<ul className="flex flex-col gap-2">
				{screenOrganisms.map((screenOrganism) => (
					<li key={screenOrganism.organismCode}>
						<button
							aria-disabled={!canReorder}
							className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background p-3 text-left transition-colors data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5 data-[drop-target=true]:border-primary/70"
							data-dragging={draggedOrganismCode === screenOrganism.organismCode}
							data-drop-target={
								Boolean(draggedOrganismCode) && draggedOrganismCode !== screenOrganism.organismCode
							}
							draggable={canReorder}
							onDragEnd={() => setDraggedOrganismCode("")}
							onDragOver={(event) => {
								if (canReorder) event.preventDefault();
							}}
							onDragStart={(event) => {
								if (!canReorder) return;
								event.dataTransfer.effectAllowed = "move";
								event.dataTransfer.setData("text/plain", screenOrganism.organismCode);
								setDraggedOrganismCode(screenOrganism.organismCode);
							}}
							onDrop={(event) => {
								event.preventDefault();
								handleDrop(screenOrganism.organismCode);
							}}
							type="button"
						>
							<div className="flex min-w-0 items-center gap-2">
								<GripVertical className="size-4 shrink-0 text-muted-foreground" />
								<div className="flex min-w-0 flex-col gap-1">
									<span className="truncate text-sm font-medium">
										{screenOrganism.organismCode}
									</span>
									<span className="text-xs text-muted-foreground">
										order {screenOrganism.order}
									</span>
								</div>
							</div>
							<Badge variant="outline">section</Badge>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

function moveItemBefore(items: string[], movedItem: string, targetItem: string) {
	const withoutMovedItem = items.filter((item) => item !== movedItem);
	const targetIndex = withoutMovedItem.indexOf(targetItem);

	if (targetIndex < 0) return items;

	return [
		...withoutMovedItem.slice(0, targetIndex),
		movedItem,
		...withoutMovedItem.slice(targetIndex),
	];
}

function CompositeInspection({ composite }: { composite: SelectedCompositeContext }) {
	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">선택 COMP</h2>
				<InfoRow label="Composite id" value={composite.code} />
				<InfoRow label="Type" value={composite.node.type} />
				<InfoRow label="Source screen" value={composite.screen.code} />
				<InfoRow label="Parent OGN" value={composite.organism?.code ?? "screen"} />
			</div>
			<NodePropsPanel node={composite.node} />
		</>
	);
}

function OrganismInspection({ organism }: { organism: SelectedOrganismContext }) {
	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">선택 OGN</h2>
				<InfoRow label="OGN code" value={organism.code} />
				<InfoRow label="Source screen" value={organism.screen.code} />
				<InfoRow label="Composites" value={String(organism.node.children?.length ?? 0)} />
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">컴포넌트</h2>
				{organism.node.children?.map((child, index) => (
					<div
						key={child.metadata.id}
						className="flex items-center justify-between rounded-lg border bg-background p-3"
					>
						<div className="flex min-w-0 flex-col gap-1">
							<span className="truncate text-sm font-medium">{child.metadata.title}</span>
							<span className="text-xs text-muted-foreground">{child.metadata.id}</span>
						</div>
						<Badge variant="outline">{index + 1}</Badge>
					</div>
				))}
			</div>
		</>
	);
}

function NodePropsPanel({ node }: { node: WireframeNode }) {
	const props = node.props ? JSON.stringify(node.props, null, 2) : "{}";

	return (
		<div className="flex flex-col gap-2">
			<h2 className="text-sm font-semibold">Props</h2>
			<pre className="max-h-64 overflow-auto rounded-lg border bg-background p-3 text-xs leading-5">
				{props}
			</pre>
		</div>
	);
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="truncate text-sm font-medium">{value}</span>
		</div>
	);
}
