import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { type RendererDefinition, RendererRegistry } from "../registry";
import { rendererRegistry, renderNode } from "../renderer";
import type { RenderTreeNode } from "../schema";

function createNode(overrides: Partial<RenderTreeNode> = {}): RenderTreeNode {
	return {
		type: "UnknownThing",
		componentVersion: "1.0.0",
		metadata: {
			id: "node-1",
			title: "Fallback title",
			author: "test",
			createdAt: "2026-05-21T00:00:00.000Z",
			updatedAt: "2026-05-21T00:00:00.000Z",
		},
		...overrides,
	};
}

describe("@cx/renderer registry", () => {
	it("registers and reads renderer definitions", () => {
		const registry = new RendererRegistry();
		const definition: RendererDefinition = {
			kind: "fallback",
			render: ({ node }) => <span>{node.metadata.title}</span>,
		};

		registry.register(definition);

		expect(registry.has("fallback")).toBe(true);
		expect(registry.getKinds()).toEqual(["fallback"]);
	});

	it("renders unknown nodes through fallback renderer", () => {
		render(renderNode(createNode(), {}));

		expect(screen.getByText("Fallback title")).toBeInTheDocument();
	});

	it("renders registered component mapping", () => {
		render(
			renderNode(
				createNode({
					type: "SectionHeader",
					props: {
						title: "가입 안내",
						description: "필수 정보를 확인하세요",
					},
				}),
				{},
			),
		);

		expect(screen.getByText("가입 안내")).toBeInTheDocument();
		expect(screen.getByText("필수 정보를 확인하세요")).toBeInTheDocument();
	});

	it("exposes default renderer registry", () => {
		expect(rendererRegistry.has("section-header")).toBe(true);
		expect(rendererRegistry.has("fallback")).toBe(true);
	});
});
