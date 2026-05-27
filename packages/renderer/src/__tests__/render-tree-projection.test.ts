import { describe, expect, it } from "vitest";
import { tablesToRenderTree, validateRenderTreeFull } from "../index";
import type {
	RenderTreePatternStorePattern,
	RenderTreeTableAreaRow,
	RenderTreeTableComponentRow,
	RenderTreeTableScreenRow,
} from "../render-tree-projection";

const metadata = {
	author: "test",
	createdAt: "2026-05-26T00:00:00Z",
	updatedAt: "2026-05-26T00:00:00Z",
};

const component: RenderTreeTableComponentRow = {
	id: "component-title",
	type: "SectionHeader",
	version: "1.0.0",
	metadata: {
		title: "타이틀",
		...metadata,
	},
	pattern: { id: "none", variant: "default" },
	children: [
		{
			component: { type: "SectionHeader" },
			props: { title: "약관 동의" },
		},
	],
};

const area: RenderTreeTableAreaRow = {
	id: "area-terms",
	type: "area.static",
	version: "1.0.0",
	metadata: {
		title: "약관 영역",
		...metadata,
	},
	pattern: { id: "list-stack" },
	props: { name: "약관 목록" },
	children: [{ kind: "component", id: component.id }],
};

const screen: RenderTreeTableScreenRow = {
	id: "screen-terms",
	screenVariantId: "variant-terms",
	version: "1.0.0",
	minRendererVersion: "0.1.0",
	metadata: {
		title: "약관 화면",
		...metadata,
	},
	screen: {
		type: "screen.page",
		regions: {
			header: {
				type: "Screen.Header",
				metadata: { title: "상단" },
				children: [],
			},
			contents: {
				type: "Screen.Contents",
				metadata: { title: "본문" },
				children: [{ kind: "area", id: area.id }],
			},
			bottom: {
				type: "Screen.Bottom",
				metadata: { title: "하단" },
				children: [],
			},
		},
	},
};

const patterns: RenderTreePatternStorePattern[] = [
	{
		id: "section-stack",
		target: "region",
		name: "섹션 스택",
		defaultVariant: "default",
		variants: {
			default: {
				childWrap: {
					kind: "page-stack",
					appliesTo: ["area"],
					divider: { type: "section" },
					itemTemplate: "card-0",
					sectionGap: 12,
					slotInsetX: 4,
					titleMode: "hidden",
				},
			},
		},
	},
	{
		id: "list-stack",
		target: "area",
		name: "리스트 스택",
		defaultVariant: "default",
		variants: {
			default: {
				layoutProps: {
					flow: "vertical",
					componentGap: 8,
				},
			},
		},
	},
	{
		id: "area-app-bar",
		target: "area",
		name: "앱바 헤더",
		defaultVariant: "with-back",
		variants: {
			"with-back": {
				layoutProps: {
					hideTitle: true,
					componentGap: 0,
				},
			},
		},
	},
];

describe("tablesToRenderTree", () => {
	it("projects table rows into a renderer input DTO", () => {
		const renderTree = tablesToRenderTree({
			componentById: new Map([[component.id, component]]),
			areaById: new Map([[area.id, area]]),
			patternById: new Map(patterns.map((pattern) => [pattern.id, pattern])),
			screen,
		});

		const screenNode = renderTree.children[0];
		const contentsNode = screenNode?.children?.[1];
		const sectionNode = contentsNode?.children?.[0];
		const areaNode = sectionNode?.children?.[0];
		const componentNode = areaNode?.children?.[0];

		expect(sectionNode?.type).toBe("PageStack");
		expect(sectionNode?.props).toMatchObject({
			itemTemplate: "card-0",
			sectionGap: 12,
			slotInsetX: 4,
			titleMode: "hidden",
		});
		expect(areaNode?.props).toEqual({
			areaCode: area.id,
			componentGap: 8,
			flow: "vertical",
			name: "약관 목록",
		});
		expect(componentNode?.props).toEqual({ title: "약관 동의" });
		expect(validateRenderTreeFull(renderTree).ok).toBe(true);
	});

	it("projects area-app-bar hideTitle layout prop into the render tree", () => {
		const headerArea: RenderTreeTableAreaRow = {
			...area,
			id: "area-header",
			metadata: { title: "상단 앱바 영역", ...metadata },
			pattern: { id: "area-app-bar", variant: "with-back" },
			props: {},
		};
		const renderTree = tablesToRenderTree({
			componentById: new Map([[component.id, component]]),
			areaById: new Map([[headerArea.id, headerArea]]),
			patternById: new Map(patterns.map((pattern) => [pattern.id, pattern])),
			screen: {
				...screen,
				screen: {
					...screen.screen,
					regions: {
						...screen.screen.regions,
						header: {
							type: "Screen.Header",
							metadata: { title: "상단" },
							children: [{ kind: "area", id: headerArea.id }],
						},
						contents: {
							type: "Screen.Contents",
							metadata: { title: "본문" },
							children: [],
						},
					},
				},
			},
		});
		const headerNode = renderTree.children[0]?.children?.[0];
		const areaNode = headerNode?.children?.[0];

		expect(areaNode?.props).toMatchObject({
			areaCode: headerArea.id,
			componentGap: 0,
			hideTitle: true,
		});
	});
});
