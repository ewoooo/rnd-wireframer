import type { RenderTreeNode } from "@cx/renderer";
import { Copy, GripVertical, Save, Trash2, Workflow } from "lucide-react";
import { useState, useTransition } from "react";
import { cloneScreen, deleteScreen, updateScreenAreaOrder, updateScreenTitle } from "@/app/actions/screen-actions";
import { AgentRegistryInspection } from "@/components/agent/AgentRegistryInspection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import {
	getWorkbenchAreaSelection,
	getWorkbenchComponentSelection,
	getWorkbenchValidationStatus,
	type WorkbenchRenderSelection,
} from "@/data/local-workbench-data-loader";
import { useWorkbenchStore } from "@/model/store";

export function InspectionPanel() {
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const agentWarnings = useWorkbenchStore((state) => state.agentWarnings);
	const areaOrderOverrides = useWorkbenchStore((state) => state.areaOrderOverrides);
	const screen = useWorkbenchStore((state) => state.activeScreen);
	const selectedAreaCode = useWorkbenchStore((state) => state.selectedAreaCode);
	const selectedAgentAsset = useWorkbenchStore((state) => state.selectedAgentAsset);
	const selectedComponentCode = useWorkbenchStore((state) => state.selectedComponentCode);
	const reorderScreenAreas = useWorkbenchStore((state) => state.reorderScreenAreas);
	const component =
		activeTab === "comp"
			? getWorkbenchComponentSelection(selectedComponentCode, areaOrderOverrides)
			: undefined;
	const area =
		activeTab === "ogn"
			? getWorkbenchAreaSelection(selectedAreaCode, areaOrderOverrides)
			: undefined;
	const validation = screen ? getWorkbenchValidationStatus(screen.code) : undefined;

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
				<SidebarHeader className="border-b border-sidebar-border">
					<h2 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
						<Workflow data-icon="inline-start" />
						Information
					</h2>
				</SidebarHeader>
				<SidebarContent className="p-3">
					<p className="text-sm text-muted-foreground">화면을 선택하세요</p>
				</SidebarContent>
			</Sidebar>
		);
	}

	const currentAreaCodes =
		areaOrderOverrides[screen.code] ?? screen.areas.map((a) => a.areaCode);

	return (
		<Sidebar side="right">
			<SidebarHeader className="border-b border-sidebar-border">
				<h2 className="flex items-center gap-2 text-base font-semibold leading-none tracking-normal">
					<Workflow data-icon="inline-start" />
					Information
				</h2>
			</SidebarHeader>
			<SidebarContent className="overflow-hidden">
				<ScrollArea className="h-[calc(100vh-88px)]">
					<div className="flex min-w-0 flex-col gap-4 p-3">
						<ScreenActions
							screenCode={screen.code}
							screenName={screen.name}
							screenVariantId={screen.screenVariantId}
							areaCodes={currentAreaCodes}
						/>
						<div className="flex min-w-0 flex-col gap-2">
							<InfoRow label="Screen code" value={screen.code} />
							<InfoRow
								label="Route"
								value={`${screen.screenRouteName} (${screen.screenRouteId})`}
							/>
							<InfoRow
								label="Variant"
								value={`${screen.screenVariantName} (${screen.screenVariantId})`}
							/>
							<InfoRow label="Variant type" value={screen.screenVariantType} />
							<InfoRow label="Module" value={screen.module} />
						</div>
						{component ? <ComponentInspection component={component} screenCode={screen.code} /> : null}
						{area ? <AreaInspection area={area} /> : null}
						<Separator />
						<ConnectedAreaList
							onReorder={reorderScreenAreas}
							screenCode={screen.code}
							screenAreas={screen.areas}
						/>
						<Separator />
						<div className="flex flex-col gap-2">
							<h2 className="text-sm font-semibold">검증 상태</h2>
							<div className="flex flex-wrap gap-2">
								<Badge variant={validation?.success ? "default" : "outline"}>
									{validation?.label ?? "screen source not selected"}
								</Badge>
								{validation && validation.warnings.length > 0 ? (
									<Badge variant="secondary">{validation.warnings.length} warnings</Badge>
								) : null}
							</div>
							{validation?.stats ? <ValidationStats stats={validation.stats} /> : null}
							{validation && validation.warnings.length > 0 ? (
								<div className="flex flex-col gap-2">
									{validation.warnings.map((warning) => (
										<div
											key={warning}
											className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
										>
											{warning}
										</div>
									))}
								</div>
							) : null}
							{validation?.success ? null : (
								<div className="flex flex-col gap-2">
									{validation?.errors.map((error) => (
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

function ScreenActions({
	screenCode,
	screenName,
	areaCodes,
}: {
	screenCode: string;
	screenName: string;
	screenVariantId: string;
	areaCodes: string[];
}) {
	const [isPending, startTransition] = useTransition();
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [message, setMessage] = useState("");
	const [editingTitle, setEditingTitle] = useState(false);
	const [title, setTitle] = useState(screenName);
	const [confirmDelete, setConfirmDelete] = useState(false);

	function handleSave() {
		startTransition(async () => {
			setStatus("idle");
			const result = await updateScreenAreaOrder(screenCode, areaCodes);
			if (result.error) {
				setStatus("error");
				setMessage(result.error);
			} else {
				setStatus("success");
				setMessage("저장 완료");
			}
		});
	}

	function handleClone() {
		startTransition(async () => {
			setStatus("idle");
			const result = await cloneScreen(screenCode);
			if (result.error) {
				setStatus("error");
				setMessage(result.error);
			} else {
				setStatus("success");
				setMessage(`복제 완료 → ${result.newScreenId}`);
			}
		});
	}

	function handleSaveTitle() {
		startTransition(async () => {
			setStatus("idle");
			const result = await updateScreenTitle(screenCode, title);
			if (result.error) {
				setStatus("error");
				setMessage(result.error);
			} else {
				setStatus("success");
				setMessage("저장 완료");
				setEditingTitle(false);
			}
		});
	}

	function handleDelete() {
		startTransition(async () => {
			setStatus("idle");
			const result = await deleteScreen(screenCode);
			if (result.error) {
				setStatus("error");
				setMessage(result.error);
			} else {
				setStatus("success");
				setMessage("삭제 완료");
			}
			setConfirmDelete(false);
		});
	}

	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-background p-3">
			<div className="flex items-center justify-between gap-2">
				<span className="text-xs font-semibold text-muted-foreground">화면 작업</span>
				<div className="flex gap-1">
					<Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleSave}>
						<Save className="mr-1 size-3" />
						{isPending ? "저장 중..." : "저장"}
					</Button>
					<Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleClone}>
						<Copy className="mr-1 size-3" />
						{isPending ? "복제 중..." : "복제"}
					</Button>
					{confirmDelete ? (
						<>
							<Button type="button" size="sm" variant="destructive" disabled={isPending} onClick={handleDelete}>
								{isPending ? "삭제 중..." : "확인"}
							</Button>
							<Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
								취소
							</Button>
						</>
					) : (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							className="text-destructive hover:text-destructive"
							disabled={isPending}
							onClick={() => setConfirmDelete(true)}
						>
							<Trash2 className="mr-1 size-3" />
							삭제
						</Button>
					)}
				</div>
			</div>
			{editingTitle ? (
				<div className="flex gap-2">
					<input
						className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
					/>
					<Button type="button" size="sm" disabled={isPending} onClick={handleSaveTitle}>
						{isPending ? "저장 중..." : "저장"}
					</Button>
					<Button type="button" size="sm" variant="ghost" onClick={() => setEditingTitle(false)}>
						취소
					</Button>
				</div>
			) : (
				<button
					type="button"
					className="text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
					onClick={() => { setTitle(screenName); setEditingTitle(true); }}
				>
					제목 편집
				</button>
			)}
			{confirmDelete && (
				<p className="text-xs text-destructive">이 화면을 삭제할까요? 되돌릴 수 없습니다.</p>
			)}
			{status !== "idle" && (
				<p className={`text-xs ${status === "success" ? "text-green-600" : "text-destructive"}`}>
					{message}
				</p>
			)}
		</div>
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
			<ul className="flex flex-col gap-2">
				{screenAreas.map((screenArea) => (
					<li className="min-w-0" key={screenArea.areaCode}>
						<button
							aria-disabled={!canReorder}
							className="flex w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border bg-background p-3 text-left transition-colors data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/5 data-[drop-target=true]:border-primary/70"
							data-dragging={draggedAreaCode === screenArea.areaCode}
							data-drop-target={Boolean(draggedAreaCode) && draggedAreaCode !== screenArea.areaCode}
							draggable={canReorder}
							onDragEnd={() => setDraggedAreaCode("")}
							onDragOver={(event) => {
								if (canReorder) event.preventDefault();
							}}
							onDragStart={(event) => {
								if (!canReorder) return;
								event.dataTransfer.effectAllowed = "move";
								event.dataTransfer.setData("text/plain", screenArea.areaCode);
								setDraggedAreaCode(screenArea.areaCode);
							}}
							onDrop={(event) => {
								event.preventDefault();
								handleDrop(screenArea.areaCode);
							}}
							type="button"
						>
							<div className="flex min-w-0 items-center gap-2">
								<GripVertical className="size-4 shrink-0 text-muted-foreground" />
								<div className="flex min-w-0 font-mono gap-1">
									<span className="truncate text-sm font-medium">{screenArea.areaCode}</span>
									<span className="text-xs text-muted-foreground"> {screenArea.order}</span>
								</div>
							</div>
							<Badge className="shrink-0" variant="outline">
								section
							</Badge>
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

function ComponentInspection({
	component,
	screenCode,
}: {
	component: WorkbenchRenderSelection & { parentAreaCode?: string };
	screenCode?: string;
}) {
	return (
		<>
			<Separator />
			<div className="flex flex-col gap-2">
				<InfoRow label="Component id" value={component.code} />
				<InfoRow label="Type" value={component.node.type} />
				<InfoRow label="Source screen" value={screenCode ?? component.screenCode} />
				<InfoRow label="Parent area" value={component.parentAreaCode ?? "screen"} />
			</div>
			<NodePropsPanel node={component.node} />
		</>
	);
}

function AreaInspection({ area }: { area: WorkbenchRenderSelection }) {
	return (
		<>
			<Separator />
			<div className="flex min-w-0 flex-col gap-2">
				<InfoRow label="Area id" value={area.code} />
				<InfoRow label="Type" value={area.node.type} />
				<InfoRow label="Source screen" value={area.screenCode} />
			</div>
			<NodePropsPanel node={area.node} />
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
		<div className="flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-lg border bg-background p-3">
			<span className="shrink-0 text-xs text-muted-foreground">{label}</span>
			<span className="min-w-0 truncate text-right text-sm font-medium">{value}</span>
		</div>
	);
}
