"use client";

import { TriangleAlert } from "lucide-react";
import { Component, type ReactNode } from "react";

/**
 * 캔버스 렌더 영역 전용 에러 바운더리.
 *
 * 렌더 트리 해석 중 throw(예: 미등록 layout 패턴)가 나도 Rail/Aside/선택은 살아있게,
 * 실패를 이 영역 안으로 격리해 error block으로 fallback한다.
 * 부모에서 `key={선택 화면 id}`를 주면 다른 화면 선택 시 새로 마운트되며 복구된다.
 */
export class RenderErrorBoundary extends Component<
	{ children: ReactNode },
	{ error: Error | null }
> {
	state: { error: Error | null } = { error: null };

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	render() {
		const { error } = this.state;
		if (!error) return this.props.children;

		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
				<div className="flex size-11 items-center justify-center rounded-md border bg-background">
					<TriangleAlert className="size-5 text-destructive" data-icon="inline-start" />
				</div>
				<div className="grid max-w-90 gap-1">
					<p className="text-sm font-semibold text-foreground">이 화면을 렌더링할 수 없어요</p>
					<p className="text-xs leading-5 text-muted-foreground">{error.message}</p>
				</div>
			</div>
		);
	}
}
