import { NODE_TYPES } from "@cx/types";
import type { RegionSlot, ScreenSurfaceType } from "../types";

export type PrddAreaSlot = RegionSlot;

export const PRDD_AREA_SLOTS = {
	bottom: "bottom",
	contents: "contents",
	header: "header",
} as const satisfies Record<PrddAreaSlot, PrddAreaSlot>;

interface PrddAreaSlotRule {
	slot: PrddAreaSlot;
	matches: (areaNo: number) => boolean;
}

export const PRDD_AREA_SLOT_RULES = [
	{
		slot: PRDD_AREA_SLOTS.header,
		matches: (areaNo) => areaNo === 0,
	},
	{
		slot: PRDD_AREA_SLOTS.bottom,
		matches: (areaNo) => areaNo >= 999,
	},
	{
		slot: PRDD_AREA_SLOTS.contents,
		matches: () => true,
	},
] as const satisfies readonly PrddAreaSlotRule[];

export const PRDD_SCREEN_TYPE_CONTRACT = {
	defaultScreenType: NODE_TYPES.screenSurface[0],
	headerRequired: {
		"screen.page": true,
		"screen.bottomSheet": false,
		"screen.popup": false,
	} satisfies Record<ScreenSurfaceType, boolean>,
};

export const PRDD_DEFAULT_HEADER_COMPONENT = {
	type: "AppBar",
	idSuffix: "__synthesized-header",
	order: 1,
	props: {
		showBackButton: true,
		titleProp: "titleContent",
	},
} as const;
