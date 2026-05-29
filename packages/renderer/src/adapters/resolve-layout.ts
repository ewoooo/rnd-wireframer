import { resolvePatternComponent } from "@cx/layout-pattern-store/resolver";

export function resolveLayout(input: { layoutId: string; props: Record<string, unknown> }) {
	return resolvePatternComponent(input);
}
