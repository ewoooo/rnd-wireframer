import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const ProductOptionGridArea = createCollectionArea({
	...collectionSectionDefaults,
	columns: 2,
	flow: "grid",
	gap: 8,
	titleGap: 12,
});
