"use client";

import { useEffect, useState } from "react";
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

/**
 * Group(ResizablePanelGroup)에 spread할 layout 값을 돌려준다.
 *
 * sessionStorage는 클라이언트 전용이라 서버 HTML은 저장값을 모른다. 첫 렌더(서버 + hydration)에
 * 저장값을 적용하면 서버/클라 HTML이 달라 hydration 불일치가 난다. → 첫 렌더에는 defaultLayout을
 * 적용하지 않아 서버와 일치시키고, 마운트 후 `key`를 바꿔 Group을 remount하며 저장 레이아웃을 적용한다.
 */
export function useSessionLayout(id: string, panelIds?: string[]) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id,
		panelIds,
		storage: sessionLayoutStorage,
	});

	// 마운트 전(서버 + hydration 첫 렌더)엔 onLayoutChanged도 떼야 한다.
	// 안 그러면 기본 레이아웃으로 마운트된 Group이 onLayoutChanged를 발화해 저장값을 기본값으로
	// 덮어쓰고, 직후 remount가 그 덮인 값을 읽어 복원이 깨진다.
	if (!mounted) {
		return { key: "ssr", defaultLayout: undefined, onLayoutChanged: undefined } as const;
	}
	return { key: "hydrated", defaultLayout, onLayoutChanged } as const;
}
