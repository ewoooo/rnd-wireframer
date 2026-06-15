import { componentCatalog } from "@cx/external/resolver";
import type { ComponentCatalog, SourceSpec } from "@cx/schema";
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
		source: "kiki-barrel",
		label: "ActionButton",
		version: "1.0.0",
		kind: "action",
		props: {
			label: { type: "string", required: true },
			variant: { type: "enum", values: ["primary", "secondary"] },
			disabled: { type: "boolean" },
			rightIcon: { type: "node", aiWritable: false },
			// action-button-label-missing rule은 전역 카탈로그로 캐논화하므로
			// 픽스처 leaf가 라벨을 갖춰야 한다 — 그 라벨 prop을 계약에 둔다.
			button: { type: "enum", values: ["1", "2"] },
			primaryText: { type: "string" },
		},
	},
} satisfies ComponentCatalog;

describe("@cx/validation validators", () => {
	it("flags use of a candidate-status component as a bounded warning", () => {
		const tree = {
			version: "render-tree.v0.1",
			metadata: { id: "tree" },
			children: [
				{
					type: "Screen",
					componentVersion: "0.1.0",
					metadata: { id: "screen", title: "Screen" },
					layout: "layout.screen.mobileScreen",
					children: [
						screenRegion("Screen.Header", "header"),
						{
							type: "Screen.Contents",
							metadata: { id: "contents", title: "Contents" },
							layout: "layout.region.header",
							props: { layout: { direction: "column", gap: 12 }, scroll: true },
							children: [
								{
									type: "kiki.ActionButton",
									componentVersion: "1.0.0",
									metadata: { id: "auth-method", title: "candidate-cta" },
									layout: "layout.composite.componentActionButton",
									props: { button: "1", primaryText: "candidate" },
								},
							],
						},
						screenRegion("Screen.Bottom", "bottom"),
					],
				},
			],
		};

		const report = validateRenderTree(tree, { componentCatalog });
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "uses-candidate-component",
				severity: "warning",
				path: ["children", 0, "children", 1, "children", 0, "type"],
			}),
		);
		// warning does not flip the report to not-ok on its own
		expect(report.issues.filter((issue) => issue.code === "uses-candidate-component")).toHaveLength(
			1,
		);
	});

	it("treats a source ref as materialized when its label text is present (folded into a prop)", () => {
		const sourceSpec = {
			schemaVersion: "source-spec.v0.1",
			sourceImport: {
				files: [],
				importId: "s",
				receivedAt: "2026-01-01T00:00:00.000Z",
				sourceKind: "markdown",
			},
			sourceShape: {
				screen: {
					name: "S",
					route: "/s",
					screenCode: "S",
					regions: [
						{
							slot: "contents",
							children: [
								{
									kind: "area",
									sourceAreaId: "area-1",
									children: [
										{
											kind: "component",
											sourceComponentId: "Button",
											sourceId: "ButtonAuthCodeRequest",
											label: "ButtonAuthCodeRequest",
											props: { label: "인증번호 요청" },
										},
									],
								},
							],
						},
					],
				},
			},
		} as unknown as SourceSpec;

		const plan = {
			density: "medium",
			layoutStrategy: "x",
			patternRationale: "x",
			primaryUserAction: "x",
			rejectedPatterns: [],
			schemaVersion: "composition-plan.v0.1",
			screenLayout: "layout.screen.mobileScreen",
			sectionRhythm: "x",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["ButtonAuthCodeRequest"],
					strategy: "x",
					targetRegion: "contents",
				},
			],
			visualHierarchy: "x",
		};
		// Output folds the button into a TextField prop: label text present, id absent.
		const generatedArtifact = {
			renderTree: { children: [{ type: "TextField", props: { buttonLabel: "인증번호 요청" } }] },
		};

		const report = validateCompositionPlan(plan, { sourceSpec, generatedArtifact });
		expect(report.issues.some((issue) => issue.code === "source-ref-not-materialized")).toBe(false);
	});

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

	it("canonicalizes bare node types to kiki. catalog keys for prop-level validation", () => {
		// validRenderTree의 leaf는 bare "ActionButton" + props { label, variant } —
		// 실제 카탈로그(kiki.ActionButton)로 캐논화되어 prop 단위 검증이 수행된다.
		const report = validateRenderTree(validRenderTree(), { componentCatalog });

		// canRenderNodeType 통과: bare type이라도 unknown-component-type이 아니다.
		expect(report.issues.some((issue) => issue.code === "unknown-component-type")).toBe(false);

		const leafPropsPath = ["children", 0, "children", 1, "children", 0, "props"];
		// 계약에 없는 prop은 unknown-prop 경고.
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-prop",
				path: [...leafPropsPath, "label"],
				severity: "warning",
			}),
		);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-prop",
				path: [...leafPropsPath, "variant"],
				severity: "warning",
			}),
		);
		// text/left는 툴팁 표면이라 더이상 required가 아니다 — 누락해도 에러 없음.
		// CTA 라벨 보장은 action-button-label-missing rule이 담당한다.
		expect(report.issues.some((issue) => issue.code === "required-field-missing")).toBe(false);
		expect(report.issues.some((issue) => issue.code === "action-button-label-missing")).toBe(
			false,
		);
	});

	it("canonicalizes bare types against an injected kiki.-keyed catalog", () => {
		const kikiCatalog = {
			"kiki.ActionButton": { ...testCatalog.ActionButton, type: "kiki.ActionButton" },
		} satisfies ComponentCatalog;

		const report = validateComponentUsage(
			{ type: "ActionButton", props: { label: "가입하기", trackingId: "cta-1" } },
			{ componentCatalog: kikiCatalog },
		);

		expect(report.issues.some((issue) => issue.code === "unknown-component-type")).toBe(false);
		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "unknown-prop",
				path: ["props", "trackingId"],
				severity: "warning",
			}),
		);
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

		// bare "ActionButton"이 전역 카탈로그의 kiki.ActionButton(draft)으로 캐논화되어
		// candidate 경고 1건이 의도적으로 표면화된다 (오류는 0).
		expect(report).toMatchObject({
			ok: true,
			summary: {
				errorCount: 0,
				warningCount: 1,
			},
			target: "render-tree",
		});
		expect(report.issues).toContainEqual(
			expect.objectContaining({ code: "uses-candidate-component", severity: "warning" }),
		);
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
					button: "1",
					primaryText: "계속하기",
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
				code: "invalid-prop-type",
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

it("flags unknown composition plan source refs as a non-blocking warning", () => {
	const sourceSpec = validSourceSpec();
	const report = validateCompositionPlan(
		{
			density: "medium",
			compositionProposal: { recommendedAreas: [], shouldChangeAreaComposite: false },
			designTrace: { usedReferenceIds: [], usedSkillIds: [] },
			currentFitAssessment: { problems: [], supportsJudgment: true },
			layoutStrategy: "Keep source order.",
			patternRationale: "Use detail composition because the source has one content area.",
			primaryUserAction: "continue",
			rejectedPatterns: [],
			schemaVersion: "composition-plan.v0.1",
			screenLayout: "layout.screen.mobileScreen",
			sectionRhythm: "Single content section with no extra divider cadence.",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["area-1", "missing-ref"],
					strategy: "Show content.",
					targetRegion: "contents",
				},
			],
			visualHierarchy: "Content first, then action.",
		},
		{ sourceSpec },
	);

	// sourceRef는 추적 메타데이터일 뿐 렌더 결과물 정합성이 아니므로,
	// 형식/매칭 실패는 hard-fail이 아니라 warning으로만 표시한다.
	expect(report.ok).toBe(true);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "unknown-source-ref",
			path: ["sections", 0, "sourceRefs", 1],
			severity: "warning",
		}),
	);
});

it("accepts composition plan source refs from SourceSpec source ids and role aliases", () => {
	const sourceSpec = validSourceSpec();
	sourceSpec.sourceShape.screen.regions[0].children[0].children[0].sourceId = "ActionButtonNext";
	sourceSpec.sourceShape.screen.regions[0].children[0].children[0].roleAlias = "PrimaryNextAction";
	const report = validateCompositionPlan(
		{
			density: "medium",
			compositionProposal: { recommendedAreas: [], shouldChangeAreaComposite: false },
			designTrace: { usedReferenceIds: [], usedSkillIds: [] },
			currentFitAssessment: { problems: [], supportsJudgment: true },
			layoutStrategy: "Keep source order.",
			patternRationale: "Use detail composition because the source has one content area.",
			primaryUserAction: "continue",
			rejectedPatterns: [],
			schemaVersion: "composition-plan.v0.1",
			screenLayout: "layout.screen.mobileScreen",
			sectionRhythm: "Single content section with no extra divider cadence.",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["ActionButtonNext", "PrimaryNextAction"],
					strategy: "Show content.",
					targetRegion: "contents",
				},
			],
			visualHierarchy: "Content first, then action.",
		},
		{ sourceSpec },
	);

	expect(report.ok).toBe(true);
});

it("warns when composition plan source refs are not visible in generated artifacts", () => {
	const sourceSpec = validSourceSpec();
	const report = validateCompositionPlan(
		{
			density: "medium",
			compositionProposal: { recommendedAreas: [], shouldChangeAreaComposite: false },
			designTrace: { usedReferenceIds: [], usedSkillIds: [] },
			currentFitAssessment: { problems: [], supportsJudgment: true },
			layoutStrategy: "Keep source order.",
			patternRationale: "Use detail composition because the source has one content area.",
			primaryUserAction: "continue",
			rejectedPatterns: [],
			schemaVersion: "composition-plan.v0.1",
			screenLayout: "layout.screen.mobileScreen",
			sectionRhythm: "Single content section with no extra divider cadence.",
			sections: [
				{
					priority: 1,
					role: "content",
					sourceRefs: ["area-1", "component-1"],
					strategy: "Show content.",
					targetRegion: "contents",
				},
			],
			visualHierarchy: "Content first, then action.",
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
		allowedLayoutIds: ["layout.screen.mobileScreen", "layout.region.header"],
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

it("errors when RenderTree changes primitive SourceSpec props", () => {
	const sourceSpec = validSourceSpec();
	sourceSpec.sourceShape.screen.regions = [
		{
			children: [
				{
					children: [
						{
							kind: "component",
							label: "가입 완료 상단 앱 바",
							props: {
								showBack: false,
								showLogo: true,
								title: "가입 완료",
							},
							roleAlias: "AppBarHeader",
							sourceComponentId: "component-appbar",
							sourceId: "AppBarHeader",
						},
					],
					kind: "area",
					sourceAreaId: "area-header",
				},
			],
			slot: "header",
		},
	];
	const tree = appBarOnlyRenderTree({
		showBack: false,
		showLogo: false,
		title: "가입 완료",
	});

	const report = validateRenderTree(tree, {
		componentCatalog,
		generatedArtifact: tree,
		sourceSpec,
	});

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "source-prop-mismatch",
			path: ["children", 0, "children", 0, "children", 0, "props", "showLogo"],
			severity: "error",
		}),
	);
});

it("errors when a single contents section uses a section divider", () => {
	const tree = singleContentsSectionRenderTree({ divider: "section" });

	const report = validateRenderTree(tree, { componentCatalog });

	expect(report.ok).toBe(false);
	expect(report.issues).toContainEqual(
		expect.objectContaining({
			code: "single-section-divider",
			path: ["children", 0, "children", 1, "children", 0, "props", "divider"],
			severity: "error",
		}),
	);
});

it("allows section dividers when contents has multiple sections", () => {
	const tree = singleContentsSectionRenderTree({ divider: "section" });
	const contents = tree.children[0]?.children?.[1];
	if (!contents) throw new Error("contents node missing");
	contents.children.push({
		type: "area.static",
		componentVersion: "1.0.0",
		metadata: { id: "secondary-section", title: "보조 섹션" },
		layout: "layout.area.fieldStack",
		props: { divider: "none" },
		children: [],
	});

	const report = validateRenderTree(tree, { componentCatalog });

	expect(report.issues.some((issue) => issue.code === "single-section-divider")).toBe(false);
});

it("does not warn for purely numeric source refs (structural order sentinels)", () => {
	const sourceSpec = validSourceSpec();
	sourceSpec.sourceShape.screen.regions[0].children[0].sourceAreaId = "999";

	const report = validateRenderTree(validRenderTree(), {
		componentCatalog: testCatalog,
		sourceSpec,
	});

	const notMaterialized = report.issues.filter(
		(issue) => issue.code === "source-ref-not-materialized",
	);
	expect(notMaterialized.some((issue) => issue.message.includes("999"))).toBe(false);
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
				layout: "layout.screen.mobileScreen",
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
									button: "1",
									primaryText: "가입하기",
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
				layout: "layout.screen.mobileScreen",
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
								type: "kiki.AppBar",
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
										type: "kiki.ListText",
										componentVersion: "1.0.0",
										metadata: {
											id: "list-text-term-required",
											title: "list-text-term-required",
										},
										layout: "layout.composite.componentListText",
										props: {
											title: "[필수] 서비스 이용약관 동의",
											subText: "회원 가입을 위해 반드시 동의가 필요합니다.",
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
			sourceKind: "markdown" as const,
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

function appBarOnlyRenderTree(props: Record<string, unknown>) {
	return {
		version: "render-tree.v0.1",
		metadata: { id: "tree" },
		children: [
			{
				type: "Screen",
				componentVersion: "0.1.0",
				metadata: { id: "screen", title: "Screen" },
				layout: "layout.screen.mobileScreen",
				children: [
					{
						...screenRegion("Screen.Header", "header"),
						children: [
							{
								type: "kiki.AppBar",
								componentVersion: "1.0.0",
								metadata: { id: "AppBarHeader", title: "가입 완료 상단 앱 바" },
								layout: "layout.composite.componentAppBar",
								props,
							},
						],
					},
					screenRegion("Screen.Contents", "contents"),
					screenRegion("Screen.Bottom", "bottom"),
				],
			},
		],
	};
}

function singleContentsSectionRenderTree(props: Record<string, unknown>) {
	return {
		version: "render-tree.v0.1",
		metadata: { id: "tree" },
		children: [
			{
				type: "Screen",
				componentVersion: "0.1.0",
				metadata: { id: "screen", title: "Screen" },
				layout: "layout.screen.mobileScreen",
				children: [
					screenRegion("Screen.Header", "header"),
					{
						type: "Screen.Contents",
						componentVersion: "0.1.0",
						metadata: { id: "contents", title: "Contents" },
						layout: "layout.region.contents",
						props: { scroll: true },
						children: [
							{
								type: "area.static",
								componentVersion: "1.0.0",
								metadata: { id: "primary-section", title: "주요 섹션" },
								layout: "layout.area.fieldStack",
								props,
								children: [],
							},
						],
					},
					screenRegion("Screen.Bottom", "bottom"),
				],
			},
		],
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
			layout: "layout.screen.mobileScreen",
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
						kind: "source-gap",
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
						kind: "source-gap",
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
			kind: "source-gap" as const,
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

describe("validateRenderTree ActionButton variant intent", () => {
	it("errors when a TwoButton CTA has primary/secondary text but omits Default type", () => {
		const tree = {
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
									type: "kiki.ActionButton",
									componentVersion: "0.0.0",
									metadata: { id: "ActionButtonHome", title: "후속 동선 CTA" },
									props: {
										button: "2",
										text: "홈으로",
										left: 0,
										primaryText: "홈으로",
										secondaryText: "내 정보로",
									},
								},
							],
						},
					],
				},
			],
		};

		const report = validateRenderTree(tree, { componentCatalog });

		expect(report.issues).toContainEqual(
			expect.objectContaining({
				code: "action-button-default-type-missing",
				path: ["children", 0, "children", 0, "children", 0, "props", "type"],
				severity: "error",
			}),
		);
	});
});
