import type { RenderTree, RenderTreeNode } from "@cx/renderer";
import { GENERATOR_CORE_SOURCE } from "./generator-core-source";

// RenderTree → Figma plugin build code (.generated.js) + component-spec.
// Mirrors scripts/render-tree-to-figma.mjs. Pure TS (no Node) so it runs in the browser.
//
// Rules: structural nodes → plain frame (group); leaf components → ref (instance, with
// generator-side fallback to plain frame if not in the Figma DS). Variant props mapped
// from introspect findings. Text content deferred (app = text SSOT).

// Structural container node types → plain frame (recurse children). Everything else is a
// leaf component (ref). Prefix-based so area.static/area.dynamic, Screen.*, Layout.* all match.
function isStructuralType(type: string): boolean {
	return (
		type === "Screen" ||
		type === "PageStack" ||
		type.startsWith("Screen.") ||
		type.startsWith("area.") ||
		type.startsWith("Layout.")
	);
}

// Leaf text content (app = text SSOT). First populated prop wins.
const TEXT_PROP_KEYS = ["label", "title", "subText", "content", "text"] as const;
function leafText(props: Props): string | undefined {
	for (const k of TEXT_PROP_KEYS) {
		const v = props[k];
		if (typeof v === "string" && v.trim()) return v;
	}
	return undefined;
}

const cap = (s: unknown) => {
	const str = String(s);
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

type Props = Record<string, unknown>;
type TextOp = { name?: string; index?: number; value: string };
const str = (v: unknown): string => (typeof v === "string" ? v : "");

// Explicit DS mapping registry (authored, not inferred). Each entry: which RenderTree types
// map to which Figma component (figmaName), how app props → Figma component-properties (props),
// and how app text → instance text nodes (texts). Types NOT in the registry fall through to
// "instance-by-type, else fallback frame with raw text".
type RegistryEntry = {
	aliases: string[];
	figmaName: string;
	props?: (p: Props) => Props;
	texts?: (p: Props) => TextOp[];
};
const REGISTRY: RegistryEntry[] = [
	{
		// app `section-message` = Callout (DS alias). title/children → Callout text nodes.
		aliases: ["section-message", "SectionMessage"],
		figmaName: "Callout",
		props: (p) => ({ "Title#9720:11": str(p.title).length > 0 }),
		texts: (p) => {
			const title = str(p.title);
			const body = str(p.children);
			if (title)
				return body
					? [
							{ index: 0, value: title },
							{ index: 1, value: body },
						]
					: [{ index: 0, value: title }];
			return body ? [{ index: 0, value: body }] : [];
		},
	},
	{
		// main action button. variant ignored (text-only differences).
		aliases: ["ActionButton", "action", "action-button"],
		figmaName: "ActionButton",
		texts: (p) => (str(p.label) ? [{ index: 0, value: str(p.label) }] : []),
	},
	{
		aliases: ["Badge"],
		figmaName: "Badge",
		props: (p) => (p.variant ? { Type: cap(p.variant) } : {}),
	},
	{
		aliases: ["ListText"],
		figmaName: "ListText",
		props: (p) => ("table" in p ? { Table: String(p.table) } : {}),
	},
	{
		aliases: ["AppBar"],
		figmaName: "AppBar",
		props: (p) => {
			const o: Props = {};
			if ("showBack" in p) o.LeftItem = p.showBack ? "On" : "Off";
			if ("showLogo" in p) o.Logo = p.showLogo ? "On" : "Off";
			if ("title" in p) o.Title = p.title ? "On" : "Off";
			return o;
		},
	},
];
function registryFor(type: string): RegistryEntry | undefined {
	return REGISTRY.find((e) => e.aliases.includes(type));
}

function num(v: unknown, d: number): number {
	return typeof v === "number" ? v : d;
}

type SpecNode =
	| {
			kind: "group";
			id: string;
			layout: Record<string, unknown>;
			visual: Record<string, unknown>;
			children: SpecNode[];
	  }
	| {
			kind: "ref";
			id: string;
			component: string;
			props: Props;
			text?: string;
			setTexts?: TextOp[];
	  };

function frameLayout(node: RenderTreeNode, isRoot: boolean): Record<string, unknown> {
	const p = (node.props ?? {}) as Props;
	const flex = (p.layout ?? {}) as Props;
	const gap = num(p.gap, num(flex.gap, num(p.itemPaddingX, 12)));
	const padX = num(p.paddingX, num(flex.paddingX, num(p.sectionPaddingX, 0)));
	const padY = num(p.paddingY, num(flex.paddingY, 0));
	const dir = (p.direction ?? flex.direction) === "row" ? "HORIZONTAL" : "VERTICAL";
	if (isRoot) {
		return {
			mode: "VERTICAL",
			primaryAxisSizingMode: "FIXED",
			counterAxisSizingMode: "FIXED",
			primaryAxisAlignItems: "MIN",
			counterAxisAlignItems: "MIN",
			paddingTop: 0,
			paddingRight: 0,
			paddingBottom: 0,
			paddingLeft: 0,
			itemSpacing: 0,
			width: 375,
			height: 812,
		};
	}
	return {
		mode: dir,
		primaryAxisSizingMode: "AUTO",
		counterAxisSizingMode: "AUTO",
		primaryAxisAlignItems: "MIN",
		counterAxisAlignItems: "MIN",
		paddingTop: padY,
		paddingRight: padX,
		paddingBottom: padY,
		paddingLeft: padX,
		itemSpacing: gap,
		width: "FILL",
		height: "HUG",
	};
}

const emptyVisual = () => ({ cornerRadius: 0, fill: null, stroke: null, shadow: null });

function convert(node: RenderTreeNode, isRoot: boolean, seq: { n: number }): SpecNode {
	const type = node.type;
	let id = node.metadata?.id;
	if (!id) {
		seq.n += 1;
		id = `${type || "node"}-${seq.n}`;
	}
	const isStructural = isRoot || isStructuralType(type);

	if (isStructural) {
		const children = (node.children ?? []).map((c) => convert(c, false, seq));
		return {
			kind: "group",
			id,
			layout: frameLayout(node, isRoot),
			visual: emptyVisual(),
			children,
		};
	}
	const rawProps = (node.props ?? {}) as Props;
	const entry = registryFor(type);
	if (entry) {
		const setTexts = entry.texts ? entry.texts(rawProps).filter((t) => t.value) : [];
		return {
			kind: "ref",
			id,
			component: entry.figmaName,
			props: entry.props ? entry.props(rawProps) : {},
			...(setTexts.length ? { setTexts } : {}),
		};
	}
	// registry miss → try instance by type name; generator falls back to a text frame if absent.
	const text = leafText(rawProps);
	return { kind: "ref", id, component: type, props: {}, ...(text ? { text } : {}) };
}

export function renderTreeToComponentSpec(rt: RenderTree) {
	const seq = { n: 0 };
	const screenNode = (rt.children?.[0] ?? rt) as RenderTreeNode;
	const root = convert(screenNode, true, seq) as Extract<SpecNode, { kind: "group" }>;
	const id = String(rt.metadata?.id ?? "screen");
	return {
		$schema: "component-spec-v1",
		name: `page/${id.toLowerCase()}`,
		category: "page",
		description: rt.metadata?.title ?? "RenderTree export",
		base: { layout: root.layout, visual: root.visual, children: root.children },
	};
}

const DS_TOKENS = {
	foundation: { dimension: { size: { "screen-content-width": { value: 375 } } } },
};

export function renderTreeToBuildCode(rt: RenderTree): string {
	const spec = renderTreeToComponentSpec(rt);
	const id = String(rt.metadata?.id ?? "?");
	return [
		`// AUTO-GENERATED from RenderTree (${id}) — paste into the Figma plugin (JSON → Figma) and Run.`,
		`const DS_TOKENS = ${JSON.stringify(DS_TOKENS, null, 2)};`,
		`const COMPONENT_SPEC = ${JSON.stringify(spec, null, 2)};`,
		"",
		GENERATOR_CORE_SOURCE,
		"",
		"(async () => {",
		"  try {",
		"    await generateComponentSet(COMPONENT_SPEC, DS_TOKENS);",
		"    figma.notify('\\u2713 screen exported: ' + COMPONENT_SPEC.name);",
		"  } catch (e) {",
		"    console.error('export error:', e);",
		"    figma.notify('export error: ' + (e && e.message ? e.message : e), { error: true });",
		"  }",
		"})();",
		"",
	].join("\n");
}

export function renderTreeToJson(rt: RenderTree): string {
	return JSON.stringify(rt, null, 2);
}
