import { canonicalizeComponentType } from "@cx/external/resolver";
import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { walkTree } from "./helpers";

/**
 * ActionButton TwoButton CTA는 primaryText/secondaryText가 있으면 Default/2 조합이어야 한다.
 * type 누락 시 React component default와 catalog default가 보정하지만, 생성 산출물은
 * variant 의도를 명시해야 drift를 조기에 잡을 수 있다.
 */
export const actionButtonDefaultTypeMissingRule = defineRule({
	code: "action-button-default-type-missing",
	target: "render-tree",
	check(ctx) {
		walkTree(ctx.tree, (node, path) => {
			if (canonicalizeComponentType(String(node.type)) !== "kiki.ActionButton") return;
			const props = isRecord(node.props) ? node.props : undefined;
			if (!props) return;
			const isTwoButton = props.button === "2";
			const hasDefaultTexts =
				typeof props.primaryText === "string" && typeof props.secondaryText === "string";
			if (!isTwoButton || !hasDefaultTexts || props.type === "Default") return;
			ctx.report({
				message:
					"ActionButton with button='2' and primaryText/secondaryText must declare type='Default'. Otherwise the CTA can drift into another two-button variant.",
				path: [...path, "props", "type"],
			});
		});
	},
});
