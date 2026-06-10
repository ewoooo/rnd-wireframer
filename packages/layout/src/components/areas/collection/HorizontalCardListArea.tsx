import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const HorizontalCardListArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "horizontal",
	gap: 12,
	paddingY: 0,
});
