"use client";

import { Copy, Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createModule, deleteModule, duplicateModule, updateModule } from "@/app/actions/module-actions";
import { createRoute, deleteRoute, duplicateRoute, updateRoute } from "@/app/actions/route-actions";
import { createVariant } from "@/app/actions/screen-actions";
import { AgentRegistryNavigation } from "@/components/agent/AgentRegistryNavigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/utils";
import type { AppComponent, AppScreenModule, AppScreenRoute } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";
import type { AppArea } from "@/adapters/tables-to-render-tree";
import { AreaUsageList, getScreensUsingArea } from "../area/AreaUsageList";
import { ScreenVariantCard } from "../screen/ScreenVariantCard";
import { Aside, Divider, Panel } from "./Aside";

// area 목록을 usage(태그)별로 그룹화한다. 그룹은 태그 알파벳순, 그룹 내부는 이름순.
// (대부분 "section" 하나로 묶이지만 component 그룹화와 동일한 형태 유지)
function groupAreasByUsage(areas: AppArea[]) {
	const byUsage = new Map<string, AppArea[]>();
	for (const area of areas) {
		const list = byUsage.get(area.usage) ?? [];
		list.push(area);
		byUsage.set(area.usage, list);
	}
	return [...byUsage.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([usage, items]) => ({
			usage,
			areas: [...items].sort((x, y) => x.name.localeCompare(y.name, "ko")),
		}));
}

// 컴포넌트 목록을 태그(type)별로 그룹화한다. 그룹은 태그 알파벳순,
// 그룹 내부는 이름순.
function groupComponentsByType(components: AppComponent[]) {
	const byType = new Map<string, AppComponent[]>();
	for (const component of components) {
		const list = byType.get(component.type) ?? [];
		list.push(component);
		byType.set(component.type, list);
	}
	return [...byType.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([type, comps]) => ({
			type,
			components: [...comps].sort((x, y) => x.name.localeCompare(y.name, "ko")),
		}));
}

export function LeftAside() {
	const router = useRouter();
	const activeTab = useWorkbenchStore((state) => state.activeNavigatorTab);
	const agentRegistry = useWorkbenchStore((state) => state.agentRegistry);
	const components = useWorkbenchStore((state) => state.components);
	const areas = useWorkbenchStore((state) => state.areas);
	const screens = useWorkbenchStore((state) => state.screens);
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

	// 방금 생성된 variant ID → 해당 ScreenVariantCard가 자동으로 편집 모드 진입
	const [pendingEditVariantId, setPendingEditVariantId] = useState<string | null>(null);
	const [isCreatingVariant, startCreatingVariant] = useTransition();

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

	function handleCreateVariant() {
		if (!activeRoute) return;
		startCreatingVariant(async () => {
			const result = await createVariant({ routeId: activeRoute.code });
			if (result.variantId) {
				router.refresh();
				setPendingEditVariantId(result.variantId);
			}
		});
	}

	return (
		<Aside side="left">
			{activeTab === "scn" ? (
				<>
					{/* ── A: 도메인/루트 목록 ── */}
					<Panel title={`${screenModules.length}개 도메인`} defaultSize={35} minSize={15} bodyClassName="py-1">
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
					</Panel>

					<Divider />

					{/* ── B: 선택된 루트의 스크린 배리언트 목록 ── */}
					<Panel
						title={activeRoute ? `${activeRoute.screenVariants.length}개 스크린` : "스크린"}
						defaultSize={65}
						minSize={20}
						bodyClassName="[&>*:first-child]:border-t-0"
						footer={
							activeRoute ? (
								<div className="border-t border-sidebar-border px-3 py-1.5">
									<button
										type="button"
										className="flex w-full items-center gap-1 rounded-md px-3 py-1.5 hover:ring-1 hover:ring-border disabled:opacity-40"
										disabled={isCreatingVariant}
										onClick={handleCreateVariant}
									>
										<Plus className="size-3 text-muted-foreground/60" />
										<span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
											스크린 추가
										</span>
									</button>
								</div>
							) : null
						}
					>
						{activeRoute?.screenVariants.length === 0 && (
							<p className="px-3 py-4 text-center text-xs text-muted-foreground/60">
								스크린이 없습니다
							</p>
						)}
						{activeRoute?.screenVariants.map((variant) => (
							<ScreenVariantCard
								key={variant.id}
								isAutoEditing={pendingEditVariantId === variant.id}
								onAutoEditDone={() => setPendingEditVariantId(null)}
								onDeleted={() => {
									router.refresh();
								}}
								onSaved={() => router.refresh()}
								onSelect={selectScreenVariant}
								screenVariant={variant}
								selectedScreenCode={selectedScreenCode}
							/>
						))}
					</Panel>
				</>
			) : activeTab === "ogn" ? (
				<>
					{/* 위 패널: 선택한 area를 사용하는 스크린 역참조 (도메인→루트→스크린) */}
					<Panel
						title={`${getScreensUsingArea(screens, selectedAreaCode).length}개 스크린에서 사용`}
						defaultSize={30}
						minSize={10}
						bodyClassName="py-1"
					>
						<AreaUsageList />
					</Panel>
					<Divider />
					<Panel defaultSize={70} minSize={30} bodyClassName="p-2">
						<div className="flex flex-col gap-3">
							{groupAreasByUsage(areas).map((group) => (
								<div key={group.usage} className="flex flex-col gap-1">
									<p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
										{group.usage}
									</p>
									{group.areas.map((area) => (
										<button
											type="button"
											key={area.code}
											className={cn(
												"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
												area.code === selectedAreaCode && "border-primary bg-primary/5",
											)}
											onClick={() => selectArea(area.code)}
										>
											<p className="text-sm font-medium">{area.name}</p>
											<div className="mt-3 flex gap-2 text-xs text-muted-foreground">
												<span>{area.stateCount} states</span>
											</div>
										</button>
									))}
								</div>
							))}
						</div>
					</Panel>
				</>
			) : (
				<Panel bodyClassName="p-2">
					{activeTab === "comp" ? (
						<div className="flex flex-col gap-3">
							{groupComponentsByType(components).map((group) => (
								<div key={group.type} className="flex flex-col gap-1">
									<p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
										{group.type}
									</p>
									{group.components.map((component) => (
										<button
											type="button"
											key={component.code}
											className={cn(
												"rounded-lg border bg-background p-3 text-left transition-colors hover:bg-accent",
												component.code === selectedComponentCode && "border-primary bg-primary/5",
											)}
											onClick={() => selectComponent(component.code)}
										>
											<p className="truncate text-sm font-medium">{component.name}</p>
										</button>
									))}
								</div>
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
				</Panel>
			)}
		</Aside>
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
			role="button"
			tabIndex={0}
			className={cn(
				"group flex cursor-pointer items-center gap-1 px-3 py-2 transition-colors hover:bg-accent",
				isActive && "bg-primary/10 text-primary",
			)}
			onClick={onSelect}
			onKeyDown={(e) => e.key === "Enter" && onSelect()}
		>
			{/* 이름 영역 + 수정 버튼 이름 바로 옆 */}
			<div
				className="flex min-w-0 flex-1 flex-col"
			>
				<div className="flex items-center gap-1">
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
				{isActive && (
					<span className="truncate text-[10px] text-muted-foreground/60">
						{route.code}
					</span>
				)}
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
