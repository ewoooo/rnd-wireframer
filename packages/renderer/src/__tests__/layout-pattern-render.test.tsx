import { RenderNodeView, RenderTreeView } from "@cx/renderer";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("@cx/renderer layout pattern rendering", () => {
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
					props: { divider: false },
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
					props: { divider: true },
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

		const trailingDividers = screen.getAllByRole("separator");
		expect(trailingDividers).toHaveLength(2);
		expect(getPageStackItems(screen.getByText("Price row 1")).children).toHaveLength(4);
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

	it("renders explicit trailing dividers for page stack area patterns", () => {
		render(
			<RenderNodeView
				node={{
					type: "area.list",
					componentVersion: "0.1.0",
					layout: "layout.area.accordionList",
					metadata: { id: "accordion-list", title: "Accordion list" },
					props: { divider: true },
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

		expect(screen.getAllByRole("separator")).toHaveLength(2);
		expect(getPageStackItems(screen.getByText("Accordion row 1")).children).toHaveLength(4);
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
