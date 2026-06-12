import {
	canonicalizeComponentType,
	getComponentCatalogEntry,
	getTextPropSourceKeys,
} from "@cx/external/resolver";
import type { ComponentPropContract, ComponentPropType } from "@cx/schema";
import { toText } from "../runtime/text";
import type { RenderTreeNode } from "../tree/types";

export type RenderSlotNode = (node: RenderTreeNode) => unknown;

export type BuildComponentPropsOptions = {
	renderNode?: RenderSlotNode;
};

export function buildComponentProps(
	type: string,
	rawProps: Record<string, unknown> | undefined,
	options?: BuildComponentPropsOptions,
): Record<string, unknown> {
	const canonicalType = canonicalizeComponentType(type);
	const entry = canonicalType ? getComponentCatalogEntry(canonicalType) : undefined;
	if (!entry) return { ...(rawProps ?? {}) };

	const props = rawProps ?? {};
	const propKeys = new Set(Object.keys(entry.props));
	const out: Record<string, unknown> = {};
	for (const [key, contract] of Object.entries(entry.props)) {
		// aiWritable=false인 prop은 렌더러가 소유한다. RenderTree에 적힌 값을 받지 않는다.
		if (contract.aiWritable === false) continue;
		// RenderTree stores interaction intent as serializable data. React listener props
		// require functions, so string event ids must not be forwarded to components.
		if (isSerializedEventProp(key, contract)) continue;
		const raw = readCatalogPropValue(props, key, propKeys);
		if (raw === undefined) {
			if (contract.defaultValue !== undefined) out[key] = contract.defaultValue;
			continue;
		}
		const coerced = coercePropValue(raw, contract, options?.renderNode);
		if (coerced === DROP_PROP) continue;
		out[key] = coerced;
	}
	return out;
}

// node 계약 prop에 render-node가 적혔는데 해석 콜백이 없는 경로(레거시 직접 호출)에서만
// 사용한다. raw 객체가 React child로 새어 나가 크래시하는 것을 막는 마지막 안전판이며,
// 인터프리터 경로는 항상 renderNode를 공급하므로 이 분기에 도달하지 않는다.
const DROP_PROP = Symbol("cx.renderer.dropProp");

function isRenderNodeShape(value: unknown): value is RenderTreeNode {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const candidate = value as { metadata?: { id?: unknown }; type?: unknown };
	return typeof candidate.type === "string" && typeof candidate.metadata?.id === "string";
}

function readCatalogPropValue(
	props: Record<string, unknown>,
	key: string,
	propKeys: ReadonlySet<string>,
): unknown {
	if (props[key] !== undefined) return props[key];

	for (const sourceKey of getTextPropSourceKeys(key)) {
		if (sourceKey !== key && propKeys.has(sourceKey)) continue;
		if (props[sourceKey] !== undefined) return props[sourceKey];
	}

	const textValues = toRecord(props.texts);
	if (!textValues) return undefined;

	for (const sourceKey of getTextPropSourceKeys(key)) {
		if (sourceKey !== key && propKeys.has(sourceKey)) continue;
		if (textValues[sourceKey] !== undefined) return textValues[sourceKey];
	}
	return undefined;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	return value as Record<string, unknown>;
}

function coercePropValue(
	value: unknown,
	contract: ComponentPropContract,
	renderNode: RenderSlotNode | undefined,
): unknown {
	const coercer = PROP_VALUE_COERCERS[contract.type as ComponentPropType];
	if (!coercer) return value;
	const coerced = coercer(value, contract, renderNode);
	// null은 정당한 결과다(예: display.when이 거짓인 슬롯 노드). raw 값으로 되살리면
	// render-node 객체가 React child로 새어 나가므로 undefined만 폴백한다.
	return coerced === undefined ? value : coerced;
}

function isSerializedEventProp(key: string, contract: ComponentPropContract): boolean {
	return contract.role === "event" || (contract.type === "string" && /^on[A-Z]/.test(key));
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
	// 계약이 node인 prop에 render-node가 적혀 있으면 렌더를 보장한다(순수 해석기 책임).
	node: (value, _contract, renderNode) => {
		if (!isRenderNodeShape(value)) return value;
		return renderNode ? (renderNode(value) ?? null) : DROP_PROP;
	},
} satisfies Record<
	ComponentPropType,
	(value: unknown, contract: ComponentPropContract, renderNode?: RenderSlotNode) => unknown
>;

const BOOLEAN_TEXT_VALUE: Record<string, boolean> = {
	false: false,
	true: true,
};
