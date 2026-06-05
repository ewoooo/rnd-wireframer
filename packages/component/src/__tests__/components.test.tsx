import { readFile } from "node:fs/promises";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccordionInfo } from "../components/AccordionInfo";
import { ActionButton } from "../components/ActionButton";
import { BannerIndicaterMedium } from "../components/BannerIndicaterMedium";
import { Button } from "../components/Button";
import { CardContentsFilled } from "../components/CardContentsFilled";
import { CardSummary } from "../components/CardSummary";
import { Coupon } from "../components/Coupon";
import { FilterSorting } from "../components/FilterSorting";
import { Footer } from "../components/Footer";
import { LegalText } from "../components/LegalText";
import { ListProductHorizontal } from "../components/ListProductHorizontal";
import { ListProductRow } from "../components/ListProductRow";
import { ListSelected } from "../components/ListSelected";
import { MapBlock } from "../components/MapBlock";
import { OptionCard } from "../components/OptionCard";
import { OptionList } from "../components/OptionList";
import { ProductInfo } from "../components/ProductInfo";
import { StoreCard } from "../components/StoreCard";
import { TextButton } from "../components/TextButton";
import { ThumbnailLarge } from "../components/ThumbnailLarge";
import { TitleSection } from "../components/TitleSection";

describe("@cx/components", () => {
	it("renders imported cx-components source", () => {
		render(<Button>확인</Button>);

		expect(screen.getByRole("button", { name: "확인" })).toBeInTheDocument();
	});

	it("renders ActionButton as the bottom CTA component", () => {
		render(<ActionButton>다음</ActionButton>);

		expect(screen.getByRole("button", { name: "다음" })).toBeInTheDocument();
	});

	it("renders ListSelected checkbox mode as an accessible checkbox", () => {
		render(
			<ListSelected
				type="checkbox"
				label="전체 약관에 동의합니다"
				showButton={false}
				showPrice={false}
			/>,
		);

		expect(screen.getByRole("checkbox", { name: "전체 약관에 동의합니다" })).toBeInTheDocument();
	});

	it("toggles uncontrolled ListSelected checkbox mode", () => {
		render(
			<ListSelected
				type="checkbox"
				label="전체 약관에 동의합니다"
				showButton={false}
				showPrice={false}
			/>,
		);

		const checkbox = screen.getByRole("checkbox", { name: "전체 약관에 동의합니다" });
		expect(checkbox).not.toBeChecked();

		fireEvent.click(checkbox);

		expect(checkbox).toBeChecked();
	});

	it("renders commerce detail components", () => {
		render(
			<>
				<ThumbnailLarge title="프리미엄 구독" eyebrow="T 우주" />
				<ProductInfo
					brand="T 우주"
					title="프리미엄 구독"
					description="매월 혜택을 받을 수 있어요"
					price="9,900원"
					badges={["혜택"]}
				/>
				<OptionCard title="월간 이용권" value="9,900원" selected />
				<OptionList
					title="색상 선택"
					items={[
						{ id: "black", title: "블랙", value: "선택됨" },
						{ id: "white", title: "화이트", value: "재고 있음" },
					]}
					selectedId="black"
				/>
				<Coupon title="제휴 할인 쿠폰" benefitText="5,000원 할인" ctaLabel="받기" />
				<BannerIndicaterMedium title="추천 혜택" current={1} total={3} />
				<FilterSorting countLabel="전체 12개" sortLabel="인기순" activeFilterCount={2} />
				<MapBlock title="가까운 매장" address="서울 중구" />
				<ListProductHorizontal
					brand="T 우주"
					title="우주패스 all"
					price="월 9,900원"
					benefitText="제휴 혜택 제공"
				/>
				<ListProductRow
					brand="Apple"
					title="iPhone 16 Pro"
					price="월 50,000원"
					specs={["256GB", "5G"]}
				/>
				<StoreCard title="T 월드 시청점" address="서울 중구" distance="320m" />
				<LegalText title="유의사항" items={["가입 전 약관을 확인하세요"]} />
				<Footer title="고객센터" links={["이용약관"]} />
			</>,
		);

		expect(screen.getAllByText("T 우주")).toHaveLength(3);
		expect(screen.getAllByText("프리미엄 구독")).toHaveLength(2);
		expect(screen.getByRole("button", { name: /월간 이용권/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByText("색상 선택")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /블랙/ })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByLabelText("제휴 할인 쿠폰")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "받기" })).toBeInTheDocument();
		expect(screen.getByText("추천 혜택")).toBeInTheDocument();
		expect(screen.getByText("전체 12개")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /필터/ })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "인기순" })).toBeInTheDocument();
		expect(screen.getByLabelText("가까운 매장")).toBeInTheDocument();
		expect(screen.getByText("우주패스 all")).toBeInTheDocument();
		expect(screen.getByText("iPhone 16 Pro")).toBeInTheDocument();
		expect(screen.getByText("T 월드 시청점")).toBeInTheDocument();
		expect(screen.getByText("가입 전 약관을 확인하세요")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "이용약관" })).toBeInTheDocument();
	});

	it("renders PRDD component surfaces", () => {
		render(
			<>
				<TitleSection title="계속하려면 로그인·인증이 필요해요" rightText="전체보기" />
				<TextButton label="상품정보 자세히 보기" underline />
				<CardSummary title="평균 평점" subText="후기 12건 기준" rightText="4.6" />
				<CardContentsFilled title="선택 조건" description="가입 전 확인이 필요합니다." />
				<AccordionInfo title="공시지원금·선택약정 비교" priceText="예상 부담 9,900원" />
			</>,
		);

		expect(screen.getByText("계속하려면 로그인·인증이 필요해요")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "상품정보 자세히 보기" })).toBeInTheDocument();
		expect(screen.getByText("평균 평점")).toBeInTheDocument();
		expect(screen.getByText("선택 조건")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /공시지원금·선택약정 비교/ })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	});

	it("maps SKT spacing tokens through generated Tailwind v4 theme variables", async () => {
		const themeCss = await readFile("packages/token/src/generated/tailwind-theme.css", "utf8");
		const componentShimCss = await readFile("packages/component/src/tailwind/theme.css", "utf8");

		expect(themeCss).toContain("@theme");
		expect(themeCss).toContain("--spacing-cx-12: var(--skt-spacing-12);");
		expect(themeCss).toContain("--spacing-cx-none: var(--skt-spacing-none);");
		expect(componentShimCss.trim()).toBe('@import "@cx/tokens/tailwind.css";');
	});

	it("keeps foundation tokens in @cx/tokens and component aliases in @cx/components", async () => {
		const tokenVariablesCss = await readFile("packages/token/src/generated/variables.css", "utf8");
		const componentVariablesCss = await readFile(
			"packages/component/src/tokens/variables.css",
			"utf8",
		);

		expect(tokenVariablesCss).toContain("--skt-color-text-neutral-primary:");
		expect(tokenVariablesCss).toContain("--skt-spacing-12:");
		expect(tokenVariablesCss).not.toContain("--skt-component-button-radius-default:");
		expect(componentVariablesCss).toContain('@import "@cx/tokens/variables.css";');
		expect(componentVariablesCss).toContain(
			"--skt-component-button-radius-default: var(--skt-radius-12);",
		);
	});
});
