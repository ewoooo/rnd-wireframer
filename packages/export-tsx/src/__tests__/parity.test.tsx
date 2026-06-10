import { type RenderTreeScreenNode, RenderTreeView } from "@cx/renderer";
import { render } from "@testing-library/react";
import type { ComponentType } from "react";
import ts from "typescript";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { emitScreenTsx } from "../emit-screen";
import fixture from "./fixtures/cart-fail-recovery.render-tree.json";

const screenTree = fixture.children[0] as unknown as RenderTreeScreenNode;

/** display.when 기본값이 false인 상태 노드 텍스트 — 양쪽 DOM 모두에 없어야 한다. */
const STATE_GATED_TEXTS = [
	"실패 사유를 확인하는 중입니다",
	"실패 사유를 불러오지 못했어요",
	"표시할 검증 결과가 없습니다",
];

/**
 * export 결과물에만 나타나는 것이 허용된 텍스트(의도적 차이 allowlist).
 * 현재 fixture(data 없음, 모든 area hasData=true)에서는 의도적 차이가 없다.
 * SHOW_DEFAULT placeholder("기본값 표시 — 데이터 미수신") 등은 __areaData__로
 * hasData=false를 시뮬레이션하는 fixture가 생기면 여기에 추가한다.
 */
const EXPORT_ONLY_TEXT_ALLOWLIST: string[] = [];

/**
 * 런타임 renderer에만 나타나는 것이 허용된 텍스트(의도적 차이).
 * SystemHeader(@cx/layout chromes) 상태바 목업 — export는 AppScreen/screen 크롬 없이
 * 루트 div로 고정하므로(emit-screen.ts SCREEN_FRAME_STYLE 참고) 상태바 텍스트가 없다.
 */
const RUNTIME_ONLY_TEXT_ALLOWLIST: string[] = [
	"9:41",
	"Cellular signal",
	"Wi-Fi signal",
	"Battery level",
];

/**
 * 생성 코드의 import specifier → 실제 워크스페이스 모듈 로더 contract 테이블.
 * (jsx: "automatic" 변환이 주입하는 react/jsx-runtime 포함)
 */
const GENERATED_MODULE_LOADERS: Record<string, () => Promise<unknown>> = {
	"@cx/external": () => import("@cx/external"),
	"@cx/layout/primitives": () => import("@cx/layout/primitives"),
	"@cx/layout/registry": () => import("@cx/layout/registry"),
	react: () => import("react"),
	"react/jsx-runtime": () => import("react/jsx-runtime"),
};

/**
 * TSX 소스 → CJS 변환. 레포 루트 devDependency인 typescript의 transpileModule을 쓴다.
 * (esbuild도 워크스페이스에 있지만 jsdom 환경에서는 TextEncoder/Uint8Array realm 불일치
 * invariant로 로드 자체가 실패한다 — vite transformWithEsbuild도 동일.)
 */
function transformTsxToCjs(code: string): string {
	const { outputText } = ts.transpileModule(code, {
		compilerOptions: {
			esModuleInterop: true,
			jsx: ts.JsxEmit.ReactJSX,
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
		},
		fileName: "generated-screen.tsx",
	});
	return outputText;
}

/** emitScreenTsx의 code 문자열 → 실제 React 컴포넌트(default export). */
async function evaluateScreenModule(code: string): Promise<ComponentType> {
	const compiled = transformTsxToCjs(code);

	const moduleEntries = await Promise.all(
		Object.entries(GENERATED_MODULE_LOADERS).map(
			async ([specifier, load]) => [specifier, await load()] as const,
		),
	);
	const moduleTable = new Map<string, unknown>(moduleEntries);
	const requireShim = (specifier: string): unknown => {
		if (!moduleTable.has(specifier)) {
			throw new Error(`parity require shim: 매핑되지 않은 모듈 "${specifier}"`);
		}
		return moduleTable.get(specifier);
	};

	const cjsModule: { exports: Record<string, unknown> } = { exports: {} };
	new Function("require", "exports", "module", compiled)(requireShim, cjsModule.exports, cjsModule);

	const Screen = cjsModule.exports.default;
	if (typeof Screen !== "function") {
		throw new Error("생성 모듈에 default export(Screen 컴포넌트)가 없습니다");
	}
	return Screen as ComponentType;
}

function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

/**
 * 사용자에게 보이는 텍스트 조각 수집 — DOM 텍스트 노드 + input placeholder.
 * 시각/구조(divider, selection-list 크롬, 빈 region)는 비교 대상이 아니다.
 */
function collectTextSegments(container: HTMLElement): string[] {
	const segments: string[] = [];
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
	while (walker.nextNode()) {
		const normalized = normalizeWhitespace(walker.currentNode.textContent ?? "");
		if (normalized) segments.push(normalized);
	}
	for (const element of container.querySelectorAll("[placeholder]")) {
		const normalized = normalizeWhitespace(element.getAttribute("placeholder") ?? "");
		if (normalized) segments.push(normalized);
	}
	return segments;
}

function isAllowlisted(segment: string, allowlist: string[]): boolean {
	return allowlist.some((allowed) => segment.includes(allowed));
}

type ParitySnapshot = {
	consoleErrors: string[];
	/** 구조 단언용 deep clone — testing-library auto-cleanup 이후에도 유효하다. */
	exportContainer: HTMLElement;
	exportJoined: string;
	exportSegments: string[];
	/** 구조 단언용 deep clone — testing-library auto-cleanup 이후에도 유효하다. */
	runtimeContainer: HTMLElement;
	runtimeJoined: string;
	runtimeSegments: string[];
	warnings: string[];
};

let snapshot: ParitySnapshot;

beforeAll(async () => {
	const consoleErrors: string[] = [];
	const errorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
		consoleErrors.push(args.map(String).join(" "));
	});

	try {
		const { code, warnings } = emitScreenTsx({ tree: screenTree });
		const Screen = await evaluateScreenModule(code);

		const runtime = render(<RenderTreeView data={{}} node={screenTree} />);
		const runtimeSegments = collectTextSegments(runtime.container);
		const runtimeContainer = runtime.container.cloneNode(true) as HTMLElement;
		runtime.unmount();

		const exported = render(<Screen />);
		const exportSegments = collectTextSegments(exported.container);
		const exportContainer = exported.container.cloneNode(true) as HTMLElement;
		exported.unmount();

		snapshot = {
			consoleErrors,
			exportContainer,
			exportJoined: exportSegments.join(" "),
			exportSegments,
			runtimeContainer,
			runtimeJoined: runtimeSegments.join(" "),
			runtimeSegments,
			warnings,
		};
	} finally {
		errorSpy.mockRestore();
	}
});

describe("TSX export ↔ runtime renderer text parity (cart-fail-recovery fixture)", () => {
	it("renders meaningful text on both sides (sanity)", () => {
		expect(snapshot.runtimeSegments.length).toBeGreaterThan(0);
		expect(snapshot.exportSegments.length).toBeGreaterThan(0);
	});

	it("shows every runtime-visible text in the exported Screen render", () => {
		const missing = snapshot.runtimeSegments.filter(
			(segment) =>
				!snapshot.exportJoined.includes(segment) &&
				!isAllowlisted(segment, RUNTIME_ONLY_TEXT_ALLOWLIST),
		);
		expect(missing).toEqual([]);
	});

	it("adds no text beyond the runtime render except the explicit allowlist", () => {
		const extra = snapshot.exportSegments.filter(
			(segment) =>
				!snapshot.runtimeJoined.includes(segment) &&
				!isAllowlisted(segment, EXPORT_ONLY_TEXT_ALLOWLIST),
		);
		expect(extra).toEqual([]);
	});

	it("keeps display.when=false texts out of both renders", () => {
		for (const text of STATE_GATED_TEXTS) {
			expect(snapshot.runtimeJoined).not.toContain(text);
			expect(snapshot.exportJoined).not.toContain(text);
		}
	});

	it("emits no warnings (divider contracts are expressed, drift guard)", () => {
		expect(snapshot.warnings).toEqual([]);
	});

	it("renders both sides without console.error output", () => {
		expect(snapshot.consoleErrors).toEqual([]);
	});

	it("renders the same divider(hr) count on both sides", () => {
		const runtimeDividers = snapshot.runtimeContainer.querySelectorAll("hr");
		const exportDividers = snapshot.exportContainer.querySelectorAll("hr");
		// fixture 기준: area-combo-result 행 사이 contents 1 + area-fail-reason 뒤 section 1.
		// (TitleSection 직후에는 양쪽 모두 divider가 없어야 한다 — heading exempt 계약.)
		expect(runtimeDividers).toHaveLength(2);
		expect(exportDividers).toHaveLength(runtimeDividers.length);
	});
});

/**
 * 구조 parity — ScreenRegion 레이아웃 의미(스크롤/고정 영역)가 export에서 보존되는지.
 *
 * 아래 두 describe는 쌍이다:
 * 1) "export DOM mirrors …": export 결과의 inline style이 emit-screen.ts의
 *    SCREEN_FRAME_STYLE / REGION_CONTAINER_CONTRACT 미러를 실제 DOM에서 만족하는지.
 * 2) "runtime DOM drift guard": 미러의 원본인 ScreenRegion/AppScreenRoot tailwind 계약이
 *    아직 그대로인지. 런타임 계약이 바뀌면 (2)가 먼저 깨져서 export 스타일 테이블
 *    (emit-screen.ts) 갱신을 강제한다 — 한쪽만 고치면 안 된다.
 */
describe("TSX export ↔ runtime structural parity (screen frame + region semantics)", () => {
	function exportRegions() {
		const root = snapshot.exportContainer.firstElementChild as HTMLElement;
		expect(root).not.toBeNull();
		const regions = [...root.children] as HTMLElement[];
		return { regions, root };
	}

	describe("export DOM mirrors AppScreenRoot/ScreenRegion semantics with inline styles", () => {
		it("renders the root as a fixed flex-column frame with overflow hidden", () => {
			const { root } = exportRegions();
			expect(root.style.display).toBe("flex");
			expect(root.style.flexDirection).toBe("column");
			expect(root.style.overflow).toBe("hidden");
			// minHeight가 아니라 height — 고정 프레임이어야 contents 스크롤이 성립한다.
			expect(root.style.height).toBe("844px");
			expect(root.style.width).toBe("390px");
			expect(root.style.minHeight).toBe("");
		});

		it("orders regions header → contents → bottom (text matches each runtime region)", () => {
			const { regions } = exportRegions();
			expect(regions).toHaveLength(3);
			const runtimeRegionOrder = ["Screen.Header", "Screen.Contents", "Screen.Bottom"];
			for (const [index, region] of runtimeRegionOrder.entries()) {
				const runtimeText = normalizeWhitespace(
					snapshot.runtimeContainer.querySelector(`[data-region="${region}"]`)?.textContent ?? "",
				);
				expect(runtimeText.length).toBeGreaterThan(0);
				expect(normalizeWhitespace(regions[index].textContent ?? "")).toBe(runtimeText);
			}
		});

		it("pins header/bottom with flexShrink:0 and scrolls contents via flex:1 + minHeight:0", () => {
			const { regions } = exportRegions();
			const [header, contents, bottom] = regions;
			expect(header.style.flexShrink).toBe("0");
			expect(bottom.style.flexShrink).toBe("0");
			expect(contents.style.flexGrow).toBe("1");
			expect(contents.style.minHeight).toBe("0px");
			expect(contents.style.overflowY).toBe("auto");
		});
	});

	describe("runtime DOM drift guard (ScreenRegion/AppScreenRoot tailwind contract)", () => {
		function runtimeRegion(region: string): HTMLElement {
			const element = snapshot.runtimeContainer.querySelector<HTMLElement>(
				`[data-region="${region}"]`,
			);
			expect(element).not.toBeNull();
			return element as HTMLElement;
		}

		it("keeps the AppScreenRoot flex-column overflow-hidden frame classes", () => {
			const root = snapshot.runtimeContainer.querySelector<HTMLElement>(
				'[data-node-type="Screen"]',
			);
			expect(root).not.toBeNull();
			for (const className of ["flex", "flex-col", "overflow-hidden"]) {
				expect(root?.classList.contains(className)).toBe(true);
			}
		});

		it("keeps the ScreenRegion contract classes the export style table mirrors", () => {
			// emit-screen.ts REGION_CONTAINER_CONTRACT와 1:1 — 여기가 깨지면 테이블을 같이 갱신할 것.
			for (const className of ["flex-1", "min-h-0", "overflow-y-auto"]) {
				expect(runtimeRegion("Screen.Contents").classList.contains(className)).toBe(true);
			}
			expect(runtimeRegion("Screen.Header").classList.contains("shrink-0")).toBe(true);
			expect(runtimeRegion("Screen.Bottom").classList.contains("shrink-0")).toBe(true);
		});
	});
});
