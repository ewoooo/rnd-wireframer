"use client";

import { type LayoutStorage, useDefaultLayout } from "react-resizable-panels";

// 패널 레이아웃을 sessionStorage에 저장한다.
//  - 새로고침: 같은 탭 세션이라 크기 유지(레이아웃이 막 바뀌지 않음).
//  - 앱을 새 탭/창으로 열기: 세션이 비어 있어 기본 크기로 초기화.
// SSR에선 window가 없으므로 안전하게 no-op/null 처리.
const sessionLayoutStorage: LayoutStorage = {
	getItem: (key) => (typeof window === "undefined" ? null : window.sessionStorage.getItem(key)),
	setItem: (key, value) => {
		if (typeof window !== "undefined") window.sessionStorage.setItem(key, value);
	},
};

/** Group(ResizablePanelGroup)에 그대로 spread할 defaultLayout/onLayoutChanged를 돌려준다. */
export function useSessionLayout(id: string) {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id,
		storage: sessionLayoutStorage,
	});
	return { defaultLayout, onLayoutChanged };
}
