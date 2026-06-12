import { defineRule } from "./define-rule";
import { forEachSourcePropMismatch } from "./source-prop-mismatch";

/**
 * SourceSpec 문구 prop(string)의 리워딩은 UX 개선으로 허용한다 — error가 아니라
 * warning으로만 노출해 revision 루프를 강제하지 않는다. boolean/number 변조는
 * source-prop-mismatch(error)가 계속 막는다.
 */
export const sourceTextRewordedRule = defineRule({
	code: "source-text-reworded",
	target: "render-tree",
	requires: ["sourceSpec"],
	check(ctx) {
		forEachSourcePropMismatch(ctx, (mismatch) => {
			if (typeof mismatch.sourceValue !== "string") return;
			ctx.report({
				message: `RenderTree reworded SourceSpec copy ${mismatch.sourceRef}.${mismatch.propName}: source ${JSON.stringify(mismatch.sourceValue)}, received ${JSON.stringify(mismatch.renderValue)}.`,
				path: [...mismatch.path],
			});
		});
	},
});
