import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type RendererDefinition, RendererRegistry } from "../registry";
import { rendererRegistry, renderNode } from "../renderer";
import type { RenderTreeNode } from "../schema";

function createNode(overrides: Partial<RenderTreeNode> = {}): RenderTreeNode {
	return {
		type: "UnknownThing",
		componentVersion: "1.0.0",
		metadata: {
			id: "node-1",
			title: "Fallback title",
			author: "test",
			createdAt: "2026-05-21T00:00:00.000Z",
			updatedAt: "2026-05-21T00:00:00.000Z",
		},
		...overrides,
	};
}

describe("@cx/renderer registry", () => {
	it("registers and reads renderer definitions", () => {
		const registry = new RendererRegistry();
		const definition: RendererDefinition = {
			kind: "fallback",
			render: ({ node }) => <span>{node.metadata.title}</span>,
		};

		registry.register(definition);

		expect(registry.has("fallback")).toBe(true);
		expect(registry.getKinds()).toEqual(["fallback"]);
	});

	it("renders unknown nodes through fallback renderer", () => {
		render(renderNode(createNode(), {}));

		expect(screen.getByText("Fallback title")).toBeInTheDocument();
	});

	it("renders registered component mapping", () => {
		render(
			renderNode(
				createNode({
					type: "SectionHeader",
					props: {
						title: "가입 안내",
						description: "필수 정보를 확인하세요",
					},
				}),
				{},
			),
		);

		expect(screen.getByText("가입 안내")).toBeInTheDocument();
		expect(screen.getByText("필수 정보를 확인하세요")).toBeInTheDocument();
	});

	it("does not render area metadata title as a visible heading", () => {
		render(
			renderNode(
				createNode({
					type: "area.dynamic",
					metadata: {
						id: "area-1",
						title: "내부 영역 의도",
						author: "test",
						createdAt: "2026-05-21T00:00:00.000Z",
						updatedAt: "2026-05-21T00:00:00.000Z",
					},
					props: {},
					children: [
						createNode({
							metadata: {
								id: "child-1",
								title: "자식",
								author: "test",
								createdAt: "2026-05-21T00:00:00.000Z",
								updatedAt: "2026-05-21T00:00:00.000Z",
							},
						}),
					],
				}),
				{},
			),
		);

		expect(screen.queryByText("내부 영역 의도")).not.toBeInTheDocument();
		expect(screen.getByText("자식")).toBeInTheDocument();
	});

	it("renders an area heading only from explicit props.name", () => {
		render(
			renderNode(
				createNode({
					type: "area.static",
					props: { name: "약관 목록" },
					children: [
						createNode({
							metadata: {
								id: "child-1",
								title: "필수 약관",
								author: "test",
								createdAt: "2026-05-21T00:00:00.000Z",
								updatedAt: "2026-05-21T00:00:00.000Z",
							},
						}),
					],
				}),
				{},
			),
		);

		expect(screen.getByText("약관 목록")).toBeInTheDocument();
		expect(screen.getByText("필수 약관")).toBeInTheDocument();
	});

	it("renders selection-list area children in a grouped list container", () => {
		const { container } = render(
			renderNode(
				createNode({
					type: "area.static",
					props: {
						name: "인증수단 선택",
						componentGap: 0,
						listPresentation: "selection-list",
					},
					children: [
						createNode({
							metadata: {
								id: "auth-phone",
								title: "휴대폰 본인인증",
								author: "test",
								createdAt: "2026-05-21T00:00:00.000Z",
								updatedAt: "2026-05-21T00:00:00.000Z",
							},
						}),
						createNode({
							metadata: {
								id: "auth-pass",
								title: "PASS 인증",
								author: "test",
								createdAt: "2026-05-21T00:00:00.000Z",
								updatedAt: "2026-05-21T00:00:00.000Z",
							},
						}),
					],
				}),
				{},
			),
		);

		expect(screen.getByText("인증수단 선택")).toBeInTheDocument();
		expect(screen.getByText("휴대폰 본인인증")).toBeInTheDocument();
		expect(screen.getByText("PASS 인증")).toBeInTheDocument();
		expect(
			container.querySelector('[data-area-list-presentation="selection-list"]'),
		).not.toBeNull();
	});

	it("renders checkbox aliases with label props", () => {
		render(
			renderNode(
				createNode({
					type: "checkbox",
					props: {
						label: "전체 약관에 동의합니다",
					},
				}),
				{},
			),
		);

		const checkbox = screen.getByLabelText("전체 약관에 동의합니다");
		expect(checkbox).toHaveAttribute("type", "checkbox");

		fireEvent.click(checkbox);

		expect(checkbox).toBeChecked();
	});

	it("renders commerce detail component aliases", () => {
		render(
			<>
				{renderNode(
					createNode({
						type: "thumbnail-large",
						metadata: {
							id: "thumbnail-1",
							title: "프리미엄 구독",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: {
							eyebrow: "T 우주",
						},
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "product-info",
						metadata: {
							id: "product-info-1",
							title: "프리미엄 구독",
							description: "매월 혜택을 받을 수 있어요",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: {
							price: "9,900원",
							badges: ["혜택"],
						},
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "option-card",
						metadata: {
							id: "option-1",
							title: "월간 이용권",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: {
							value: "9,900원",
							selected: true,
						},
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "banner-indicator",
						metadata: {
							id: "banner-1",
							title: "추천 혜택",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: {
							current: 1,
							total: 3,
						},
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "store-card",
						metadata: {
							id: "store-1",
							title: "T 월드 시청점",
							description: "서울 중구",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: {
							distance: "320m",
						},
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "footer",
						metadata: {
							id: "footer-1",
							title: "고객센터",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: {
							links: ["이용약관"],
						},
					}),
					{},
				)}
			</>,
		);

		expect(screen.getByText("T 우주")).toBeInTheDocument();
		expect(screen.getAllByText("프리미엄 구독")).toHaveLength(2);
		expect(screen.getByRole("button", { name: /월간 이용권/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByText("추천 혜택")).toBeInTheDocument();
		expect(screen.getByText("T 월드 시청점")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "이용약관" })).toBeInTheDocument();
	});

	it("renders PRDD component aliases from parsed text props", () => {
		render(
			<>
				{renderNode(
					createNode({
						type: "TitleSection",
						metadata: {
							id: "title-section-1",
							title: "Fallback section",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: { texts: { title: "계속하려면 로그인·인증이 필요해요" } },
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "ButtonTextUnderline",
						metadata: {
							id: "text-link-1",
							title: "Fallback link",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: { texts: { label: "상품정보 자세히 보기" } },
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "CardSummary",
						metadata: {
							id: "card-summary-1",
							title: "Fallback summary",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: { texts: { title: "평균 평점", subText: "후기 12건 기준" } },
					}),
					{},
				)}
				{renderNode(
					createNode({
						type: "AccordionPriceInfo",
						metadata: {
							id: "accordion-price-1",
							title: "Fallback accordion",
							author: "test",
							createdAt: "2026-05-21T00:00:00.000Z",
							updatedAt: "2026-05-21T00:00:00.000Z",
						},
						props: {
							texts: {
								titleText: "공시지원금·선택약정 비교",
								priceText: "예상 부담 9,900원",
							},
						},
					}),
					{},
				)}
			</>,
		);

		expect(screen.getByText("계속하려면 로그인·인증이 필요해요")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "상품정보 자세히 보기" })).toBeInTheDocument();
		expect(screen.getByText("평균 평점")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /공시지원금·선택약정 비교/ })).toBeInTheDocument();
	});

	it("exposes default renderer registry", () => {
		expect(rendererRegistry.has("accordion-info")).toBe(true);
		expect(rendererRegistry.has("section-header")).toBe(true);
		expect(rendererRegistry.has("checkbox")).toBe(true);
		expect(rendererRegistry.has("banner-indicator")).toBe(true);
		expect(rendererRegistry.has("footer")).toBe(true);
		expect(rendererRegistry.has("product-info")).toBe(true);
		expect(rendererRegistry.has("title-section")).toBe(true);
		expect(rendererRegistry.has("fallback")).toBe(true);
	});
});
