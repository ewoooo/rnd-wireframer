import { collectionSectionDefaults, createCollectionArea } from "./CollectionArea";

export const HiddenTitlePagestackCardListArea = createCollectionArea({
	...collectionSectionDefaults,
	flow: "stack",
	gap: 12,
	itemTemplate: "card-0",
});
