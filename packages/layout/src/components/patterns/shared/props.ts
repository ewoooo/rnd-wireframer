import type { PageStackProps } from "@cx/layout/primitives";

export function toNumber(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function toBoolean(value: unknown): boolean | undefined {
	return typeof value === "boolean" ? value : undefined;
}

export function toPageStackItemTemplate(
	value: unknown,
): PageStackProps["itemTemplate"] | undefined {
	return value === "card-0" || value === "default-20" || value === "plain" ? value : undefined;
}
