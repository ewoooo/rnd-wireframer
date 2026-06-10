import { ListText, TitleSection } from "@cx/external/registry";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	classifyDividerChild,
	contentsDividerBoundaries,
	DIVIDER_EXEMPT_CANONICAL_TYPES,
	renderChildrenWithDividers,
	resolveDividerContract,
	withTrailingSectionDivider,
} from "../components/patterns/shared/divider";
import { CompositeGap0 } from "../registry.generated";

describe("resolveDividerContract — divider/sectionDivider 계약 환원", () => {
	it('divider:"contents"는 rows로 환원한다', () => {
		expect(resolveDividerContract({ divider: "contents" })).toEqual({
			rows: true,
			trailingSection: false,
		});
	});

	it('divider:"section"은 trailingSection으로 환원한다', () => {
		expect(resolveDividerContract({ divider: "section" })).toEqual({
			rows: false,
			trailingSection: true,
		});
	});

	it("divider:true/false coercion을 유지한다 (true→contents, false→none)", () => {
		expect(resolveDividerContract({ divider: true })).toEqual({
			rows: true,
			trailingSection: false,
		});
		expect(resolveDividerContract({ divider: false })).toEqual({
			rows: false,
			trailingSection: false,
		});
	});

	it("divider:false는 defaults.divider보다 우선한다", () => {
		expect(resolveDividerContract({ divider: false }, { divider: "contents" })).toEqual({
			rows: false,
			trailingSection: false,
		});
	});

	it("divider 미지정이면 defaults.divider를 따른다", () => {
		expect(resolveDividerContract({}, { divider: "contents" })).toEqual({
			rows: true,
			trailingSection: false,
		});
		expect(resolveDividerContract({})).toEqual({ rows: false, trailingSection: false });
	});

	it("레거시 sectionDivider:true를 trailingSection으로 흡수한다", () => {
		expect(resolveDividerContract({ sectionDivider: true })).toEqual({
			rows: false,
			trailingSection: true,
		});
		expect(resolveDividerContract({ divider: "contents", sectionDivider: true })).toEqual({
			rows: true,
			trailingSection: true,
		});
	});
});

describe("contentsDividerBoundaries — 순수 경계 함수", () => {
	it("길이 n 입력에 길이 n-1 경계를 반환한다", () => {
		expect(contentsDividerBoundaries([])).toEqual([]);
		expect(contentsDividerBoundaries(["row"])).toEqual([]);
		expect(contentsDividerBoundaries(["row", "row"])).toEqual([true]);
	});

	it("exempt 양쪽 경계는 모두 false다", () => {
		expect(contentsDividerBoundaries(["exempt", "row", "row"])).toEqual([false, true]);
		expect(contentsDividerBoundaries(["row", "exempt", "row"])).toEqual([false, false]);
		expect(contentsDividerBoundaries(["row", "row", "exempt"])).toEqual([true, false]);
	});
});

describe("renderChildrenWithDividers — heading 제외", () => {
	it("rows=false면 children을 그대로 반환한다", () => {
		render(
			<div>
				{renderChildrenWithDividers(
					[<ListText key="a" title="Row A" />, <ListText key="b" title="Row B" />],
					false,
				)}
			</div>,
		);

		expect(screen.queryAllByRole("separator")).toHaveLength(0);
	});

	it("행 사이 모든 경계에 contents divider를 삽입한다", () => {
		render(
			<div>
				{renderChildrenWithDividers(
					[
						<ListText key="a" title="Row A" />,
						<ListText key="b" title="Row B" />,
						<ListText key="c" title="Row C" />,
					],
					true,
				)}
			</div>,
		);

		expect(screen.getAllByRole("separator")).toHaveLength(2);
	});

	it("첫 child가 TitleSection이면 타이틀 바로 아래에는 divider가 없다", () => {
		const { container } = render(
			<div>
				{renderChildrenWithDividers(
					[
						<TitleSection key="t" title="제목" />,
						<ListText key="a" title="Row A" />,
						<ListText key="b" title="Row B" />,
					],
					true,
				)}
			</div>,
		);

		expect(screen.getAllByRole("separator")).toHaveLength(1);
		// 순서 고정: 제목, RowA, hr, RowB — 제목 직후가 아니라 행 사이에만 삽입된다.
		const items = (container.firstElementChild as HTMLElement).children;
		expect(items).toHaveLength(4);
		expect(items[2].tagName).toBe("HR");
	});

	it("중간 heading 양쪽 경계 모두 미삽입한다", () => {
		render(
			<div>
				{renderChildrenWithDividers(
					[
						<ListText key="a" title="Row A" />,
						<TitleSection key="t" title="중간 제목" />,
						<ListText key="b" title="Row B" />,
					],
					true,
				)}
			</div>,
		);

		expect(screen.queryAllByRole("separator")).toHaveLength(0);
	});

	it("composite 래퍼(단일 자식 체인)에 감싸인 TitleSection도 exempt로 분류한다", () => {
		render(
			<div>
				{renderChildrenWithDividers(
					[
						<CompositeGap0 key="t" metadata={{ id: "t" }} props={{}}>
							<TitleSection title="제목" />
						</CompositeGap0>,
						<ListText key="a" title="Row A" />,
						<ListText key="b" title="Row B" />,
					],
					true,
				)}
			</div>,
		);

		expect(screen.getAllByRole("separator")).toHaveLength(1);
	});
});

describe("classifyDividerChild / 테이블", () => {
	it("계약 테이블은 canonical componentKey를 사용한다", () => {
		expect(DIVIDER_EXEMPT_CANONICAL_TYPES).toContain("kiki.TitleSection");
	});

	it("registry 컴포넌트 참조로 exempt/row를 분류한다", () => {
		expect(classifyDividerChild(<TitleSection title="t" />)).toBe("exempt");
		expect(classifyDividerChild(<ListText title="r" />)).toBe("row");
		expect(classifyDividerChild("text")).toBe("row");
	});
});

describe("withTrailingSectionDivider", () => {
	it("trailingSection=true면 section divider를 형제로 붙인다", () => {
		render(<div>{withTrailingSectionDivider(<span>content</span>, true)}</div>);

		const [divider] = screen.getAllByRole("separator");
		expect(divider.className).toContain("section");
	});

	it("trailingSection=false면 그대로 반환한다", () => {
		render(<div>{withTrailingSectionDivider(<span>content</span>, false)}</div>);

		expect(screen.queryAllByRole("separator")).toHaveLength(0);
	});
});
