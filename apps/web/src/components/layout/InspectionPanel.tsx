import type { RenderTreeNode } from "@cx/renderer";
import { Copy, GripVertical, Workflow } from "lucide-react";
import { useState, useTransition } from "react";
import { cloneArea } from "@/app/actions/screen-actions";
import { AgentRegistryInspection } from "@/components/agent/AgentRegistryInspection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import type { SelectedComponentContext, SelectedAreaContext } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";

export function InspectionPanel() {
	const component = useWorkbenchStore((state) => state.selectedComponent);
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const agentWarnings = useWorkbenchStore((state) => state.agentWarnings);
	const area = useWorkbenchStore((state) => state.selectedArea);
	const screen = useWorkbenchStore((state) => state.activeScreen);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);
	const validationErrors = useWorkbenchStore((state) => state.validationErrors);
	const validationLabel = useWorkbenchStore((state) => state.validationLabel);
	const validationStats = useWorkbenchStore((state) => state.validationStats);
	const validationSuccess = useWorkbenchStore((state) => state.validationSuccess);
	const validationWarnings = useWorkbenchStore((state) => state.validationWarnings);
	const reorderScreenAreas = useWorkbenchStore((state) => state.reorderScreenAreas);

	return (
		<Sidebar side="right">
			{activeTab === "agent" ? (
				<>
					<SidebarHeader className="border-b border-sidebar-border">
						<h2 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
							<Workflow data-icon="inline-start" />
							Agent
						</h2>
					</SidebarHeader>
					<SidebarContent className="p-3">
						<AgentRegistryInspection
							registry={agentRegistry}
							selectedAsset={selectedAgentAsset}
							warnings={agentWarnings}
						/>
					</SidebarContent>
				</>
			) : (
				<ResizablePanelGroup orientation="vertical" className="h-full">
					{/* ── A: 스크린 정보 ── */}
					<ResizablePanel defaultSize={50} minSize={15}>
						<div className="flex h-full flex-col overflow-hidden">
							<div className="border-b px-3 py-2">
								<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
									스크린 정보
								</span>
							</div>
							<div className="min-h-0 flex-1 overflow-y-auto p-3">
								{!screen ? (
									<p className="text-sm text-muted-foreground">스크린을 선택해주세요.</p>
								) : (
									<div className="flex flex-col gap-4">
										{component ? <ComponentInspection component={component} /> : null}
										{area ? <AreaInspection area={area} /> : null}
									</div>
								)}
							</div>
						</div>
					</ResizablePanel>

					<ResizableHandle />

					{/* ── B: 연결 Area + 검증 ── */}
					<ResizablePanel defaultSize={50} minSize={20}>
						<div className="flex h-full flex-col overflow-hidden">
							<div className="border-b px-3 py-2">
								<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
									검증 / Area
								</span>
							</div>
							<div className="min-h-0 flex-1 overflow-y-auto p-3">
								{screen ? (
									<div className="flex flex-col gap-4">
										<ConnectedAreaList
											onReorder={reorderScreenAreas}
											screenCode={screen.code}
											screenAreas={screen.areas}
										/>
										<Separator />
										<div className="flex flex-col gap-2">
											<h2 className="text-sm font-semibold">검증 상태</h2>
											<div className="flex flex-wrap gap-2">
												<Badge variant={validationSuccess ? "default" : "outline"}>
													{validationLabel}
												</Badge>
												{validationWarnings.length > 0 ? (
													<Badge variant="secondary">{validationWarnings.length} warnings</Badge>
												) : null}
											</div>
											{validationStats ? <ValidationStats stats={validationStats} /> : null}
											{validationWarnings.length > 0 ? (
												<div className="flex flex-col gap-2">
													{validationWarnings.map((warning) => (
														<div
															key={warning}
															className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
														>
															{warning}
														</div>
													))}
												</div>
											) : null}
											{validationSuccess ? null : (
												<div className="flex flex-col gap-2">
													{validationErrors.map((error) => (
														<div key={error} className="rounded-lg border bg-background p-3 text-sm">
															{error}
														</div>
													))}
												</div>
											)}
										</div>
									</div>
								) : null}
							</div>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Sidebar>
	);
}

function ValidationStats({
	stats,
}: {
	stats: {
		componentTypes: string[];
		fallbackTypes: string[];
		maxDepth: number;
		rendererKinds: string[];
		totalNodes: number;
	};
}) {
	return (
		<div className="grid grid-cols-2 gap-2">
			<InfoRow label="Nodes" value={String(stats.totalNodes)} />
			<InfoRow label="Depth" value={String(stats.maxDepth)} />
			<InfoRow label="Types" value={String(stats.componentTypes.length)} />
			<InfoRow label="Fallbacks" value={String(stats.fallbackTypes.length)} />
		</div>
	);
}

function ConnectedAreaList({
	onReorder,
	screenCode,
	screenAreas,
}: {
	onReorder: (screenCode: string, areaCodes: string[]) => void;
	screenCode: string;
	screenAreas: Array<{ order: number; areaCode: string }>;
}) {
	const [draggedAreaCode, setDraggedAreaCode] = useState("");
	const canReorder = screenAreas.length > 1;

	function handleDrop(targetAreaCode: string) {
		if (!draggedAreaCode || draggedAreaCode === targetAreaCode) {
			setDraggedAreaCode("");
			return;
		}

		const previousAreaCodes = screenAreas.map((area) => area.areaCode);
		const nextAreaCodes = moveItemBefore(previousAreaCodes, draggedAreaCode, targetAreaCode);

		onReorder(screenCode, nextAreaCodes);
		setDraggedAreaCode("");
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-sm font-semibold">연결 Area</h2>
				<Badge variant="outline">local order</Badge>
			</div>
			<ul className="flex flex-col gap-2">
				{screenAreas.map((screenArea) => (
					<li key={screenArea.areaCode}>
						<button
							aria-disabled={!canReorder}
							className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background p-3 text-left transition-colors data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5 data-[drop-target=true]:border-primary/70"
							data-dragging={draggedAreaCode === screenArea.areaCode}
							data-drop-target={Boolean(draggedAreaCode) && draggedAreaCode !== screenArea.areaCode}
							draggable={canReorder}
							onDragEnd={() => setDraggedAreaCode("")}
							onDragOver={(event) => { if (canReorder) event.preventDefault(); }}
							onDragStart={(event) => {
								if (!canReorder) return;
								event.dataTransfer.effectAllowed = "move";
								event.dataTransfer.setData("text/plain", screenArea.areaCode);
								setDraggedAreaCode(screenArea.areaCode);
							}}
							onDrop={(event) => { event.preventDefault(); handleDrop(screenArea.areaCode); }}
							type="button"
						>
							<div className="flex min-w-0 items-center gap-2">
								<GripVertical className="size-4 shrink-0 text-muted-foreground" />
								<div className="flex min-w-0 flex-col gap-1">
									<span className="truncate text-sm font-medium">{screenArea.areaCode}</span>
									<span className="text-xs text-muted-foreground">order {screenArea.order}</span>
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
	return [...withoutMovedItem.slice(0, targetIndex), movedItem, ...withoutMovedItem.slice(targetIndex)];
}

function ComponentInspection({ component }: { component: SelectedComponentContext }) {
	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">선택 Component</h2>
				<InfoRow label="Component id" value={component.code} />
				<InfoRow label="Type" value={component.node.type} />
				<InfoRow label="Source screen" value={component.screen.code} />
				<InfoRow label="Parent Area" value={component.area?.code ?? "screen"} />
			</div>
			<NodePropsPanel node={component.node} />
		</>
	);
}

function AreaInspection({ area }: { area: SelectedAreaContext }) {
	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">선택 Area</h2>
				<InfoRow label="Area code" value={area.code} />
				<InfoRow label="Source screen" value={area.screen.code} />
				<InfoRow label="Components" value={String(area.node.children?.length ?? 0)} />
			</div>
			<AreaActions areaCode={area.code} screenCode={area.screen.code} />
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">컴포넌트</h2>
				{area.node.children?.map((child, index) => (
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

function NodePropsPanel({ node }: { node: RenderTreeNode }) {
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

function AreaActions({ areaCode, screenCode }: { areaCode: string; screenCode: string }) {
	const [isPending, startTransition] = useTransition();
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [message, setMessage] = useState("");

	function handleClone() {
		startTransition(async () => {
			setStatus("idle");
			const result = await cloneArea(areaCode, screenCode);
			if (result.error) {
				setStatus("error");
				setMessage(result.error);
			} else {
				setStatus("success");
				setMessage(`복제 완료 → ${result.newAreaId}`);
			}
		});
	}

	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-background p-3">
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs font-semibold text-muted-foreground">OGN 작업</span>
				<Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleClone}>
					<Copy className="mr-1 size-3" />
					{isPending ? "복제 중..." : "복제"}
				</Button>
			</div>
			{status !== "idle" && (
				<p className={`text-xs ${status === "success" ? "text-green-600" : "text-destructive"}`}>
					{message}
				</p>
			)}
		</div>
	);
}

