import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

// Canonical for filterChipTextListArea ≡ productListGroupArea (byte-identical defaults).
export const FilterChipTextListArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "stack",
	gap: 16,
	titleGap: 12,
});
