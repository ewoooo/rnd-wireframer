import { canonicalizeLayout } from "@cx/layout/canonicalize";
import * as LayoutRegistry from "@cx/layout/registry";
import { getLayoutCatalogEntry } from "@cx/layout/resolver";

export function resolveLayout(input: { layoutId: string; props: Record<string, unknown> }) {
	const key = canonicalizeLayout(input.layoutId);
	const Component = key
		? (LayoutRegistry as Record<string, ((props: Record<string, unknown>) => unknown) | undefined>)[
				key
			]
		: undefined;
	if (!Component) return undefined;

	const pattern = getLayoutCatalogEntry(input.layoutId);

	return {
		Component,
		componentProps: {
			props: input.props,
		},
		issues: [],
		pattern,
	};
}
