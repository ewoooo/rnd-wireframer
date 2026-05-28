import type { PropValue } from "../tree/types";

export type TableChildRef = {
	id: string;
	kind: "area" | "component";
};

export type TableScreenRegionRecord = {
	children?: TableChildRef[];
	layout?: string;
	metadata?: {
		title?: string;
	};
	type?: "Screen.Bottom" | "Screen.Contents" | "Screen.Header";
};

export type TableScreenRecord = {
	id: string;
	layout?: string;
	metadata?: {
		description?: string;
		title?: string;
	};
	screen?: {
		regions?: {
			bottom?: TableScreenRegionRecord;
			contents?: TableScreenRegionRecord;
			header?: TableScreenRegionRecord;
		};
	};
	version?: string;
};

export type TableAreaRecord = {
	children?: TableChildRef[];
	id: string;
	layout?: string;
	metadata?: {
		description?: string;
		title?: string;
	};
	props?: Record<string, PropValue>;
	type: "area.dynamic" | "area.static";
	version?: string;
};

export type TableComponentRecord = {
	children?: Array<{
		component?: {
			type?: string;
		};
		props?: Record<string, PropValue>;
	}>;
	id: string;
	layout?: string;
	metadata?: {
		description?: string;
		title?: string;
	};
	type: string;
	version?: string;
};

export type TableScreenData = {
	areas: {
		areas: TableAreaRecord[];
	};
	components: {
		components: TableComponentRecord[];
	};
	screens: {
		screens: TableScreenRecord[];
	};
};
