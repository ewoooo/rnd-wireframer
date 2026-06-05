import { describe, expect, it } from "vitest";
import { parseDesignReview } from "../design-review/design-review-schema";

const designReference = {
	path: "docs/design/INTERACTION_PATTERNS.md",
	section: "CTA",
	rationale: "Primary navigation actions should be separated from inline content actions.",
} as const;

describe("design review schema", () => {
	it("accepts movement, pattern creation, and composite proposals with design references", () => {
		const review = parseDesignReview({
			scope: {
				treeStage: "decorated",
				screenIds: ["NOVA-MBR-FP-003-0"],
			},
			findings: [
				{
					id: "finding-auth-actions",
					title: "Auth actions are mixed into contents",
					description: "Retry and confirm actions need different interaction hierarchy.",
					affectedNodeIds: ["button-auth-retry", "action-area-auth-confirm"],
					designReferences: [designReference],
				},
			],
			operations: [
				{
					id: "move-auth-confirm",
					operation: "moveComponent",
					componentId: "action-area-auth-confirm",
					from: { areaId: "ogn-mbr-auth-request" },
					to: { screenId: "NOVA-MBR-FP-003-0", screenRegion: "bottom", placement: "last" },
					rationale: "Authentication confirm is the primary submit CTA.",
					designReferences: [designReference],
				},
				{
					id: "create-bottom-primary-pattern",
					operation: "createNewPattern",
					pattern: {
						id: "bottom-primary-cta",
						target: "composite",
						name: "Bottom Primary CTA",
						description: "A single full-width primary action pinned to the bottom region.",
						variants: {
							default: {
								direction: "vertical",
								layoutProps: {
									fullWidth: true,
									size: "xlarge",
								},
							},
						},
					},
					applyTo: [{ level: "component", id: "action-area-auth-confirm" }],
					rationale: "The current component-button pattern does not encode bottom CTA intent.",
					designReferences: [designReference],
				},
				{
					id: "group-auth-retry-and-field",
					operation: "createComposite",
					composite: {
						id: "auth-code-request-group",
						name: "Auth code request group",
						componentIds: ["text-field-auth-code", "button-auth-retry"],
						pattern: { id: "auth-code-request", variant: "default" },
					},
					replace: {
						areaId: "ogn-mbr-auth-request",
						componentIds: ["text-field-auth-code", "button-auth-retry"],
					},
					rationale: "Retry is an inline secondary action tied to the auth code field.",
					designReferences: [designReference],
				},
			],
		});

		expect(review.version).toBe("1.0.0");
		expect(review.operations.map((operation) => operation.operation)).toEqual([
			"moveComponent",
			"createNewPattern",
			"createComposite",
		]);
	});

	it("rejects operations without docs/design references", () => {
		expect(() =>
			parseDesignReview({
				scope: { treeStage: "decorated" },
				operations: [
					{
						id: "move-without-reference",
						operation: "moveComponent",
						componentId: "action-area-next",
						from: { areaId: "ogn-mbr-member-input" },
						to: { screenRegion: "bottom" },
						rationale: "Primary action should be promoted.",
						designReferences: [],
					},
				],
			}),
		).toThrow();
	});
});
