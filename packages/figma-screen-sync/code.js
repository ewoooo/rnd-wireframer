// Genui Spec Extractor — Figma 손작업 노드 → component-specs JSON 역추출.
// Figma plugin sandbox 호환 — spread 사용 X (Object.assign / direct mutation 사용).
// dynamic-page documentAccess — figma.getStyleByIdAsync / getVariableByIdAsync 사용.

// typography composite lookup — DS 의 semantic.typography.* 자동 주입 영역.
// 갱신 명령: node scripter/build-plugin-lookup.js
/* @generated:typography-lookup-start */
const TYPOGRAPHY_PATH_LOOKUP = {
  "hero-headline": {
    "fontSize": "foundation.typography.fontSize.number-emphasis",
    "lineHeight": "foundation.typography.lineHeight.xl",
    "fontWeight": "foundation.typography.fontWeight.bold",
    "letterSpacing": "foundation.typography.letterSpacing.tight-sm"
  },
  "card-title": {
    "fontSize": "foundation.typography.fontSize.title",
    "lineHeight": "foundation.typography.lineHeight.120",
    "fontWeight": "foundation.typography.fontWeight.bold",
    "letterSpacing": "foundation.typography.letterSpacing.tight-md"
  },
  "number-emphasis": {
    "fontSize": "foundation.typography.fontSize.number-emphasis",
    "lineHeight": "foundation.typography.lineHeight.2xl",
    "fontWeight": "foundation.typography.fontWeight.bold",
    "letterSpacing": "foundation.typography.letterSpacing.tight-md"
  },
  "price-original": {
    "fontSize": "foundation.typography.fontSize.card-label",
    "lineHeight": "foundation.typography.lineHeight.md",
    "fontWeight": "foundation.typography.fontWeight.regular",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "body": {
    "fontSize": "foundation.typography.fontSize.body",
    "lineHeight": "foundation.typography.lineHeight.lg",
    "fontWeight": "foundation.typography.fontWeight.regular",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "body-medium": {
    "fontSize": "foundation.typography.fontSize.body",
    "lineHeight": "foundation.typography.lineHeight.lg",
    "fontWeight": "foundation.typography.fontWeight.medium",
    "letterSpacing": "foundation.typography.letterSpacing.tight-sm"
  },
  "body-bold": {
    "fontSize": "foundation.typography.fontSize.body",
    "lineHeight": "foundation.typography.lineHeight.lg",
    "fontWeight": "foundation.typography.fontWeight.bold",
    "letterSpacing": "foundation.typography.letterSpacing.tight-sm"
  },
  "button": {
    "fontSize": "foundation.typography.fontSize.body",
    "lineHeight": "foundation.typography.lineHeight.lg",
    "fontWeight": "foundation.typography.fontWeight.semibold",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "card-label": {
    "fontSize": "foundation.typography.fontSize.card-label",
    "lineHeight": "foundation.typography.lineHeight.md",
    "fontWeight": "foundation.typography.fontWeight.regular",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "chip-badge": {
    "fontSize": "foundation.typography.fontSize.chip-badge",
    "lineHeight": "foundation.typography.lineHeight.md",
    "fontWeight": "foundation.typography.fontWeight.medium",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "sub-label": {
    "fontSize": "foundation.typography.fontSize.sub-label",
    "lineHeight": "foundation.typography.lineHeight.sm",
    "fontWeight": "foundation.typography.fontWeight.regular",
    "letterSpacing": "foundation.typography.letterSpacing.tight-sm"
  },
  "card-header-label": {
    "fontSize": "foundation.typography.fontSize.sub-label",
    "lineHeight": "foundation.typography.lineHeight.sm",
    "fontWeight": "foundation.typography.fontWeight.semibold",
    "letterSpacing": "foundation.typography.letterSpacing.tight-sm"
  },
  "insight": {
    "fontSize": "foundation.typography.fontSize.insight",
    "lineHeight": "foundation.typography.lineHeight.md",
    "fontWeight": "foundation.typography.fontWeight.regular",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "tab-label": {
    "fontSize": "foundation.typography.fontSize.tab-label",
    "lineHeight": "foundation.typography.lineHeight.xs",
    "fontWeight": "foundation.typography.fontWeight.medium",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "list-label": {
    "fontSize": "foundation.typography.fontSize.body",
    "lineHeight": "foundation.typography.lineHeight.lg",
    "fontWeight": "foundation.typography.fontWeight.regular",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  },
  "home-emphasis": {
    "fontSize": "foundation.typography.fontSize.home-md",
    "lineHeight": "foundation.typography.lineHeight.lg",
    "fontWeight": "foundation.typography.fontWeight.bold",
    "letterSpacing": "foundation.typography.letterSpacing.tight-sm"
  },
  "home-button": {
    "fontSize": "foundation.typography.fontSize.home-md",
    "lineHeight": "foundation.typography.lineHeight.lg",
    "fontWeight": "foundation.typography.fontWeight.semibold",
    "letterSpacing": "foundation.typography.letterSpacing.default"
  }
};
const TYPOGRAPHY_RAW_LOOKUP = [
  {
    "name": "hero-headline",
    "fontSize": 28,
    "lineHeight": {
      "value": 28,
      "unit": "PIXELS"
    },
    "fontWeight": 700,
    "letterSpacing": -0.3
  },
  {
    "name": "card-title",
    "fontSize": 20,
    "lineHeight": {
      "value": 120,
      "unit": "PERCENT"
    },
    "fontWeight": 700,
    "letterSpacing": -0.5
  },
  {
    "name": "number-emphasis",
    "fontSize": 28,
    "lineHeight": {
      "value": 36,
      "unit": "PIXELS"
    },
    "fontWeight": 700,
    "letterSpacing": -0.5
  },
  {
    "name": "price-original",
    "fontSize": 13,
    "lineHeight": {
      "value": 18,
      "unit": "PIXELS"
    },
    "fontWeight": 400,
    "letterSpacing": 0
  },
  {
    "name": "body",
    "fontSize": 15,
    "lineHeight": {
      "value": 22,
      "unit": "PIXELS"
    },
    "fontWeight": 400,
    "letterSpacing": 0
  },
  {
    "name": "body-medium",
    "fontSize": 15,
    "lineHeight": {
      "value": 22,
      "unit": "PIXELS"
    },
    "fontWeight": 500,
    "letterSpacing": -0.3
  },
  {
    "name": "body-bold",
    "fontSize": 15,
    "lineHeight": {
      "value": 22,
      "unit": "PIXELS"
    },
    "fontWeight": 700,
    "letterSpacing": -0.3
  },
  {
    "name": "button",
    "fontSize": 15,
    "lineHeight": {
      "value": 22,
      "unit": "PIXELS"
    },
    "fontWeight": 600,
    "letterSpacing": 0
  },
  {
    "name": "card-label",
    "fontSize": 13,
    "lineHeight": {
      "value": 18,
      "unit": "PIXELS"
    },
    "fontWeight": 400,
    "letterSpacing": 0
  },
  {
    "name": "chip-badge",
    "fontSize": 13,
    "lineHeight": {
      "value": 18,
      "unit": "PIXELS"
    },
    "fontWeight": 500,
    "letterSpacing": 0
  },
  {
    "name": "sub-label",
    "fontSize": 12,
    "lineHeight": {
      "value": 16,
      "unit": "PIXELS"
    },
    "fontWeight": 400,
    "letterSpacing": -0.3
  },
  {
    "name": "card-header-label",
    "fontSize": 12,
    "lineHeight": {
      "value": 16,
      "unit": "PIXELS"
    },
    "fontWeight": 600,
    "letterSpacing": -0.3
  },
  {
    "name": "insight",
    "fontSize": 13,
    "lineHeight": {
      "value": 18,
      "unit": "PIXELS"
    },
    "fontWeight": 400,
    "letterSpacing": 0
  },
  {
    "name": "tab-label",
    "fontSize": 9,
    "lineHeight": {
      "value": 12,
      "unit": "PIXELS"
    },
    "fontWeight": 500,
    "letterSpacing": 0
  },
  {
    "name": "list-label",
    "fontSize": 15,
    "lineHeight": {
      "value": 22,
      "unit": "PIXELS"
    },
    "fontWeight": 400,
    "letterSpacing": 0
  },
  {
    "name": "home-emphasis",
    "fontSize": 18,
    "lineHeight": {
      "value": 22,
      "unit": "PIXELS"
    },
    "fontWeight": 700,
    "letterSpacing": -0.3
  },
  {
    "name": "home-button",
    "fontSize": 18,
    "lineHeight": {
      "value": 22,
      "unit": "PIXELS"
    },
    "fontWeight": 600,
    "letterSpacing": 0
  }
];
/* @generated:typography-lookup-end */

figma.showUI(__html__, { width: 480, height: 640 });

// 한글/특수문자만 들어 있어 slugify 결과가 비는 경우를 위한 sequential id 카운터.
// extract 시작 시 resetIdCounters() 로 매 세션 0부터.
const idCounters = { text: 0, group: 0, ref: 0, node: 0 };
function resetIdCounters() {
  idCounters.text = 0;
  idCounters.group = 0;
  idCounters.ref = 0;
  idCounters.node = 0;
}

figma.ui.onmessage = async (msg) => {
  console.log("[plugin] received message:", msg && msg.type);
  try {
    if (msg.type === "extract-auto") {
      resetIdCounters();
      await figma.currentPage.loadAsync();
      if (figma.currentPage.selection.length > 0) await extractSelection();
      else await extractPage();
    } else if (msg.type === "extract-selection") {
      resetIdCounters();
      await extractSelection();
    } else if (msg.type === "extract-page") {
      resetIdCounters();
      await extractPage();
    } else if (msg.type === "build-from-code") {
      await buildFromCode(msg.code);
    } else if (msg.type === "wash") {
      await runWash({ dryRun: !!msg.dryRun });
    } else if (msg.type === "close") {
      figma.closePlugin();
    }
  } catch (e) {
    const errMsg = (e && e.message) ? e.message : String(e);
    const errStack = (e && e.stack) ? "\n" + e.stack : "";
    console.error("[plugin] error:", errMsg, errStack);
    figma.notify("에러: " + errMsg, { error: true, timeout: 8000 });
    if (msg.type === "build-from-code") {
      figma.ui.postMessage({ type: "build-error", message: errMsg });
    } else if (msg.type === "wash") {
      figma.ui.postMessage({ type: "wash-error", message: errMsg + errStack });
    } else {
      figma.ui.postMessage({ type: "error", message: errMsg + errStack });
    }
  }
};

// scripter 의 .generated.js 코드를 plugin 안에서 실행 — Scripter ⌘+V→Run 대체.
// 코드는 functions 정의 + 마지막에 즉시 실행 IIFE (runBatch().catch(...)) 형태.
async function buildFromCode(code) {
  if (!code || typeof code !== "string") {
    throw new Error("빌드 코드가 비었거나 문자열이 아님");
  }
  // figma sandbox 안에서 코드 실행. async 함수로 감싸 await 가능하게.
  // new AsyncFunction 사용 — code 마지막 IIFE 의 promise 까지 기다림.
  const AsyncFunction = (async function () {}).constructor;
  const fn = new AsyncFunction(code);
  await fn();
  console.log("[plugin] build-from-code 완료");
  figma.ui.postMessage({ type: "build-done", note: "(" + code.length + " bytes 실행)" });
}

async function extractSelection() {
  console.log("[plugin] extractSelection start");
  await figma.currentPage.loadAsync();
  const selection = figma.currentPage.selection;
  console.log("[plugin] selection count:", selection.length);
  if (selection.length === 0) {
    figma.notify("노드를 1개 이상 선택해 주세요.");
    figma.ui.postMessage({ type: "error", message: "노드를 1개 이상 선택해 주세요." });
    return;
  }
  const specs = [];
  for (const node of selection) {
    console.log("[plugin] extracting:", node.type, node.name);
    const spec = await extractNode(node);
    if (spec) specs.push(spec);
  }
  console.log("[plugin] done, specs:", specs.length);
  figma.ui.postMessage({ type: "result", specs: specs });
}

async function extractPage() {
  console.log("[plugin] extractPage start");
  const page = figma.currentPage;
  await page.loadAsync();
  const tops = page.children.filter(function (n) {
    return n.type === "COMPONENT" || n.type === "COMPONENT_SET" || n.type === "FRAME" || n.type === "INSTANCE";
  });
  console.log("[plugin] page tops:", tops.length);
  const specs = [];
  for (const node of tops) {
    const spec = await extractNode(node);
    if (spec) specs.push(spec);
  }
  console.log("[plugin] done, specs:", specs.length);
  figma.ui.postMessage({ type: "result", specs: specs });
}

async function extractNode(node) {
  if (node.type === "COMPONENT_SET") {
    return await extractComponentSet(node);
  }
  if (node.type === "COMPONENT") {
    const inner = await extractFrameLike(node);
    return wrapTopLevel(guessSpecName(node), guessCategory(guessSpecName(node), node), inner.base, null);
  }
  if (node.type === "INSTANCE" || node.type === "FRAME") {
    const inner = await extractFrameLike(node);
    return wrapTopLevel(guessSpecName(node), guessCategory(guessSpecName(node), node), inner.base, null);
  }
  if (node.type === "TEXT") {
    const child = await extractText(node);
    return wrapTopLevel(node.name, "atom", { layout: minimalLayout(), visual: emptyVisual(), children: [child] }, null);
  }
  return null;
}

async function extractComponentSet(set) {
  const variants = set.children.filter(function (c) { return c.type === "COMPONENT"; });
  if (variants.length === 0) return null;
  const inner = await extractFrameLike(variants[0]);
  const name = guessSpecName(set);
  const category = guessCategory(name, variants[0]);

  const axesMap = {};
  for (const v of variants) {
    const props = parseVariantName(v.name);
    for (const key in props) {
      if (!Object.prototype.hasOwnProperty.call(props, key)) continue;
      if (!axesMap[key]) axesMap[key] = [];
      if (axesMap[key].indexOf(props[key]) === -1) axesMap[key].push(props[key]);
    }
  }
  const axes = [];
  for (const key in axesMap) {
    if (Object.prototype.hasOwnProperty.call(axesMap, key)) {
      axes.push({ name: key, values: axesMap[key] });
    }
  }

  return wrapTopLevel(name, category, inner.base, { axes: axes, overrides: {} });
}

function parseVariantName(name) {
  const result = {};
  const parts = String(name).split(",");
  for (const part of parts) {
    const eq = part.split("=");
    const k = (eq[0] || "").trim();
    const v = (eq[1] || "").trim();
    if (k && v) result[k] = v;
  }
  return result;
}

function wrapTopLevel(name, category, base, variants) {
  const out = {
    $schema: "component-spec-v1",
    name: name,
    category: category,
    description: "(Figma 손작업 추출 — 검토·보강 필요)",
    base: base,
  };
  if (variants) out.variants = variants;
  return out;
}

async function extractFrameLike(node) {
  const layout = await extractLayout(node);
  const visual = await extractVisual(node);
  const children = [];
  if ("children" in node) {
    for (const child of node.children) {
      const c = await extractChild(child);
      if (c) children.push(c);
    }
  }
  return { base: { layout: layout, visual: visual, children: children } };
}

async function extractChild(node) {
  if (node.type === "TEXT") return await extractText(node);
  if (node.type === "INSTANCE") return await extractInstance(node);
  if (node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT") {
    const layout = await extractLayout(node);
    const visual = await extractVisual(node);
    const children = [];
    if ("children" in node) {
      for (const c of node.children) {
        const ec = await extractChild(c);
        if (ec) children.push(ec);
      }
    }
    const out = {
      kind: "group",
      id: slugifyId(node.name, "group"),
      layout: layout,
      visual: visual,
      children: children,
    };
    if (isMeaningfulLayoutAlign(node.layoutAlign)) out.layoutAlign = node.layoutAlign;
    return out;
  }
  return null;
}

async function extractLayout(node) {
  const layout = {};
  if ("layoutMode" in node) {
    layout.mode = node.layoutMode === "HORIZONTAL" ? "HORIZONTAL"
      : node.layoutMode === "VERTICAL" ? "VERTICAL" : "NONE";
  } else {
    layout.mode = "NONE";
  }
  if (layout.mode !== "NONE") {
    layout.primaryAxisSizingMode = node.primaryAxisSizingMode || "AUTO";
    layout.counterAxisSizingMode = node.counterAxisSizingMode || "AUTO";
    layout.primaryAxisAlignItems = node.primaryAxisAlignItems || "MIN";
    layout.counterAxisAlignItems = node.counterAxisAlignItems || "MIN";
    layout.paddingTop = await readBoundOrNumber(node, "paddingTop");
    layout.paddingRight = await readBoundOrNumber(node, "paddingRight");
    layout.paddingBottom = await readBoundOrNumber(node, "paddingBottom");
    layout.paddingLeft = await readBoundOrNumber(node, "paddingLeft");
    layout.itemSpacing = await readBoundOrNumber(node, "itemSpacing");
  }
  if (node.layoutSizingHorizontal === "FILL") layout.width = "FILL";
  else if (node.layoutSizingHorizontal === "HUG") layout.width = "HUG";
  else if (typeof node.width === "number") {
    const w = await readBoundOrNumber(node, "width");
    layout.width = w !== null ? w : node.width;
  }
  if (node.layoutSizingVertical === "FILL") layout.height = "FILL";
  else if (node.layoutSizingVertical === "HUG") layout.height = "HUG";
  else if (typeof node.height === "number") {
    const h = await readBoundOrNumber(node, "height");
    layout.height = h !== null ? h : node.height;
  }
  return layout;
}

function minimalLayout() {
  return { mode: "NONE", width: "HUG", height: "HUG" };
}

async function extractVisual(node) {
  const visual = { cornerRadius: 0, fill: null, stroke: null, shadow: null };
  const cr = await readBoundOrNumber(node, "cornerRadius");
  if (cr !== null) visual.cornerRadius = cr;

  if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
    const f = node.fills[0];
    if (f.type === "SOLID") {
      const bound = await readBoundVarFromArray(node, "fills", 0);
      visual.fill = bound || rgbaToHex(f.color, f.opacity == null ? 1 : f.opacity);
    }
  }
  if ("strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
    const s = node.strokes[0];
    if (s.type === "SOLID") {
      const bound = await readBoundVarFromArray(node, "strokes", 0);
      visual.stroke = bound || rgbaToHex(s.color, s.opacity == null ? 1 : s.opacity);
    }
  }
  if ("effects" in node && Array.isArray(node.effects)) {
    const sh = node.effects.find(function (e) { return e.type === "DROP_SHADOW" && e.visible !== false; });
    if (sh) {
      const bound = await readBoundVarFromArray(node, "effects", 0);
      visual.shadow = bound || ("drop-shadow(" + sh.offset.x + "px " + sh.offset.y + "px " + sh.radius + "px " + rgbaToHex(sh.color, sh.color.a == null ? 1 : sh.color.a) + ")");
    }
  }
  return visual;
}

function emptyVisual() {
  return { cornerRadius: 0, fill: null, stroke: null, shadow: null };
}

// fontName.style → fontWeight number (DS 의 fontWeight 와 비교용).
function fontStyleToWeight(style) {
  if (!style) return null;
  const s = String(style).toLowerCase().replace(/\s+/g, "");
  if (s.includes("thin") || s.includes("hairline")) return 100;
  if (s.includes("extralight") || s.includes("ultralight")) return 200;
  if (s.includes("light")) return 300;
  if (s.includes("medium")) return 500;
  if (s.includes("semibold") || s.includes("demibold")) return 600;
  if (s.includes("extrabold") || s.includes("ultrabold")) return 800;
  if (s.includes("black") || s.includes("heavy")) return 900;
  if (s.includes("bold")) return 700;
  if (s.includes("regular") || s.includes("normal") || s.includes("book")) return 400;
  return null;
}

// 옵션 C — text 노드의 boundVariables (fontSize/lineHeight/letterSpacing) 의 Variable
// path 를 읽어, TYPOGRAPHY_PATH_LOOKUP 의 어느 composite 와 일치하는지 찾음.
// fontWeight 는 figma 가 fontName 으로 처리하니 path 비교 대상에서 제외 (fontName.style 로 보조 검증).
async function matchTypographyByPaths(node) {
  const boundPaths = {};
  for (const field of ["fontSize", "lineHeight", "letterSpacing"]) {
    if (node.boundVariables && node.boundVariables[field]) {
      try {
        const v = await figma.variables.getVariableByIdAsync(node.boundVariables[field].id);
        if (!v) continue;
        let collectionName = "";
        try {
          const col = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
          if (col && col.name) collectionName = normalizeCollectionName(col.name);
        } catch (e) {}
        const dotPath = String(v.name).replace(/\//g, ".");
        boundPaths[field] = collectionName ? collectionName + "." + dotPath : dotPath;
      } catch (e) {}
    }
  }
  const boundFields = Object.keys(boundPaths);
  if (boundFields.length === 0) return null; // 옵션 C 적용 불가 — 옵션 A 로 떨어짐

  const weight = fontStyleToWeight(node.fontName && node.fontName.style);

  const candidates = [];
  for (const name in TYPOGRAPHY_PATH_LOOKUP) {
    if (!Object.prototype.hasOwnProperty.call(TYPOGRAPHY_PATH_LOOKUP, name)) continue;
    const entry = TYPOGRAPHY_PATH_LOOKUP[name];
    let allMatch = true;
    for (const f of boundFields) {
      if (entry[f] !== boundPaths[f]) { allMatch = false; break; }
    }
    if (!allMatch) continue;
    // fontWeight 보조 검증 — DS path 의 끝 segment 가 weight 명. weight 추출 후 비교.
    if (weight != null && entry.fontWeight) {
      const dsWeightKey = entry.fontWeight.split(".").pop().toLowerCase();
      const dsWeight = fontStyleToWeight(dsWeightKey);
      if (dsWeight != null && dsWeight !== weight) continue;
    }
    candidates.push(name);
  }
  // 동률 (여러 composite 가 raw 값/path 가 동일 — body vs list-label 등) →
  // DS 정의 순서대로 첫 후보 우선. 0개면 null.
  return candidates.length > 0 ? candidates[0] : null;
}

// 옵션 A — node 의 raw 값 (fontSize/lineHeight/letterSpacing/fontWeight) 을
// TYPOGRAPHY_RAW_LOOKUP 의 entry 와 정확 매칭 (작은 tolerance).
function matchTypographyByRaw(node) {
  const fs_ = typeof node.fontSize === "number" ? node.fontSize : null;
  if (fs_ == null) return null;
  const lh = node.lineHeight; // { value, unit: "PIXELS"|"PERCENT"|"AUTO" }
  const ls = node.letterSpacing; // { value, unit: "PIXELS"|"PERCENT" }
  const weight = fontStyleToWeight(node.fontName && node.fontName.style);

  const candidates = [];
  for (const entry of TYPOGRAPHY_RAW_LOOKUP) {
    if (Math.abs(entry.fontSize - fs_) > 0.5) continue;
    if (entry.fontWeight != null && weight != null && entry.fontWeight !== weight) continue;
    if (entry.lineHeight && lh && lh.unit && lh.unit !== "AUTO") {
      if (entry.lineHeight.unit !== lh.unit) continue;
      if (Math.abs(entry.lineHeight.value - lh.value) > 0.5) continue;
    }
    if (entry.letterSpacing != null && ls && typeof ls.value === "number") {
      // ls.unit 이 PERCENT 면 px 환산 (fontSize 기준) — DS 는 px 단위
      let lsPx = ls.value;
      if (ls.unit === "PERCENT") lsPx = (ls.value / 100) * fs_;
      if (Math.abs(entry.letterSpacing - lsPx) > 0.15) continue;
    }
    candidates.push(entry.name);
  }
  // 동률 (여러 composite 가 raw 값/path 가 동일 — body vs list-label 등) →
  // DS 정의 순서대로 첫 후보 우선. 0개면 null.
  return candidates.length > 0 ? candidates[0] : null;
}

async function extractText(node) {
  const colorBound = await readBoundVarFromArray(node, "fills", 0);
  let color = null;
  if (colorBound) {
    color = colorBound;
  } else if (node.fills && node.fills[0] && node.fills[0].type === "SOLID") {
    color = rgbaToHex(node.fills[0].color, node.fills[0].opacity == null ? 1 : node.fills[0].opacity);
  }
  let textStyle = null;
  const textStyleId = node.textStyleId;
  if (textStyleId && typeof textStyleId === "string") {
    try {
      const style = await figma.getStyleByIdAsync(textStyleId);
      if (style) textStyle = "{semantic.typography." + slugify(style.name) + "}";
    } catch (e) {}
  }
  // 옵션 C: 사용자가 textStyle 안 박았어도 fontSize/lineHeight/letterSpacing 을
  // 각 Variable 로 박은 경우 — bound Variable path 셋이 어떤 composite 와 매칭되는지 본다.
  if (!textStyle) {
    const matched = await matchTypographyByPaths(node);
    if (matched) textStyle = "{semantic.typography." + matched + "}";
  }
  // 옵션 A: Variable 도 안 박은 raw 값 케이스 — 4 필드 (fontSize/lineHeight/weight/letterSpacing)
  // 의 raw 값을 DS lookup 과 비교해 composite 추론.
  if (!textStyle) {
    const matched = matchTypographyByRaw(node);
    if (matched) textStyle = "{semantic.typography." + matched + "}";
  }
  const fontStyle = node.fontName && node.fontName.style ? node.fontName.style : "regular";
  const out = {
    kind: "text",
    id: slugifyId(node.name, "text"),
    content: node.characters,
    textStyle: textStyle || ("(raw fontSize=" + node.fontSize + ", weight=" + fontStyle + ")"),
    color: color || "(raw)",
  };
  if (isMeaningfulLayoutAlign(node.layoutAlign)) out.layoutAlign = node.layoutAlign;
  if (node.textAutoResize) out.autoResize = node.textAutoResize;
  return out;
}

async function extractInstance(node) {
  let main = null;
  try {
    main = await node.getMainComponentAsync();
  } catch (e) {}
  let component = "(unknown)";
  let variant = null;
  if (main) {
    if (main.parent && main.parent.type === "COMPONENT_SET") {
      component = guessSpecName(main.parent);
      variant = parseVariantName(main.name);
    } else {
      component = guessSpecName(main);
    }
  }
  const props = {};
  if (node.componentProperties) {
    for (const k in node.componentProperties) {
      if (!Object.prototype.hasOwnProperty.call(node.componentProperties, k)) continue;
      const def = node.componentProperties[k];
      const key = k.split("#")[0];
      if (def.type === "TEXT" || def.type === "BOOLEAN") {
        props[key] = def.value;
      } else if (def.type === "INSTANCE_SWAP") {
        // value 는 component nodeId. 우리 spec 형태로 component path 변환.
        props[key] = await resolveSwapTarget(def.value);
      }
    }
  }
  const out = {
    kind: "ref",
    id: slugifyId(node.name, "ref"),
    component: component,
  };
  if (variant) out.variant = variant;
  if (Object.keys(props).length > 0) out.props = props;
  if (isMeaningfulLayoutAlign(node.layoutAlign)) out.layoutAlign = node.layoutAlign;
  return out;
}

// INSTANCE_SWAP value (component nodeId) → component path ("atom/icon/arrow-left" 등)
async function resolveSwapTarget(nodeId) {
  if (!nodeId) return nodeId;
  try {
    const target = await figma.getNodeByIdAsync(nodeId);
    if (!target) return nodeId;
    if (target.parent && target.parent.type === "COMPONENT_SET") {
      return guessSpecName(target.parent);
    }
    return guessSpecName(target);
  } catch (e) {
    return nodeId;
  }
}

// layoutAlign 가 "INHERIT" 또는 unset 이면 spec 에 안 박음 (default = inherit).
function isMeaningfulLayoutAlign(value) {
  return value && value !== "INHERIT";
}

async function readBoundVarFromArray(node, propName, idx) {
  if (!node.boundVariables) return null;
  const arr = node.boundVariables[propName];
  if (!arr || !Array.isArray(arr) || !arr[idx]) return null;
  try {
    const variable = await figma.variables.getVariableByIdAsync(arr[idx].id);
    return await variableToTokenPath(variable);
  } catch (e) {
    return null;
  }
}

async function readBoundOrNumber(node, propName) {
  if (node.boundVariables && node.boundVariables[propName]) {
    try {
      const v = await figma.variables.getVariableByIdAsync(node.boundVariables[propName].id);
      const path = await variableToTokenPath(v);
      if (path) return path;
    } catch (e) {}
  }
  if (typeof node[propName] === "number") return node[propName];
  return null;
}

// Figma Variable → DTCG token path 역변환.
// sync-tokens.js 의 varNameFor_s 룰 역:
//   DS path "foundation.dimension.spacing.none"
//     → Variable Collection name = "foundation" (또는 "SKT Foundation" 등 prefix 변형)
//     → Variable name = "dimension/spacing/none"
// 역변환:
//   normalizedCollectionName + "." + variable.name.replace(/\//g, ".")
async function variableToTokenPath(variable) {
  if (!variable) return null;
  let collectionName = "";
  try {
    const col = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
    if (col && col.name) collectionName = normalizeCollectionName(col.name);
  } catch (e) {}
  const dotPath = String(variable.name).replace(/\//g, ".");
  const full = collectionName ? collectionName + "." + dotPath : dotPath;
  return "{" + full + "}";
}

// "SKT Foundation" / "Foundation" / "foundation" 모두 → "foundation"
// DS JSON 의 top-level key (foundation/semantic/component) 와 매칭.
function normalizeCollectionName(name) {
  const s = String(name || "").toLowerCase();
  if (s.indexOf("foundation") !== -1) return "foundation";
  if (s.indexOf("semantic") !== -1) return "semantic";
  if (s.indexOf("component") !== -1) return "component";
  return s.replace(/\s+/g, "");
}

function rgbaToHex(c, a) {
  const toHex = function (n) { return Math.round(n * 255).toString(16).padStart(2, "0"); };
  const hex = "#" + toHex(c.r) + toHex(c.g) + toHex(c.b);
  return a < 1 ? hex + toHex(a) : hex;
}

function slugify(name) {
  return String(name || "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-_]/g, "");
}

// slugify 결과가 비거나 dash/underscore 만일 때 "{kind}-{N}" 으로 fallback.
// kind: "text" | "group" | "ref" — 호출 부위 별 prefix.
function slugifyId(name, kind) {
  const slug = slugify(name);
  if (slug && !/^[-_]+$/.test(slug)) return slug;
  const k = idCounters[kind] != null ? kind : "node";
  idCounters[k] = (idCounters[k] || 0) + 1;
  return k + "-" + idCounters[k];
}

function guessSpecName(node) {
  if (node.name && node.name.match(/^(atom|mol|ogn|page)\//)) {
    return node.name;
  }
  return slugify(node.name);
}

function guessCategory(specName, node) {
  const seg = specName.split("/")[0];
  if (["atom", "mol", "ogn", "page"].includes(seg)) return seg;
  if (node) {
    const inferred = inferCategoryFromNode(node);
    if (inferred) return inferred;
  }
  return "(unknown)";
}

// 이름 prefix 가 없을 때 노드 구조 기반으로 atom/mol/ogn/page 추론.
// 룰 (WASH_SPEC.md / project_wash_tool.md 메모리):
//   page : 모바일 화면 (width 360~500 + height 600+)
//   atom : children 0  (TEXT/RECTANGLE/INSTANCE 단독)
//   ogn  : children 2+ + (padding 16+ OR width 280+)
//   mol  : children 1~5 (compound)
// 추론 실패 시 null → 호출자가 "(unknown)" 처리.
function inferCategoryFromNode(node) {
  const w = typeof node.width === "number" ? node.width : 0;
  const h = typeof node.height === "number" ? node.height : 0;
  const childrenCount = ("children" in node && Array.isArray(node.children)) ? node.children.length : 0;

  if (w >= 360 && w <= 500 && h >= 600) return "page";
  if (childrenCount === 0) return "atom";

  const pads = [
    typeof node.paddingTop === "number" ? node.paddingTop : 0,
    typeof node.paddingRight === "number" ? node.paddingRight : 0,
    typeof node.paddingBottom === "number" ? node.paddingBottom : 0,
    typeof node.paddingLeft === "number" ? node.paddingLeft : 0,
  ];
  const maxPad = Math.max.apply(null, pads);

  if (childrenCount >= 2 && (maxPad >= 16 || w >= 280)) return "ogn";
  if (childrenCount >= 1 && childrenCount <= 5) return "mol";
  return null;
}

// =============================================
// Wash mode — Figma 손그림 → DS 가이드대로 자동 정규화
// scripter/wash-runtime.js 의 핵심 로직 + DP 룰을 plugin 안으로 통합.
// VAR_MAP / LOOKUPS 는 sync-tokens 가 figma.root.setPluginData 로 저장한 것을 읽음.
// =============================================

// chrome 격 (외피 padding 0 + width FILL 표준) ogn 이름 패턴.
const WASH_CHROME_PATTERNS = [
  "ogn/status-bar", "ogn/GNB", "ogn/header", "ogn/footer-cs",
  "ogn/tab-bar", "ogn/sticky-footer", "ogn/sticky-footer-cta",
  "ogn/snack-bar", "ogn/step-indicator",
];
function isChromeName(name) {
  if (!name) return false;
  for (let i = 0; i < WASH_CHROME_PATTERNS.length; i++) {
    if (name === WASH_CHROME_PATTERNS[i]) return true;
  }
  // chrome 키워드 fallback
  return /chrome|status-bar|^ogn\/(GNB|header|footer|tab-bar|sticky|snack-bar)/i.test(name);
}

async function runWash(opts) {
  const dryRun = opts && opts.dryRun;
  await figma.currentPage.loadAsync();

  // 1) pluginData 에서 VAR_MAP + LOOKUPS 읽기
  const varMapRaw = figma.root.getPluginData("skt-vars");
  const lookupsRaw = figma.root.getPluginData("skt-lookups");
  if (!varMapRaw || !lookupsRaw) {
    figma.ui.postMessage({
      type: "wash-error",
      message: "DS Variables 동기화가 안 됨 — 먼저 'node scripter/bundle.js --sync' 실행 후 Figma 에서 Run.",
    });
    return;
  }
  const VAR_MAP = JSON.parse(varMapRaw);
  const LOOKUPS = JSON.parse(lookupsRaw);
  const COLOR_LOOKUP = LOOKUPS.color || { text: {}, surface: {}, border: {}, other: {} };
  const COLOR_LOOKUP_RGBA = LOOKUPS.colorRgba || { text: {}, surface: {}, border: {}, other: {} };
  const DIMENSION_LOOKUP = LOOKUPS.dimension || { radius: {}, spacing: {}, size: {} };
  const FONTSIZE_LOOKUP = LOOKUPS.fontSize || {};
  const FONTWEIGHT_LOOKUP = LOOKUPS.fontWeight || {};
  const LETTERSPACING_LOOKUP = LOOKUPS.letterSpacing || {};

  // 2) wash 대상 — 선택된 노드, 없으면 에러.
  const targets = figma.currentPage.selection;
  if (targets.length === 0) {
    figma.ui.postMessage({
      type: "wash-error",
      message: "Wash 대상 노드를 1개 이상 선택해 주세요.",
    });
    return;
  }

  // 3) 통계 + 보고
  const stats = { color: 0, padding: 0, spacing: 0, radius: 0, fontSize: 0, fontWeight: 0, letterSpacing: 0, rule: 0 };
  const report = []; // 정확/가까운 매칭 — 자동 적용
  const fuzzyReport = []; // fuzzy — 사용자 확인 권장
  const ruleReport = []; // DP 룰 적용
  const detectReport = []; // detect-only (룰 위반 검출만)
  const unmatchedRaw = { colors: {}, dimensions: {}, fontSizes: {} };

  for (let i = 0; i < targets.length; i++) {
    await washNode(targets[i], { isTopLevel: true });
  }

  // 4) UI 로 결과 전송
  const summary = {
    type: "wash-result",
    dryRun: dryRun,
    targetCount: targets.length,
    stats: stats,
    report: report,
    fuzzyReport: fuzzyReport,
    ruleReport: ruleReport,
    detectReport: detectReport,
    unmatched: {
      colors: Object.keys(unmatchedRaw.colors).map(function (k) { return { value: k, count: unmatchedRaw.colors[k] }; }),
      dimensions: Object.keys(unmatchedRaw.dimensions).map(function (k) { return { value: k, count: unmatchedRaw.dimensions[k] }; }),
      fontSizes: Object.keys(unmatchedRaw.fontSizes).map(function (k) { return { value: k, count: unmatchedRaw.fontSizes[k] }; }),
    },
  };
  figma.ui.postMessage(summary);

  const totalFix = report.length + fuzzyReport.length + ruleReport.length;
  const note = dryRun ? "(dry-run — 실제 변경 X)" : "";
  figma.notify("✓ Wash: " + totalFix + " fix · 검출 " + detectReport.length + " " + note);

  // ----- 노드 1개 처리 (재귀) -----
  async function washNode(node, ctx) {
    const nodeName = node.name || "(unnamed)";
    const isText = node.type === "TEXT";
    const isTopLevel = ctx && ctx.isTopLevel;

    // === 시각 토큰 매칭 ===

    // 1. fills SOLID — text 면 COLOR.text 우선, 아니면 COLOR.surface 우선
    if ("fills" in node && Array.isArray(node.fills) && node.fills.length > 0) {
      const fills = node.fills.map(function (f) { return Object.assign({}, f); });
      let changed = false;
      for (let i = 0; i < fills.length; i++) {
        const f = fills[i];
        if (f.type === "SOLID" && f.color && !isFillBoundW(node, "fills", i)) {
          const opacity = f.opacity == null ? 1 : f.opacity;
          const result = matchColorContextual(f.color, opacity, isText ? "text" : "surface");
          if (result.path && VAR_MAP[result.path]) {
            const msg = nodeName + " fills[" + i + "] (#" + rgbToHexW(f.color) + (opacity < 1 ? " α" + opacity.toFixed(2) : "") + ") → " + result.path;
            if (!dryRun) {
              const v = await figma.variables.getVariableByIdAsync(VAR_MAP[result.path]);
              if (v) {
                fills[i] = figma.variables.setBoundVariableForPaint(f, "color", v);
                changed = true;
                stats.color++;
              }
            } else {
              stats.color++;
            }
            if (result.distance > 0.05) fuzzyReport.push(msg + " (거리 " + result.distance.toFixed(3) + ")");
            else report.push(msg);
          } else {
            const key = rgbToHexW(f.color) + (opacity < 1 ? "α" + opacity.toFixed(2) : "");
            unmatchedRaw.colors[key] = (unmatchedRaw.colors[key] || 0) + 1;
          }
        }
      }
      if (changed && !dryRun) node.fills = fills;
    }

    // 2. strokes — COLOR.border 우선
    if ("strokes" in node && Array.isArray(node.strokes) && node.strokes.length > 0) {
      const strokes = node.strokes.map(function (s) { return Object.assign({}, s); });
      let changed = false;
      for (let i = 0; i < strokes.length; i++) {
        const s = strokes[i];
        if (s.type === "SOLID" && s.color && !isFillBoundW(node, "strokes", i)) {
          const opacity = s.opacity == null ? 1 : s.opacity;
          const result = matchColorContextual(s.color, opacity, "border");
          if (result.path && VAR_MAP[result.path]) {
            const msg = nodeName + " strokes[" + i + "] → " + result.path;
            if (!dryRun) {
              const v = await figma.variables.getVariableByIdAsync(VAR_MAP[result.path]);
              if (v) {
                strokes[i] = figma.variables.setBoundVariableForPaint(s, "color", v);
                changed = true;
                stats.color++;
              }
            } else {
              stats.color++;
            }
            if (result.distance > 0.05) fuzzyReport.push(msg + " (거리 " + result.distance.toFixed(3) + ")");
            else report.push(msg);
          }
        }
      }
      if (changed && !dryRun) node.strokes = strokes;
    }

    // 3. padding — DIMENSION.spacing 만
    const paddingFields = ["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"];
    for (let i = 0; i < paddingFields.length; i++) {
      const prop = paddingFields[i];
      if (prop in node && typeof node[prop] === "number") {
        const result = matchDimensionContextual(node[prop], "spacing");
        if (result.path && VAR_MAP[result.path] && !isFieldBoundW(node, prop)) {
          const msg = nodeName + " " + prop + "=" + node[prop] + " → " + result.path;
          if (!dryRun) {
            try {
              const v = await figma.variables.getVariableByIdAsync(VAR_MAP[result.path]);
              if (v) {
                node.setBoundVariable(prop, v);
                stats.padding++;
              }
            } catch (e) {}
          } else {
            stats.padding++;
          }
          if (result.distance > 0) fuzzyReport.push(msg + " (거리 " + result.distance + ")");
          else report.push(msg);
        } else if (!result.path && node[prop] > 0) {
          unmatchedRaw.dimensions[node[prop]] = (unmatchedRaw.dimensions[node[prop]] || 0) + 1;
        }
      }
    }

    // 4. itemSpacing
    if ("itemSpacing" in node && typeof node.itemSpacing === "number") {
      const result = matchDimensionContextual(node.itemSpacing, "spacing");
      if (result.path && VAR_MAP[result.path] && !isFieldBoundW(node, "itemSpacing")) {
        const msg = nodeName + " itemSpacing=" + node.itemSpacing + " → " + result.path;
        if (!dryRun) {
          try {
            const v = await figma.variables.getVariableByIdAsync(VAR_MAP[result.path]);
            if (v) {
              node.setBoundVariable("itemSpacing", v);
              stats.spacing++;
            }
          } catch (e) {}
        } else {
          stats.spacing++;
        }
        if (result.distance > 0) fuzzyReport.push(msg);
        else report.push(msg);
      } else if (!result.path && node.itemSpacing > 0) {
        unmatchedRaw.dimensions[node.itemSpacing] = (unmatchedRaw.dimensions[node.itemSpacing] || 0) + 1;
      }
    }

    // 5. cornerRadius — DIMENSION.radius
    if ("cornerRadius" in node && typeof node.cornerRadius === "number") {
      const result = matchDimensionContextual(node.cornerRadius, "radius");
      if (result.path && VAR_MAP[result.path]) {
        const msg = nodeName + " cornerRadius=" + node.cornerRadius + " → " + result.path;
        if (!dryRun) {
          try {
            const v = await figma.variables.getVariableByIdAsync(VAR_MAP[result.path]);
            if (v) {
              const radiusProps = ["topLeftRadius", "topRightRadius", "bottomLeftRadius", "bottomRightRadius"];
              for (let r = 0; r < radiusProps.length; r++) {
                const rp = radiusProps[r];
                if (rp in node && !isFieldBoundW(node, rp)) {
                  node.setBoundVariable(rp, v);
                }
              }
              stats.radius++;
            }
          } catch (e) {}
        } else {
          stats.radius++;
        }
        if (result.distance > 0) fuzzyReport.push(msg);
        else report.push(msg);
      } else if (!result.path && node.cornerRadius > 0) {
        unmatchedRaw.dimensions[node.cornerRadius] = (unmatchedRaw.dimensions[node.cornerRadius] || 0) + 1;
      }
    }

    // 6. text — fontSize / fontWeight / letterSpacing
    if (isText) {
      const fs = node.fontSize;
      if (typeof fs === "number" && FONTSIZE_LOOKUP[fs] && VAR_MAP[FONTSIZE_LOOKUP[fs]] && !isFieldBoundW(node, "fontSize")) {
        const path = FONTSIZE_LOOKUP[fs];
        const msg = nodeName + " fontSize=" + fs + " → " + path;
        if (!dryRun) {
          try {
            const v = await figma.variables.getVariableByIdAsync(VAR_MAP[path]);
            if (v) {
              node.setBoundVariable("fontSize", v);
              stats.fontSize++;
            }
          } catch (e) {}
        } else {
          stats.fontSize++;
        }
        report.push(msg);
      } else if (typeof fs === "number" && !FONTSIZE_LOOKUP[fs]) {
        unmatchedRaw.fontSizes[fs] = (unmatchedRaw.fontSizes[fs] || 0) + 1;
      }
      if (node.fontName && node.fontName.style) {
        const styleKey = String(node.fontName.style).toLowerCase().replace(/\s+/g, "");
        const path = FONTWEIGHT_LOOKUP[styleKey];
        if (path && VAR_MAP[path] && !isFieldBoundW(node, "fontWeight")) {
          const msg = nodeName + " weight=" + node.fontName.style + " → " + path;
          if (!dryRun) {
            try {
              const v = await figma.variables.getVariableByIdAsync(VAR_MAP[path]);
              if (v) {
                node.setBoundVariable("fontWeight", v);
                stats.fontWeight++;
              }
            } catch (e) {}
          } else {
            stats.fontWeight++;
          }
          report.push(msg);
        }
      }
      if (node.letterSpacing && typeof node.letterSpacing.value === "number" && node.letterSpacing.unit === "PIXELS") {
        const ls = node.letterSpacing.value;
        const path = LETTERSPACING_LOOKUP[ls];
        if (path && VAR_MAP[path] && !isFieldBoundW(node, "letterSpacing")) {
          const msg = nodeName + " letterSpacing=" + ls + " → " + path;
          if (!dryRun) {
            try {
              const v = await figma.variables.getVariableByIdAsync(VAR_MAP[path]);
              if (v) {
                node.setBoundVariable("letterSpacing", v);
                stats.letterSpacing++;
              }
            } catch (e) {}
          } else {
            stats.letterSpacing++;
          }
          report.push(msg);
        }
      }
    }

    // === DP 룰 (top-level 노드만, 안전한 것부터) ===
    if (isTopLevel) {
      await applyDpRules(node);
    }

    // 자식 재귀 — INSTANCE 안은 건드리지 않음 (component property 로 변경)
    if ("children" in node && node.type !== "INSTANCE") {
      for (let i = 0; i < node.children.length; i++) {
        await washNode(node.children[i], { isTopLevel: false });
      }
    }
  }

  // ----- DP 룰 적용 -----
  async function applyDpRules(node) {
    const name = node.name || "";

    // RULE A: chrome ogn 의 width → FILL (CONVENTIONS § 6.3 — chrome 도 FILL 표준)
    if (isChromeName(name) && "layoutSizingHorizontal" in node) {
      if (node.layoutSizingHorizontal !== "FILL" && node.parent && "layoutMode" in node.parent && node.parent.layoutMode !== "NONE") {
        const msg = name + " width → FILL (chrome 격 ogn 표준)";
        if (!dryRun) {
          try {
            node.layoutSizingHorizontal = "FILL";
            stats.rule++;
          } catch (e) {}
        } else {
          stats.rule++;
        }
        ruleReport.push(msg);
      }
    }

    // RULE B (검출만): ogn 격 + 외피 padding > 0 → 외피 0 + content wrapper 24 권장
    //   자동 변경은 false-positive 위험 (의도된 padding 일 수 있음). 보고만.
    const inferredCat = inferCategoryFromNode(node);
    if (inferredCat === "ogn" || /^ogn\//.test(name)) {
      const padL = typeof node.paddingLeft === "number" ? node.paddingLeft : 0;
      const padR = typeof node.paddingRight === "number" ? node.paddingRight : 0;
      if (padL > 0 || padR > 0) {
        // chrome 은 외피 padding 0 룰 적용 안 함 (이름이 chrome 인 ogn 은 자체 padding OK)
        if (!isChromeName(name)) {
          detectReport.push(name + " ogn 외피 paddingLR=" + padL + "/" + padR + " — DP § 4.3: 외피 padding 0 + 자식 content wrapper 24 권장");
        }
      }
    }

    // RULE C (검출만): page 격 + paddingLR > 0 → Pattern B (서브 페이지) 위반 가능성
    if (inferredCat === "page" || /^page\//.test(name)) {
      const padL = typeof node.paddingLeft === "number" ? node.paddingLeft : 0;
      const padR = typeof node.paddingRight === "number" ? node.paddingRight : 0;
      // 홈/GNB 는 Pattern A (padding 24 OK), 그 외 서브 페이지는 Pattern B (padding 0)
      const isHome = /\/main$|\/home$/i.test(name);
      if (!isHome && (padL > 0 || padR > 0)) {
        detectReport.push(name + " page paddingLR=" + padL + "/" + padR + " — DP § 9.1.1: 서브 페이지는 Pattern B (padding 0) 권장. ogn 자체 padding 24 로 처리");
      }
    }
  }

  // ----- 매칭 함수 (wash-runtime 의 컨텍스트 인식 그대로) -----
  function matchColorContextual(c, opacity, primaryCategory) {
    let fallbackCategories;
    if (primaryCategory === "text") fallbackCategories = ["surface", "other"];
    else if (primaryCategory === "surface") fallbackCategories = ["other", "text"];
    else if (primaryCategory === "border") fallbackCategories = ["other"];
    else fallbackCategories = ["other"];
    const tryCategories = [primaryCategory].concat(fallbackCategories);

    const key = colorKeyW(c);
    const rgbaKey = key + "," + opacity.toFixed(3);

    // 1. 정확 (alpha 포함)
    for (let i = 0; i < tryCategories.length; i++) {
      const cat = tryCategories[i];
      if (COLOR_LOOKUP_RGBA[cat] && COLOR_LOOKUP_RGBA[cat][rgbaKey]) {
        return { path: COLOR_LOOKUP_RGBA[cat][rgbaKey], distance: 0 };
      }
    }
    // 2. 정확 (RGB 만, alpha=1)
    if (opacity === 1) {
      for (let i = 0; i < tryCategories.length; i++) {
        const cat = tryCategories[i];
        if (COLOR_LOOKUP[cat] && COLOR_LOOKUP[cat][key]) {
          return { path: COLOR_LOOKUP[cat][key], distance: 0 };
        }
      }
    }
    // 3. fuzzy (Phase 3: 0.12 threshold)
    let bestPath = null;
    let bestDist = 0.12;
    for (let i = 0; i < tryCategories.length; i++) {
      const cat = tryCategories[i];
      const pool = COLOR_LOOKUP[cat] || {};
      for (const k in pool) {
        const parts = k.split(",").map(parseFloat);
        const d = Math.sqrt(
          Math.pow(parts[0] - c.r, 2) +
          Math.pow(parts[1] - c.g, 2) +
          Math.pow(parts[2] - c.b, 2)
        );
        if (d < bestDist) {
          bestDist = d;
          bestPath = pool[k];
        }
      }
      if (bestPath) break;
    }
    return { path: bestPath, distance: bestDist };
  }

  function matchDimensionContextual(num, category) {
    const pool = DIMENSION_LOOKUP[category] || {};
    if (pool[num] !== undefined) return { path: pool[num], distance: 0 };
    let bestPath = null;
    let bestDist = 1.5;
    for (const k in pool) {
      const v = parseFloat(k);
      const d = Math.abs(v - num);
      if (d < bestDist) {
        bestDist = d;
        bestPath = pool[k];
      }
    }
    return { path: bestPath, distance: bestDist === 1.5 ? null : bestDist };
  }

  function colorKeyW(c) {
    return c.r.toFixed(4) + "," + c.g.toFixed(4) + "," + c.b.toFixed(4);
  }
  function rgbToHexW(c) {
    function h(n) { return ("0" + Math.round(n * 255).toString(16)).slice(-2); }
    return (h(c.r) + h(c.g) + h(c.b)).toUpperCase();
  }
  function isFillBoundW(node, prop, index) {
    if (!node.boundVariables) return false;
    const arr = node.boundVariables[prop];
    if (!Array.isArray(arr)) return false;
    return !!arr[index];
  }
  function isFieldBoundW(node, prop) {
    if (!node.boundVariables) return false;
    return !!node.boundVariables[prop];
  }
}
