import { RenderNodeView, type RenderTreeScreenNode, RenderTreeView } from "@cx/renderer";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("@cx/renderer layout pattern rendering", () => {
	it("keeps area metadata title and name structural while rendering child headings", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.dynamic",
					componentVersion: "0.1.0",
					metadata: { id: "area-structural", title: "Structural Area Title" },
					props: { name: "Structural Area Name" },
					children: [
						{
							type: "TitleSection",
							componentVersion: "0.1.0",
							metadata: { id: "title-section", title: "Visible Section Title" },
							props: { title: "Visible Section Title" },
						},
					],
				}}
			/>,
		);

		expect(screen.getByText("Visible Section Title")).toBeInTheDocument();
		expect(screen.queryByText("Structural Area Title")).not.toBeInTheDocument();
		expect(screen.queryByText("Structural Area Name")).not.toBeInTheDocument();
	});

	it("does not render PageStack area layout metadata titles", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.dynamic",
					componentVersion: "0.1.0",
					layout: "layout.area.listStack",
					metadata: { id: "area-layout-structural", title: "Structural Layout Area Title" },
					children: [
						{
							type: "TitleSection",
							componentVersion: "0.1.0",
							metadata: { id: "layout-title-section", title: "Visible Layout Section Title" },
							props: { title: "Visible Layout Section Title" },
						},
					],
				}}
			/>,
		);

		expect(screen.getByText("Visible Layout Section Title")).toBeInTheDocument();
		expect(screen.queryByText("Structural Layout Area Title")).not.toBeInTheDocument();
		expect(
			screen.getByText("Visible Layout Section Title").closest("[data-node-type='PageStack']"),
		).not.toBeNull();
	});

	it("renders layout pattern components from the node layout key", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.stack",
					componentVersion: "0.1.0",
					layout: "layout.area.listStack",
					metadata: { id: "area-1", title: "Area 1" },
					props: { gap: 8 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "child-1", title: "Child 1" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Child 1");
		const layoutRoot = child.closest("[data-node-type='PageStack']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot).toHaveAttribute("data-node-id", "area-1");
		expect(layoutRoot).toHaveStyle({ paddingBlock: "28px", paddingInline: "12px" });
		expect(getPageStackItems(child)).toHaveStyle({ gap: "8px", paddingInline: "20px" });
	});

	it("renders a Radio node as a selectable list row without crashing", () => {
		render(
			<RenderNodeView
				node={{
					type: "Radio",
					componentVersion: "0.1.0",
					metadata: { id: "radio-1", title: "휴대폰 본인인증" },
					props: { checked: true },
				}}
			/>,
		);

		expect(screen.getByText("휴대폰 본인인증")).toBeInTheDocument();
	});

	it("renders a RadioGroup node as one selectable row per option", () => {
		render(
			<RenderNodeView
				node={{
					type: "RadioGroup",
					componentVersion: "0.1.0",
					metadata: { id: "rg-1", title: "인증수단" },
					props: {
						options: ["휴대폰 본인인증", "PASS", "공동인증서"],
						selectedValue: "휴대폰 본인인증",
					},
				}}
			/>,
		);

		expect(screen.getByText("휴대폰 본인인증")).toBeInTheDocument();
		expect(screen.getByText("PASS")).toBeInTheDocument();
		expect(screen.getByText("공동인증서")).toBeInTheDocument();
	});

	it("renders RadioGroup options given as {value,label} objects", () => {
		render(
			<RenderNodeView
				node={{
					type: "RadioGroup",
					componentVersion: "0.1.0",
					metadata: { id: "rg-2", title: "인증수단" },
					props: {
						options: [
							{ value: "phone", label: "휴대폰 본인인증" },
							{ value: "pass", label: "PASS" },
						],
						selectedValue: "phone",
					},
				}}
			/>,
		);

		expect(screen.getByText("휴대폰 본인인증")).toBeInTheDocument();
		expect(screen.getByText("PASS")).toBeInTheDocument();
	});

	it("renders a TextField field-side button from button/buttonLabel props", () => {
		render(
			<RenderNodeView
				node={{
					type: "TextField",
					componentVersion: "0.1.0",
					metadata: { id: "tf-1", title: "인증번호" },
					props: { button: true, buttonLabel: "인증번호 요청", placeholder: "숫자만 입력" },
				}}
			/>,
		);

		expect(screen.getByText("인증번호 요청")).toBeInTheDocument();
	});

	it("drops AI-written readonly props (rightElement object) without crashing", () => {
		render(
			<RenderNodeView
				node={{
					type: "TextField",
					componentVersion: "0.1.0",
					metadata: { id: "tf-2", title: "휴대폰번호" },
					props: {
						placeholder: "숫자만 입력",
						rightElement: {
							type: "Button",
							componentVersion: "0.1.0",
							metadata: { id: "btn", title: "인증요청" },
							props: { label: "인증요청" },
						},
					},
				}}
			/>,
		);

		// Renderer owns rightElement; an AI-written render-node object must be ignored, not crash.
		expect(screen.getByPlaceholderText("숫자만 입력")).toBeInTheDocument();
	});

	it("preserves area pattern default item gaps from the pattern components", () => {
		render(
			<>
				<RenderNodeView
					node={{
						type: "area.list",
						componentVersion: "0.1.0",
						layout: "layout.area.listStack",
						metadata: { id: "list-area", title: "List area" },
						children: [
							{
								type: "SectionHeader",
								componentVersion: "0.1.0",
								metadata: { id: "list-child", title: "List child" },
							},
						],
					}}
				/>
				<RenderNodeView
					node={{
						type: "area.form",
						componentVersion: "0.1.0",
						layout: "layout.area.fieldStack",
						metadata: { id: "field-area", title: "Field area" },
						children: [
							{
								type: "SectionHeader",
								componentVersion: "0.1.0",
								metadata: { id: "field-child", title: "Field child" },
							},
						],
					}}
				/>
				<RenderNodeView
					node={{
						type: "area.checks",
						componentVersion: "0.1.0",
						layout: "layout.area.checkboxStack",
						metadata: { id: "checkbox-area", title: "Checkbox area" },
						children: [
							{
								type: "SectionHeader",
								componentVersion: "0.1.0",
								metadata: { id: "checkbox-child", title: "Checkbox child" },
							},
						],
					}}
				/>
				<RenderNodeView
					node={{
						type: "area.accordion",
						componentVersion: "0.1.0",
						layout: "layout.area.accordionList",
						metadata: { id: "accordion-area", title: "Accordion area" },
						children: [
							{
								type: "SectionHeader",
								componentVersion: "0.1.0",
								metadata: { id: "accordion-child", title: "Accordion child" },
							},
						],
					}}
				/>
				<RenderNodeView
					node={{
						type: "area.message",
						componentVersion: "0.1.0",
						layout: "layout.area.messageStack",
						metadata: { id: "message-area", title: "Message area" },
						children: [
							{
								type: "SectionHeader",
								componentVersion: "0.1.0",
								metadata: { id: "message-child", title: "Message child" },
							},
						],
					}}
				/>
			</>,
		);

		expect(getPageStackItems(screen.getByText("List child"))).toHaveStyle({ gap: "8px" });
		expect(getPageStackItems(screen.getByText("Field child"))).toHaveStyle({ gap: "12px" });
		expect(getPageStackItems(screen.getByText("Checkbox child"))).toHaveStyle({ gap: "12px" });
		expect(getPageStackItems(screen.getByText("Accordion child"))).toHaveStyle({ gap: "0px" });
		expect(getPageStackItems(screen.getByText("Message child"))).toHaveStyle({ gap: "12px" });
		expect(screen.getByText("Field child").closest("[data-node-type='PageStack']")).toHaveStyle({
			gap: "8px",
			paddingBlock: "28px",
			paddingInline: "12px",
		});
	});

	it("keeps legacy PageStack spacing prop names as render fallbacks", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.form",
					componentVersion: "0.1.0",
					layout: "layout.area.fieldStack",
					metadata: { id: "legacy-field-area", title: "Legacy field area" },
					props: {
						componentGap: 16,
						itemPaddingX: 24,
						paddingY: 32,
						sectionPaddingX: 10,
						titleGap: 6,
					},
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "legacy-field-child", title: "Legacy field child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Legacy field child");
		expect(getPageStackItems(child)).toHaveStyle({ gap: "16px", paddingInline: "24px" });
		expect(child.closest("[data-node-type='PageStack']")).toHaveStyle({
			gap: "6px",
			paddingBlock: "32px",
			paddingInline: "10px",
		});
	});

	it("maps catalog-approved visual props onto the primitive wrapper", () => {
		render(
			<RenderNodeView
				node={{
					type: "component.wrapper",
					componentVersion: "0.1.0",
					layout: "layout.composite.componentSearchBar",
					metadata: { id: "search-wrapper", title: "Search wrapper" },
					props: { height: 44 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "search-child", title: "Search child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Search child");
		const layoutRoot = child.closest("[data-node-id='search-wrapper']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot).toHaveStyle({ height: "44px" });
	});

	it("wraps leaf component rendering when a composite layout is present", () => {
		render(
			<RenderNodeView
				node={{
					type: "AppBar",
					componentVersion: "1.0.0",
					layout: "layout.composite.componentAppBar",
					metadata: { id: "appbar-leaf", title: "App bar" },
					props: { title: "약관 동의", showBack: true },
				}}
			/>,
		);

		const title = screen.getByText("약관 동의");
		const layoutRoot = title.closest("[data-node-id='appbar-leaf']");

		expect(layoutRoot).toBeInTheDocument();
	});

	it("applies region layout wrappers while preserving screen chrome", () => {
		render(
			<RenderTreeView
				node={{
					type: "Screen",
					componentVersion: "1.0.0",
					metadata: { id: "screen", title: "Screen" },
					children: [
						{
							type: "Screen.Header",
							componentVersion: "0.1.0",
							layout: "layout.region.header",
							metadata: { id: "screen.header", title: "Header" },
							children: [],
						},
						{
							type: "Screen.Contents",
							componentVersion: "0.1.0",
							layout: "layout.region.contents",
							metadata: { id: "screen.contents", title: "Contents" },
							children: [
								{
									type: "SectionHeader",
									componentVersion: "0.1.0",
									metadata: { id: "contents-child", title: "Contents child" },
								},
							],
						},
						{
							type: "Screen.Bottom",
							componentVersion: "0.1.0",
							layout: "layout.region.bottom",
							metadata: { id: "screen.bottom", title: "Bottom" },
							children: [],
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Contents child");
		const regionLayoutRoot = child.closest("[data-node-id='screen.contents']");

		expect(regionLayoutRoot).toBeInTheDocument();
		expect(regionLayoutRoot).toHaveAttribute("data-node-type", "Layout.Flex");
	});

	it("renders screen trees with missing or unordered regions", () => {
		render(
			<RenderTreeView
				node={
					{
						type: "Screen",
						componentVersion: "1.0.0",
						metadata: { id: "screen", title: "Screen" },
						children: [
							{
								type: "Screen.Contents",
								componentVersion: "0.1.0",
								metadata: { id: "screen.contents", title: "Contents" },
								children: [
									{
										type: "SectionHeader",
										componentVersion: "0.1.0",
										metadata: { id: "contents-child", title: "Contents child" },
									},
								],
							},
						],
					} as unknown as RenderTreeScreenNode
				}
			/>,
		);

		expect(screen.getByText("Contents child")).toBeInTheDocument();
		expect(
			screen.getByText("Contents child").closest("[data-region='Screen.Contents']"),
		).toHaveAttribute("data-node-id", "screen.contents");
	});

	it("allows screen region content to be overridden while preserving screen chrome", () => {
		render(
			<RenderTreeView
				node={{
					type: "Screen",
					componentVersion: "1.0.0",
					metadata: { id: "screen", title: "Screen" },
					children: [
						{
							type: "Screen.Header",
							componentVersion: "0.1.0",
							metadata: { id: "screen.header", title: "Header" },
							children: [],
						},
						{
							type: "Screen.Contents",
							componentVersion: "0.1.0",
							metadata: { id: "screen.contents", title: "Contents" },
							children: [],
						},
						{
							type: "Screen.Bottom",
							componentVersion: "0.1.0",
							metadata: { id: "screen.bottom", title: "Bottom" },
							children: [],
						},
					],
				}}
				renderRegion={({ region }) => <div>{`override:${region}`}</div>}
			/>,
		);

		expect(screen.getByText("override:header")).toBeInTheDocument();
		expect(screen.getByText("override:contents")).toBeInTheDocument();
		expect(screen.getByText("override:bottom")).toBeInTheDocument();
		expect(
			screen.getByText("override:bottom").closest("[data-region='Screen.Bottom']"),
		).toHaveAttribute("data-node-id", "screen.bottom");
	});

	it("uses the fixed bottom primitive for bottom action area patterns", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.action",
					componentVersion: "0.1.0",
					layout: "layout.area.bottomActionArea",
					metadata: { id: "bottom-action", title: "Bottom action" },
					props: { paddingY: 12 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "bottom-child", title: "Bottom child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Bottom child");
		const layoutRoot = child.closest("[data-node-id='bottom-action']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot).toHaveStyle({ bottom: "0px", position: "sticky" });
	});

	it("lets bottom action area own CTA rail spacing", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.action",
					componentVersion: "0.1.0",
					layout: "layout.area.bottomActionArea",
					metadata: { id: "bottom-action", title: "Bottom action" },
					props: {},
					children: [
						{
							type: "ActionButton",
							componentVersion: "0.1.0",
							layout: "layout.composite.componentActionButton",
							metadata: { id: "confirm-action", title: "Confirm action" },
							props: { label: "인증 확인", size: "xlarge", variant: "primary" },
						},
					],
				}}
			/>,
		);

		const button = screen.getByRole("button", { name: "인증 확인" });
		const actionArea = button.closest("[data-node-id='bottom-action']");
		const actionWrapper = button.closest("[data-node-id='confirm-action']");

		expect(actionArea).toHaveStyle({ paddingTop: "22px" });
		expect(actionArea?.getAttribute("style")).toContain("padding-bottom: calc(24px");
		expect(actionWrapper).not.toHaveStyle({ height: "56px", paddingTop: "22px" });
	});

	it("renders option collection patterns as grids", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.options",
					componentVersion: "0.1.0",
					layout: "layout.area.productOptionGrid",
					metadata: { id: "option-grid", title: "Options" },
					props: { columns: 2, gap: 12 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "option-child", title: "Option child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Option child");
		const layoutRoot = child.closest("[data-node-id='option-grid']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot).toHaveAttribute("data-node-type", "Layout.Grid");
		expect(layoutRoot).toHaveStyle({ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
	});

	it("renders horizontal card collection patterns as rows", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.cards",
					componentVersion: "0.1.0",
					layout: "layout.area.horizontalCardListArea",
					metadata: { id: "horizontal-cards", title: "Horizontal cards" },
					props: { gap: 10 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "card-child", title: "Card child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Card child");
		const layoutRoot = child.closest("[data-node-id='horizontal-cards']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot).toHaveAttribute("data-node-type", "Layout.Flex");
		expect(layoutRoot).toHaveClass("flex-row");
	});

	it("renders row card collection patterns as page stack sections", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.cards",
					componentVersion: "0.1.0",
					layout: "layout.area.rowCardListArea",
					metadata: { id: "row-cards", title: "Row cards" },
					props: { gap: 14 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "row-card-child", title: "Row card child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Row card child");
		const layoutRoot = child.closest("[data-node-id='row-cards']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot?.tagName.toLowerCase()).toBe("section");
		expect(layoutRoot).toHaveAttribute("data-node-type", "PageStack");
	});

	it("renders text list group patterns as page stack sections", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.list",
					componentVersion: "0.1.0",
					layout: "layout.area.textListGroupArea",
					metadata: { id: "text-list-group", title: "Text list group" },
					props: { gap: 6 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "text-row-child", title: "Text row child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Text row child");
		const layoutRoot = child.closest("[data-node-id='text-list-group']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot?.tagName.toLowerCase()).toBe("section");
		expect(layoutRoot).toHaveAttribute("data-node-type", "PageStack");
		expect(getPageStackItems(child)).toHaveStyle({ gap: "6px" });
	});

	it("renders commerce detail section patterns as page stack sections", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.detail",
					componentVersion: "0.1.0",
					layout: "layout.area.productInfoSection",
					metadata: { id: "product-info", title: "Product info" },
					props: { gap: 20 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "product-info-child", title: "Product info child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Product info child");
		const layoutRoot = child.closest("[data-node-id='product-info']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot?.tagName.toLowerCase()).toBe("section");
		expect(layoutRoot).toHaveAttribute("data-node-type", "PageStack");
	});

	it("restores area divider defaults for divider-backed page stack patterns", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.detail",
					componentVersion: "0.1.0",
					layout: "layout.area.priceAccordionStackArea",
					metadata: { id: "price-accordion", title: "Price accordion" },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-1", title: "Price row 1" },
						},
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-2", title: "Price row 2" },
						},
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-3", title: "Price row 3" },
						},
					],
				}}
			/>,
		);

		const dividers = screen.getAllByRole("separator");

		expect(dividers).toHaveLength(2);
		expect(dividers[0].className).toContain("contents");
		expect(getPageStackItems(screen.getByText("Price row 1")).children).toHaveLength(5);
	});

	it("allows divider props to disable and override pattern defaults", () => {
		const { rerender } = render(
			<RenderNodeView
				node={{
					type: "area.detail",
					componentVersion: "0.1.0",
					layout: "layout.area.priceAccordionStackArea",
					metadata: { id: "price-accordion", title: "Price accordion" },
					props: { divider: "none" },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-1", title: "Price row 1" },
						},
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-2", title: "Price row 2" },
						},
					],
				}}
			/>,
		);

		expect(screen.queryAllByRole("separator")).toHaveLength(0);

		rerender(
			<RenderNodeView
				node={{
					type: "area.detail",
					componentVersion: "0.1.0",
					layout: "layout.area.priceAccordionStackArea",
					metadata: { id: "price-accordion", title: "Price accordion" },
					props: { divider: "section" },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-1", title: "Price row 1" },
						},
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-2", title: "Price row 2" },
						},
					],
				}}
			/>,
		);

		const [divider] = screen.getAllByRole("separator");

		expect(divider.className).toContain("section");

		rerender(
			<RenderNodeView
				node={{
					type: "area.detail",
					componentVersion: "0.1.0",
					layout: "layout.area.priceAccordionStackArea",
					metadata: { id: "price-accordion", title: "Price accordion" },
					props: { divider: "contents" },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-1", title: "Price row 1" },
						},
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "price-row-2", title: "Price row 2" },
						},
					],
				}}
			/>,
		);

		const contentsDividers = screen.getAllByRole("separator");
		expect(contentsDividers).toHaveLength(1);
		expect(contentsDividers[0].className).toContain("contents");
		expect(getPageStackItems(screen.getByText("Price row 1")).children).toHaveLength(3);
	});

	it('renders a trailing section divider after the area stack when divider is "section"', () => {
		render(
			<RenderNodeView
				node={{
					type: "area.dynamic",
					componentVersion: "0.1.0",
					layout: "layout.area.listStack",
					metadata: { id: "terms-list", title: "약관 목록" },
					props: { divider: "section" },
					children: [
						{
							type: "ListText",
							componentVersion: "0.1.0",
							metadata: { id: "terms-row-1", title: "약관 1" },
						},
					],
				}}
			/>,
		);

		const dividers = screen.getAllByRole("separator");
		expect(dividers).toHaveLength(1);
		expect(dividers[0].className).toContain("section");
	});

	it("does not render a trailing section divider when divider is absent", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.dynamic",
					componentVersion: "0.1.0",
					layout: "layout.area.listStack",
					metadata: { id: "terms-list-2", title: "약관 목록" },
					children: [
						{
							type: "ListText",
							componentVersion: "0.1.0",
							metadata: { id: "terms-row-a", title: "약관 1" },
						},
					],
				}}
			/>,
		);

		expect(screen.queryAllByRole("separator")).toHaveLength(0);
	});

	it("does not add dividers to page stack patterns without divider defaults", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.list",
					componentVersion: "0.1.0",
					layout: "layout.area.listStack",
					metadata: { id: "list-stack", title: "List stack" },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "list-row-1", title: "List row 1" },
						},
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "list-row-2", title: "List row 2" },
						},
					],
				}}
			/>,
		);

		expect(screen.queryAllByRole("separator")).toHaveLength(0);
		expect(getPageStackItems(screen.getByText("List row 1")).children).toHaveLength(2);
	});

	it("renders explicit contents dividers between page stack area children", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.list",
					componentVersion: "0.1.0",
					layout: "layout.area.accordionList",
					metadata: { id: "accordion-list", title: "Accordion list" },
					props: { divider: "contents" },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "accordion-row-1", title: "Accordion row 1" },
						},
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "accordion-row-2", title: "Accordion row 2" },
						},
					],
				}}
			/>,
		);

		expect(screen.getAllByRole("separator")).toHaveLength(1);
		expect(getPageStackItems(screen.getByText("Accordion row 1")).children).toHaveLength(3);
	});

	it("maps commerce detail padding aliases onto primitive layout props", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.hero",
					componentVersion: "0.1.0",
					layout: "layout.area.productHeroSummary",
					metadata: { id: "hero-summary", title: "Hero summary" },
					props: {
						gap: 16,
						infoPaddingX: 20,
						infoPaddingTop: 12,
						infoPaddingBottom: 18,
						thumbnailHeight: 240,
					},
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "hero-child", title: "Hero child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Hero child");
		const layoutRoot = child.closest("[data-node-id='hero-summary']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot).toHaveStyle({
			height: "240px",
			paddingInline: "20px",
			paddingTop: "12px",
			paddingBottom: "18px",
		});
	});

	it("renders selectable list patterns as page stack sections", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.selection",
					componentVersion: "0.1.0",
					layout: "layout.area.authMethodList",
					metadata: { id: "auth-methods", title: "Auth methods" },
					props: { gap: 12 },
					children: [
						{
							type: "SectionHeader",
							componentVersion: "0.1.0",
							metadata: { id: "auth-method-child", title: "Auth method child" },
						},
					],
				}}
			/>,
		);

		const child = screen.getByText("Auth method child");
		const layoutRoot = child.closest("[data-node-id='auth-methods']");

		expect(layoutRoot).toBeInTheDocument();
		expect(layoutRoot?.tagName.toLowerCase()).toBe("section");
		expect(layoutRoot).toHaveAttribute("data-node-type", "PageStack");
	});
});

function getPageStackItems(child: HTMLElement): Element {
	const pageStack = child.closest("[data-node-type='PageStack']");
	const items = pageStack?.lastElementChild;
	if (!items) throw new Error(`PageStack items wrapper missing for '${child.textContent ?? ""}'`);
	return items;
}
