import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const ProductListChipSortArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "horizontal",
	gap: 8,
	paddingY: 0,
});
