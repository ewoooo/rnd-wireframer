import { readFile } from "node:fs/promises";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccordionInfo } from "../AccordionInfo";
import { ActionButton } from "../ActionButton";
import { BannerIndicaterMedium } from "../BannerIndicaterMedium";
import { Button } from "../Button";
import { CardContentsFilled } from "../CardContentsFilled";
import { CardSummary } from "../CardSummary";
import { Footer } from "../Footer";
import { LegalText } from "../LegalText";
import { ListSelected } from "../ListSelected";
import { MapBlock } from "../MapBlock";
import { OptionCard } from "../OptionCard";
import { ProductInfo } from "../ProductInfo";
import { StoreCard } from "../StoreCard";
import { TextButton } from "../TextButton";
import { ThumbnailLarge } from "../ThumbnailLarge";
import { TitleSection } from "../TitleSection";

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
				<BannerIndicaterMedium title="추천 혜택" current={1} total={3} />
				<MapBlock title="가까운 매장" address="서울 중구" />
				<StoreCard title="T 월드 시청점" address="서울 중구" distance="320m" />
				<LegalText title="유의사항" items={["가입 전 약관을 확인하세요"]} />
				<Footer title="고객센터" links={["이용약관"]} />
			</>,
		);

		expect(screen.getAllByText("T 우주")).toHaveLength(2);
		expect(screen.getAllByText("프리미엄 구독")).toHaveLength(2);
		expect(screen.getByRole("button", { name: /월간 이용권/ })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.getByText("추천 혜택")).toBeInTheDocument();
		expect(screen.getByLabelText("가까운 매장")).toBeInTheDocument();
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
});
