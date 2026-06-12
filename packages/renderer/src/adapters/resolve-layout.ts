import { canonicalizeLayout } from "@cx/layout/canonicalize";
import * as LayoutRegistry from "@cx/layout/registry";
import type { ComponentType } from "react";

export function resolveLayout(input: { layoutId: string; props: Record<string, unknown> }) {
	const key = canonicalizeLayout(input.layoutId);
	const Component = key
		? (LayoutRegistry as Record<string, ComponentType<Record<string, unknown>> | undefined>)[key]
		: undefined;
	if (!Component) return undefined;

	return {
		Component,
		componentProps: {
			props: input.props,
		},
	};
}
