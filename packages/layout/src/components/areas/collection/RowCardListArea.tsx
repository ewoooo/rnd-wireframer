import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

// Canonical for rowCardListArea ≡ listSummaryCardArea (byte-identical defaults).
export const RowCardListArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "stack",
	gap: 0,
	paddingY: 0,
});
