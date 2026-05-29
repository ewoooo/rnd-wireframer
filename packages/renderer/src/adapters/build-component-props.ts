import type { ComponentPropContract, ComponentPropType } from "@cx/components/catalog";
import { getComponentCatalogEntry } from "@cx/components/catalog";
import { toText } from "../runtime/text";

export interface CatalogPropFallbacks {
	[propName: string]: unknown;
}

export function buildComponentProps(
	type: string,
	rawProps: Record<string, unknown> | undefined,
	fallbacks: CatalogPropFallbacks = {},
): Record<string, unknown> {
	const entry = getComponentCatalogEntry(type);
	if (!entry) return { ...(rawProps ?? {}) };

	const props = rawProps ?? {};
	const out: Record<string, unknown> = {};
	for (const [key, contract] of Object.entries(entry.props)) {
		const rawFromProps = readCatalogPropValue(props, key);
		if (contract.aiWritable === false && rawFromProps === undefined) continue;
		const raw = rawFromProps !== undefined ? rawFromProps : fallbacks[key];
		if (raw === undefined) {
			if (contract.defaultValue !== undefined) out[key] = contract.defaultValue;
			continue;
		}
		out[key] = coercePropValue(raw, contract);
	}
	return out;
}

function readCatalogPropValue(props: Record<string, unknown>, key: string): unknown {
	if (props[key] !== undefined) return props[key];

	const textValues = toRecord(props.texts);
	if (!textValues) return undefined;

	for (const sourceKey of CATALOG_TEXT_PROP_SOURCE_KEYS[key] ?? [key]) {
		if (textValues[sourceKey] !== undefined) return textValues[sourceKey];
	}
	return undefined;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

function coercePropValue(value: unknown, contract: ComponentPropContract): unknown {
	return PROP_VALUE_COERCERS[contract.type as ComponentPropType]?.(value, contract) ?? value;
}

const PROP_VALUE_COERCERS = {
	string: (value) => (typeof value === "string" ? value : toText(value, "")),
	boolean: (value) => {
		if (typeof value === "boolean") return value;
		if (typeof value === "string") return BOOLEAN_TEXT_VALUE[value] ?? Boolean(value);
		return Boolean(value);
	},
	number: (value, contract) => {
		if (typeof value === "number") return value;
		if (typeof value === "string") {
			const n = Number(value);
			if (Number.isFinite(n)) return n;
		}
		return contract.defaultValue;
	},
	enum: (value, contract) => {
		const text = toText(value, "");
		if (contract.values?.includes(text)) return text;
		return contract.defaultValue;
	},
	array: (value, contract) => (Array.isArray(value) ? value : (contract.defaultValue ?? [])),
	node: (value) => value,
} satisfies Record<ComponentPropType, (value: unknown, contract: ComponentPropContract) => unknown>;

const BOOLEAN_TEXT_VALUE: Record<string, boolean> = {
	false: false,
	true: true,
};

const CATALOG_TEXT_PROP_SOURCE_KEYS: Record<string, readonly string[]> = {
	description: ["description", "descriptionText", "body", "bodyText", "slot"],
	label: ["label", "labelText", "text", "main"],
	priceText: ["priceText", "price", "value"],
	rightText: ["rightText", "value"],
	subText: ["subText", "subtitle", "description"],
	title: ["title", "titleText", "titleLabel", "main"],
	titleContent: ["titleContent", "title", "titleText", "titleLabel", "main"],
};
