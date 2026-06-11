import type { ReferenceCatalogEntry, ReferenceCatalogObject } from "@cx/schema";
import { SSOT_OBJECT_SCHEMA_VERSION } from "@cx/schema";
import { referenceAreaCatalog } from "../../docs/references/areas/catalog.generated";
import { referenceScreenCatalog } from "../../docs/references/screens/catalog.generated";
import { readAgentMarkdownDocument } from "../docs/package-markdown";
import { isReferenceCategory, REFERENCE_CATEGORIES, type ReferenceCategory } from "./categories";

// satisfies가 category 누락을 컴파일 타임에 강제한다(새 category 추가 시 여기 한 줄 필수).
const ENTRIES_BY_CATEGORY = {
	area: referenceAreaCatalog,
	screen: referenceScreenCatalog,
} satisfies Record<ReferenceCategory, ReferenceCatalogEntry[]>;

export function resolveReferenceForInference(
	category: string,
	mode: "catalog" | "index",
): ReferenceCatalogObject {
	if (!isReferenceCategory(category)) {
		throw new Error(`Unknown reference category: ${category}`);
	}
	const entries = ENTRIES_BY_CATEGORY[category];
	const documents = entries.map((entry) => ({
		...entry,
		body: mode === "catalog" ? readAgentMarkdownDocument(entry.sourceRef).body : undefined,
	}));
	return {
		kind: "reference-catalog",
		id: `${category}.${mode}`,
		owner: "@cx/agent",
		sourceRef: REFERENCE_CATEGORIES[category],
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: { category, mode, documents },
	};
}
