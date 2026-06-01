import { componentCatalog } from "@cx/components/catalog";
import type { ComponentCatalog } from "@cx/components/types";
import type { SourceSpec } from "@cx/schema";
import {
	validateAgentResult,
	validateComponentProposal,
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

	it("reports RenderTree nodes without required layout refs", () => {
		const tree = validRenderTree();
		const contents = tree.children[0]?.children?.[1];
		const area = contents?.children?.[0] as { layout?: string } | undefined;
		if (!area) throw new Error("area node missing");
		delete area.layout;

		const report = validateRenderTree(tree, { componentCatalog: testCatalog });

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "required-field-missing",
				path: ["children", 0, "children", 1, "children", 0, "layout"],
			}),
		);
	});

	it("warns when visible metadata titles expose internal source names", () => {
		const tree = validRenderTree();
		const contents = tree.children[0]?.children?.[1];
		const area = contents?.children?.[0] as { metadata?: { title?: string } } | undefined;
		if (!area?.metadata) throw new Error("area node missing");
		area.metadata.title = "TermsSection";

		const report = validateRenderTree(tree, { componentCatalog: testCatalog });

		expect(report.ok).toBe(true);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "internal-visible-title",
				path: ["children", 0, "children", 1, "children", 0, "metadata", "title"],
				severity: "warning",
			}),
		);
	});

	it("warns when ListText dot rows omit visible subText", () => {
		const tree = validRenderTree();
		const contents = tree.children[0]?.children?.[1] as { children?: unknown[] } | undefined;
		if (!contents) throw new Error("contents node missing");
		contents.children = [
			{
				type: "ListText",
				componentVersion: "1.0.0",
				metadata: { id: "terms-list-row", title: "약관 목록 행" },
				layout: "layout.composite.componentListText",
				props: {
					table: "dot",
					title: "[필수] 서비스 이용약관",
				},
			},
		];

		const report = validateRenderTree(tree, { componentCatalog });

		expect(report.ok).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "list-text-dot-subtext-missing",
				path: ["children", 0, "children", 1, "children", 0, "props"],
				severity: "error",
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
	result.areas[0].layout = "layout.region.header";
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

it("warns when RenderTree layout refs are outside pattern candidates", () => {
	const report = validateRenderTree(validRenderTree(), {
		allowedLayoutIds: ["layout.screen.screenShell", "layout.region.header"],
		componentCatalog: testCatalog,
	});

	expect(report.ok).toBe(true);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "layout-ref-outside-candidates",
			path: ["children", 0, "children", 1, "children", 0, "layout"],
			severity: "warning",
		}),
	);
});

it("warns when SourceSpec refs are not visible in a generated RenderTree", () => {
	const report = validateRenderTree(validRenderTree(), {
		componentCatalog: testCatalog,
		sourceSpec: validSourceSpec(),
	});

	expect(report.ok).toBe(true);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "source-ref-not-materialized",
			severity: "warning",
		}),
	);
});

it("warns when stateful source surfaces have no state coverage", () => {
	const sourceSpec = validSourceSpec();
	sourceSpec.sourceShape.screen.name = "검색 결과 목록";

	const report = validateRenderTree(validRenderTree(), {
		componentCatalog: testCatalog,
		sourceSpec,
	});

	expect(report.ok).toBe(true);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "state-coverage-missing",
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
						layout: "layout.region.header",
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
						layout: "layout.region.header",
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
						layout: "layout.region.contents",
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
						layout: "layout.region.bottom",
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
		layout: readRegionLayout(type),
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

function readRegionLayout(type: "Screen.Header" | "Screen.Contents" | "Screen.Bottom") {
	if (type === "Screen.Header") return "layout.region.header";
	if (type === "Screen.Contents") return "layout.region.contents";
	return "layout.region.bottom";
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
					header: tableRegion("Screen.Header", [{ kind: "area", id: "area-1" }]),
					contents: tableRegion("Screen.Contents", [{ kind: "area", id: "area-2" }]),
					bottom: tableRegion("Screen.Bottom", []),
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
	children: Array<{ kind: "area" | "component"; id: string }>,
) {
	return {
		type,
		metadata: { title: type },
		layout: readRegionLayout(type),
		children,
	};
}

describe("validateComponentProposal", () => {
	const base = {
		schemaVersion: "component-proposal.v0.1" as const,
	};

	it("passes a bounded proposal with evidence and known catalog match", () => {
		const report = validateComponentProposal(
			{
				...base,
				proposals: [
					{
						id: "p1",
						proposedComponentType: "PriceCallout",
						rationale: "Source emphasizes total price",
						sourceEvidence: ["area.price"],
						nearestCatalogMatch: "Callout",
					},
				],
			},
			{ allowedRefs: ["area.price"], catalogComponentTypes: ["Callout"] },
		);

		expect(report.ok).toBe(true);
		expect(report.target).toBe("component-proposal");
	});

	it("flags proposal whose source evidence is not in allowedRefs", () => {
		const report = validateComponentProposal(
			{
				...base,
				proposals: [
					{
						id: "p1",
						proposedComponentType: "t",
						rationale: "r",
						sourceEvidence: ["area.unknown"],
						nearestCatalogMatch: "Callout",
					},
				],
			},
			{ allowedRefs: ["area.price"], catalogComponentTypes: ["Callout"] },
		);

		expect(report.ok).toBe(false);
		expect(report.issues.some((issue) => issue.code === "proposal-source-evidence-missing")).toBe(
			true,
		);
	});

	it("flags more than the allowed number of proposals", () => {
		const proposals = Array.from({ length: 6 }, (_unused, index) => ({
			id: `p${index}`,
			proposedComponentType: "t",
			rationale: "r",
			sourceEvidence: ["area.price"],
			nearestCatalogMatch: "Callout",
		}));
		const report = validateComponentProposal(
			{ ...base, proposals },
			{ allowedRefs: ["area.price"], catalogComponentTypes: ["Callout"], maxProposals: 5 },
		);

		expect(report.ok).toBe(false);
		expect(report.issues.some((issue) => issue.code === "proposal-limit-exceeded")).toBe(true);
	});
});

describe("validateRenderTree bottom CTA state gating", () => {
	function bottomCtaTree(displayA: unknown, displayB: unknown) {
		return {
			version: "render-tree.v0.1",
			metadata: { id: "tree" },
			children: [
				{
					type: "Screen",
					componentVersion: "0.1.0",
					metadata: { id: "screen", title: "Screen" },
					children: [
						{
							type: "Screen.Bottom",
							componentVersion: "0.1.0",
							metadata: { id: "bottom", title: "Bottom" },
							children: [
								{
									type: "ActionButton",
									componentVersion: "1.0.0",
									metadata: { id: "cta-a", title: "CTA A" },
									display: displayA,
									props: { label: "다음", variant: "primary" },
								},
								{
									type: "ActionButton",
									componentVersion: "1.0.0",
									metadata: { id: "cta-b", title: "CTA B" },
									display: displayB,
									props: { label: "다음", variant: "primary" },
								},
							],
						},
					],
				},
			],
		};
	}

	it("flags state-variant bottom CTAs that are not gated by display.when", () => {
		const report = validateRenderTree(
			bottomCtaTree({ stateRole: "disabled" }, { stateRole: "success" }),
			{ componentCatalog: testCatalog },
		);

		const flagged = report.issues.filter((issue) => issue.code === "bottom-cta-state-ungated");
		expect(flagged).toHaveLength(2);
		expect(report.ok).toBe(false);
	});

	it("accepts state-variant bottom CTAs gated by display.when", () => {
		const report = validateRenderTree(
			bottomCtaTree(
				{ stateRole: "disabled", when: { bind: "terms.notAllChecked", default: true } },
				{ stateRole: "success", when: { bind: "terms.allChecked", default: false } },
			),
			{ componentCatalog: testCatalog },
		);

		expect(report.issues.some((issue) => issue.code === "bottom-cta-state-ungated")).toBe(false);
	});

	it("does not flag a secondary+primary pair without state roles", () => {
		const report = validateRenderTree(bottomCtaTree(undefined, undefined), {
			componentCatalog: testCatalog,
		});

		expect(report.issues.some((issue) => issue.code === "bottom-cta-state-ungated")).toBe(false);
	});
});
