"use client";

import {
	Children,
	cloneElement,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useId,
} from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";
import { useSessionLayout } from "@/components/layout/use-session-layout";

/**
 * 레이아웃 규칙(코드화):
 *   하나의 Aside는 n개의 Panel과 n-1개의 Divider로 분할된다.
 *   첫(최상단) Panel은 Divider가 없고, 이후 Panel마다 *위에* Divider가 붙는다.
 *   → 자식으로 받은 Panel들 중 index>0 앞에만 Divider를 자동 삽입.
 *
 * ⚠️ 자동 삽입은 Panel이 Aside의 *직접* 자식일 때만 동작한다.
 *    분기를 <>…</> Fragment로 감싸면 Children.toArray가 단일 자식으로 보아
 *    자동 삽입이 깨지므로, 그 경우엔 <Divider/>를 직접 넣을 것.
 *
 * 컬럼 경계(aside↔canvas)는 Divider가 아니라 DoubleBorder가 담당한다.
 */
export function Aside({
	side,
	fill,
	persistId,
	children,
}: {
	side: "left" | "right";
	/** true면 고정 폭 대신 부모 폭을 가득 채운다(ResizablePanel 안에서 드래그 리사이즈용). */
	fill?: boolean;
	/** 지정 시 패널 크기를 sessionStorage에 저장(새로고침 유지, 앱 새로 열면 초기화). */
	persistId?: string;
	children: ReactNode;
}) {
	const panels = Children.toArray(children).filter(isValidElement);
	// 훅은 무조건 호출(rules of hooks). persistId 없으면 저장하지 않고 fallback id만 채운다.
	const fallbackId = useId();
	// 패널에 안정적인 명시 id 부여 → 저장/복원 키가 리로드·remount에도 일치(자동 id는 매번 바뀌어 복원 실패).
	const panelIds = persistId ? panels.map((_, index) => `${persistId}:${index}`) : undefined;
	const layout = useSessionLayout(persistId ?? fallbackId, panelIds);
	const persistProps = persistId
		? { defaultLayout: layout.defaultLayout, onLayoutChanged: layout.onLayoutChanged }
		: {};

	return (
		<Sidebar side={side} className={fill ? "h-full w-full" : undefined}>
			<ResizablePanelGroup
				key={persistId ? layout.key : undefined}
				orientation="vertical"
				className="h-full"
				{...persistProps}
			>
				{panels.map((panel, index) => (
					<Fragment key={index}>
						{index > 0 ? <Divider /> : null}
						{persistId
							? cloneElement(panel as ReactElement<{ id?: string }>, {
									id: `${persistId}:${index}`,
								})
							: panel}
					</Fragment>
				))}
			</ResizablePanelGroup>
		</Sidebar>
	);
}

/**
 * Aside를 구성하는 단위 패널.
 * - title: 헤더(문자열 또는 아이콘·카운트 등 ReactNode). 패널 톤 통일을 위해 자체 헤더 대신 이 title을 쓸 것.
 * - footer: 하단 고정 영역.
 * - body는 자동으로 세로 스크롤.
 */
export function Panel({
	id,
	title,
	icon,
	count,
	footer,
	defaultSize,
	minSize,
	bodyClassName,
	children,
}: {
	/** 레이아웃 저장/복원용 안정 id(Aside가 persistId 사용 시 자동 주입). */
	id?: string;
	title?: ReactNode;
	/** 제목 앞 아이콘(선택). */
	icon?: ReactNode;
	/** 제목 우측 카운트 배지(선택). */
	count?: number;
	footer?: ReactNode;
	defaultSize?: number;
	minSize?: number;
	bodyClassName?: string;
	children: ReactNode;
}) {
	return (
		<ResizablePanel id={id} defaultSize={defaultSize} minSize={minSize}>
			{/* 모든 패널 공통 chrome: 동일 헤더 · 배경(bg-sidebar) · 스크롤 body */}
			<div className="flex h-full min-h-0 flex-col overflow-hidden bg-sidebar">
				{title !== undefined ? (
					<div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-3">
						<div className="flex min-w-0 items-center gap-1.5">
							{icon}
							{typeof title === "string" ? (
								<span className="truncate text-xs font-semibold text-sidebar-foreground">
									{title}
								</span>
							) : (
								title
							)}
						</div>
						{count !== undefined ? (
							<span className="shrink-0 rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
								{count}
							</span>
						) : null}
					</div>
				) : null}
				<div className={cn("min-h-0 flex-1 overflow-y-auto py-1", bodyClassName)}>{children}</div>
				{footer ? <div className="shrink-0">{footer}</div> : null}
			</div>
		</ResizablePanel>
	);
}

/** aside 내부 패널 divider = 드래그 가능한 ResizableHandle(중앙 알약선). */
export const Divider = ResizableHandle;
