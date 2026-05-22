import type { WireframeNode } from "@cx/renderer";
import { describe, expect, it } from "vitest";
import { renderTreeToTables } from "./render-tree-to-tables";
import {
	type PatternStorePattern,
	type SampleComposite,
	type SampleArea,
	type SampleScreen,
	tablesToRenderTree,
} from "./tables-to-render-tree";

const metadata = (id: string, title: string) => ({
	id,
	title,
	author: "test-author",
	createdAt: "2026-05-21T00:00:00Z",
	updatedAt: "2026-05-21T00:00:00Z",
});

const topNavigation: WireframeNode = {
	type: "HeaderBase",
	componentVersion: "1.0.0",
	metadata: metadata("top-navigation", "상단 내비게이션"),
	props: { titleContent: "약관 동의" },
};

const intro: WireframeNode = {
	type: "SectionHeader",
	componentVersion: "1.0.0",
	metadata: metadata("screen-intro", "인트로"),
	props: { title: "약관 동의" },
};

const requiredTerm: WireframeNode = {
	type: "ListCell",
	componentVersion: "1.0.0",
	metadata: metadata("requiredTerm", "필수 약관"),
	props: { title: { bind: "termList.requiredTerm.title" } },
};

const termDetail: WireframeNode = {
	type: "Accordion",
	componentVersion: "1.0.0",
	metadata: metadata("termDetail", "약관 상세"),
	props: { title: { bind: "termList.termDetail.title" } },
};

const area: SampleArea = {
	id: "ogn-mbr-term-list",
	type: "Area",
	version: "1.0.0",
	metadata: {
		title: "약관 목록",
		author: "test-author",
		createdAt: "2026-05-21T00:00:00Z",
		updatedAt: "2026-05-21T00:00:00Z",
	},
	pattern: { id: "list-stack", variant: "default" },
	props: { name: "약관 목록 조회" },
	children: [
		{ kind: "composite", id: "requiredTerm" },
		{ kind: "composite", id: "termDetail" },
	],
};

const screen: SampleScreen = {
	id: "NOVA-MBR-FP-001-0",
	screenVariantId: "mbr-join-base",
	version: "1.0.0",
	minRendererVersion: "0.1.0",
	metadata: {
		title: "약관 동의",
		author: "test-author",
		createdAt: "2026-05-21T00:00:00Z",
		updatedAt: "2026-05-21T00:00:00Z",
	},
	pattern: { id: "term-agreement-screen", variant: "default" },
	screen: {
		type: "page",
		regions: {
			header: {
				type: "Screen.Header",
				metadata: { title: "고정 상단 영역" },
				children: [{ kind: "composite", id: "top-navigation" }],
			},
			contents: {
				type: "Screen.Contents",
				metadata: { title: "스크롤 콘텐츠 영역" },
				children: [
					{ kind: "composite", id: "screen-intro" },
					{ kind: "area", id: "ogn-mbr-term-list" },
				],
			},
			bottom: {
				type: "Screen.Bottom",
				metadata: { title: "고정 하단 영역" },
				children: [],
			},
		},
	},
};

const listStackPattern: PatternStorePattern = {
	id: "list-stack",
	name: "리스트 스택",
	target: "area",
	defaultVariant: "default",
	variants: {
		default: {
			direction: "vertical",
			childOrder: "explicit",
			gap: 8,
			props: {
				flow: "vertical",
				componentGap: 8,
			},
		},
	},
};

const sectionStackPattern: PatternStorePattern = {
	id: "section-stack",
	name: "섹션 스택",
	target: "region",
	defaultVariant: "default",
	variants: {
		default: {
			direction: "vertical",
			childOrder: "explicit",
			childWrap: {
				kind: "page-stack",
				appliesTo: ["composite", "area"],
				sectionPaddingX: 12,
				itemPaddingX: 20,
				paddingY: 28,
				divider: {
					type: "section",
				},
			},
		},
	},
};

describe("renderTreeToTables", () => {
	it("extracts database table rows from a resolved render tree", () => {
		const toSampleComposite = (node: WireframeNode): SampleComposite => ({
			id: node.metadata.id,
			type: node.type,
			version: node.componentVersion,
			metadata: {
				title: node.metadata.title,
				author: node.metadata.author,
				createdAt: node.metadata.createdAt,
				updatedAt: node.metadata.updatedAt,
			},
			pattern: { id: "default", variant: "default" },
			children: [
				{ component: { type: node.type }, props: (node.props ?? {}) as Record<string, never> },
			],
			events: {},
		});
		const schema = tablesToRenderTree({
			screen,
			compositeById: new Map(
				[topNavigation, intro, requiredTerm, termDetail].map((node) => [
					node.metadata.id,
					toSampleComposite(node),
				]),
			),
			areaById: new Map([[area.id, area]]),
			patternById: new Map<string, PatternStorePattern>([
				[listStackPattern.id, listStackPattern],
				[sectionStackPattern.id, sectionStackPattern],
			]),
		});
		const contentsNode = schema.children[0]?.children?.[1];

		expect(contentsNode?.children?.map((node) => node.type)).toEqual([
			"PageStack",
			"Divider",
			"PageStack",
		]);

		const result = renderTreeToTables(schema, {
			screenVariantId: "mbr-join-base",
			pattern: screen.pattern,
		});

		expect(result.screens.screens[0].screen.regions.header.children).toEqual([
			{ kind: "composite", id: "top-navigation" },
		]);
		expect(result.screens.screens[0].screen.regions.contents.children).toEqual([
			{ kind: "composite", id: "screen-intro" },
			{ kind: "area", id: "ogn-mbr-term-list" },
		]);
		expect(result.areas.areas[0]).toMatchObject({
			id: "ogn-mbr-term-list",
			props: { name: "약관 목록 조회" },
			children: [
				{ kind: "composite", id: "requiredTerm" },
				{ kind: "composite", id: "termDetail" },
			],
		});
		expect(result.composites.composites.map((c) => c.id).sort()).toEqual([
			"requiredTerm",
			"screen-intro",
			"termDetail",
			"top-navigation",
		]);
		expect(result.warnings).toEqual([
			"Dropped generated divider wrapper: screen-contents-divider-1",
		]);
	});
});
