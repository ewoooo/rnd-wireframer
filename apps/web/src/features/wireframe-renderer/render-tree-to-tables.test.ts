import type { WireframeNode } from "@cx/renderer";
import { describe, expect, it } from "vitest";
import { renderTreeToTables } from "./render-tree-to-tables";
import {
	type PatternStorePattern,
	type SampleOrganism,
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

const organism: SampleOrganism = {
	id: "ogn-mbr-term-list",
	type: "Organism",
	componentVersion: "1.0.0",
	metadata: metadata("ogn-mbr-term-list", "약관 목록"),
	props: { name: "약관 목록 조회" },
	composites: [
		{ compositeId: "requiredTerm", order: 1 },
		{ compositeId: "termDetail", order: 2 },
	],
};

const screen: SampleScreen = {
	id: "NOVA-MBR-FP-001-0",
	screenVariantCode: "mbr-join-base",
	version: "1.0.0",
	minRendererVersion: "0.1.0",
	metadata: metadata("NOVA-MBR-FP-001-0", "약관 동의"),
	pattern: { id: "term-agreement-screen", variant: "default" },
	screen: {
		type: "Screen",
		componentVersion: "1.0.0",
		metadata: metadata("screen-root", "약관 동의 화면"),
		regions: {
			header: {
				type: "Screen.Header",
				metadata: metadata("screen-header", "고정 상단 영역"),
				children: [{ kind: "composite", compositeId: "top-navigation" }],
			},
			contents: {
				type: "Screen.Contents",
				metadata: metadata("screen-contents", "스크롤 콘텐츠 영역"),
				children: [
					{ kind: "composite", compositeId: "screen-intro" },
					{ kind: "organism", organismId: "ogn-mbr-term-list" },
				],
			},
			bottom: {
				type: "Screen.Bottom",
				metadata: metadata("screen-bottom", "고정 하단 영역"),
				children: [],
			},
		},
	},
};

const screenPattern: PatternStorePattern = {
	id: "term-agreement-screen",
	name: "약관 동의 화면",
	target: "screen",
	defaultVariant: "default",
	variants: {
		default: {
			recipe: {
				screen: {
					regions: {
						contents: {
							pageStack: {
								enabled: true,
								divider: { type: "section" },
							},
						},
					},
				},
			},
		},
	},
};

describe("renderTreeToTables", () => {
	it("extracts database table rows from a resolved render tree", () => {
		const schema = tablesToRenderTree({
			screen,
			compositeById: new Map(
				[topNavigation, intro, requiredTerm, termDetail].map((node) => [node.metadata.id, node]),
			),
			organismById: new Map([[organism.id, organism]]),
			patternById: new Map([[screenPattern.id, screenPattern]]),
		});

		const result = renderTreeToTables(schema, {
			screenVariantCode: "mbr-join-base",
			pattern: screen.pattern,
		});

		expect(result.screens.screens[0].screen.regions.header.children).toEqual([
			{ kind: "composite", compositeId: "top-navigation" },
		]);
		expect(result.screens.screens[0].screen.regions.contents.children).toEqual([
			{ kind: "composite", compositeId: "screen-intro" },
			{ kind: "organism", organismId: "ogn-mbr-term-list" },
		]);
		expect(result.organisms.organisms[0]).toMatchObject({
			id: "ogn-mbr-term-list",
			props: { name: "약관 목록 조회" },
			composites: [
				{ compositeId: "requiredTerm", order: 1 },
				{ compositeId: "termDetail", order: 2 },
			],
		});
		expect(result.composites.composites.map((node) => node.metadata.id).sort()).toEqual([
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
