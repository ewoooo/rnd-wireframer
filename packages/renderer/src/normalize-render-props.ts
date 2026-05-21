import { toText } from "./runtime";

export function toNumber(value: unknown, fallback: number) {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
}

export function toButtonSize(value: unknown) {
	const size = toText(value, "xlarge");
	return ["large", "medium", "small", "xlarge", "xsmall"].includes(size)
		? (size as "large" | "medium" | "small" | "xlarge" | "xsmall")
		: "xlarge";
}

export function toButtonVariant(value: unknown) {
	const variant = toText(value, "primary");
	return ["primary", "secondary", "solid"].includes(variant)
		? (variant as "primary" | "secondary" | "solid")
		: "primary";
}

export function toDividerType(value: unknown) {
	const type = toText(value, "section");
	return type === "contents" ? "contents" : "section";
}
