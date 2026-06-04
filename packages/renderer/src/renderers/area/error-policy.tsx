import { cx, spacingFallbackStyleValue, spacingUtilityClass } from "@cx/layout/primitives";
import type { ReactNode } from "react";

import { ERROR_POLICY } from "./types";

/**
 * Dynamic 영역에 데이터가 없을 때 적용할 fallback JSX.
 *
 * 반환값:
 *   - null         → 영역 자체를 그리지 않음 (HIDE_AREA)
 *   - ReactNode    → 대체 표시 (HIDE_ITEM의 빈 area, SHOW_DEFAULT의 placeholder)
 *   - undefined    → 정책 미지정 / 알 수 없는 정책 → 호출자가 정상 렌더 fallback
 */
export function renderErrorPolicyFallback(
	policy: string | undefined,
	context: { areaId: string; areaName?: string; titleGap: number },
): ReactNode | null | undefined {
	if (!policy) return undefined;

	return ERROR_POLICY_FALLBACK_RENDERERS[policy]?.(context);
}

type ErrorPolicyFallbackContext = { areaId: string; areaName?: string; titleGap: number };

const ERROR_POLICY_FALLBACK_RENDERERS: Record<
	string,
	(context: ErrorPolicyFallbackContext) => ReactNode | null
> = {
	[ERROR_POLICY.HIDE_AREA]: () => null,
	[ERROR_POLICY.HIDE_ITEM]: (context) => (
		<section
			key={context.areaId}
			className={cx("flex w-full min-w-0 flex-col", spacingUtilityClass("gap", context.titleGap))}
			style={{ gap: spacingFallbackStyleValue(context.titleGap) }}
			data-area-empty="hide-item"
		>
			{context.areaName ? (
				<p className="text-base font-semibold text-muted-foreground">{context.areaName}</p>
			) : null}
		</section>
	),
	[ERROR_POLICY.SHOW_DEFAULT]: (context) => (
		<section
			key={context.areaId}
			className={cx(
				"flex w-full min-w-0 flex-col rounded-md border border-dashed bg-muted/30 p-3",
				spacingUtilityClass("gap", context.titleGap),
			)}
			style={{ gap: spacingFallbackStyleValue(context.titleGap) }}
			data-area-empty="show-default"
		>
			{context.areaName ? <p className="text-base font-semibold">{context.areaName}</p> : null}
			<p className="text-xs text-muted-foreground">기본값 표시 — 데이터 미수신</p>
		</section>
	),
};
