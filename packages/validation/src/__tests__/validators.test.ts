import { componentCatalog } from "@cx/components/catalog";
import type { ComponentCatalog } from "@cx/components/types";
import type { SourceSpec } from "@cx/schema";
import {
	validateAgentResult,
	validateComponentUsage,
	validateCompositionPlan,
	validateLayoutProps,
	validateRenderTree,
	validateSchemaArtifact,
	validateTableGenerationResult,
} from "@cx/validation";
import { describe, expect, it } from "vitest";

const testCatalog = {
	ActionButton: {
		type: "ActionButton",
		source: "react-component",
		version: "1.0.0",
		kind: "action",
		props: {
			label: { type: "string", required: true },
			variant: { type: "enum", values: ["primary", "secondary"] },
			disabled: { type: "boolean" },
			rightIcon: { type: "node", aiWritable: false },
		},
	},
} satisfies ComponentCatalog;

describe("@cx/validation validators", () => {
	it("reports unknown component types as errors", () => {
		const report = validateComponentUsage(
			{ type: "MissingCard", props: {} },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues[0]).toMatchObject({
			code: "unknown-component-type",
			severity: "error",
		});
	});

	it("reports missing required props as errors", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { variant: "primary" } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "required-field-missing",
				path: ["props", "label"],
				severity: "error",
			}),
		);
	});

	it("reports invalid enum values as errors", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { label: "가입하기", variant: "ghost" } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-enum-value",
				path: ["props", "variant"],
				severity: "error",
			}),
		);
	});

	it("reports unknown props as warnings", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { label: "가입하기", trackingId: "cta-1" } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(true);
		expect(report.summary.warningCount).toBe(1);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-prop",
				path: ["props", "trackingId"],
				severity: "warning",
			}),
		);
	});

	it("reports aiWritable false props as errors", () => {
		const report = validateComponentUsage(
			{ type: "ActionButton", props: { label: "가입하기", rightIcon: null } },
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "readonly-prop-written",
				path: ["props", "rightIcon"],
				severity: "error",
			}),
		);
	});

	it("reports invalid Screen region structure as errors", () => {
		const report = validateRenderTree(
			{
				version: "render-tree.v0.1",
				metadata: { id: "tree" },
				children: [
					{
						type: "Screen",
						componentVersion: "0.1.0",
						metadata: { id: "screen", title: "Screen" },
						children: [
							screenRegion("Screen.Contents", "contents"),
							screenRegion("Screen.Header", "header"),
							screenRegion("Screen.Bottom", "bottom"),
						],
					},
				],
			},
			{ componentCatalog: testCatalog },
		);

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-render-node",
				path: ["children", 0, "children", 0, "type"],
			}),
		);
	});

	it("accepts a valid RenderTree", () => {
		const report = validateRenderTree(validRenderTree(), { componentCatalog: testCatalog });

		expect(report).toMatchObject({
			ok: true,
			summary: {
				errorCount: 0,
				warningCount: 0,
			},
			target: "render-tree",
		});
	});

	it("accepts RenderTree nodes with registered layout pattern ids", () => {
		const tree = validRenderTree();
		const contents = tree.children[0]?.children?.[1];
		const area = contents?.children?.[0] as { type: string; layout?: string } | undefined;
		if (!area) throw new Error("area node missing");
		area.type = "area.stack";
		area.layout = "layout.area.listStack";
		(area as { children?: unknown[] }).children = [
			{
				type: "ActionButton",
				componentVersion: "1.0.0",
				metadata: { id: "area-child-cta", title: "Area child CTA" },
				layout: "layout.composite.componentActionButton",
				props: {
					label: "계속하기",
					variant: "primary",
				},
			},
		];

		const report = validateRenderTree(tree, { componentCatalog: testCatalog });

		expect(report.ok).toBe(true);
	});

	it("reports unknown leaf component types even when a layout wrapper is registered", () => {
		const tree = validRenderTree();
		const contents = tree.children[0]?.children?.[1];
		const leaf = contents?.children?.[0] as { type: string; layout?: string } | undefined;
		if (!leaf) throw new Error("leaf node missing");
		leaf.type = "MissingLeaf";
		leaf.layout = "layout.composite.componentAppBar";

		const report = validateRenderTree(tree, { componentCatalog: testCatalog });

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-component-type",
				path: ["children", 0, "children", 1, "children", 0, "type"],
			}),
		);
	});

	it("reports unknown RenderTree layout pattern ids", () => {
		const tree = validRenderTree();
		const contents = tree.children[0]?.children?.[1];
		const area = contents?.children?.[0] as { type: string; layout?: string } | undefined;
		if (!area) throw new Error("area node missing");
		area.type = "area.stack";
		area.layout = "layout.area.missingStack";

		const report = validateRenderTree(tree, { componentCatalog: testCatalog });

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-layout-ref",
				path: ["children", 0, "children", 1, "children", 0, "layout"],
			}),
		);
	});

	it("reports RenderTree layout refs that do not match the node target", () => {
		const tree = validRenderTree();
		const contents = tree.children[0]?.children?.[1] as { layout?: string } | undefined;
		if (!contents) throw new Error("contents node missing");
		contents.layout = "layout.area.productHeroSummary";

		const report = validateRenderTree(tree, { componentCatalog: testCatalog });

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-layout-ref",
				path: ["children", 0, "children", 1, "layout"],
			}),
		);
	});

	it("accepts the final screen RenderTree handoff shape without region props", () => {
		const report = validateRenderTree(finalScreenRenderTreeExample(), { componentCatalog });

		expect(report).toMatchObject({
			ok: true,
			summary: {
				errorCount: 0,
				warningCount: 0,
			},
			target: "render-tree",
		});
	});

	it("validates RenderTree JSON Schema before semantic validation", () => {
		const report = validateSchemaArtifact("render-tree", {
			version: "render-tree.v0.1",
			metadata: { id: "tree", title: "Top-level title is not allowed" },
			children: [],
		});

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "schema-invalid",
				path: ["metadata"],
			}),
		);
	});

	it("validates layout prop enums and number props", () => {
		const report = validateLayoutProps({
			type: "Layout.Flex",
			props: {
				direction: "diagonal",
				gap: "wide",
			},
		});

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-enum-value",
				path: ["props", "direction"],
			}),
		);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-layout-prop",
				path: ["props", "gap"],
			}),
		);
	});

	it("rejects agent results that contain free React or HTML code", () => {
		const report = validateAgentResult({
			renderTree: validRenderTree(),
			code: "export function Screen() { return (<div />); }",
		});

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "invalid-render-node",
				path: ["code"],
			}),
		);
	});
});

it("requires table-shaped generation records to consume real layout refs", () => {
	const result = validTableGenerationResult();
	const report = validateTableGenerationResult(result);

	expect(report.ok).toBe(true);
});

it("rejects table-shaped generation records with missing layout refs", () => {
	const result = validTableGenerationResult();
	delete (result.areas[0] as Record<string, unknown>).layout;
	const report = validateSchemaArtifact("table-generation-result", result);

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "schema-invalid",
			path: ["areas", 0],
		}),
	);
});

it("rejects table-shaped generation records with unknown layout ids", () => {
	const result = validTableGenerationResult();
	result.components[0].layout = "layout.composite.missingComponentPattern";
	const report = validateTableGenerationResult(result);

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "unknown-layout-ref",
			path: ["components", 0, "layout"],
		}),
	);
});

it("rejects table-shaped generation records with target/layout mismatches", () => {
	const result = validTableGenerationResult();
	result.areas[0].layout = "layout.region.plainStack";
	const report = validateTableGenerationResult(result);

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "unknown-layout-ref",
			path: ["areas", 0, "layout"],
		}),
	);
});

it("validates composition plan source refs against SourceSpec", () => {
	const sourceSpec = validSourceSpec();
	const report = validateCompositionPlan(
		{
			layoutStrategy: "Keep source order.",
			schemaVersion: "composition-plan.v0.1",
			screenLayout: "layout.screen.commerceDetailScreen",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["area-1", "missing-ref"],
					strategy: "Show content.",
					targetRegion: "contents",
				},
			],
		},
		{ sourceSpec },
	);

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "unknown-source-ref",
			path: ["sections", 0, "sourceRefs", 1],
			severity: "error",
		}),
	);
});

it("accepts composition plan source refs from SourceSpec source ids and role aliases", () => {
	const sourceSpec = validSourceSpec();
	sourceSpec.sourceShape.screen.regions[0].children[0].children[0].sourceId = "ActionButtonNext";
	sourceSpec.sourceShape.screen.regions[0].children[0].children[0].roleAlias = "PrimaryNextAction";
	const report = validateCompositionPlan(
		{
			layoutStrategy: "Keep source order.",
			schemaVersion: "composition-plan.v0.1",
			screenLayout: "layout.screen.commerceDetailScreen",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["ActionButtonNext", "PrimaryNextAction"],
					strategy: "Show content.",
					targetRegion: "contents",
				},
			],
		},
		{ sourceSpec },
	);

	expect(report.ok).toBe(true);
});

it("warns when composition plan source refs are not visible in generated artifacts", () => {
	const sourceSpec = validSourceSpec();
	const report = validateCompositionPlan(
		{
			layoutStrategy: "Keep source order.",
			schemaVersion: "composition-plan.v0.1",
			screenLayout: "layout.screen.commerceDetailScreen",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["area-1", "component-1"],
					strategy: "Show content.",
					targetRegion: "contents",
				},
			],
		},
		{
			generatedArtifact: { renderTree: { metadata: { id: "area-1" } } },
			sourceSpec,
		},
	);

	expect(report.ok).toBe(true);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "source-ref-not-materialized",
			path: ["sections", 0, "sourceRefs", 1],
			severity: "warning",
		}),
	);
});

function validRenderTree() {
	return {
		version: "render-tree.v0.1",
		metadata: { id: "tree" },
		children: [
			{
				type: "Screen",
				componentVersion: "0.1.0",
				metadata: { id: "screen", title: "Screen" },
				layout: "layout.screen.screenShell",
				children: [
					screenRegion("Screen.Header", "header"),
					{
						type: "Screen.Contents",
						metadata: { id: "contents", title: "Contents" },
						layout: "layout.region.plainStack",
						props: {
							layout: { direction: "column", gap: 12 },
							scroll: true,
						},
						children: [
							{
								type: "ActionButton",
								componentVersion: "1.0.0",
								metadata: { id: "cta", title: "CTA" },
								layout: "layout.composite.componentActionButton",
								props: {
									label: "가입하기",
									variant: "primary",
								},
							},
						],
					},
					screenRegion("Screen.Bottom", "bottom"),
				],
			},
		],
	};
}

function finalScreenRenderTreeExample() {
	return {
		version: "render-tree.v0.1",
		minRendererVersion: "0.1.0",
		metadata: {
			id: "NOVA-MBR-FP-001-0",
			author: "plus_x_author_1",
			createdAt: "2026-05-22T05:58:12.837Z",
			updatedAt: "2026-05-22T05:58:12.837Z",
		},
		theme: { mode: "light" },
		children: [
			{
				type: "Screen",
				componentVersion: "1.0.0",
				metadata: {
					id: "NOVA-MBR-FP-001-0",
					title: "약관 동의",
				},
				layout: "layout.screen.screenShell",
				children: [
					{
						type: "Screen.Header",
						componentVersion: "0.1.0",
						metadata: {
							id: "NOVA-MBR-FP-001-0.header",
							title: "고정 상단 영역",
						},
						children: [
							{
								type: "AppBar",
								componentVersion: "1.0.0",
								metadata: {
									id: "mbr-appbar-nova-mbr-fp-001-0",
									title: "약관 동의 상단 앱 바",
								},
								layout: "layout.composite.componentAppBar",
								props: {
									title: "약관 동의",
									showBack: true,
									showLogo: false,
								},
							},
						],
					},
					{
						type: "Screen.Contents",
						componentVersion: "0.1.0",
						metadata: {
							id: "NOVA-MBR-FP-001-0.contents",
							title: "스크롤 콘텐츠 영역",
						},
						children: [
							{
								type: "area.static",
								componentVersion: "1.0.0",
								metadata: {
									id: "ogn-mbr-term-list",
									title: "약관 목록 조회",
								},
								layout: "layout.area.accordionList",
								props: { name: "약관 목록 조회" },
								children: [
									{
										type: "list-cell",
										componentVersion: "1.0.0",
										metadata: {
											id: "list-cell-term-required",
											title: "list-cell-term-required",
										},
										layout: "layout.composite.componentListCell",
										props: {
											title: "[필수] 서비스 이용약관 동의",
											description: "회원 가입을 위해 반드시 동의가 필요합니다.",
										},
									},
								],
							},
						],
					},
					{
						type: "Screen.Bottom",
						componentVersion: "0.1.0",
						metadata: {
							id: "NOVA-MBR-FP-001-0.bottom",
							title: "고정 하단 영역",
						},
						children: [],
					},
				],
			},
		],
	};
}

function validSourceSpec(): SourceSpec {
	return {
		schemaVersion: "source-spec.v0.1" as const,
		sourceImport: {
			files: [],
			importId: "sample",
			receivedAt: "2026-05-27T00:00:00.000Z",
			sourceKind: "prdd-markdown-bundle" as const,
		},
		sourceShape: {
			screen: {
				name: "샘플",
				regions: [
					{
						children: [
							{
								children: [
									{
										kind: "component" as const,
										label: "ActionButton",
										sourceComponentId: "component-1",
									},
								],
								kind: "area" as const,
								sourceAreaId: "area-1",
							},
						],
						slot: "contents" as const,
					},
				],
				route: "/sample",
				screenCode: "SAMPLE",
			},
		},
	};
}

function screenRegion(type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom", id: string) {
	const base = {
		type,
		componentVersion: "0.1.0",
		metadata: { id, title: id },
		layout: id === "header" ? "layout.region.plainStack" : "layout.region.plainStack",
		props: {
			layout: { direction: "column" },
			position: "static",
		},
		children: [],
	};

	if (type === "Screen.Contents") {
		return {
			...base,
			props: {
				layout: { direction: "column" },
				scroll: true,
			},
		};
	}

	return base;
}

function validTableGenerationResult() {
	return {
		schemaVersion: "table-generation-result.v0.1",
		screen: {
			id: "screen-1",
			version: "0.1.0",
			metadata: { title: "Screen 1" },
			screenVariantId: "screen-1",
			layout: "layout.screen.commerceDetailScreen",
			screen: {
				type: "screen.page",
				regions: {
					header: tableRegion("Screen.Header", "plain-stack", [{ kind: "area", id: "area-1" }]),
					contents: tableRegion("Screen.Contents", "subscription-detail-rich-content", [
						{ kind: "area", id: "area-2" },
					]),
					bottom: tableRegion("Screen.Bottom", "commerce-detail-bottom-action", []),
				},
			},
		},
		areas: [
			{
				id: "area-1",
				version: "0.1.0",
				metadata: { title: "Header area" },
				layout: "layout.area.areaAppBar",
				type: "area.dynamic",
				children: [{ kind: "component", id: "appbar" }],
			},
		],
		components: [
			{
				id: "appbar",
				version: "0.1.0",
				metadata: { title: "App bar" },
				layout: "layout.composite.componentAppBar",
				type: "AppBar",
				children: [{ component: { type: "AppBar" }, props: { title: "Screen 1" } }],
			},
		],
	};
}

function tableRegion(
	type: "Screen.Bottom" | "Screen.Contents" | "Screen.Header",
	layoutId: string,
	children: Array<{ kind: "area" | "component"; id: string }>,
) {
	return {
		type,
		metadata: { title: type },
		layout: toRegionLayout(layoutId),
		children,
	};
}

function toRegionLayout(id: string) {
	return `layout.region.${id.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())}`;
}
