import { findLayoutPatternComponentByLayoutId } from "@cx/layout-pattern-store/components";

export function resolveLayout(input: { layoutId: string; props: Record<string, unknown> }) {
	const entry = findLayoutPatternComponentByLayoutId(input.layoutId);
	if (!entry) return undefined;

	return {
		Component: entry.component,
		componentProps: {
			props: input.props,
		},
		issues: [],
		pattern: entry.pattern,
	};
}
