import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { walkTree } from "./helpers";

export const singleSectionDividerRule = defineRule({
	code: "single-section-divider",
	target: "render-tree",
	check(ctx) {
		walkTree(ctx.tree, (node, path) => {
			if (node.type !== "Screen.Contents" || !Array.isArray(node.children)) return;
			const areaChildren = node.children.filter(isRecord);
			if (areaChildren.length !== 1) return;
			const area = areaChildren[0];
			if (!isRecord(area?.props) || area.props.divider !== "section") return;
			ctx.report({
				message:
					'Screen.Contents has a single section, so props.divider="section" is over-applied. Omit divider or use "none"; section dividers are only for boundaries between multiple contents sections.',
				path: [...path, "children", 0, "props", "divider"],
			});
		});
	},
});
