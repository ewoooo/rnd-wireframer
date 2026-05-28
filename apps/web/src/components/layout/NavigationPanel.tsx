"use client";

import { Pencil, Plus, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createRoute, deleteRoute, updateRoute } from "@/app/actions/route-actions";
import { DeleteButton } from "@/components/common/DeleteButton";
import { AgentRegistryNavigation } from "@/components/agent/AgentRegistryNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import type { AppScreenRoute } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { ScreenVariantCard } from "../screen/ScreenVariantCard";

export function NavigationPanel() {
	const router = useRouter();
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const components = useWorkbenchStore((state) => state.components);
	const areas = useWorkbenchStore((state) => state.areas);
	const screenRoutes = useWorkbenchStore((state) => state.screenRoutes);
	const selectedAgentNode = useWorkbenchStore((state) => state.selectedAgentNode);
	const selectedComponentCode = useWorkbenchStore((state) => state.selectedComponentCode);
	const selectedAreaCode = useWorkbenchStore((state) => state.selectedAreaCode);
	const selectedScreen = useWorkbenchStore((state) => state.selectedScreen);
	const selectedScreenCode = useWorkbenchStore((state) => state.selectedScreenCode);
	const selectAgentNode = useWorkbenchStore((state) => state.selectAgentNode);
	const selectComponent = useWorkbenchStore((state) => state.selectComponent);
	const selectArea = useWorkbenchStore((state) => state.selectArea);
	const selectScreenRoute = useWorkbenchStore((state) => state.selectScreenRoute);
	const selectScreenVariant = useWorkbenchStore((state) => state.selectScreenVariant);

	const [activeRouteCode, setActiveRouteCode] = useState<string>(() => screenRoutes[0]?.code ?? "");
	const [isCreating, startCreating] = useTransition();

	// 캔버스 선택 → 루트 셀렉터 동기화
	useEffect(() => {
		if (selectedScreen?.screenRouteId) {
			setActiveRouteCode(selectedScreen.screenRouteId);
		}
	}, [selectedScreen?.screenRouteId]);

	// 초기 데이터 로드 후 세팅
	useEffect(() => {
		if (!activeRouteCode && screenRoutes.length > 0) {
			setActiveRouteCode(screenRoutes[0].code);
		}
	}, [screenRoutes, activeRouteCode]);

	const activeRoute =
		screenRoutes.find((r) => r.code === activeRouteCode) ?? screenRoutes[0];

	async function handleCreate() {
		startCreating(async () => {
			const result = await createRoute();
			if (result.id) {
				router.refresh();
				setActiveRouteCode(result.id);
			}
		});
	}

	return (
		<Sidebar side="left">
			{activeTab === "scn" ? (
				<ResizablePanelGroup orientation="vertical" className="h-full">
					{/* ── A: 루트 목록 ── */}
					<ResizablePanel defaultSize={35} minSize={15}>
						<div className="flex h-full flex-col overflow-hidden">
							{/* 헤더: 루트 개수 + 생성 버튼 */}
							<div className="flex shrink-0 items-center justify-between px-3 py-2">
								<span className="text-xs font-medium text-muted-foreground">
									{screenRoutes.length}개 루트
								</span>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									className="h-6 w-6 p-0"
									disabled={isCreating}
									onClick={handleCreate}
								>
									<Plus className="size-3.5" />
								</Button>
							</div>
							<Separator />
							<div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
								{screenRoutes.map((route) => (
									<RouteListItem
										key={route.code}
										isActive={route.code === activeRoute?.code}
										route={route}
										onSelect={() => {
											setActiveRouteCode(route.code);
											selectScreenRoute(route.code);
										}}
										onSaved={() => router.refresh()}
										onDeleted={() => {
											router.refresh();
											if (route.code === activeRouteCode) {
												const next = screenRoutes.find((r) => r.code !== route.code);
												if (next) setActiveRouteCode(next.code);
											}
										}}
									/>
								))}
							</div>
						</div>
					</ResizablePanel>

					<ResizableHandle withHandle />

					{/* ── B+C: 선택된 루트 상세 + 스크린 목록 ── */}
					<ResizablePanel defaultSize={65} minSize={20}>
						<div className="flex h-full flex-col overflow-hidden">
							{activeRoute && (
								<>
									<div className="shrink-0 px-3 py-3">
										<p className="truncate text-sm font-semibold leading-snug">
											{activeRoute.name}
										</p>
										<p className="mt-0.5 truncate text-xs text-muted-foreground">
											{activeRoute.code}
										</p>
										<div className="mt-2 flex items-center gap-2">
											<Badge variant="secondary">{activeRoute.module}</Badge>
											<span className="text-xs text-muted-foreground">
												{activeRoute.screenCount} screens
											</span>
										</div>
									</div>
									<Separator />
								</>
							)}
							<div className="min-h-0 flex-1 overflow-y-auto">
								{activeRoute?.screenVariants.map((variant) => (
									<ScreenVariantCard
										key={variant.id}
										onSelect={selectScreenVariant}
										screenVariant={variant}
										selectedScreenCode={selectedScreenCode}
									/>
								))}
							</div>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			) : (
				<SidebarContent className="p-2">
					{activeTab === "ogn" ? (
						<div className="flex flex-col gap-2">
							{areas.map((area) => (
								<button
									type="button"
									key={area.code}
									className={cn(
										"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
										area.code === selectedAreaCode && "border-primary bg-primary/5",
									)}
									onClick={() => selectArea(area.code)}
								>
									<div className="flex items-center justify-between gap-2">
										<p className="text-sm font-medium">{area.name}</p>
										<Badge variant="secondary">{area.usage}</Badge>
									</div>
									<p className="mt-1 text-xs text-muted-foreground">{area.code}</p>
									<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
										<span>{area.stateCount} states</span>
										<span>{area.componentCount} components</span>
									</div>
								</button>
							))}
						</div>
					) : null}
					{activeTab === "comp" ? (
						<div className="flex flex-col gap-2">
							{components.map((component) => (
								<button
									type="button"
									key={component.code}
									className={cn(
										"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
										component.code === selectedComponentCode && "border-primary bg-primary/5",
									)}
									onClick={() => selectComponent(component.code)}
								>
									<div className="flex items-center justify-between gap-2">
										<p className="truncate text-sm font-medium">{component.name}</p>
										<Badge variant="secondary">{component.type}</Badge>
									</div>
									<p className="mt-1 truncate text-xs text-muted-foreground">{component.code}</p>
									<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
										<span>{component.sourceScreenCode}</span>
										<span>{component.parentAreaCode ?? "screen"}</span>
									</div>
								</button>
							))}
						</div>
					) : null}
					{activeTab === "agent" ? (
						<AgentRegistryNavigation
							registry={agentRegistry}
							selectedNode={selectedAgentNode}
							onSelectNode={selectAgentNode}
						/>
					) : null}
				</SidebarContent>
			)}
		</Sidebar>
	);
}

interface RouteListItemProps {
	isActive: boolean;
	route: AppScreenRoute;
	onSelect: () => void;
	onSaved: () => void;
	onDeleted: () => void;
}

function RouteListItem({ isActive, route, onSelect, onSaved, onDeleted }: RouteListItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [nameValue, setNameValue] = useState(route.name);
	const [codeValue, setCodeValue] = useState(route.code);
	const [isSaving, startSaving] = useTransition();
	const nameInputRef = useRef<HTMLInputElement>(null);

	// 편집 모드 진입 시 포커스
	useEffect(() => {
		if (isEditing) {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
		}
	}, [isEditing]);

	// route 변경 시 편집 값 동기화
	useEffect(() => {
		if (!isEditing) {
			setNameValue(route.name);
			setCodeValue(route.code);
		}
	}, [route.name, route.code, isEditing]);

	function handleStartEdit(e: React.MouseEvent) {
		e.stopPropagation();
		setNameValue(route.name);
		setCodeValue(route.code);
		setIsEditing(true);
	}

	function handleCancel() {
		setNameValue(route.name);
		setCodeValue(route.code);
		setIsEditing(false);
	}

	function handleSave() {
		startSaving(async () => {
			const trimmedName = nameValue.trim();
			const trimmedCode = codeValue.trim();
			if (!trimmedName && !trimmedCode) {
				handleCancel();
				return;
			}
			const result = await updateRoute(route.code, {
				name: trimmedName || undefined,
				code: trimmedCode || undefined,
			});
			if (!result.error) {
				setIsEditing(false);
				onSaved();
			}
		});
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter") handleSave();
		if (e.key === "Escape") handleCancel();
	}

	if (isEditing) {
		return (
			<div
				className={cn(
					"rounded-md border px-3 py-2",
					isActive ? "border-primary bg-primary/5" : "border-border bg-background",
				)}
			>
				<input
					ref={nameInputRef}
					type="text"
					value={nameValue}
					onChange={(e) => setNameValue(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={isSaving}
					placeholder="루트명"
					className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/50"
				/>
				<input
					type="text"
					value={codeValue}
					onChange={(e) => setCodeValue(e.target.value)}
					onKeyDown={handleKeyDown}
					disabled={isSaving}
					placeholder="루트 코드"
					className="mt-0.5 w-full bg-transparent text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/50"
				/>
				<div className="mt-2 flex items-center gap-1">
					<Button
						type="button"
						size="sm"
						variant="default"
						className="h-6 px-2 text-xs"
						disabled={isSaving}
						onClick={handleSave}
					>
						<Check className="mr-1 size-3" />
						{isSaving ? "저장 중…" : "저장"}
					</Button>
					<Button
						type="button"
						size="sm"
						variant="ghost"
						className="h-6 px-2 text-xs"
						disabled={isSaving}
						onClick={handleCancel}
					>
						<X className="mr-1 size-3" />
						취소
					</Button>
					<div className="flex-1" />
					<DeleteButton
						size="xs"
						description={
							route.screenCount > 0
								? `이 루트에 연결된 ${route.screenCount}개 스크린이 삭제됩니다.`
								: "이 루트를 삭제합니다."
						}
						onConfirm={async () => {
							await deleteRoute(route.code);
							onDeleted();
						}}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="group relative">
			<button
				type="button"
				className={cn(
					"flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
					isActive && "bg-primary/10 text-primary",
				)}
				onClick={onSelect}
			>
				<span className={cn("truncate text-sm", isActive ? "font-semibold" : "font-normal")}>
					{route.name}
				</span>
				<span className="shrink-0 text-xs text-muted-foreground">{route.screenCount}</span>
			</button>
			{/* 편집 버튼: hover 시 표시 */}
			<button
				type="button"
				className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
				onClick={handleStartEdit}
				title="편집"
			>
				<Pencil className="size-3 text-muted-foreground" />
			</button>
		</div>
	);
}
