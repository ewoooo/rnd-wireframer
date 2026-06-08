import {
	componentCatalog,
	getComponentCatalogEntry,
	getComponentCatalogStatus,
	getComponentCatalogTypes,
} from "@cx/components/catalog";
import {
	resolveCompositeLayoutByComponentType,
	resolveRegionLayoutFromScreenLayout,
} from "@cx/layout-pattern-store/resolver";

import type {
	ScreenGenerationReferences,
	ScreenGenerationReferencesInput,
} from "../../public/types";
import { loadDesignContextBundleContents } from "./design-context-catalog";
import { loadGenerationSkillCatalog } from "./skill-catalog";

export function createDefaultScreenGenerationReferences(): ScreenGenerationReferences {
	return {
		// Default component adapter. The key names are the public references contract;
		// callers may replace implementations, but pipeline code reads these names.
		componentCatalogs: {
			getEntry: getComponentCatalogEntry,
			getStatus: getComponentCatalogStatus,
			getTypes: getComponentCatalogTypes,
			validationCatalog: componentCatalog,
		},
		designContextBundles: {
			loadContents: loadDesignContextBundleContents,
		},
		layoutCatalogs: {
			resolveComponentLayout: ({ componentType, sourceComponentId }) =>
				resolveCompositeLayoutByComponentType(componentType ?? sourceComponentId),
			resolveRegionLayout: resolveRegionLayoutFromScreenLayout,
		},
		skillBundles: {
			loadCatalog: loadGenerationSkillCatalog,
		},
	};
}

export function mergeScreenGenerationReferences(
	base: ScreenGenerationReferences,
	override?: ScreenGenerationReferencesInput,
): ScreenGenerationReferences {
	return {
		componentCatalogs: {
			...base.componentCatalogs,
			...override?.componentCatalogs,
		},
		designContextBundles: {
			...base.designContextBundles,
			...override?.designContextBundles,
		},
		layoutCatalogs: {
			...base.layoutCatalogs,
			...override?.layoutCatalogs,
		},
		skillBundles: {
			...base.skillBundles,
			...override?.skillBundles,
		},
	};
}
