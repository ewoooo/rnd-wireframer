"use client";

import { Copy, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createModule, deleteModule, duplicateModule, updateModule } from "@/app/actions/module-actions";
import { createRoute, deleteRoute, duplicateRoute, updateRoute } from "@/app/actions/route-actions";
import { AgentRegistryNavigation } from "@/components/agent/AgentRegistryNavigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import type { AppScreenModule, AppScreenRoute } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import { ScreenVariantCard } from "../screen/ScreenVariantCard";

export function NavigationPanel() {
	const router = useRouter();
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const components = useWorkbenchStore((state) => state.components);
	const areas = useWorkbenchStore((state) => state.areas);
	const screenModules = useWorkbenchStore((state) => state.screenModules);
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
	// 방금 생성된 도메인 ID → 해당 DomainGroup이 자동으로 편집 모드 진입
	const [pendingEditModuleId, setPendingEditModuleId] = useState<string | null>(null);
	const [isCreatingModule, startCreatingModule] = useTransition();

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

	function handleCreateModule() {
		startCreatingModule(async () => {
			const result = await createModule();
			if (result.id) {
				router.refresh();
				setPendingEditModuleId(result.id);
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
							{/* 헤더 */}
							<div className="border-b px-3 py-2">
								<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
									{screenModules.length}개 도메인
								</span>
							</div>

							<div className="min-h-0 flex-1 overflow-y-auto py-1">
								{screenModules.map((mod) => {
									const modRoutes = screenRoutes.filter((r) => r.moduleId === mod.id);
									return (
										<DomainGroup
											key={mod.id}
											module={mod}
											routes={modRoutes}
											activeRouteCode={activeRoute?.code}
											isAutoEditing={pendingEditModuleId === mod.id}
											onAutoEditDone={() => setPendingEditModuleId(null)}
											onSelectRoute={(code) => {
												setActiveRouteCode(code);
												selectScreenRoute(code);
											}}
											onRouteCreated={(id) => {
												router.refresh();
												setActiveRouteCode(id);
											}}
											onRouteSaved={() => router.refresh()}
											onRouteDeleted={(routeCode) => {
												router.refresh();
												if (routeCode === activeRouteCode) {
													const next = screenRoutes.find((r) => r.code !== routeCode);
													if (next) setActiveRouteCode(next.code);
												}
											}}
											onModuleSaved={() => router.refresh()}
										onModuleDeleted={() => router.refresh()}
										/>
									);
								})}

								{/* 도메인 추가 버튼 — 목록 맨 아래 */}
								<div className="px-3 py-1.5">
								<button
									type="button"
									className="flex w-full items-center gap-1 rounded-md px-3 py-1.5 hover:ring-1 hover:ring-border disabled:opacity-40"
									disabled={isCreatingModule}
									onClick={handleCreateModule}
								>
									<Plus className="size-3 text-muted-foreground/60" />
									<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
										도메인 추가
									</span>
								</button>
							</div>
						</div>
					</div>
					</ResizablePanel>

					<ResizableHandle />

					{/* ── B: 선택된 루트의 스크린 배리언트 목록 ── */}
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

// ─────────────────────────────────────────────
// DomainGroup
// ─────────────────────────────────────────────

interface DomainGroupProps {
	module: AppScreenModule;
	routes: AppScreenRoute[];
	activeRouteCode: string | undefined;
	isAutoEditing: boolean;
	onAutoEditDone: () => void;
	onSelectRoute: (code: string) => void;
	onRouteCreated: (id: string) => void;
	onRouteSaved: () => void;
	onRouteDeleted: (routeCode: string) => void;
	onModuleSaved: () => void;
	onModuleDeleted: () => void;
}

function DomainGroup({
	module,
	routes,
	activeRouteCode,
	isAutoEditing,
	onAutoEditDone,
	onSelectRoute,
	onRouteCreated,
	onRouteSaved,
	onRouteDeleted,
	onModuleSaved,
	onModuleDeleted,
}: DomainGroupProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [nameValue, setNameValue] = useState(module.name);
	const [isSaving, startSaving] = useTransition();
	const [isDuplicating, startDuplicating] = useTransition();
	const [isAddingRoute, startAddingRoute] = useTransition();
	const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
	const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// 도메인 추가 후 자동 편집 모드 진입
	useEffect(() => {
		if (isAutoEditing && !isEditing) {
			setNameValue(module.name);
			setIsEditing(true);
			onAutoEditDone();
		}
	}, [isAutoEditing, isEditing, module.name, onAutoEditDone]);

	// module.name 변경 시 동기화
	useEffect(() => {
		if (!isEditing) setNameValue(module.name);
	}, [module.name, isEditing]);

	useEffect(() => {
		if (isEditing) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
	}, [isEditing]);

	function handleSave() {
		const trimmed = nameValue.trim();
		if (!trimmed || trimmed === module.name) {
			setIsEditing(false);
			return;
		}
		startSaving(async () => {
			await updateModule(module.id, { name: trimmed });
			setIsEditing(false);
			onModuleSaved();
		});
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") handleSave();
		if (e.key === "Escape") {
			setNameValue(module.name);
			setIsEditing(false);
		}
	}

	function handleAddRoute() {
		startAddingRoute(async () => {
			const result = await createRoute({ moduleId: module.id });
			if (result.id) onRouteCreated(result.id);
		});
	}

	function handleDuplicate(e: React.MouseEvent) {
		e.stopPropagation();
		startDuplicating(async () => {
			await duplicateModule(module.id);
			onModuleSaved();
		});
	}

	function handleDeleteClick(e: React.MouseEvent) {
		e.stopPropagation();
		if (isDeleteConfirming) {
			if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
			setIsDeleteConfirming(false);
			deleteModule(module.id).then(onModuleDeleted);
		} else {
			setIsDeleteConfirming(true);
			deleteTimerRef.current = setTimeout(() => setIsDeleteConfirming(false), 2000);
		}
	}

	return (
		<div className="px-3 py-1.5">
			<div className="overflow-hidden rounded-md border border-border">
				{/* 도메인 레이블 행 */}
				<div className="group flex items-center gap-1 border-b border-border px-3 py-1.5">
					{isEditing ? (
						<input
							ref={inputRef}
							type="text"
							value={nameValue}
							onChange={(e) => setNameValue(e.target.value)}
							onKeyDown={handleKeyDown}
							onBlur={handleSave}
							disabled={isSaving}
							className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold uppercase tracking-wider text-foreground outline-none"
						/>
					) : (
						<>
							{/* 이름 + 수정 버튼 (왼쪽 그룹) */}
							<div className="flex min-w-0 flex-1 items-center gap-1">
								<span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
									{module.name}
								</span>
								<button
									type="button"
									className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
									onClick={() => { setNameValue(module.name); setIsEditing(true); }}
									title="도메인 이름 편집"
								>
									<Pencil className="size-3 text-muted-foreground" />
								</button>
							</div>
							{/* 복제 버튼 */}
							<button
								type="button"
								className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100 disabled:opacity-20"
								disabled={isDuplicating}
								onClick={handleDuplicate}
								title="도메인 복제"
							>
								<Copy className="size-3 text-muted-foreground" />
							</button>
							{/* 삭제 버튼 */}
							<button
								type="button"
								className={cn(
									"shrink-0 rounded p-0.5 transition-all hover:bg-black/5",
									isDeleteConfirming
										? "opacity-100 text-destructive"
										: "opacity-0 group-hover:opacity-100",
								)}
								onClick={handleDeleteClick}
								title={isDeleteConfirming ? "한 번 더 클릭하면 삭제됩니다" : "도메인 삭제"}
							>
								<Trash2 className="size-3 text-current" />
							</button>
						</>
					)}
				</div>

				{/* 루트 목록 + 루트 추가 버튼 */}
				{routes.map((route) => (
					<RouteListItem
						key={route.code}
						isActive={route.code === activeRouteCode}
						route={route}
						onSelect={() => onSelectRoute(route.code)}
						onSaved={onRouteSaved}
						onDeleted={() => onRouteDeleted(route.code)}
					/>
				))}
				<button
					type="button"
					className="flex items-center gap-1 px-3 py-1.5 disabled:opacity-40"
					disabled={isAddingRoute}
					onClick={handleAddRoute}
				>
					<Plus className="size-3 text-muted-foreground/60" />
					<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
						루트 추가
					</span>
				</button>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// RouteListItem
// ─────────────────────────────────────────────

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
	const [isDuplicating, startDuplicating] = useTransition();
	const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);
	const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const nameInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isEditing) {
			nameInputRef.current?.focus();
			nameInputRef.current?.select();
		}
	}, [isEditing]);

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

	function handleDuplicate(e: React.MouseEvent) {
		e.stopPropagation();
		startDuplicating(async () => {
			await duplicateRoute(route.code);
			onSaved();
		});
	}

	function handleDeleteClick(e: React.MouseEvent) {
		e.stopPropagation();
		if (isDeleteConfirming) {
			if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
			setIsDeleteConfirming(false);
			deleteRoute(route.code).then(onDeleted);
		} else {
			setIsDeleteConfirming(true);
			deleteTimerRef.current = setTimeout(() => setIsDeleteConfirming(false), 2000);
		}
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter") handleSave();
		if (e.key === "Escape") handleCancel();
	}

	if (isEditing) {
		return (
			<div
				className={cn(
					"mx-2 rounded-md border px-3 py-2",
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
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"group flex items-center gap-1 px-3 py-2 transition-colors hover:bg-accent",
				isActive && "bg-primary/10 text-primary",
			)}
		>
			{/* 이름 영역 (클릭 = 선택) + 수정 버튼 이름 바로 옆 */}
			<div
				role="button"
				tabIndex={0}
				className="flex min-w-0 flex-1 cursor-pointer items-center gap-1"
				onClick={onSelect}
				onKeyDown={(e) => e.key === "Enter" && onSelect()}
			>
				<span className={cn("truncate text-sm", isActive ? "font-semibold" : "font-normal")}>
					{route.name}
				</span>
				<button
					type="button"
					className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100"
					onClick={handleStartEdit}
					title="이름 편집"
				>
					<Pencil className="size-3 text-muted-foreground" />
				</button>
			</div>

			{/* 오른쪽: 복제 + 삭제 + 스크린 수 */}
			<button
				type="button"
				className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-black/5 group-hover:opacity-100 disabled:opacity-20"
				disabled={isDuplicating}
				onClick={handleDuplicate}
				title="루트 복제"
			>
				<Copy className="size-3 text-muted-foreground" />
			</button>
			<button
				type="button"
				className={cn(
					"shrink-0 rounded p-0.5 transition-all hover:bg-black/5",
					isDeleteConfirming
						? "opacity-100 text-destructive"
						: "opacity-0 group-hover:opacity-100",
				)}
				onClick={handleDeleteClick}
				title={isDeleteConfirming ? "한 번 더 클릭하면 삭제됩니다" : "루트 삭제"}
			>
				<Trash2 className="size-3 text-current" />
			</button>
			<span className="shrink-0 text-xs text-muted-foreground">{route.screenCount}</span>
		</div>
	);
}
