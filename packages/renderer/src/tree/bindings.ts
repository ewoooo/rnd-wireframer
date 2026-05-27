import { getByPath } from "./path";
import { isBindingValue, type PropBinding, type PropValue } from "./types";

const TEMPLATE_REGEX = /\{\{([^}]+)\}\}/g;
const TEMPLATE_BOUNDARY_REGEX = /\{\{|\}\}/g;
const EVENT_PREFIX = "event.";

export interface RuntimeContext {
	event?: unknown;
}

export function isEventReservedKey(key: string): boolean {
	return key === "event" || key.startsWith(EVENT_PREFIX);
}

export function resolveValue(
	value: PropValue,
	data: Record<string, unknown>,
	runtime?: RuntimeContext,
): unknown {
	if (isBindingValue(value)) {
		return resolveBinding(value, data, runtime);
	}

	if (typeof value === "string" && value.includes("{{")) {
		return resolveTemplateString(value, data, runtime);
	}

	if (Array.isArray(value)) {
		return value.map((item) => resolveValue(item, data, runtime));
	}

	if (typeof value === "object" && value !== null) {
		const resolved: Record<string, unknown> = {};
		for (const [key, nestedValue] of Object.entries(value)) {
			resolved[key] = resolveValue(nestedValue as PropValue, data, runtime);
		}
		return resolved;
	}

	return value;
}

export function resolveProps(
	props: Record<string, PropValue> | undefined,
	data: Record<string, unknown>,
	runtime?: RuntimeContext,
): Record<string, unknown> {
	if (!props) return {};

	const resolved: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		resolved[key] = resolveValue(value, data, runtime);
	}
	return resolved;
}

export function resolveDisplayWhen(
	when: PropBinding | boolean | undefined,
	data: Record<string, unknown>,
	runtime?: RuntimeContext,
): boolean {
	if (when === undefined) return true;
	return Boolean(resolveValue(when, data, runtime));
}

function resolveBinding(
	binding: PropBinding,
	data: Record<string, unknown>,
	runtime?: RuntimeContext,
): unknown {
	if (binding.bind.includes("{{")) {
		if (binding.default !== undefined && !allTemplateFieldsValid(binding.bind, data, runtime)) {
			return binding.default;
		}
		return resolveTemplateString(binding.bind, data, runtime);
	}

	const resolved = binding.bind.startsWith(EVENT_PREFIX)
		? getEventValue(binding.bind, runtime)
		: getByPath(data, binding.bind);

	return resolved !== undefined && resolved !== null ? resolved : binding.default;
}

function resolveTemplateString(
	template: string,
	data: Record<string, unknown>,
	runtime?: RuntimeContext,
): string {
	return template.replace(TEMPLATE_REGEX, (_match, expression) => {
		const key = String(expression).trim();
		const value = key.startsWith(EVENT_PREFIX) ? getEventValue(key, runtime) : getByPath(data, key);

		return value === undefined || value === null ? "" : String(value);
	});
}

function allTemplateFieldsValid(
	template: string,
	data: Record<string, unknown>,
	runtime?: RuntimeContext,
): boolean {
	const matches = template.match(TEMPLATE_REGEX);
	if (!matches) return true;

	return matches.every((match) => {
		const key = match.replace(TEMPLATE_BOUNDARY_REGEX, "").trim();
		const value = key.startsWith(EVENT_PREFIX) ? getEventValue(key, runtime) : getByPath(data, key);
		return value !== undefined && value !== null;
	});
}

function getEventValue(path: string, runtime?: RuntimeContext): unknown {
	if (!runtime?.event) return undefined;
	const eventPath = path.slice(EVENT_PREFIX.length);
	return getByPath(runtime.event, eventPath);
}
