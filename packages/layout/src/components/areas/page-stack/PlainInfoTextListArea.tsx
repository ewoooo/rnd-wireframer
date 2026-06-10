import { createPageStackArea } from "./PageStackFrame";
import { areaPageStackPresets } from "./presets";

// Canonical for plainInfoTextListArea ≡ noticeAccordionStackArea (byte-identical defaults).
export const PlainInfoTextListArea = createPageStackArea(
	areaPageStackPresets.plainInfoTextListArea.defaults,
);
