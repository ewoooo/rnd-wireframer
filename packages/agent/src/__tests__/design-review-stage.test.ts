import { describe, expect, it } from "vitest";
import { applyDesignReview } from "../design-review/apply-design-review";
import { reviewDesignTree } from "../design-review/review-design-tree";
import { materializeDecoratedAssetsToNodeTree } from "../database/register-assets-to-database-tables";
import type { DecoratedNodeTree } from "../types";

const tree: DecoratedNodeTree = {
	routes: [],
	variants: [],
	screens: [
		{
			id: "screen-1",
			name: "Screen",
			order: 1,
			children: {
				contents: [{ areaId: "area-form", order: 1 }],
			},
			pattern: { id: "screen-shell", variant: "default" },
		},
	],
	areas: [
		{
			level: "area",
			id: "area-form",
			name: "Form",
			order: 1,
			children: [
				{ componentId: "text-field-name", order: 1 },
				{ componentId: "action-area-next", order: 2 },
			],
			pattern: { id: "field-stack", variant: "default" },
		},
	],
	components: [
		{
			id: "text-field-name",
			name: "Name",
			order: 1,
			type: "text-field",
			props: { label: "이름" },
			pattern: { id: "component-text-field", variant: "default" },
		},
		{
			id: "action-area-next",
			name: "Next",
			order: 2,
			type: "button",
			props: { label: "다음" },
			hooks: [{ trigger: "onClick", action: "navigate", target: "screen-2" }],
			pattern: { id: "component-button", variant: "default" },
		},
	],
	warnings: [],
};

describe("design review stage", () => {
	it("reviews and applies primary CTA promotion", () => {
		const review = reviewDesignTree(tree);
		const result = applyDesignReview(tree, review);

		expect(review.operations).toHaveLength(1);
		expect(result.appliedOperationIds).toEqual(["move-action-area-next-to-bottom"]);
		expect(result.reviewed.areas.find((area) => area.id === "area-form")?.children).toEqual([
			{ componentId: "text-field-name", order: 1 },
		]);
		expect(result.reviewed.screens[0]?.children.bottom?.[0]?.areaId).toBe(
			"screen-1-bottom-actions",
		);
		expect(
			result.reviewed.areas.find((area) => area.id === "screen-1-bottom-actions")?.children,
		).toEqual([{ componentId: "action-area-next", order: 1 }]);
	});

	it("applies display updates to reviewed components", () => {
		const result = applyDesignReview(tree, {
			scope: { treeStage: "decorated", screenIds: ["screen-1"] },
			operations: [
				{
					id: "hide-error-message",
					operation: "setDisplay",
					componentId: "text-field-name",
					display: { when: { bind: "state.showName", default: false } },
					rationale: "Only show this node when the bound state is active.",
					designReferences: [
						{
							path: "docs/design/INTERACTION_PATTERNS.md",
							rationale: "Stateful visibility must be explicit.",
						},
					],
				},
			],
		});

		const component = result.reviewed.components.find(
			(candidate) => candidate.id === "text-field-name",
		);
		expect(component?.display).toEqual({ when: { bind: "state.showName", default: false } });
	});

	it("creates composite wrappers and materializes nested component entries", () => {
		const result = applyDesignReview(tree, {
			scope: { treeStage: "decorated", screenIds: ["screen-1"] },
			operations: [
				{
					id: "group-field-and-action",
					operation: "createComposite",
					composite: {
						id: "composite-name-submit",
						name: "Name submit group",
						componentIds: ["text-field-name", "action-area-next"],
						pattern: { id: "inline-field-action", variant: "default" },
					},
					replace: {
						areaId: "area-form",
						componentIds: ["text-field-name", "action-area-next"],
					},
					rationale: "The field and submit action should be handled as one form group.",
					designReferences: [
						{
							path: "docs/design/COMPOSITION_LAYERS.md",
							rationale: "Composite wrappers group components that form one interaction unit.",
						},
					],
				},
			],
		});

		expect(result.appliedOperationIds).toEqual(["group-field-and-action"]);
		expect(result.reviewed.areas.find((area) => area.id === "area-form")?.children).toEqual([
			{ componentId: "composite-name-submit", order: 1 },
		]);

		const materialized = materializeDecoratedAssetsToNodeTree(result.reviewed, {
			now: () => "2026-05-26T00:00:00.000Z",
		});
		const composite = materialized.components.find(
			(component) => component.id === "composite-name-submit",
		);
		expect(composite?.type).toBe("Layout.Flex");
		expect(composite?.children.map((child) => child.component.type)).toEqual([
			"text-field",
			"button",
		]);
	});

	it("applies region pattern updates on screen regions", () => {
		const result = applyDesignReview(tree, {
			scope: { treeStage: "decorated", screenIds: ["screen-1"] },
			operations: [
				{
					id: "set-bottom-region-pattern",
					operation: "updatePattern",
					target: { level: "region", id: "screen-1.bottom" },
					pattern: { id: "bottom-action-region", variant: "default" },
					rationale: "Bottom actions need a region-level layout recipe.",
					designReferences: [
						{
							path: "docs/design/LAYOUT_SPACING_CONTRACT.md",
							rationale: "Region spacing is owned by region layout patterns.",
						},
					],
				},
			],
		});

		expect(result.reviewed.screens[0]?.regionPatterns?.bottom).toEqual({
			id: "bottom-action-region",
			variant: "default",
		});
	});

	it("skips AI writes to non-writable catalog props", () => {
		const result = applyDesignReview(tree, {
			scope: { treeStage: "decorated", screenIds: ["screen-1"] },
			operations: [
				{
					id: "write-private-slot",
					operation: "updateComponentProps",
					componentId: "text-field-name",
					props: { rightElement: "bad-slot" },
					rationale: "Slots should not be authored by design review AI.",
					designReferences: [
						{
							path: "docs/design/COMPONENT_INVENTORY.md",
							rationale: "Component authoring is limited by component catalog contracts.",
						},
					],
				},
			],
		});

		expect(result.appliedOperationIds).toEqual([]);
		expect(result.skippedOperations[0]?.reason).toContain("not AI-writable");
	});
});
