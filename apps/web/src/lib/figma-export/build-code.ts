import type { RenderTree, RenderTreeNode } from "@cx/renderer";
import { GENERATOR_CORE_SOURCE } from "./generator-core-source";

// RenderTree → Figma plugin build code (.generated.js) + component-spec.
// Mirrors scripts/render-tree-to-figma.mjs. Pure TS (no Node) so it runs in the browser.
//
// Rules: structural nodes → plain frame (group); leaf components → ref (instance, with
// generator-side fallback to plain frame if not in the Figma DS). Variant props mapped
// from introspect findings. Text content deferred (app = text SSOT).

const STRUCTURAL = new Set([
	"Screen",
	"Screen.Header",
	"Screen.Contents",
	"Screen.Bottom",
	"area.dynamic",
	"PageStack",
	"Layout.Flex",
	"Layout.Grid",
]);

const cap = (s: unknown) => {
	const str = String(s);
	return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

type Props = Record<string, unknown>;

const VARIANT_MAP: Record<string, (p: Props) => Props> = {
	AppBar: (p) => {
		const o: Props = {};
		if ("showBack" in p) o.LeftItem = p.showBack ? "On" : "Off";
		if ("showLogo" in p) o.Logo = p.showLogo ? "On" : "Off";
		if ("title" in p) o.Title = p.title ? "On" : "Off";
		return o;
	},
	Badge: (p) => (p.variant ? { Type: cap(p.variant) } : {}),
	ListText: (p) => ("table" in p ? { Table: String(p.table) } : {}),
};

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
	| { kind: "ref"; id: string; component: string; props: Props };

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
	const isStructural = isRoot || STRUCTURAL.has(type);

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
	const mapper = VARIANT_MAP[type];
	const props = mapper ? mapper((node.props ?? {}) as Props) : {};
	return { kind: "ref", id, component: type, props };
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
