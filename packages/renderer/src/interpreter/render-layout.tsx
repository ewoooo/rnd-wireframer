import type { ReactNode } from "react";
import type { RenderTreeNode } from "../tree/types";
import type { RendererRuntime } from "./types";

export function renderLayout({
	children,
	layoutId,
	node,
	props,
	runtime,
}: {
	children: ReactNode;
	layoutId: string;
	node: RenderTreeNode;
	props: Record<string, unknown>;
	runtime: RendererRuntime;
}): ReactNode {
	const resolvedLayout = runtime.resolveLayout({ layoutId, props });
	if (!resolvedLayout) {
		// 미등록 layout 패턴 fallback (good-ui식 일반 projection):
		// 패턴별 전용 컴포넌트가 없어도 throw하지 않고, 자식을 세로 스택으로 그려 화면을 렌더한다.
		// (area는 본래 "제목 + 자식 세로 스택"이라 대부분의 미등록 패턴이 이 fallback으로 자연스럽게 렌더됨)
		return (
			<div
				key={node.metadata.id}
				className="flex w-full min-w-0 flex-col gap-3"
				data-fallback-layout={layoutId}
			>
				{children}
			</div>
		);
	}

	const { Component, componentProps } = resolvedLayout;
	return (
		<Component
			key={node.metadata.id}
			{...componentProps}
			className={node.className}
			metadata={node.metadata}
		>
			{children}
		</Component>
	);
}
