import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { walkTree } from "./helpers";

/**
 * Screen.Bottom의 state-variant CTA가 display.when 없이 항상 렌더되어 CTA가 중복 노출되는 것을 막는다.
 * 비-base display.stateRole을 가진 ActionButton은 display.when으로 게이팅돼야 한다.
 */
export const bottomCtaStateUngatedRule = defineRule({
	code: "bottom-cta-state-ungated",
	target: "render-tree",
	check(ctx) {
		walkTree(ctx.tree, (node, path, ancestors) => {
			if (node.type !== "ActionButton") return;
			if (!ancestors.some((ancestor) => ancestor.type === "Screen.Bottom")) return;
			const display = isRecord(node.display) ? node.display : undefined;
			const stateRole = display?.stateRole;
			const hasWhen = display !== undefined && "when" in display && display.when !== undefined;
			if (typeof stateRole !== "string" || stateRole === "base" || hasWhen) return;
			ctx.report({
				message: `Bottom ActionButton declares state '${stateRole}' without display.when, so multiple CTAs render at once. Gate state-variant CTAs with display.when or use a single CTA.`,
				path: [...path, "display", "when"],
			});
		});
	},
});
