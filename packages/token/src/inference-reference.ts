import { SSOT_OBJECT_SCHEMA_VERSION, type TokenCatalogObject } from "@cx/schema";
import * as variables from "./generated/tokens";

export function resolveTokenCatalogForInference(): TokenCatalogObject {
	return {
		kind: "token-catalog",
		id: "default",
		owner: "@cx/tokens",
		sourceRef: "generated/tokens",
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			variables,
			tailwindKeys: Object.keys(variables)
				.filter((key) => key.startsWith("Spacing"))
				.map(toTailwindSpacingKey)
				.sort(),
		},
	};
}

function toTailwindSpacingKey(key: string): string {
	return `cx-${key.slice("Spacing".length).toLowerCase()}`;
}
