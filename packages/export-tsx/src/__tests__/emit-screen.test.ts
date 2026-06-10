import type { RenderTreeNode } from "@cx/renderer";
import { describe, expect, it } from "vitest";
import { emitScreenTsx } from "../emit-screen";
import fixture from "./fixtures/cart-fail-recovery.render-tree.json";

const screenTree = fixture.children[0] as unknown as RenderTreeNode;

/** 기본 data({})에서 화면에 보여야 하는 모든 텍스트 콘텐츠. */
const VISIBLE_TEXTS = [
	"선택 불가·충돌 사유 안내",
	"담기에 실패한 이유와 해결 방법",
	"{실패축} 문제로 담지 못했어요",
	"상품·옵션·조건·정책 중 어디서 막혔는지와 수정 방법을 확인하세요",
	"나중에 다시 보기",
	"선택 구성 검증 결과",
	"중복가입 가능여부",
	"중복가입 불가",
	"그룹상품 선택",
];

/**
 * 계약 defaultValue로 렌더되는 텍스트 — 소스 문자열에는 없어도 화면에는 보인다.
 * (ActionButton label 기본값. 과거에는 named 래퍼의 props 에코로 소스에 남았지만
 * primitive unwrap 이후 소스에서 사라졌다. 렌더 수준 보존은 parity.test.tsx가 보장.)
 */
const DEFAULT_VALUE_TEXTS = ["계속하기"];

/** display.when 기본값이 false인 상태 노드의 텍스트 — export물에 나오면 안 된다. */
const STATE_GATED_TEXTS = [
	"실패 사유를 확인하는 중입니다",
	"실패 사유를 불러오지 못했어요",
	"표시할 검증 결과가 없습니다",
];

describe("emitScreenTsx — integration (cart-fail-recovery fixture)", () => {
	const result = emitScreenTsx({ tree: screenTree });

	it("matches the TSX snapshot", () => {
		expect(result.code).toMatchSnapshot();
	});

	it("includes every visible text content", () => {
		for (const text of VISIBLE_TEXTS) {
			expect(result.code).toContain(text);
		}
	});

	it("relies on contract defaults (not source text) only for the known allowlist", () => {
		for (const text of DEFAULT_VALUE_TEXTS) {
			expect(result.code).not.toContain(text);
		}
	});

	it("excludes state-gated texts whose display.when defaults to false", () => {
		for (const text of STATE_GATED_TEXTS) {
			expect(result.code).not.toContain(text);
		}
	});

	it("warns only about intentionally dropped divider props (drift guard)", () => {
		expect(result.warnings).toEqual([
			'layout "layout.area.fieldStack" unwrap (node area-fail-reason): primitive 미지원 prop 생략 — divider',
			'layout "layout.area.listStack" unwrap (node area-combo-result): primitive 미지원 prop 생략 — divider',
		]);
	});

	it("emits a clean root div and imports only the used modules", () => {
		expect(result.code).toContain("export default function Screen()");
		expect(result.code).toContain("<div style={{ minHeight: 852, width: 393 }}>");
		expect(result.code).not.toContain("AppScreen");
		expect(result.code).not.toContain("node={");
		expect(result.code).toContain('from "@cx/external";');
		expect(result.code).toContain('from "@cx/layout/primitives";');
		expect(result.code).toContain('from "@cx/layout/registry";');
		expect(result.code).not.toContain('from "@cx/renderer"');
	});

	it("expresses regions with layout primitives (bottom via BottomFixedArea)", () => {
		expect(result.code).toContain("<BottomFixedArea>");
		expect(result.code).toContain('<Flex layout={{ direction: "column" }}>');
	});

	it("unwraps pattern layoutIds into primitives and drops divider props (no Divider leaf)", () => {
		expect(result.code).toContain("<PageStack");
		expect(result.code).toContain("<HStack gap={0}>");
		expect(result.code).not.toContain("divider");
		expect(result.code).not.toContain("<Divider");
	});
});

describe("emitScreenTsx — data snapshotting", () => {
	it("freezes provided data into literals instead of binding defaults", () => {
		const { code } = emitScreenTsx({
			data: { failReason: { title: "재고 부족 문제로 담지 못했어요" } },
			tree: screenTree,
		});

		expect(code).toContain("재고 부족 문제로 담지 못했어요");
		expect(code).not.toContain("{실패축}");
	});

	it("drops subtrees whose display.when resolves to false from data", () => {
		const { code } = emitScreenTsx({
			data: { comboResult: { visible: false } },
			tree: screenTree,
		});

		expect(code).not.toContain("선택 구성 검증 결과");
		expect(code).toContain("담기에 실패한 이유와 해결 방법");
	});
});

describe("emitScreenTsx — input contract", () => {
	it("rejects a non-screen root node", () => {
		expect(() =>
			emitScreenTsx({
				tree: {
					componentVersion: "0.1.0",
					metadata: { id: "x", title: "x" },
					type: "Layout.Flex",
				} as RenderTreeNode,
			}),
		).toThrowError(/Screen/);
	});
});
