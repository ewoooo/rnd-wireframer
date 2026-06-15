import { canonicalizeComponentType } from "@cx/external/resolver";
import { isRecord } from "@cx/schema";
import { defineRule } from "./define-rule";
import { walkTree } from "./helpers";

/**
 * Default 변형 ActionButton은 라벨 prop이 없으면 React 기본값 "버튼"으로 렌더된다
 * (button 생략 시 "2" → "버튼 | 버튼"). 카탈로그가 라벨을 required로 강제할 수 없는
 * 이유는 Ai/Gift 변형이 다른 라벨 prop을 쓰기 때문 — 그래서 변형별 라벨 요구를
 * 여기서 deterministic하게 잡는다. text/left(툴팁 표면)는 라벨이 아니다.
 */
export const actionButtonLabelMissingRule = defineRule({
	code: "action-button-label-missing",
	target: "render-tree",
	check(ctx) {
		walkTree(ctx.tree, (node, path) => {
			if (canonicalizeComponentType(String(node.type)) !== "kiki.ActionButton") return;
			const props = isRecord(node.props) ? node.props : {};
			const variant = typeof props.type === "string" ? props.type : "Default";
			if (variant !== "Default") return;

			const button = typeof props.button === "string" ? props.button : "2";
			const hasPrimary = typeof props.primaryText === "string" && props.primaryText.length > 0;
			const hasSecondary =
				typeof props.secondaryText === "string" && props.secondaryText.length > 0;

			if (button === "1" && !hasPrimary) {
				ctx.report({
					message:
						"ActionButton(Default, button='1') needs primaryText for the CTA label. Without it the button renders the placeholder '버튼'. text/left are tooltip props, not the label.",
					path: [...path, "props"],
				});
				return;
			}
			if (button === "2" && (!hasPrimary || !hasSecondary)) {
				ctx.report({
					message:
						"ActionButton(Default, button='2') needs both secondaryText(left) and primaryText(right). Missing labels render as '버튼 | 버튼'. For a single CTA use button='1' + primaryText.",
					path: [...path, "props"],
				});
			}
		});
	},
});
