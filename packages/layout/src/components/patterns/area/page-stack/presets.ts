import type { AreaPageStackDefaults } from "./frame";
import { pageStackBaseDefaults } from "./frame";

export type AreaPageStackPreset = {
	defaults: AreaPageStackDefaults;
};

export const areaPageStackPresets = {
	accordionList: {
		defaults: { ...pageStackBaseDefaults, gap: 0 },
	},
	accordionNoticeListArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleMode: "none",
		},
	},
	actionStack: {
		defaults: {
			...pageStackBaseDefaults,
			gap: 12,
			paddingY: 0,
			titleGap: 0,
			titleMode: "none",
		},
	},
	authCodeEntry: {
		defaults: { ...pageStackBaseDefaults, gap: 12, titleGap: 8 },
	},
	authMethodList: {
		defaults: { ...pageStackBaseDefaults, gap: 0, itemPaddingX: 0, titleGap: 8 },
	},
	checkboxStack: {
		defaults: { ...pageStackBaseDefaults, gap: 12 },
	},
	deliveryInfoAccordionArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleGap: 0,
			titleMode: "none",
		},
	},
	fieldStack: {
		defaults: { ...pageStackBaseDefaults, gap: 12 },
	},
	listStack: {
		defaults: { ...pageStackBaseDefaults, gap: 8 },
	},
	messageStack: {
		defaults: { ...pageStackBaseDefaults, gap: 12 },
	},
	noticeAccordionStackArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleMode: "none",
		},
	},
	pagestackInfoTextSection: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleGap: 12,
		},
	},
	plainInfoTextListArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleMode: "hidden",
		},
	},
	priceAccordionStackArea: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleGap: 0,
		},
	},
	productDisclosureAccordion: {
		defaults: {
			...pageStackBaseDefaults,
			divider: "contents",
			gap: 0,
			titleGap: 0,
			titleMode: "none",
		},
	},
	productInfoSection: {
		defaults: { ...pageStackBaseDefaults, gap: 16, titleGap: 16 },
	},
	tabChipSearchAccordionArea: {
		defaults: { ...pageStackBaseDefaults, gap: 12, titleMode: "none" },
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
