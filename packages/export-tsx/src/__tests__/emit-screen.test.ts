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
	"계속하기",
];

/** display.when 기본값이 false인 visibility 역할(base/empty) 텍스트 — export물에 나오면 안 된다.
 *  loading/error 등 state 역할은 when=false라도 disabled/loading 상태로 유지·렌더된다(5b5cdd8c). */
const STATE_GATED_TEXTS = ["표시할 검증 결과가 없습니다"];

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

	it("excludes state-gated texts whose display.when defaults to false", () => {
		for (const text of STATE_GATED_TEXTS) {
			expect(result.code).not.toContain(text);
		}
	});

	it("emits no warnings — divider props are expressed, not dropped (drift guard)", () => {
		expect(result.warnings).toEqual([]);
	});

	it("emits a clean root div and imports only the used modules", () => {
		expect(result.code).toContain("export default function Screen()");
		// AppScreenRoot의 정적 거울 — flex column + overflow hidden + 고정 프레임(390×844, height).
		expect(result.code).toContain('display: "flex"');
		expect(result.code).toContain('flexDirection: "column"');
		expect(result.code).toContain("height: 844");
		expect(result.code).toContain('overflow: "hidden"');
		expect(result.code).toContain("width: 390");
		expect(result.code).toContain(
			'backgroundColor: "var(--semantic-surface-page-normal, #ffffff)"',
		);
		expect(result.code).not.toContain("AppScreen");
		expect(result.code).not.toContain("node={");
		expect(result.code).toContain('from "@cx/external";');
		expect(result.code).toContain('from "@cx/layout/primitives";');
		// region 래퍼(PlainStackRegion)까지 primitive로 unwrap — fixture에는 named fallback이 없다.
		expect(result.code).not.toContain('from "@cx/layout/registry"');
		expect(result.code).not.toContain('from "@cx/renderer"');
	});

	it("mirrors ScreenRegion semantics on region containers (inline style, no tailwind)", () => {
		// header/bottom: shrink-0 거울.
		expect(result.code).toContain(
			'<Flex layout={{ direction: "column" }} style={{ flexShrink: 0 }}>',
		);
		// contents: flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] 거울.
		expect(result.code).toContain(
			'style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none" }}',
		);
		// region layoutId(layout.region.* → PlainStackRegion)도 primitive(VStack)로 unwrap.
		expect(result.code).toContain('<VStack as="section" gap={0}>');
		expect(result.code).not.toContain("PlainStackRegion");
		// BottomFixedArea는 region 컨테이너가 아니라 bottomActionArea(area layout)에서만 나온다.
		expect(result.code).toContain("<BottomFixedArea gap={0}>");
		expect(result.code).not.toContain("<BottomFixedArea>");
	});

	it("unwraps pattern layoutIds into primitives and expresses divider contracts as Divider leaves", () => {
		expect(result.code).toContain("<PageStack");
		expect(result.code).toContain("<HStack gap={0}>");
		// raw divider/sectionDivider prop은 primitive에 남지 않는다.
		expect(result.code).not.toContain("divider=");
		expect(result.code).not.toContain("sectionDivider");
		// area-fail-reason(divider:"section") → PageStack 닫은 뒤 형제 section divider 1개.
		expect(result.code.match(/<Divider type="section" \/>/g)).toHaveLength(1);
	});

	it("inserts a contents divider only between rows, never below the heading (area-combo-result)", () => {
		// 행 경계 1곳(ListText↔ListSelected)에만 삽입 — TitleSection(exempt) 직후에는 없다.
		expect(result.code.match(/<Divider type="contents" \/>/g)).toHaveLength(1);

		const headingIndex = result.code.indexOf('title="선택 구성 검증 결과"');
		const firstRowIndex = result.code.indexOf('title="중복가입 가능여부"');
		const dividerIndex = result.code.indexOf('<Divider type="contents" />');
		const secondRowIndex = result.code.indexOf("<ListSelected");
		expect(headingIndex).toBeGreaterThan(-1);
		expect(firstRowIndex).toBeGreaterThan(headingIndex);
		expect(dividerIndex).toBeGreaterThan(firstRowIndex);
		expect(secondRowIndex).toBeGreaterThan(dividerIndex);
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
