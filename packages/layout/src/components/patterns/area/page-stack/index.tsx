import type { LayoutPatternComponentProps } from "../../types";
import { type AreaPageStackDefaults, AreaPageStackFrame } from "./frame";
import { areaPageStackPresets } from "./presets";

function createPageStackArea(defaults: AreaPageStackDefaults) {
	return function PageStackArea(props: LayoutPatternComponentProps) {
		return <AreaPageStackFrame {...props} defaults={defaults} />;
	};
}

export const AccordionListArea = createPageStackArea(areaPageStackPresets.accordionList.defaults);
export const ActionStackArea = createPageStackArea(areaPageStackPresets.actionStack.defaults);
export const AuthCodeEntryArea = createPageStackArea(areaPageStackPresets.authCodeEntry.defaults);
export const AuthMethodListArea = createPageStackArea(areaPageStackPresets.authMethodList.defaults);
export const FieldStackArea = createPageStackArea(areaPageStackPresets.fieldStack.defaults);
export const ListStackArea = createPageStackArea(areaPageStackPresets.listStack.defaults);
export const NoticeAccordionStackArea = createPageStackArea(
	areaPageStackPresets.noticeAccordionStackArea.defaults,
);
export const PlainInfoTextListArea = createPageStackArea(
	areaPageStackPresets.plainInfoTextListArea.defaults,
);
export const ProductDisclosureAccordionArea = createPageStackArea(
	areaPageStackPresets.productDisclosureAccordion.defaults,
);
export const ProductInfoSectionArea = createPageStackArea(
	areaPageStackPresets.productInfoSection.defaults,
);
export const TabChipSearchAccordionArea = createPageStackArea(
	areaPageStackPresets.tabChipSearchAccordionArea.defaults,
);
export const TextListGroupArea = createPageStackArea(
	areaPageStackPresets.textListGroupArea.defaults,
);
