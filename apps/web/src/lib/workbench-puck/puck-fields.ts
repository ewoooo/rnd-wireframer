import { getComponentCatalogEntry } from "@cx/external/resolver";
import type { Config } from "@puckeditor/core";

export function buildFieldsForNodeType(nodeType: string): Config["components"][string]["fields"] {
	const fields: Config["components"][string]["fields"] = {
		title: {
			label: "Title",
			type: "text",
		},
	};
	const entry = getComponentCatalogEntry(nodeType);

	for (const [propName, contract] of Object.entries(entry?.props ?? {})) {
		fields[propName] = buildFieldForPropContract(propName, contract);
	}

	if (!fields.variant) {
		fields.variant = {
			label: "Variant",
			type: "text",
		};
	}
	fields.nodePropsJson = {
		label: "Props JSON",
		type: "textarea",
	};
	return fields;
}

function buildFieldForPropContract(
	propName: string,
	contract: NonNullable<ReturnType<typeof getComponentCatalogEntry>>["props"][string],
) {
	const label = propName;
	if (contract.type === "enum" && contract.values?.length) {
		return {
			label,
			options: contract.values.map((value) => ({ label: value, value })),
			type: "select" as const,
		};
	}
	if (contract.type === "boolean") {
		return {
			label,
			options: [
				{ label: "true", value: true },
				{ label: "false", value: false },
			],
			type: "radio" as const,
		};
	}
	if (contract.type === "number") {
		return {
			label,
			type: "number" as const,
		};
	}
	if (contract.type === "array" || contract.type === "node") {
		return {
			label,
			type: "textarea" as const,
		};
	}
	return {
		label,
		type: "text" as const,
	};
}
