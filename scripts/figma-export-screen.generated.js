// AUTO-GENERATED from RenderTree (NOVA-PRDD-PG-001-0) — paste into bridge plugin (JSON → Figma) and Run.
const DS_TOKENS = {
  "foundation": {
    "dimension": {
      "size": {
        "screen-content-width": {
          "value": 375
        }
      }
    }
  }
};
const COMPONENT_SPEC = {
  "$schema": "component-spec-v1",
  "name": "page/nova-prdd-pg-001-0",
  "category": "page",
  "description": "상품 상세 핵심 요약 탐색",
  "base": {
    "layout": {
      "mode": "VERTICAL",
      "primaryAxisSizingMode": "FIXED",
      "counterAxisSizingMode": "FIXED",
      "primaryAxisAlignItems": "MIN",
      "counterAxisAlignItems": "MIN",
      "paddingTop": 0,
      "paddingRight": 0,
      "paddingBottom": 0,
      "paddingLeft": 0,
      "itemSpacing": 0,
      "width": 375,
      "height": 812
    },
    "visual": {
      "cornerRadius": 0,
      "fill": null,
      "stroke": null,
      "shadow": null
    },
    "children": [
      {
        "kind": "group",
        "id": "screen-header",
        "layout": {
          "mode": "VERTICAL",
          "primaryAxisSizingMode": "AUTO",
          "counterAxisSizingMode": "AUTO",
          "primaryAxisAlignItems": "MIN",
          "counterAxisAlignItems": "MIN",
          "paddingTop": 0,
          "paddingRight": 0,
          "paddingBottom": 0,
          "paddingLeft": 0,
          "itemSpacing": 12,
          "width": "FILL",
          "height": "HUG"
        },
        "visual": {
          "cornerRadius": 0,
          "fill": null,
          "stroke": null,
          "shadow": null
        },
        "children": [
          {
            "kind": "group",
            "id": "NOVA-PRDD-PG-001-0__area0",
            "layout": {
              "mode": "VERTICAL",
              "primaryAxisSizingMode": "AUTO",
              "counterAxisSizingMode": "AUTO",
              "primaryAxisAlignItems": "MIN",
              "counterAxisAlignItems": "MIN",
              "paddingTop": 0,
              "paddingRight": 0,
              "paddingBottom": 0,
              "paddingLeft": 0,
              "itemSpacing": 12,
              "width": "FILL",
              "height": "HUG"
            },
            "visual": {
              "cornerRadius": 0,
              "fill": null,
              "stroke": null,
              "shadow": null
            },
            "children": [
              {
                "kind": "ref",
                "id": "d-appbar-1",
                "component": "AppBar",
                "props": {
                  "LeftItem": "On",
                  "Logo": "Off",
                  "Title": "On"
                }
              }
            ]
          }
        ]
      },
      {
        "kind": "group",
        "id": "screen-contents",
        "layout": {
          "mode": "VERTICAL",
          "primaryAxisSizingMode": "AUTO",
          "counterAxisSizingMode": "AUTO",
          "primaryAxisAlignItems": "MIN",
          "counterAxisAlignItems": "MIN",
          "paddingTop": 0,
          "paddingRight": 0,
          "paddingBottom": 0,
          "paddingLeft": 0,
          "itemSpacing": 12,
          "width": "FILL",
          "height": "HUG"
        },
        "visual": {
          "cornerRadius": 0,
          "fill": null,
          "stroke": null,
          "shadow": null
        },
        "children": [
          {
            "kind": "group",
            "id": "screen-contents-section-1",
            "layout": {
              "mode": "VERTICAL",
              "primaryAxisSizingMode": "AUTO",
              "counterAxisSizingMode": "AUTO",
              "primaryAxisAlignItems": "MIN",
              "counterAxisAlignItems": "MIN",
              "paddingTop": 28,
              "paddingRight": 12,
              "paddingBottom": 28,
              "paddingLeft": 12,
              "itemSpacing": 20,
              "width": "FILL",
              "height": "HUG"
            },
            "visual": {
              "cornerRadius": 0,
              "fill": null,
              "stroke": null,
              "shadow": null
            },
            "children": [
              {
                "kind": "group",
                "id": "NOVA-PRDD-PG-001-0__area1",
                "layout": {
                  "mode": "VERTICAL",
                  "primaryAxisSizingMode": "AUTO",
                  "counterAxisSizingMode": "AUTO",
                  "primaryAxisAlignItems": "MIN",
                  "counterAxisAlignItems": "MIN",
                  "paddingTop": 0,
                  "paddingRight": 0,
                  "paddingBottom": 0,
                  "paddingLeft": 0,
                  "itemSpacing": 12,
                  "width": "FILL",
                  "height": "HUG"
                },
                "visual": {
                  "cornerRadius": 0,
                  "fill": null,
                  "stroke": null,
                  "shadow": null
                },
                "children": [
                  {
                    "kind": "ref",
                    "id": "d-card-summary-1",
                    "component": "CardSummary",
                    "props": {}
                  },
                  {
                    "kind": "ref",
                    "id": "d-badge-status-1",
                    "component": "Badge",
                    "props": {
                      "Type": "Blue"
                    }
                  },
                  {
                    "kind": "ref",
                    "id": "d-text-button-origin-1",
                    "component": "TextButton",
                    "props": {}
                  },
                  {
                    "kind": "ref",
                    "id": "d-list-text-info-1",
                    "component": "ListText",
                    "props": {
                      "Table": "on"
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "kind": "group",
        "id": "screen-bottom",
        "layout": {
          "mode": "VERTICAL",
          "primaryAxisSizingMode": "AUTO",
          "counterAxisSizingMode": "AUTO",
          "primaryAxisAlignItems": "MIN",
          "counterAxisAlignItems": "MIN",
          "paddingTop": 0,
          "paddingRight": 0,
          "paddingBottom": 0,
          "paddingLeft": 0,
          "itemSpacing": 12,
          "width": "FILL",
          "height": "HUG"
        },
        "visual": {
          "cornerRadius": 0,
          "fill": null,
          "stroke": null,
          "shadow": null
        },
        "children": []
      }
    ]
  }
};

// =============================================
// SKT Genui — Generator Core
// scripter/bundle.js 가 이 파일 내용을 .generated.js 로 합침.
// DS_TOKENS, COMPONENT_SPEC 변수는 bundler 가 상단에 주입.
// =============================================

// ---------- 1. Token Resolver ----------
function hexToRgb(s) {
  s = s.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s.slice(0, 6), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

function parseLiteral(v) {
  if (typeof v === "number") return { type: "dimension", px: v };
  if (typeof v !== "string") return v;
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return { type: "color", rgb: hexToRgb(v) };
  if (/^-?\d+(\.\d+)?(px|ms)$/.test(v)) return { type: "dimension", px: parseFloat(v) };
  if (/^-?\d+(\.\d+)?%$/.test(v)) return { type: "percent", value: parseFloat(v) };
  return v;
}

// Returns the original token path if ref looks like "{a.b.c}", else null.
function tokenPathOf(ref) {
  if (typeof ref !== "string") return null;
  const m = ref.match(/^\{(.+)\}$/);
  return m ? m[1] : null;
}

function resolveToken(tokens, ref, seen) {
  if (!seen) seen = new Set();
  if (typeof ref !== "string") return ref;
  const m = ref.match(/^\{(.+)\}$/);
  if (!m) return parseLiteral(ref);
  const path = m[1];
  if (seen.has(path)) throw new Error("Token cycle: " + path);
  seen.add(path);
  const dsNode = path.split(".").reduce((o, k) => (o == null ? o : o[k]), tokens);
  if (!dsNode) throw new Error("Token missing: " + path);
  const v = dsNode.value !== undefined ? dsNode.value : dsNode;
  if (typeof v === "string" && /^\{.+\}$/.test(v)) return resolveToken(tokens, v, seen);
  // shadow composite
  if (v && typeof v === "object" && "blur" in v && "color" in v) {
    const c = resolveToken(tokens, v.color, new Set());
    return {
      type: "shadow",
      offset: { x: parseFloat(v.x), y: parseFloat(v.y) },
      radius: parseFloat(v.blur),
      spread: parseFloat(v.spread),
      color: { r: c.rgb.r, g: c.rgb.g, b: c.rgb.b, a: v.alpha }
    };
  }
  // typography composite
  if (v && typeof v === "object" && "fontSize" in v) {
    const fs = resolveToken(tokens, v.fontSize, new Set());
    const lh = resolveToken(tokens, v.lineHeight, new Set());
    const fw = resolveToken(tokens, v.fontWeight, new Set());
    const ls = resolveToken(tokens, v.letterSpacing, new Set());
    // lineHeight 는 PIXELS 또는 PERCENT — unit 정보 보존
    let lineHeightObj;
    if (lh && lh.type === "percent") {
      lineHeightObj = { value: lh.value, unit: "PERCENT" };
    } else if (lh && lh.px != null) {
      lineHeightObj = { value: lh.px, unit: "PIXELS" };
    } else if (typeof lh === "number") {
      lineHeightObj = { value: lh, unit: "PIXELS" };
    } else {
      lineHeightObj = null;
    }
    return {
      type: "typography",
      fontSize: fs.px != null ? fs.px : parseFloat(fs),
      lineHeight: lineHeightObj,
      fontWeight: Number(fw.px != null ? fw : fw),
      letterSpacing: ls.px != null ? ls.px : parseFloat(ls || 0),
      // 각 필드가 참조하는 토큰 경로 (Variable 바인딩에 쓰임)
      bindings: {
        fontSize:      tokenPathOf(v.fontSize),
        lineHeight:    tokenPathOf(v.lineHeight),
        fontWeight:    tokenPathOf(v.fontWeight),
        letterSpacing: tokenPathOf(v.letterSpacing)
      }
    };
  }
  return parseLiteral(v);
}

// ---------- 2. Spec merge (base + override) ----------
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

function setDeep(obj, path, val) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const m = part.match(/^children\[(.+?)\]$/);
    if (m && cur.children) {
      // children[id] 패턴 — 배열 안 id 자식으로 진입
      const child = cur.children.find((c) => c.id === m[1]);
      if (!child) return; // path 매칭 실패 — silent skip
      cur = child;
    } else {
      cur = cur[part] = cur[part] || {};
    }
  }
  cur[parts[parts.length - 1]] = val;
}

function mergeSpec(base, override) {
  const out = deepClone(base);
  for (const key in override) {
    if (key.indexOf("children[") === 0) {
      const m = key.match(/^children\[(.+?)\]\.(.+)$/);
      if (m && out.children) {
        const child = out.children.find((c) => c.id === m[1]);
        if (child) setDeep(child, m[2], override[key]);
      }
    } else if (override[key] !== null && typeof override[key] === "object" && !Array.isArray(override[key])) {
      out[key] = Object.assign({}, out[key] || {}, override[key]);
    } else {
      out[key] = override[key];
    }
  }
  return out;
}

// ---------- 3. Spec validation (Figma 호출 전) ----------
function collectTokenRefs(obj, acc) {
  if (acc == null) acc = [];
  if (typeof obj === "string") {
    const m = obj.match(/^\{(.+)\}$/);
    if (m) acc.push(m[1]);
  } else if (Array.isArray(obj)) {
    obj.forEach((x) => collectTokenRefs(x, acc));
  } else if (obj && typeof obj === "object") {
    Object.values(obj).forEach((x) => collectTokenRefs(x, acc));
  }
  return acc;
}

function validateSpec(spec, tokens) {
  const refs = collectTokenRefs(spec);
  const missing = [];
  for (const r of refs) {
    const dsNode = r.split(".").reduce((o, k) => (o == null ? o : o[k]), tokens);
    if (!dsNode) missing.push(r);
  }
  if (missing.length) throw new Error("Missing tokens:\n  - " + Array.from(new Set(missing)).join("\n  - "));
}

// ---------- 4. Variant combinatorics ----------
function enumerateVariants(axes) {
  return axes.reduce(function (acc, ax) {
    const next = [];
    for (let i = 0; i < acc.length; i++) {
      const combo = acc[i];
      for (let j = 0; j < ax.values.length; j++) {
        const val = ax.values[j];
        const merged = Object.assign({}, combo);
        merged[ax.name] = val;
        next.push(merged);
      }
    }
    return next;
  }, [{}]);
}

function variantKey(combo) {
  return Object.keys(combo).map((k) => k + "=" + combo[k]).join(",");
}

function variantFigmaName(combo) {
  return Object.keys(combo).map((k) => k + "=" + combo[k]).join(", ");
}

// ---------- 5. Figma node builders ----------
function toFontStyle(weight) {
  if (weight >= 700) return "Bold";
  if (weight >= 600) return "SemiBold";
  if (weight >= 500) return "Medium";
  return "Regular";
}

function hasHangul(s) { return /[\uAC00-\uD7A3]/.test(s); }

async function preloadFonts() {
  const families = [
    { family: "Inter", style: "Regular" },
    { family: "Inter", style: "Medium" },
    { family: "Inter", style: "Semi Bold" },
    { family: "Inter", style: "Bold" },
    { family: "Pretendard", style: "Regular" },
    { family: "Pretendard", style: "Medium" },
    { family: "Pretendard", style: "SemiBold" },
    { family: "Pretendard", style: "Bold" }
  ];
  const loaded = [];
  const failed = [];
  for (const f of families) {
    try {
      await figma.loadFontAsync(f);
      loaded.push(f);
    } catch (e) {
      failed.push(f);
    }
  }
  return { loaded, failed };
}

function pickFont(textContent, weight, loadedFamilies) {
  const style = toFontStyle(weight);
  const needKorean = hasHangul(textContent);
  const want = needKorean ? "Pretendard" : "Inter";
  // Pretendard uses "SemiBold" (no space), Inter uses "Semi Bold"
  const wantStyle = want === "Pretendard" && style === "SemiBold" ? "SemiBold" : (want === "Inter" && style === "SemiBold" ? "Semi Bold" : style);
  const hit = loadedFamilies.find((f) => f.family === want && f.style === wantStyle);
  if (hit) return hit;
  // Fallback: try the other family with corresponding style
  const fallbackFamily = want === "Pretendard" ? "Inter" : "Pretendard";
  const fallbackStyle = fallbackFamily === "Inter" && style === "SemiBold" ? "Semi Bold" : (fallbackFamily === "Pretendard" && style === "SemiBold" ? "SemiBold" : style);
  const fb = loadedFamilies.find((f) => f.family === fallbackFamily && f.style === fallbackStyle);
  if (fb) return fb;
  return { family: "Inter", style: "Regular" };
}

// ---------- Variable binding helpers ----------
let _varMapCache = null;
function getVariableMap() {
  if (_varMapCache) return _varMapCache;
  try {
    const raw = figma.root.getPluginData("skt-vars");
    _varMapCache = raw ? JSON.parse(raw) : {};
  } catch (e) { _varMapCache = {}; }
  return _varMapCache;
}

// id → Variable 객체 cache (dynamic-page documentAccess 호환 위해 async init)
let _varObjCache = null;
async function ensureVariableObjects() {
  if (_varObjCache !== null) return;
  _varObjCache = {};
  try {
    const cols = await figma.variables.getLocalVariableCollectionsAsync();
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      for (let j = 0; j < c.variableIds.length; j++) {
        const vid = c.variableIds[j];
        try {
          const v = await figma.variables.getVariableByIdAsync(vid);
          if (v) _varObjCache[vid] = v;
        } catch (e) {}
      }
    }
  } catch (e) { console.warn("ensureVariableObjects fail:", e.message); }
}

function findVariable(path) {
  if (!_varObjCache) return null;
  const varMap = getVariableMap();
  const id = varMap[path];
  if (!id) return null;
  return _varObjCache[id] || null;
}

// Set a FLOAT field; bind to variable if available, else raw assign.
function setFloatField(tgt, field, ref, tokens) {
  if (ref == null) return;
  const resolved = resolveToken(tokens, ref);
  const value = resolved && resolved.px != null ? resolved.px : (typeof resolved === "number" ? resolved : 0);
  try { tgt[field] = value; } catch (e) {}
  const path = tokenPathOf(ref);
  if (!path) return;
  const v = findVariable(path);
  if (!v) return;
  try { tgt.setBoundVariable(field, v); }
  catch (e) { console.warn("bind fail:", field, "→", path, e.message); }
}

function buildSolidPaint(rgbColor, variableId) {
  const paint = { type: "SOLID", color: { r: rgbColor.r, g: rgbColor.g, b: rgbColor.b } };
  if (variableId) {
    paint.boundVariables = { color: { type: "VARIABLE_ALIAS", id: variableId } };
  }
  return paint;
}

function applyFills(tgt, resolvedColor, variableId) {
  if (!resolvedColor) { tgt.fills = []; return; }
  tgt.fills = [buildSolidPaint(resolvedColor.rgb, variableId)];
}

function applyFillsRef(tgt, fillRef, tokens) {
  if (fillRef == null) { tgt.fills = []; return; }
  const resolvedColor = resolveToken(tokens, fillRef);
  const path = tokenPathOf(fillRef);
  const vid = path ? (getVariableMap()[path] || null) : null;
  applyFills(tgt, resolvedColor, vid);
}

function applyStrokeResolved(tgt, strokeSpec, tokens) {
  if (!strokeSpec) { tgt.strokes = []; return; }
  const c = resolveToken(tokens, strokeSpec.color);
  const path = tokenPathOf(strokeSpec.color);
  const vid = path ? (getVariableMap()[path] || null) : null;
  tgt.strokes = [buildSolidPaint(c.rgb, vid)];
  // strokeWeight: bind if possible (usually a raw number in spec)
  const w = strokeSpec.weight != null ? strokeSpec.weight : 1;
  tgt.strokeWeight = typeof w === "number" ? w : (resolveToken(tokens, w).px || 1);
}

function applyShadow(tgt, shadowRef, tokens) {
  if (!shadowRef) { tgt.effects = []; return; }
  const s = resolveToken(tokens, shadowRef);
  tgt.effects = [{
    type: "DROP_SHADOW",
    visible: true,
    blendMode: "NORMAL",
    color: s.color,
    offset: s.offset,
    radius: s.radius,
    spread: s.spread
  }];
}

function px(resolved) {
  if (resolved == null) return 0;
  if (typeof resolved === "number") return resolved;
  if (typeof resolved === "object" && "px" in resolved) return resolved.px;
  if (typeof resolved === "string") return parseFloat(resolved);
  return 0;
}

function bindTextField(textNode, field, path) {
  if (!path) return;
  const v = findVariable(path);
  if (!v) return;
  try { textNode.setBoundVariable(field, v); }
  catch (e) { console.warn("bind " + field + " (" + path + "):", e.message); }
}

function buildText(childSpec, tokens, loadedFonts) {
  const t = figma.createText();
  t.name = childSpec.id || "text";
  const ts = resolveToken(tokens, childSpec.textStyle);
  const font = pickFont(childSpec.content || "", ts.fontWeight, loadedFonts);
  t.fontName = font;
  t.characters = childSpec.content || "";

  // fontFamily Variable 바인딩 — DS 의 foundation.typography.fontFamily.primary/fallback 에 묶음.
  // pickFont 가 선택한 family 에 맞는 Variable 로 연결 (Pretendard → primary, Inter → fallback).
  // style suffix 차이 (Pretendard "SemiBold" vs Inter "Semi Bold") 때문에 각자 매칭 필수.
  const familyVarPath = font.family === "Pretendard"
    ? "foundation.typography.fontFamily.primary"
    : "foundation.typography.fontFamily.fallback";
  const familyVar = findVariable(familyVarPath);
  if (familyVar) {
    try { t.setBoundVariable("fontFamily", familyVar); }
    catch (e) { console.warn("bind fontFamily " + font.family + " 실패:", e.message); }
  }

  // Raw 값 먼저 적용
  t.fontSize = ts.fontSize;
  if (ts.lineHeight) {
    // ts.lineHeight 는 {value, unit} 객체 ("PIXELS" 또는 "PERCENT")
    t.lineHeight = { value: ts.lineHeight.value, unit: ts.lineHeight.unit };
  }
  if (ts.letterSpacing != null) t.letterSpacing = { value: ts.letterSpacing, unit: "PIXELS" };

  // Variable 바인딩 (tokens 에 매핑 존재 시)
  if (ts.bindings) {
    bindTextField(t, "fontSize",      ts.bindings.fontSize);
    // lineHeight: PERCENT unit 일 땐 Figma 가 Variable 바인딩 시 unit 을 PIXELS 로 강제하는 문제가 있어
    //            raw 값만 적용하고 Variable 바인딩은 skip. PIXELS 일 때만 binding 시도.
    if (ts.lineHeight && ts.lineHeight.unit === "PIXELS") {
      bindTextField(t, "lineHeight", ts.bindings.lineHeight);
    }
    bindTextField(t, "letterSpacing", ts.bindings.letterSpacing);
    // fontWeight: Figma 가 FLOAT Variable 을 fontName.style 로 매핑해줌 (Pretendard SemiBold / Inter Semi Bold 둘 다 600 으로 호환).
    bindTextField(t, "fontWeight",    ts.bindings.fontWeight);
  }

  // Text color with variable binding
  applyFillsRef(t, childSpec.color, tokens);

  // textAutoResize — "HEIGHT" 면 width 고정 + height 자동 (긴 문장 자동 줄바꿈)
  // "NONE" 면 양축 고정, 미지정이면 Figma 기본 (WIDTH_AND_HEIGHT)
  if (childSpec.autoResize) {
    try { t.textAutoResize = childSpec.autoResize; }
    catch (e) { console.warn("textAutoResize " + childSpec.autoResize + " 실패:", e.message); }
  }

  // textDecoration — "UNDERLINE" / "STRIKETHROUGH" / "NONE". atom/link 같은 link 시각 용.
  if (childSpec.textDecoration) {
    try { t.textDecoration = childSpec.textDecoration; }
    catch (e) { console.warn("textDecoration " + childSpec.textDecoration + " 실패:", e.message); }
  }

  // textAlignHorizontal — "LEFT" / "CENTER" / "RIGHT" / "JUSTIFIED". result-summary 같이 중앙 정렬 텍스트용.
  if (childSpec.textAlignHorizontal) {
    try { t.textAlignHorizontal = childSpec.textAlignHorizontal; }
    catch (e) { console.warn("textAlignHorizontal " + childSpec.textAlignHorizontal + " 실패:", e.message); }
  }
  return t;
}

function buildFrame(spec, variantName, tokens, loadedFonts) {
  const f = figma.createFrame();
  f.name = variantName;
  const L = spec.layout || {};
  const V = spec.visual || {};

  // layout mode + alignment (non-bindable)
  // NONE 모드면 auto-layout 전용 속성은 모두 skip — Figma API 가 throw
  if (L.mode) {
    try { f.layoutMode = L.mode; } catch (e) { console.warn("layoutMode 실패:", e.message); }
  }
  const isAutoLayout = L.mode === "VERTICAL" || L.mode === "HORIZONTAL";
  if (isAutoLayout) {
    if (L.primaryAxisSizingMode) {
      try { f.primaryAxisSizingMode = L.primaryAxisSizingMode; } catch (e) { console.warn("primaryAxisSizingMode 실패:", e.message); }
    }
    if (L.counterAxisSizingMode) {
      try { f.counterAxisSizingMode = L.counterAxisSizingMode; } catch (e) { console.warn("counterAxisSizingMode 실패:", e.message); }
    }
    if (L.primaryAxisAlignItems) {
      try { f.primaryAxisAlignItems = L.primaryAxisAlignItems; } catch (e) { console.warn("primaryAxisAlignItems 실패:", e.message); }
    }
    if (L.counterAxisAlignItems) {
      try { f.counterAxisAlignItems = L.counterAxisAlignItems; } catch (e) { console.warn("counterAxisAlignItems 실패:", e.message); }
    }
  }

  // Bindable scalars: padding, itemSpacing — auto-layout 일 때만 의미 있음
  if (isAutoLayout) {
    setFloatField(f, "paddingTop",    L.paddingTop,    tokens);
    setFloatField(f, "paddingRight",  L.paddingRight,  tokens);
    setFloatField(f, "paddingBottom", L.paddingBottom, tokens);
    setFloatField(f, "paddingLeft",   L.paddingLeft,   tokens);
    if (L.itemSpacing != null) setFloatField(f, "itemSpacing", L.itemSpacing, tokens);
  }

  // Sizing — width/height 에 숫자 또는 token 이 있으면 resize + bind
  function resolveDim(val) {
    if (val == null || val === "HUG" || val === "FILL") return null;
    if (typeof val === "number") return val;
    const r = resolveToken(tokens, val);
    if (r && r.px != null) return r.px;
    if (typeof r === "number") return r;
    return null;
  }
  const targetW = resolveDim(L.width);
  const targetH = resolveDim(L.height);
  if (targetW != null || targetH != null) {
    f.resize(
      targetW != null ? targetW : f.width,
      targetH != null ? targetH : f.height
    );
  }
  // Variable 바인딩 (토큰 경로가 있을 때만)
  const wpath = tokenPathOf(L.width);
  if (wpath) {
    const vw = findVariable(wpath);
    if (vw) {
      try { f.setBoundVariable("width", vw); }
      catch (e) { console.warn("bind width:", e.message); }
    }
  }
  const hpath = tokenPathOf(L.height);
  if (hpath) {
    const vh = findVariable(hpath);
    if (vh) {
      try { f.setBoundVariable("height", vh); }
      catch (e) { console.warn("bind height:", e.message); }
    }
  }

  // width/height = "FILL" or "HUG" → layoutSizingHorizontal / Vertical 직접 설정
  // (parent auto-layout 안에서만 FILL 유효. top-level Component 빌드 시 throw → fallback width 토큰 자동 적용)
  if (isAutoLayout) {
    if (L.width === "FILL") {
      let filled = false;
      try { f.layoutSizingHorizontal = "FILL"; filled = true; }
      catch (e) { /* top-level — fallback below */ }
      if (!filled) {
        const fbToken = spec.widthFallback || "{foundation.dimension.size.screen-content-width}";
        const fb = resolveToken(tokens, fbToken);
        if (fb && fb.px != null) {
          f.resize(fb.px, f.height);
          const fbPath = tokenPathOf(fbToken);
          if (fbPath) {
            const vw = findVariable(fbPath);
            if (vw) { try { f.setBoundVariable("width", vw); } catch (e) {} }
          }
        }
      }
    } else if (L.width === "HUG") {
      try { f.layoutSizingHorizontal = "HUG"; }
      catch (e) { console.warn("layoutSizingHorizontal HUG 실패:", e.message); }
    }
    if (L.height === "FILL" || L.height === "HUG") {
      try { f.layoutSizingVertical = L.height; }
      catch (e) { console.warn("layoutSizingVertical " + L.height + " 실패:", e.message); }
    }
  }

  // minHeight — auto-layout primary AUTO 모드일 때 콘텐츠 적어도 baseline 보장
  if (L.minHeight != null) {
    const minH = resolveDim(L.minHeight);
    if (minH != null) {
      try { f.minHeight = minH; }
      catch (e) { console.warn("minHeight 실패:", e.message); }
    }
    const mhpath = tokenPathOf(L.minHeight);
    if (mhpath) {
      const vmh = findVariable(mhpath);
      if (vmh) {
        try { f.setBoundVariable("minHeight", vmh); }
        catch (e) { /* Figma 가 minHeight binding 미지원할 수 있음 — silent */ }
      }
    }
  }

  // visual — cornerRadius (bindable)
  if (V.cornerRadius != null) setFloatField(f, "cornerRadius", V.cornerRadius, tokens);
  // fill (bindable via paint.boundVariables)
  if (V.fill != null) applyFillsRef(f, V.fill, tokens);
  else f.fills = [];
  // stroke
  applyStrokeResolved(f, V.stroke, tokens);
  // shadow (non-bindable — no Variable type for composite shadow)
  applyShadow(f, V.shadow, tokens);
  if (V.opacity != null) f.opacity = V.opacity;

  // children
  const childList = spec.children || [];
  for (let i = 0; i < childList.length; i++) {
    const child = childList[i];
    let node = null;
    if (child.kind === "text") {
      node = buildText(child, tokens, loadedFonts);
    } else if (child.kind === "ref") {
      node = buildRef(child);
    } else if (child.kind === "group") {
      // 익명 서브 프레임 — child 스펙을 mini-spec 으로 재귀 빌드
      node = buildFrame(child, child.id || "group", tokens, loadedFonts);
    }
    if (!node) continue;
    f.appendChild(node);
    // visible: false → 노드 보이지만 hidden (auto-layout 에서 0px 차지 → 시각·공간 모두 사라짐)
    if (child.visible === false) {
      try { node.visible = false; }
      catch (e) { console.warn("visible=false 실패:", child.id, e.message); }
    }
    // Per-child alignment: 명시된 layoutAlign 우선, 미지정 시 ref 대상 spec 의 layout 의도로 자동 추론.
    //   - 부모 VERTICAL + 자식 ref spec.width === "FILL"  → STRETCH 자동 부여
    //   - 부모 HORIZONTAL + 자식 ref spec.height === "FILL" → STRETCH 자동 부여
    //   - 자동화 명시적 skip 하려면 spec 에 layoutAlign: "INHERIT" 적기 (아무것도 안 함)
    // SPEC_REGISTRY 는 bundle.js 가 wrapper 로 주입하는 const ({ "atom/banner": { width, height }, ... }).
    // 단독 사용 시 미정의 → typeof 가드.
    let effectiveAlign = child.layoutAlign;
    if (effectiveAlign === "INHERIT") {
      effectiveAlign = null;
    } else if (!effectiveAlign && child.kind === "ref" && child.component) {
      const refMeta = (typeof SPEC_REGISTRY !== "undefined") ? SPEC_REGISTRY[child.component] : null;
      if (refMeta) {
        const parentMode = spec.layout && spec.layout.mode;
        if (parentMode === "VERTICAL" && refMeta.width === "FILL") effectiveAlign = "STRETCH";
        else if (parentMode === "HORIZONTAL" && refMeta.height === "FILL") effectiveAlign = "STRETCH";
      }
    }
    if (effectiveAlign) {
      try { node.layoutAlign = effectiveAlign; }
      catch (e) { console.warn("layoutAlign 실패:", child.id, e.message); }
      // STRETCH 시 instance/frame 의 sizing 도 명시적으로 FILL 로 강제 (Figma v3 API).
      // layoutAlign 만으로는 instance baseline width 가 유지되는 케이스 있음 — § 12 우회책 대체.
      // 부모 VERTICAL → counter-axis 가로 → layoutSizingHorizontal
      // 부모 HORIZONTAL → counter-axis 세로 → layoutSizingVertical
      if (effectiveAlign === "STRETCH") {
        const parentMode = spec.layout && spec.layout.mode;
        try {
          if (parentMode === "VERTICAL") {
            try { node.setBoundVariable("width", null); } catch (ee) {}
            node.layoutSizingHorizontal = "FILL";
          } else if (parentMode === "HORIZONTAL") {
            try { node.setBoundVariable("height", null); } catch (ee) {}
            node.layoutSizingVertical = "FILL";
          }
        } catch (e) {
          console.warn("layoutSizing FILL 실패:", child.id, e.message);
        }
        // text 노드면 textAutoResize="HEIGHT" 도 자동 적용 — 줄글이 부모 폭에서 자동 줄바꿈
        // (autoResize 가 spec 에 명시되어 있으면 그 값을 우선; 명시 안 됐을 때만 default 적용)
        if (child.kind === "text" && !child.autoResize) {
          try { node.textAutoResize = "HEIGHT"; }
          catch (e) { console.warn("textAutoResize HEIGHT 자동 적용 실패:", child.id, e.message); }
        }
      }
    }
    // Growing: child takes max space on primary axis
    if (child.layoutGrow != null) {
      try { node.layoutGrow = child.layoutGrow; }
      catch (e) { console.warn("layoutGrow 실패:", child.id, e.message); }
    }
    // scrollBehavior — Figma prototype 에서 부모 스크롤 시 자식 동작.
    // "STICKY_SCROLLS" = sticky (footer / GNB 류), "FIXED" = 항상 고정, "SCROLLS" = 기본 (스크롤 따라 이동).
    if (child.scrollBehavior) {
      try { node.scrollBehavior = child.scrollBehavior; }
      catch (e) { console.warn("scrollBehavior 실패:", child.id, e.message); }
    }
    // group/frame 자식이 spec 에 width/height = "FILL" 명시한 경우 — buildFrame 안에서는 부모가 없어 throw 됐을 수 있음.
    // appendChild 이후라 이제 부모가 auto-layout 이므로 다시 시도.
    // 단, buildFrame 의 fallback 에서 width 를 resize + Variable 바인딩한 상태이므로
    // 먼저 바인딩 해제 + 리사이즈 fallback 영향 무력화 후 layoutSizingHorizontal=FILL 적용.
    if (child.kind === "group" && child.layout) {
      if (child.layout.width === "FILL") {
        try { node.setBoundVariable("width", null); } catch (e) {}
        try { node.layoutSizingHorizontal = "FILL"; }
        catch (e) { console.warn("post-append layoutSizingHorizontal FILL 실패:", child.id, e.message); }
      }
      if (child.layout.height === "FILL") {
        try { node.setBoundVariable("height", null); } catch (e) {}
        try { node.layoutSizingVertical = "FILL"; }
        catch (e) { console.warn("post-append layoutSizingVertical FILL 실패:", child.id, e.message); }
      }
    }
    // Absolute positioning: child taken out of auto-layout flow.
    // x/y 는 부모 frame 기준 좌표. constraints 로 부모 resize 시 동작 결정.
    if (child.layoutPositioning === "ABSOLUTE") {
      try { node.layoutPositioning = "ABSOLUTE"; }
      catch (e) { console.warn("layoutPositioning 실패:", child.id, e.message); }
      if (child.x != null) {
        try { node.x = child.x; } catch (e) {}
      }
      if (child.y != null) {
        try { node.y = child.y; } catch (e) {}
      }
      if (child.constraints) {
        // 직관적 표현 (TOP/BOTTOM/LEFT/RIGHT) 을 Figma constraint (MIN/MAX) 로 매핑
        // — sticky-footer / snack-bar 같은 floating chrome 작성 시 사용자 친화
        function mapConstraint(v) {
          if (v === "TOP" || v === "LEFT") return "MIN";
          if (v === "BOTTOM" || v === "RIGHT") return "MAX";
          return v || "MIN";
        }
        try {
          node.constraints = {
            horizontal: mapConstraint(child.constraints.horizontal),
            vertical: mapConstraint(child.constraints.vertical),
          };
        } catch (e) { console.warn("constraints 실패:", child.id, e.message); }
      }
    }
  }

  return f;
}

// ---------- Ref child: atom/mol 인스턴스 참조 ----------
function matchVariantByName(componentName, variantProps) {
  for (const key in variantProps) {
    if (componentName.indexOf(key + "=" + variantProps[key]) === -1) return false;
  }
  return true;
}

function findMasterForRef(setName) {
  // Component Set 우선, 없으면 단일 Component
  const sets = figma.root.findAll(function (n) {
    return n.type === "COMPONENT_SET" && n.name === setName;
  });
  if (sets.length > 0) return { kind: "set", targetNode: sets[0] };
  const comps = figma.root.findAll(function (n) {
    return n.type === "COMPONENT" && n.name === setName;
  });
  if (comps.length > 0) return { kind: "comp", targetNode: comps[0] };
  return null;
}

function applyInstanceProps(instance, props) {
  if (!props) return;
  const processedKeys = {};

  function countUnprocessed() {
    let c = 0;
    for (const k in props) if (!processedKeys[k]) c++;
    return c;
  }

  // INSTANCE_SWAP 의 value 는 component id — path 형태("atom/icon/heart")이면 자동 변환
  function resolvePropValue(val, propType) {
    if (propType === "INSTANCE_SWAP" && typeof val === "string" && val.indexOf("/") !== -1) {
      const master = findMasterForRef(val);
      if (master) {
        const node = master.kind === "set"
          ? (master.targetNode.defaultVariant || master.targetNode.children[0])
          : master.targetNode;
        return node.id;
      }
      console.warn("INSTANCE_SWAP path resolve 실패:", val);
    }
    return val;
  }

  function tryApplyOn(targetInst) {
    let defs;
    try {
      defs = targetInst.componentProperties || {};
    } catch (e) {
      // Figma component SET with existing errors makes this getter throw
      // ("Component set for node has existing errors"). Skip props for this
      // instance rather than aborting the whole screen build.
      console.warn("⚠ componentProperties read failed on '" + targetInst.name + "' (" + e.message + ") — skipping props for this instance");
      return;
    }
    const setProps = {};
    for (const key in props) {
      if (processedKeys[key]) continue;
      for (const pid in defs) {
        if (pid === key || pid.indexOf(key + "#") === 0) {
          const propType = defs[pid] && defs[pid].type;
          setProps[pid] = resolvePropValue(props[key], propType);
          processedKeys[key] = true;
          break;
        }
      }
    }
    if (Object.keys(setProps).length > 0) {
      try { targetInst.setProperties(setProps); }
      catch (e) { console.warn("setProperties 실패 (" + targetInst.name + "):", e.message); }
    }
  }

  // 1) outer instance 자체에서 매칭
  tryApplyOn(instance);

  // 2) 남은 props 가 있으면 하위 instance 들 탐색
  if (countUnprocessed() > 0) {
    const innerInstances = instance.findAll(function (n) { return n.type === "INSTANCE"; });
    for (let i = 0; i < innerInstances.length; i++) {
      tryApplyOn(innerInstances[i]);
      if (countUnprocessed() === 0) break;
    }
  }

  // 3) 그래도 남으면 경고
  if (countUnprocessed() > 0) {
    const left = [];
    for (const k in props) if (!processedKeys[k]) left.push(k);
    console.warn("prop 매칭 실패 (어떤 instance property 에도 매칭 안됨):", left.join(", "));
  }
}

// Component asset SSOT = Figma file. If a ref can't be resolved to a local master,
// we do NOT skip and do NOT auto-create a component — we emit a plain frame LAYER
// (placeholder) so the node still exists in the tree. It auto-upgrades to an instance
// once the named component appears in the Figma DS (no code change). Applies to ALL refs.
function buildFallbackLayer(childSpec) {
  const f = figma.createFrame();
  f.name = childSpec.id || childSpec.component || "missing-component";
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "FIXED";
  try { f.resize(343, 48); } catch (e) {}
  f.cornerRadius = 4;
  f.fills = [{ type: "SOLID", color: { r: 0.93, g: 0.94, b: 0.96 } }];
  f.strokes = [{ type: "SOLID", color: { r: 0.80, g: 0.82, b: 0.88 } }];
  f.strokeWeight = 1;
  f.setPluginData("figmaExportFallback", "1");
  f.setPluginData("figmaExportComponent", String(childSpec.component || ""));
  return f;
}

function buildRef(childSpec) {
  const setName = childSpec.component;
  if (!setName) { console.warn("ref 에 component 이름 없음 — fallback layer"); return buildFallbackLayer(childSpec); }
  const master = findMasterForRef(setName);
  if (!master) {
    console.warn("참조 대상 없음(DS 미존재): " + setName + " — plain frame 레이어로 처리");
    return buildFallbackLayer(childSpec);
  }
  let instance;
  if (master.kind === "set") {
    // Variant 선택
    let chosen = null;
    if (childSpec.variant) {
      chosen = master.targetNode.children.find(function (c) {
        return matchVariantByName(c.name, childSpec.variant);
      });
    }
    if (!chosen) chosen = master.targetNode.defaultVariant || master.targetNode.children[0];
    instance = chosen.createInstance();
  } else {
    instance = master.targetNode.createInstance();
  }
  if (childSpec.id) instance.name = childSpec.id;
  applyInstanceProps(instance, childSpec.props);
  return instance;
}

// ---------- Auto-create missing section frame ----------
const SECTION_FILL = {
  atom: { r: 0.933, g: 0.929, b: 0.996 },
  mol:  { r: 1.0,   g: 0.957, b: 0.878 },
  ogn:  { r: 1.0,   g: 0.918, b: 0.839 }
};
const SECTION_LABEL_COLOR = {
  atom: { r: 0.212, g: 0.090, b: 0.808 },
  mol:  { r: 0.627, g: 0.373, b: 0.051 },
  ogn:  { r: 0.557, g: 0.263, b: 0.043 }
};

async function createSectionAutoAsync(targetPage, specName, category, loadedFonts) {
  const frame = figma.createFrame();
  frame.name = specName;

  // Placement: 기존 프레임들 아래에 100px 간격으로
  const frames = targetPage.children.filter(function (c) { return c.type === "FRAME"; });
  if (frames.length === 0) {
    frame.x = 80;
    frame.y = 80;
  } else {
    let maxBottom = 0;
    for (let i = 0; i < frames.length; i++) {
      const b = frames[i].y + frames[i].height;
      if (b > maxBottom) maxBottom = b;
    }
    frame.x = 80;
    frame.y = maxBottom + 100;
  }

  frame.cornerRadius = 16;
  frame.fills = [{ type: "SOLID", color: SECTION_FILL[category] || SECTION_FILL.atom }];
  frame.strokes = [{ type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.90 } }];
  frame.strokeWeight = 1;
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "AUTO";
  frame.minWidth = 800;
  frame.minHeight = 600;
  frame.paddingTop = 24;
  frame.paddingRight = 24;
  frame.paddingBottom = 24;
  frame.paddingLeft = 24;
  frame.itemSpacing = 12;

  // 라벨 + 힌트 (figma-create-sections.js 패턴)
  try {
    const labelFont = loadedFonts.find(function (f) { return f.family === "Inter" && f.style === "Semi Bold"; }) || { family: "Inter", style: "Semi Bold" };
    const label = figma.createText();
    label.fontName = labelFont;
    label.characters = specName;
    label.fontSize = 18;
    label.fills = [{ type: "SOLID", color: SECTION_LABEL_COLOR[category] || SECTION_LABEL_COLOR.atom }];
    frame.appendChild(label);
  } catch (e) { console.warn("section label 실패:", e.message); }

  targetPage.appendChild(frame);
  return frame;
}

// ---------- Component Property exposure ----------
// spec.base 의 children 을 재귀적으로 순회하며 exposeAs 가진 text/ref 수집
function collectExposed(node, acc) {
  if (!acc) acc = [];
  const children = (node && node.children) || [];
  for (let i = 0; i < children.length; i++) {
    const ch = children[i];
    if (ch.exposeAs && (ch.kind === "text" || ch.kind === "ref")) {
      acc.push(ch);
    }
    if (ch.kind === "group") {
      collectExposed(ch, acc);
    }
  }
  return acc;
}

function exposeComponentProperties(mainNode, figmaComponents, base) {
  const exposed = collectExposed(base);
  for (let i = 0; i < exposed.length; i++) {
    const childSpec = exposed[i];
    try {
      if (childSpec.kind === "text") {
        const propId = mainNode.addComponentProperty(childSpec.exposeAs, "TEXT", childSpec.content || "");
        for (let j = 0; j < figmaComponents.length; j++) {
          const comp = figmaComponents[j];
          const txt = comp.findOne(function (n) { return n.type === "TEXT" && n.name === childSpec.id; });
          if (txt) txt.componentPropertyReferences = { characters: propId };
        }
      } else if (childSpec.kind === "ref") {
        // INSTANCE_SWAP property — defaultValue = ref 대상 component 의 key
        console.log("[INSTANCE_SWAP] start", childSpec.exposeAs, "→", childSpec.component);
        const master = findMasterForRef(childSpec.component);
        if (!master) {
          console.warn("[INSTANCE_SWAP] master 없음:", childSpec.component);
          continue;
        }
        const defaultNode = master.kind === "set"
          ? (master.targetNode.defaultVariant || master.targetNode.children[0])
          : master.targetNode;
        // Figma plugin API quirk: INSTANCE_SWAP defaultValue 는 component **id** 사용 (key 는 거부됨)
        console.log("[INSTANCE_SWAP] master.kind=" + master.kind + " defaultNode.type=" + defaultNode.type + " id=" + defaultNode.id);
        let propId;
        try {
          propId = mainNode.addComponentProperty(childSpec.exposeAs, "INSTANCE_SWAP", defaultNode.id);
          console.log("[INSTANCE_SWAP] addComponentProperty OK propId=" + propId);
        } catch (e) {
          console.error("[INSTANCE_SWAP] addComponentProperty FAILED:", e.message);
          continue;
        }
        let attached = 0;
        for (let j = 0; j < figmaComponents.length; j++) {
          const comp = figmaComponents[j];
          const inst = comp.findOne(function (n) { return n.type === "INSTANCE" && n.name === childSpec.id; });
          if (inst) {
            try {
              inst.componentPropertyReferences = { mainComponent: propId };
              attached++;
            } catch (e) {
              console.error("[INSTANCE_SWAP] propRef FAILED on " + comp.name + ":", e.message);
            }
          } else {
            console.warn("[INSTANCE_SWAP] instance '" + childSpec.id + "' not found in", comp.name);
          }
        }
        console.log("[INSTANCE_SWAP] attached " + attached + "/" + figmaComponents.length + " variants");
      }
    } catch (e) {
      console.warn("Component Property 실패 (" + childSpec.exposeAs + "):", e.message);
    }
  }
}

// ---------- 6. Idempotency ----------
async function purgeExistingByName(scopeNode, name) {
  const hits = scopeNode.findAll((n) =>
    (n.type === "COMPONENT_SET" || n.type === "COMPONENT") && n.name === name
  );
  let count = 0;
  for (const hit of hits) {
    try {
      hit.remove();
      count++;
    } catch (e) {
      console.warn("remove 실패:", hit.id, e.message);
    }
  }
  return count;
}

// ---------- 6.5 Instance swap (Figma 마스터·인스턴스 모델 보존) ----------
// 컴포넌트 재생성 시: old 삭제하기 전에 모든 instance 의 mainComponent 를 new 로 swap.
// → 인스턴스 살아있고 override 도 보존됨 → 이걸 ref 하는 ogn/page 의 instance 들도 끊기지 않음
// → cascade 재빌드 불필요 (구조 변경 외 visual-only edit 의 경우)
//
// ⚠️ Figma dynamic-page mode 대응: instance.mainComponent 동기 접근 금지 → getMainComponentAsync 사용.
async function swapInstancesToNewMaster(oldNodes, newNode) {
  if (!oldNodes || oldNodes.length === 0 || !newNode) return 0;

  // old 의 모든 variant Component 평탄화 (Set 일 경우 자식 풀고, single 이면 자기 자신)
  const oldComponents = [];
  for (let i = 0; i < oldNodes.length; i++) {
    const o = oldNodes[i];
    if (o.type === "COMPONENT_SET") {
      for (let j = 0; j < o.children.length; j++) oldComponents.push(o.children[j]);
    } else if (o.type === "COMPONENT") {
      oldComponents.push(o);
    }
  }
  if (oldComponents.length === 0) return 0;

  // new 의 variant 명 → Component 매핑
  const newIsSet = newNode.type === "COMPONENT_SET";
  const newVariants = newIsSet ? newNode.children : [newNode];
  const newByName = {};
  for (let i = 0; i < newVariants.length; i++) newByName[newVariants[i].name] = newVariants[i];

  // old (id) → new 매핑 — instance.getMainComponentAsync 결과의 id 와 비교용
  const oldIdToNew = new Map();
  for (let i = 0; i < oldComponents.length; i++) {
    const oc = oldComponents[i];
    const nc = newIsSet ? (newByName[oc.name] || newVariants[0]) : newNode;
    oldIdToNew.set(oc.id, nc);
  }

  // 파일 전체 instance 순회 → mainComponent 가 swapMap 에 있으면 swap
  // findAllWithCriteria 는 모든 페이지 (loadAllPagesAsync 가 먼저 호출됨)
  const allInstances = (figma.root.findAllWithCriteria
    ? figma.root.findAllWithCriteria({ types: ["INSTANCE"] })
    : figma.root.findAll(function (n) { return n.type === "INSTANCE"; }));

  let swapped = 0;
  for (let i = 0; i < allInstances.length; i++) {
    const inst = allInstances[i];
    let oldMain = null;
    try {
      // Figma 신 API — dynamic-page mode 강제
      oldMain = inst.getMainComponentAsync ? await inst.getMainComponentAsync() : inst.mainComponent;
    } catch (e) {
      continue;
    }
    if (!oldMain) continue;
    const newMain = oldIdToNew.get(oldMain.id);
    if (!newMain) continue;
    try {
      inst.swapComponent(newMain);
      swapped++;
    } catch (e) {
      console.warn("swapComponent 실패:", inst.name, e.message);
    }
  }
  return swapped;
}

// ---------- 7. Main orchestrator ----------
async function generateComponentSet(spec, tokens) {
  validateSpec(spec, tokens);

  if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();
  await ensureVariableObjects();

  // Variable map (if sync-tokens 이 실행된 적 있으면 채워짐)
  const varMap = getVariableMap();
  const varCount = Object.keys(varMap).length;
  if (varCount === 0) {
    console.warn("⚠ Variable map 비어있음 — sync-tokens 먼저 실행하세요. 지금은 raw 값으로 생성됩니다.");
  } else {
    console.log("✓ Variable map loaded: " + varCount + "개 토큰 바인딩 가능");
  }

  const fontResult = await preloadFonts();
  if (fontResult.failed.length) {
    console.warn("누락된 폰트:", fontResult.failed.map((f) => f.family + " " + f.style).join(", "));
  }

  const category = spec.name.split("/")[0];
  if (category === "page") {
    return generateScreen(spec, tokens, fontResult);
  }
  const pageMap = { atom: "Atom", mol: "Molecule", ogn: "Organism", sb: "SB" };
  const pageName = pageMap[category];
  if (!pageName) throw new Error("Unknown category: " + category);

  const targetPage = figma.root.children.find((p) => p.name === pageName);
  if (!targetPage) throw new Error("페이지 없음: " + pageName);
  await figma.setCurrentPageAsync(targetPage);

  // 기존 같은 이름 Component/Set 찾기 (섹션 안에 있든, 페이지 직접 자식이든)
  const existing = targetPage.findAll(function (n) {
    return (n.type === "COMPONENT" || n.type === "COMPONENT_SET") && n.name === spec.name;
  });

  // 배치 위치 결정 — 기존 있으면 그 좌표 이어받기, 없으면 페이지 하단에 추가
  let targetX = 80, targetY = 80;
  const sectionsToRemove = [];
  if (existing.length > 0) {
    const first = existing[0];
    // absolute x/y 계산 (섹션 안에 있을 수 있음)
    let ax = first.x, ay = first.y;
    let p = first.parent;
    while (p && p.type !== "PAGE") {
      ax += p.x; ay += p.y;
      p = p.parent;
    }
    targetX = ax;
    targetY = ay;
    // 기존 wrapper section frame 이 있으면 같이 제거 (name 이 spec.name 과 일치할 때)
    const imm = first.parent;
    if (imm && imm.type === "FRAME" && imm.name === spec.name && imm.parent && imm.parent.type === "PAGE") {
      // 섹션의 절대 위치로 덮어쓰기 (component 가 섹션 안에 있었으니)
      targetX = imm.x;
      targetY = imm.y;
      sectionsToRemove.push(imm);
    }
  } else {
    // 페이지에서 기존 Component/Set 들 중 가장 아래 + 오른쪽 찾기
    const allComps = targetPage.findAll(function (n) {
      return n.type === "COMPONENT" || n.type === "COMPONENT_SET";
    });
    if (allComps.length > 0) {
      let maxBottom = 0;
      for (let i = 0; i < allComps.length; i++) {
        const c = allComps[i];
        // absolute y
        let ay = c.y;
        let p = c.parent;
        while (p && p.type !== "PAGE") { ay += p.y; p = p.parent; }
        const b = ay + c.height;
        if (b > maxBottom) maxBottom = b;
      }
      targetY = maxBottom + 80;
    }
  }

  // ⚠️ old 삭제는 new 생성 + instance swap 이후로 연기 (마스터·인스턴스 보존 패턴)
  // 여기서 삭제하면 원래 동작 — 일단 보류만 하고 아래 swap 후 제거.

  // enumerate + build
  const axes = spec.variants && spec.variants.axes ? spec.variants.axes : [];
  const overrides = (spec.variants && spec.variants.overrides) || {};
  const combos = axes.length > 0 ? enumerateVariants(axes) : [{}];

  const components = [];
  for (const combo of combos) {
    // overrides 키는 풀 조합 또는 부분 키 ("tone=required" 처럼 일부 axis 만)
    // combo 와 일치하는 모든 키를 누적 merge — 풀 조합도 동일 로직으로 처리됨 (backward compatible)
    let merged = spec.base;
    for (const ovKey in overrides) {
      const pairs = ovKey.split(",").map(function (p) { return p.split("="); });
      const allMatch = pairs.every(function (kv) { return combo[kv[0]] === kv[1]; });
      if (allMatch) merged = mergeSpec(merged, overrides[ovKey]);
    }
    // widthFallback 은 spec top-level 필드 — buildFrame 의 spec 인자(=base)에서 lookup 가능하도록 주입.
    if (spec.widthFallback) merged.widthFallback = spec.widthFallback;
    const frame = buildFrame(merged, variantFigmaName(combo) || "Default", tokens, fontResult.loaded);
    const comp = figma.createComponentFromNode(frame);
    comp.name = variantFigmaName(combo) || "Default";
    components.push(comp);
  }

  // 페이지에 직접 배치
  let resultNode;
  if (combos.length > 1) {
    const set = figma.combineAsVariants(components, targetPage);
    set.name = spec.name;
    set.layoutMode = "HORIZONTAL";
    set.itemSpacing = 24;
    set.paddingTop = 24;
    set.paddingBottom = 24;
    set.paddingLeft = 24;
    set.paddingRight = 24;
    set.primaryAxisSizingMode = "AUTO";
    set.counterAxisSizingMode = "AUTO";
    resultNode = set;
    exposeComponentProperties(set, components, spec.base);
  } else {
    targetPage.appendChild(components[0]);
    components[0].name = spec.name;
    exposeComponentProperties(components[0], [components[0]], spec.base);
    resultNode = components[0];
  }

  // 위치 설정 (old 위치 이어받기 — old 가 아직 살아있어도 같은 좌표 OK, 곧 제거됨)
  try {
    resultNode.x = targetX;
    resultNode.y = targetY;
  } catch (e) { console.warn("위치 설정 실패:", e.message); }

  // ⭐ instance swap — old 의 마스터를 참조하던 모든 instance 를 new 로 redirect
  // 이게 핵심: old 가 삭제돼도 instance 들은 new 마스터를 가리키므로 끊기지 않음
  // → ogn/page 들이 mol/* 을 ref 하고 있어도 cascade 재빌드 불필요 (visual-only 변경 시)
  let swappedInstances = 0;
  if (existing.length > 0) {
    swappedInstances = await swapInstancesToNewMaster(existing, resultNode);
  }

  // 이제 안전하게 old 제거 (instance 다 swap 됐으니 끊기지 않음)
  for (let i = 0; i < existing.length; i++) {
    try { existing[i].remove(); } catch (err) {}
  }
  for (let i = 0; i < sectionsToRemove.length; i++) {
    try { sectionsToRemove[i].remove(); } catch (err) {}
  }

  figma.notify("✓ " + spec.name + " — " + components.length + " variants, " + swappedInstances + " instances swapped");
  console.log("✓ " + spec.name + ": " + components.length + " variants, " + existing.length + " replaced, " + swappedInstances + " instances kept linked, " + sectionsToRemove.length + " sections removed");
  return resultNode;
}

// ---------- 8. Screen/Page generator ----------
// page/* category 를 위한 별도 경로. Component 가 아닌 일반 Frame 으로 생성해서
// "Page" Figma 페이지에 top-level frame 으로 배치.
async function generateScreen(spec, tokens, fontResult) {
  await ensureVariableObjects();

  // "Page" Figma 페이지 찾기 or 생성
  let targetPage = figma.root.children.find(function (p) { return p.name === "Page"; });
  if (!targetPage) {
    targetPage = figma.createPage();
    targetPage.name = "Page";
  }
  await figma.setCurrentPageAsync(targetPage);

  // 기존 같은 이름 top-level FRAME 찾기
  const existing = targetPage.children.filter(function (n) {
    return n.type === "FRAME" && n.name === spec.name;
  });

  let targetX = 80, targetY = 80;
  let useGridLayout = false;
  if (existing.length > 0) {
    // 기존 frame 위치 유지 (사용자가 수동 정렬한 가능성)
    targetX = existing[0].x;
    targetY = existing[0].y;
    for (let i = 0; i < existing.length; i++) {
      try { existing[i].remove(); } catch (err) {}
    }
  } else if (typeof spec._layout_col === "number" && typeof spec._layout_row === "number") {
    // bundle.js 가 PAGE_FLOW_ORDER 로 _layout_col / _layout_row 주입한 경우 — UC × step grid 배치
    // X 는 col, Y 는 row. 같은 col 의 다른 frame 들 폭 측정해서 X 정렬.
    useGridLayout = true;
  } else {
    // 기본: 다른 Page 들이 있으면 오른쪽에 80px 간격으로 배치 (가로 한 줄)
    const allFrames = targetPage.children.filter(function (n) { return n.type === "FRAME"; });
    if (allFrames.length > 0) {
      let maxRight = 0;
      for (let i = 0; i < allFrames.length; i++) {
        const r = allFrames[i].x + allFrames[i].width;
        if (r > maxRight) maxRight = r;
      }
      targetX = maxRight + 80;
      targetY = 80;
    }
  }

  // Frame 으로 생성 (Component 아님)
  // widthFallback 은 spec top-level 필드 — buildFrame 의 spec 인자(=base)에서 lookup 가능하도록 주입.
  const baseToBuild = spec.widthFallback
    ? Object.assign({}, spec.base, { widthFallback: spec.widthFallback })
    : spec.base;
  const frame = buildFrame(baseToBuild, spec.name, tokens, fontResult.loaded);
  frame.name = spec.name;
  targetPage.appendChild(frame);

  if (useGridLayout) {
    // Grid 좌표 계산 (frame.height / frame.width 가 확정된 후)
    // X: col 별로 같은 col 의 다른 frame 들 우측 max 추적 — 같은 col 끼리 같은 X 보장 안 함, 첫 frame 의 X 가 col base
    // 단순화: col 별 X = 80 + col * (FRAME_W + 80), row 별 Y = 80 + row * (FRAME_H + 80)
    const FRAME_W = frame.width || 375;
    const FRAME_H = frame.height || 812;
    const GAP = 80;
    targetX = 80 + spec._layout_col * (FRAME_W + GAP);
    targetY = 80 + spec._layout_row * (FRAME_H + GAP);
  }
  frame.x = targetX;
  frame.y = targetY;

  figma.notify("✓ Screen: " + spec.name);
  console.log("✓ Screen generated: " + spec.name + " at (" + targetX + ", " + targetY + "), replaced " + existing.length);
  return frame;
}


(async () => {
  try {
    await generateComponentSet(COMPONENT_SPEC, DS_TOKENS);
    figma.notify('✓ screen exported: ' + COMPONENT_SPEC.name);
  } catch (e) {
    console.error('export error:', e);
    figma.notify('export error: ' + (e && e.message ? e.message : e), { error: true });
  }
})();
