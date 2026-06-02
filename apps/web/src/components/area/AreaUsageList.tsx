"use client";

import type { AppScreen } from "@/adapters/tables-to-render-tree";
import type { AppScreenModule } from "@/model/store";
import { useWorkbenchStore } from "@/model/store";

// 선택된 area를 사용(참조)하는 스크린들을 역참조로 찾는다.
// screen.areas(=screen.screen jsonb 의 area 참조를 로더가 추출한 것)에
// 해당 areaCode 가 포함되면 그 스크린이 이 area 를 쓰는 것.
export function getScreensUsingArea(screens: AppScreen[], areaCode: string): AppScreen[] {
	if (!areaCode) return [];
	return screens.filter((screen) => screen.areas.some((area) => area.areaCode === areaCode));
}

interface RouteGroup {
	code: string;
	name: string;
	screens: AppScreen[];
}

interface ModuleGroup {
	id: string;
	name: string;
	routes: RouteGroup[];
}

// 사용 스크린들을 도메인(module) → 루트(route) → 스크린 트리로 묶는다.
// 도메인/루트 순서는 store 의 screenModules 순서를 따른다.
function groupByModuleRoute(screens: AppScreen[], modules: AppScreenModule[]): ModuleGroup[] {
	const moduleOrder = new Map(modules.map((mod, index) => [mod.id, index]));
	const moduleName = new Map(modules.map((mod) => [mod.id, mod.name]));

	const byModule = new Map<string, AppScreen[]>();
	for (const screen of screens) {
		const list = byModule.get(screen.moduleId) ?? [];
		list.push(screen);
		byModule.set(screen.moduleId, list);
	}

	return [...byModule.entries()]
		.sort(([a], [b]) => (moduleOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (moduleOrder.get(b) ?? Number.MAX_SAFE_INTEGER))
		.map(([moduleId, moduleScreens]) => ({
			id: moduleId,
			name: moduleName.get(moduleId) ?? moduleScreens[0]?.module ?? moduleId,
			routes: groupByRoute(moduleScreens),
		}));
}

function groupByRoute(screens: AppScreen[]): RouteGroup[] {
	const byRoute = new Map<string, AppScreen[]>();
	for (const screen of screens) {
		const list = byRoute.get(screen.screenRouteId) ?? [];
		list.push(screen);
		byRoute.set(screen.screenRouteId, list);
	}
	return [...byRoute.entries()].map(([code, routeScreens]) => ({
		code,
		name: routeScreens[0]?.screenRouteName ?? code,
		screens: routeScreens,
	}));
}

const LABEL_CLASS =
	"truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60";

export function AreaUsageList() {
	const selectedAreaCode = useWorkbenchStore((state) => state.selectedAreaCode);
	const screens = useWorkbenchStore((state) => state.screens);
	const screenModules = useWorkbenchStore((state) => state.screenModules);

	const used = getScreensUsingArea(screens, selectedAreaCode);

	if (used.length === 0) {
		return (
			<p className="px-3 py-4 text-center text-xs text-muted-foreground/60">
				이 area를 사용하는 스크린이 없습니다
			</p>
		);
	}

	const modules = groupByModuleRoute(used, screenModules);

	return (
		<div className="py-1">
			{modules.map((mod) => (
				// 도메인 박스 — Screen 페이지 DomainGroup 의 바깥 스타일 그대로
				<div key={mod.id} className="px-3 py-1.5">
					<div className="overflow-hidden rounded-md border border-border">
						<div className="border-b border-border px-3 py-1.5">
							<span className={LABEL_CLASS}>{mod.name}</span>
						</div>

						{/* 루트들 — 도메인 박스 스타일을 그대로 중첩 */}
						<div className="flex flex-col gap-1.5 p-1.5">
							{mod.routes.map((route) => (
								<div key={route.code} className="overflow-hidden rounded-md border border-border">
									<div className="border-b border-border px-3 py-1.5">
										<span className={LABEL_CLASS}>{route.name}</span>
									</div>

									{/* 스크린들 — Screen 페이지 좌상단의 루트(RouteListItem) 행 스타일 */}
									{route.screens.map((screen) => (
										<div
											key={screen.code}
											className="flex flex-col gap-0.5 border-t border-border/60 px-3 py-2 first:border-t-0"
										>
											<span className="truncate text-sm">{screen.name}</span>
											<span className="truncate text-[10px] text-muted-foreground/60">{screen.code}</span>
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
