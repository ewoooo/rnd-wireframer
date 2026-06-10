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
	exportJoined: string;
	exportSegments: string[];
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
		runtime.unmount();

		const exported = render(<Screen />);
		const exportSegments = collectTextSegments(exported.container);
		exported.unmount();

		snapshot = {
			consoleErrors,
			exportJoined: exportSegments.join(" "),
			exportSegments,
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

	it("emits the fixture without warnings (drift guard)", () => {
		expect(snapshot.warnings).toEqual([]);
	});

	it("renders both sides without console.error output", () => {
		expect(snapshot.consoleErrors).toEqual([]);
	});
});
