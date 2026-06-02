"use client";

import type { AppArea } from "@/adapters/tables-to-render-tree";
import { useWorkbenchStore } from "@/model/store";

// 선택된 컴포넌트를 사용(참조)하는 area들을 역참조로 찾는다.
// area.node.children(=organisms.children 의 component 참조)에 해당 컴포넌트 id가
// 포함되면 그 area가 이 컴포넌트를 쓰는 것. (component id = node.metadata.id)
export function getAreasUsingComponent(areas: AppArea[], componentCode: string): AppArea[] {
	if (!componentCode) return [];
	return areas.filter((area) =>
		(area.node.children ?? []).some((child) => child.metadata.id === componentCode),
	);
}

export function ComponentUsageList() {
	const selectedComponentCode = useWorkbenchStore((state) => state.selectedComponentCode);
	const areas = useWorkbenchStore((state) => state.areas);

	const used = getAreasUsingComponent(areas, selectedComponentCode);

	if (used.length === 0) {
		return (
			<p className="px-3 py-4 text-center text-xs text-muted-foreground/60">
				이 컴포넌트를 사용하는 area가 없습니다
			</p>
		);
	}

	// 도메인/루트 계층 없이 area만 flat 하게 리스팅 (이름순).
	const sorted = [...used].sort((a, b) => a.name.localeCompare(b.name, "ko"));

	return (
		<div className="flex flex-col">
			{sorted.map((area) => (
				<div
					key={area.code}
					className="flex flex-col gap-0.5 border-t border-border/60 px-3 py-2 first:border-t-0 last:border-b"
				>
					<span className="truncate text-sm">{area.name}</span>
					<span className="truncate text-[10px] text-muted-foreground/60">{area.code}</span>
				</div>
			))}
		</div>
	);
}
