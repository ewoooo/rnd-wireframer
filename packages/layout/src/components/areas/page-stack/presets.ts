import type { AreaPageStackDefaults } from "./PageStackFrame";
import { pageStackBaseDefaults } from "./PageStackFrame";

export type AreaPageStackPreset = {
	defaults: AreaPageStackDefaults;
};

export const areaPageStackPresets = {
	accordionList: {
		defaults: { ...pageStackBaseDefaults, gap: 0 },
	},
	actionStack: {
		defaults: {
			...pageStackBaseDefaults,
			gap: 12,
			paddingY: 0,
			titleGap: 0,
		},
	},
	authCodeEntry: {
		defaults: { ...pageStackBaseDefaults, gap: 12, titleGap: 8 },
	},
	authMethodList: {
		defaults: { ...pageStackBaseDefaults, gap: 0, itemPaddingX: 0, titleGap: 8 },
	},
	fieldStack: {
		defaults: { ...pageStackBaseDefaults, gap: 12 },
	},
	listStack: {
		defaults: { ...pageStackBaseDefaults, gap: 8 },
	},
	noticeAccordionStackArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
		},
	},
	plainInfoTextListArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
		},
	},
	productDisclosureAccordion: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleGap: 0,
		},
	},
	productInfoSection: {
		defaults: { ...pageStackBaseDefaults, gap: 16, titleGap: 16 },
	},
	tabChipSearchAccordionArea: {
		defaults: { ...pageStackBaseDefaults, gap: 12 },
	},
	textListGroupArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleGap: 12,
		},
	},
} as const satisfies Record<string, AreaPageStackPreset>;
