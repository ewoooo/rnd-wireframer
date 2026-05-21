import {
	SCREEN_BOTTOM_NODE_TYPE,
	SCREEN_CONTENTS_NODE_TYPE,
	SCREEN_HEADER_NODE_TYPE,
	SCREEN_NODE_TYPE,
	type WireframeAction,
	type WireframeEvents,
	type WireframeMetadata,
	type WireframeNode,
	type WireframeSchema,
} from "./types";

export interface SpecScreenSource {
	module: string;
	screenVariantId: string;
	metadata: {
		code: string;
		name: string;
		description?: string;
		surface?: string;
	};
	organisms: Array<{
		order: number;
		organismCode: string;
	}>;
}

export interface SpecOrganismSource {
	metadata: {
		module?: string;
		code: string;
		name: string;
		type?: string;
		usage?: string;
	};
	layout?: {
		flow?: "horizontal" | "vertical" | string;
	};
	states?: Record<
		string,
		{
			visible?: string[];
		}
	>;
	children?: SpecOrganismChild[];
}

export interface SpecOrganismChild {
	id: string;
	componentCode: string;
	slot?: string;
	policyCode?: string;
	events?: Record<
		string,
		{
			action: string;
			target?: string;
		}
	>;
}

export interface SpecComponentEntry {
	code: string;
	componentType: string;
	property?: Record<string, string | number | boolean | null>;
}

export interface ComposeWireframeFromSpecInput {
	screenSource: SpecScreenSource;
	organisms: SpecOrganismSource[];
	components: SpecComponentEntry[];
	data?: Record<string, unknown>;
	now?: string;
	author?: string;
	version?: string;
}

export interface ComposeWireframeFromSpecResult {
	schema: WireframeSchema;
	warnings: string[];
}

const DEFAULT_VERSION = "1.0.0";
const DEFAULT_AUTHOR = "wireframe-composer";

export function composeWireframeFromSpec(
	input: ComposeWireframeFromSpecInput,
): ComposeWireframeFromSpecResult {
	const version = input.version ?? DEFAULT_VERSION;
	const author = input.author ?? DEFAULT_AUTHOR;
	const now = input.now ?? new Date().toISOString();
	const warnings: string[] = [];

	const organismByCode = new Map(
		input.organisms.map((organism) => [organism.metadata.code, organism]),
	);
	const componentByCode = new Map(input.components.map((component) => [component.code, component]));
	const screenCode = input.screenSource.metadata.code;

	const schema: WireframeSchema = {
		version,
		metadata: metadata(screenCode, input.screenSource.metadata.name, author, now, {
			description: input.screenSource.metadata.description,
		}),
		data: input.data,
		children: [
			{
				type: SCREEN_NODE_TYPE,
				componentVersion: version,
				metadata: metadata("screen-root", input.screenSource.metadata.name, author, now, {
					description: input.screenSource.metadata.description,
				}),
				props: {
					surface: input.screenSource.metadata.surface ?? "page",
				},
				children: [
					composeHeaderRegion(input.screenSource, version, author, now),
					composeContentsRegion({
						screenSource: input.screenSource,
						organismByCode,
						componentByCode,
						version,
						author,
						now,
						warnings,
					}),
					composeBottomRegion(version, author, now),
				],
			},
		],
	};

	return { schema, warnings };
}

function composeHeaderRegion(
	screenSource: SpecScreenSource,
	version: string,
	author: string,
	now: string,
): WireframeNode {
	return {
		type: SCREEN_HEADER_NODE_TYPE,
		componentVersion: version,
		metadata: metadata("screen-header", "고정 상단 영역", author, now),
		props: {
			position: "fixed",
			layout: {
				direction: "column",
				gap: 0,
			},
			height: 96,
			zIndex: 10,
		},
		children: [
			{
				type: "HeaderBase",
				componentVersion: version,
				metadata: metadata("top-navigation", "상단 내비게이션", author, now),
				props: {
					titleContent: screenSource.metadata.name,
					titleSize: "title3",
					showBackButton: true,
				},
			},
		],
	};
}

function composeContentsRegion(input: {
	screenSource: SpecScreenSource;
	organismByCode: Map<string, SpecOrganismSource>;
	componentByCode: Map<string, SpecComponentEntry>;
	version: string;
	author: string;
	now: string;
	warnings: string[];
}): WireframeNode {
	const orderedOrganisms = [...input.screenSource.organisms].sort((left, right) => {
		return left.order - right.order;
	});

	return {
		type: SCREEN_CONTENTS_NODE_TYPE,
		componentVersion: input.version,
		metadata: metadata("screen-contents", "스크롤 콘텐츠 영역", input.author, input.now),
		props: {
			layout: {
				direction: "column",
				gap: 4,
				paddingX: 5,
				paddingY: 4,
			},
			scroll: true,
		},
		children: orderedOrganisms.map((screenOrganism) => {
			const organism = input.organismByCode.get(screenOrganism.organismCode);
			if (!organism) {
				input.warnings.push(`Missing organism source: ${screenOrganism.organismCode}`);
			}

			return composeOrganismSection({
				order: screenOrganism.order,
				organismCode: screenOrganism.organismCode,
				organism,
				componentByCode: input.componentByCode,
				version: input.version,
				author: input.author,
				now: input.now,
				warnings: input.warnings,
			});
		}),
	};
}

function composeBottomRegion(version: string, author: string, now: string): WireframeNode {
	return {
		type: SCREEN_BOTTOM_NODE_TYPE,
		componentVersion: version,
		metadata: metadata("screen-bottom", "고정 하단 영역", author, now),
		props: {
			position: "fixed",
			layout: {
				direction: "column",
				gap: 0,
			},
			safeArea: true,
			zIndex: 10,
		},
		children: [],
	};
}

function composeOrganismSection(input: {
	order: number;
	organismCode: string;
	organism?: SpecOrganismSource;
	componentByCode: Map<string, SpecComponentEntry>;
	version: string;
	author: string;
	now: string;
	warnings: string[];
}): WireframeNode {
	const visibleIds = input.organism?.states?.default?.visible;
	const children = input.organism?.children ?? [];
	const sortedChildren = children.filter((child) => {
		return !visibleIds || visibleIds.includes(child.id);
	});
	const flow = input.organism?.layout?.flow === "horizontal" ? "horizontal" : "vertical";
	const name = input.organism?.metadata.name ?? input.organismCode;

	return {
		type: "Organism.Section",
		componentVersion: input.version,
		metadata: metadata(input.organismCode, name, input.author, input.now),
		props: {
			organismCode: input.organismCode,
			name,
			flow,
			order: input.order,
		},
		children: sortedChildren.map((child) => {
			const component = input.componentByCode.get(child.componentCode);
			if (!component) {
				input.warnings.push(`Missing component entry: ${child.componentCode}`);
			}

			return composeComponentNode({
				child,
				component,
				version: input.version,
				author: input.author,
				now: input.now,
			});
		}),
	};
}

function composeComponentNode(input: {
	child: SpecOrganismChild;
	component?: SpecComponentEntry;
	version: string;
	author: string;
	now: string;
}): WireframeNode {
	const name = String(input.component?.property?.name ?? input.child.id);
	const description = input.component?.property?.description;

	return {
		type: normalizeComponentType(input.component?.componentType ?? input.child.componentCode),
		componentVersion: input.version,
		metadata: metadata(input.child.id, name, input.author, input.now, {
			description: typeof description === "string" ? description : undefined,
		}),
		props: buildComponentProps(input.component),
		events: mapEvents(input.child.events),
	};
}

function buildComponentProps(
	component?: SpecComponentEntry,
): Record<string, string | number | boolean | null> {
	const property = component?.property ?? {};
	const props: Record<string, string | number | boolean | null> = {};

	if (typeof property.name === "string") {
		props.title = property.name;
	}
	if (typeof property.description === "string") {
		props.description = property.description;
	}
	if (typeof property.variant === "string") {
		props.variant = property.variant;
	}

	return props;
}

function mapEvents(events?: SpecOrganismChild["events"]): WireframeEvents | undefined {
	if (!events) return undefined;

	const mappedEvents: WireframeEvents = {};
	for (const [eventName, event] of Object.entries(events)) {
		const action = mapAction(event);
		if (action) {
			mappedEvents[eventName as `on${string}`] = action;
		}
	}

	return Object.keys(mappedEvents).length > 0 ? mappedEvents : undefined;
}

function mapAction(event: { action: string; target?: string }): WireframeAction | undefined {
	if (event.action === "setState") {
		return {
			action: "setState",
			key: event.target ?? "state",
		};
	}

	if (event.action === "track") {
		return {
			action: "track",
			event: event.target ?? "wireframe_event",
		};
	}

	return undefined;
}

function normalizeComponentType(componentType: string): string {
	return componentType
		.split(/[-_.\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

function metadata(
	id: string,
	title: string,
	author: string,
	now: string,
	options: { description?: string } = {},
): WireframeMetadata {
	return {
		id,
		title,
		author,
		createdAt: now,
		updatedAt: now,
		...(options.description ? { description: options.description } : {}),
	};
}
