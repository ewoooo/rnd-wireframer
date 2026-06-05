import type { ComponentCatalog } from "../public/types";

export const candidateCatalogEntries = {
	RadioGroup: {
		type: "RadioGroup",
		source: "react-component",
		version: "1.0.0",
		aliases: ["radio-group"],
		props: {
			options: { type: "array", role: "data" },
			selectedValue: { type: "string", role: "value" },
			label: { type: "string", role: "label" },
		},
	},
} as const satisfies ComponentCatalog;
