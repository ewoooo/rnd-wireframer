"use client";

import { Children, Fragment, isValidElement, type ReactNode } from "react";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sidebar } from "@/components/ui/sidebar";
import { cn } from "@/components/utils";

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
	children,
}: {
	side: "left" | "right";
	children: ReactNode;
}) {
	const panels = Children.toArray(children).filter(isValidElement);

	return (
		<Sidebar side={side}>
			<ResizablePanelGroup orientation="vertical" className="h-full">
				{panels.map((panel, index) => (
					<Fragment key={index}>
						{index > 0 ? <Divider /> : null}
						{panel}
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
	title,
	footer,
	defaultSize,
	minSize,
	bodyClassName,
	children,
}: {
	title?: ReactNode;
	footer?: ReactNode;
	defaultSize?: number;
	minSize?: number;
	bodyClassName?: string;
	children: ReactNode;
}) {
	return (
		<ResizablePanel defaultSize={defaultSize} minSize={minSize}>
			<div className="flex h-full min-h-0 flex-col overflow-hidden">
				{title ? (
					<div className="flex h-9 shrink-0 items-center border-b px-3">
						{typeof title === "string" ? (
							<span className="truncate text-xs font-semibold text-sidebar-foreground">
								{title}
							</span>
						) : (
							title
						)}
					</div>
				) : null}
				<div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>{children}</div>
				{footer ? <div className="shrink-0">{footer}</div> : null}
			</div>
		</ResizablePanel>
	);
}

/** aside 내부 패널 divider = 드래그 가능한 ResizableHandle(중앙 알약선). */
export const Divider = ResizableHandle;
