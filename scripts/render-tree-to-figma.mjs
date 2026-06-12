// Automated converter: RenderTree JSON → component-spec-v1 (page) → self-contained
// .generated.js for the bridge plugin. Works on ANY screen's RenderTree (no hand-authoring).
//
// Rules (confirmed):
//  - Structural nodes (Screen, regions, area.*, layout primitives) → plain frame (group).
//  - Leaf component nodes → ref (instance); generator falls back to a plain frame if the
//    named component isn't in the Figma DS. (Component asset SSOT = Figma file.)
//  - Variant props mapped from introspect findings; unmapped components emit no props.
//  - Text content deferred (option a) — app remains text SSOT, injected later.
//
// Run: node scripts/render-tree-to-figma.mjs [path-to-rendertree.json]
import { readFileSync, writeFileSync } from "node:fs";

const RT_PATH = process.argv[2] || "/tmp/rt.json";
const rt = JSON.parse(readFileSync(RT_PATH, "utf8"));

const core = readFileSync(new URL("../packages/figma-screen-sync/generator-core.js", import.meta.url), "utf8");

// Structural container types → plain frame (group). Everything else = leaf component (ref).
const STRUCTURAL = new Set([
	"Screen", "Screen.Header", "Screen.Contents", "Screen.Bottom",
	"area.dynamic", "PageStack", "Layout.Flex", "Layout.Grid",
]);

// Variant prop mapping (from Figma introspect). Unknown types → no props.
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase();
const VARIANT_MAP = {
	AppBar: (p) => {
		const o = {};
		if ("showBack" in p) o.LeftItem = p.showBack ? "On" : "Off";
		if ("showLogo" in p) o.Logo = p.showLogo ? "On" : "Off";
		if ("title" in p) o.Title = p.title ? "On" : "Off";
		return o;
	},
	Badge: (p) => (p.variant ? { Type: cap(p.variant) } : {}),
	ListText: (p) => ("table" in p ? { Table: String(p.table) } : {}),
};

function num(v, d) { return typeof v === "number" ? v : d; }

// Build a component-spec layout for a structural frame from RenderTree props.
function frameLayout(node, isRoot) {
	const p = node.props || {};
	const flex = p.layout || {}; // region/flex layout props
	const gap = num(p.gap, num(flex.gap, num(p.itemPaddingX, 12)));
	const padX = num(p.paddingX, num(flex.paddingX, num(p.sectionPaddingX, 0)));
	const padY = num(p.paddingY, num(flex.paddingY, 0));
	const dir = (p.direction || flex.direction) === "row" ? "HORIZONTAL" : "VERTICAL";
	if (isRoot) {
		return { mode: "VERTICAL", primaryAxisSizingMode: "FIXED", counterAxisSizingMode: "FIXED", primaryAxisAlignItems: "MIN", counterAxisAlignItems: "MIN", paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, itemSpacing: 0, width: 375, height: 812 };
	}
	return { mode: dir, primaryAxisSizingMode: "AUTO", counterAxisSizingMode: "AUTO", primaryAxisAlignItems: "MIN", counterAxisAlignItems: "MIN", paddingTop: padY, paddingRight: padX, paddingBottom: padY, paddingLeft: padX, itemSpacing: gap, width: "FILL", height: "HUG" };
}

const emptyVisual = () => ({ cornerRadius: 0, fill: null, stroke: null, shadow: null });

let nodeSeq = 0;
function idFor(node) {
	const id = node.metadata?.id;
	if (id) return id;
	nodeSeq += 1;
	return `${node.type || "node"}-${nodeSeq}`;
}

// Convert a RenderTree node → component-spec child node.
function convert(node, isRoot) {
	const type = node.type;
	const id = idFor(node);
	const isStructural = isRoot || STRUCTURAL.has(type);

	if (isStructural) {
		const children = (node.children || []).map((c) => convert(c, false)).filter(Boolean);
		const g = { kind: "group", id, layout: frameLayout(node, isRoot), visual: emptyVisual(), children };
		return g;
	}

	// leaf component → ref (instance; generator falls back to plain frame if not in DS)
	const mapper = VARIANT_MAP[type];
	const props = mapper ? mapper(node.props || {}) : {};
	return { kind: "ref", id, component: type, props };
}

// Root must be the Screen node (rt.children[0]).
const screenNode = rt.children?.[0] || rt;
const rootGroup = convert(screenNode, true);

const COMPONENT_SPEC = {
	$schema: "component-spec-v1",
	name: `page/${String(rt.metadata?.id || "screen").toLowerCase()}`,
	category: "page",
	description: rt.metadata?.title || "RenderTree export",
	base: { layout: rootGroup.layout, visual: rootGroup.visual, children: rootGroup.children },
};

const DS_TOKENS = { foundation: { dimension: { size: { "screen-content-width": { value: 375 } } } } };

const out = [
	`// AUTO-GENERATED from RenderTree (${String(rt.metadata?.id || "?")}) — paste into bridge plugin (JSON → Figma) and Run.`,
	`const DS_TOKENS = ${JSON.stringify(DS_TOKENS, null, 2)};`,
	`const COMPONENT_SPEC = ${JSON.stringify(COMPONENT_SPEC, null, 2)};`,
	"",
	core,
	"",
	"(async () => {",
	"  try {",
	"    await generateComponentSet(COMPONENT_SPEC, DS_TOKENS);",
	"    figma.notify('✓ screen exported: ' + COMPONENT_SPEC.name);",
	"  } catch (e) {",
	"    console.error('export error:', e);",
	"    figma.notify('export error: ' + (e && e.message ? e.message : e), { error: true });",
	"  }",
	"})();",
	"",
].join("\n");

const dest = new URL("./figma-export-screen.generated.js", import.meta.url);
writeFileSync(dest, out, "utf8");
console.log("written:", dest.pathname, `(${out.length} bytes) from screen`, rt.metadata?.id);
