import { App } from "@/components/App";
import type { NavigatorTab } from "@/model/workbench-view-model";

const NAVIGATOR_TABS: NavigatorTab[] = ["agent", "comp", "ogn", "puck", "scn"];

// 탭을 ?tab= 쿼리로 받아 서버 렌더 시점부터 반영 → 새로고침 깜빡임 없음.
export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ tab?: string }>;
}) {
	const { tab } = await searchParams;
	const initialTab: NavigatorTab = NAVIGATOR_TABS.includes(tab as NavigatorTab)
		? (tab as NavigatorTab)
		: "scn";
	return <App initialTab={initialTab} />;
}
