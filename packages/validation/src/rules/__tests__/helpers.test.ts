import { describe, expect, it } from "vitest";
import { walkTree } from "../helpers";

describe("walkTree", () => {
	const tree = {
		type: "Screen",
		children: [
			{
				type: "Screen.Bottom",
				children: [{ type: "ActionButton", props: { label: "확인" } }],
			},
		],
	};

	it("visits every record node with its path", () => {
		const visited: Array<{ type: unknown; path: Array<string | number> }> = [];
		walkTree(tree, (node, path) => {
			visited.push({ type: node.type, path });
		});
		expect(visited).toEqual([
			{ type: "Screen", path: [] },
			{ type: "Screen.Bottom", path: ["children", 0] },
			{ type: "ActionButton", path: ["children", 0, "children", 0] },
		]);
	});

	it("provides ancestors from root to parent", () => {
		let buttonAncestors: unknown[] = [];
		walkTree(tree, (node, _path, ancestors) => {
			if (node.type === "ActionButton") {
				buttonAncestors = ancestors.map((ancestor) => ancestor.type);
			}
		});
		expect(buttonAncestors).toEqual(["Screen", "Screen.Bottom"]);
	});

	it("ignores non-record nodes and walks array roots", () => {
		const visited: unknown[] = [];
		walkTree([null, "text", { type: "A" }], (node) => {
			visited.push(node.type);
		});
		expect(visited).toEqual(["A"]);
	});
});
