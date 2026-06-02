// One-off introspection probe: discover the REAL Figma component names + property
// schemas for our target component types. Paste output into bridge plugin (JSON → Figma) → Run.
// Reads ground truth so we can decide: build a mapping table, or rename one side.
// Run: node scripts/assemble-figma-introspect.mjs  →  paste scripts/figma-introspect.generated.js
import { writeFileSync } from "node:fs";

// Figma DS component names we need real schemas for (variant axes + text node NAMES + props),
// to wire the registry. Callout = the real component behind app's `section-message` (alias).
const TARGETS = [
	"Callout", "CheckBox", "Divider", "ListText", "AppBar", "Badge", "TextButton",
	"Button", "TitleSection/Default", "TitleSection", "TitleMain", "ActionButton",
];

const body = `
const TARGETS = ${JSON.stringify(TARGETS)};

(async () => {
  if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();

  // collect every COMPONENT / COMPONENT_SET name in the file (for fuzzy lookup)
  const allMasters = figma.root.findAll(function (n) {
    return n.type === "COMPONENT_SET" || (n.type === "COMPONENT" && (!n.parent || n.parent.type !== "COMPONENT_SET"));
  });
  const allNames = allMasters.map(function (n) { return n.type + " :: " + n.name; });

  function variantAxes(setNode) {
    var axes = {};
    var kids = setNode.children || [];
    for (var i = 0; i < kids.length; i++) {
      var parts = String(kids[i].name).split(",");
      for (var j = 0; j < parts.length; j++) {
        var kv = parts[j].split("=");
        var k = (kv[0] || "").trim(), v = (kv[1] || "").trim();
        if (!k || !v) continue;
        if (!axes[k]) axes[k] = [];
        if (axes[k].indexOf(v) === -1) axes[k].push(v);
      }
    }
    return axes;
  }

  function readProps(node) {
    // componentProperties getter can throw on broken sets — guard it
    var defs = null;
    try { defs = node.componentPropertyDefinitions || null; } catch (e) {}
    if (!defs) { try { defs = node.componentProperties || null; } catch (e) {} }
    if (!defs) return { error: "props unreadable" };
    var out = {};
    for (var pid in defs) {
      if (!Object.prototype.hasOwnProperty.call(defs, pid)) continue;
      var d = defs[pid];
      out[pid] = { type: d && d.type, default: d && (d.defaultValue !== undefined ? d.defaultValue : d.value) };
    }
    return out;
  }

  // inner TEXT node names + their default characters (for text injection mapping)
  function textNodes(node) {
    var sample = node;
    if (node.type === "COMPONENT_SET" && node.children && node.children[0]) sample = node.children[0];
    var out = [];
    try {
      var texts = sample.findAll(function (n) { return n.type === "TEXT"; });
      for (var i = 0; i < texts.length; i++) {
        out.push({ name: texts[i].name, chars: String(texts[i].characters || "").slice(0, 24) });
      }
    } catch (e) {}
    return out;
  }

  var report = {};
  for (var t = 0; t < TARGETS.length; t++) {
    var name = TARGETS[t];
    var sets = figma.root.findAll(function (n) { return n.type === "COMPONENT_SET" && n.name === name; });
    var comps = figma.root.findAll(function (n) { return n.type === "COMPONENT" && n.name === name; });
    if (sets.length > 0) {
      report[name] = { found: true, kind: "COMPONENT_SET", realName: sets[0].name, variantAxes: variantAxes(sets[0]), props: readProps(sets[0]), textNodes: textNodes(sets[0]) };
    } else if (comps.length > 0) {
      report[name] = { found: true, kind: "COMPONENT", realName: comps[0].name, props: readProps(comps[0]), textNodes: textNodes(comps[0]) };
    } else {
      // fuzzy: any master whose name contains the type (case-insensitive), or kebab form
      var needle = name.toLowerCase();
      var kebab = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      var candidates = allNames.filter(function (n) {
        var low = n.toLowerCase();
        return low.indexOf(needle) !== -1 || low.indexOf(kebab) !== -1;
      });
      report[name] = { found: false, candidates: candidates };
    }
  }

  var result = { totalMasters: allMasters.length, report: report, allNames: allNames };

  // Send to localhost dev sink (manifest allows http://localhost:3000) → written to
  // scripts/figma-introspect-result.json. Falls back to console if the POST fails.
  try {
    var res = await fetch("http://localhost:3000/api/figma-introspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    var j = await res.json();
    figma.notify("introspect sent → " + (j && j.bytes) + " bytes written (" + allMasters.length + " masters)");
  } catch (e) {
    console.log("=== FIGMA INTROSPECT (POST failed, console fallback) ===");
    console.log(JSON.stringify(result, null, 2));
    figma.notify("introspect: POST 실패 — 콘솔 확인 (" + (e && e.message ? e.message : e) + ")");
  }
})();
`;

const dest = "/Users/plusx/Documents/GitHub/rnd-wireframer/scripts/figma-introspect.generated.js";
writeFileSync(dest, body, "utf8");
console.log("written:", dest, "(" + body.length + " bytes)");
