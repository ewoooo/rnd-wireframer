import { createPageStackArea } from "./PageStackFrame";
import { areaPageStackPresets } from "./presets";

// Canonical for fieldStack ≡ tabChipSearchAccordionArea (byte-identical defaults).
export const FieldStackArea = createPageStackArea(areaPageStackPresets.fieldStack.defaults);
