# KIKI-SHIM — 임시 빌드 보완 레이어 (제거 가이드)

> **이 문서는 "kiki가 라이브러리 빌드를 제공하면 한 번에 걷어내기 위한" 체크리스트다.**

## 왜 존재하나

kiki(`github.com/sovorovvang-cyber/kiki`)는 현재 **라이브러리 빌드를 제공하지 않는다.**
(`design-system/package.json` 이 `private: true` + `main`/`module`/`exports` 없음 → 소비용 패키지 아님.)

그래서 우리는 kiki **원본 소스(.tsx)를 vendoring** 해서 우리 Next/Turbopack 으로 직접 컴파일한다.
이때 kiki 가 "번들러(Vite)가 해줄 것"이라 가정하고 미뤄둔 일들(이미지 import → string 해소,
타입 선언, export 표면 등)을 **우리가 대신** 해줘야 한다. 그 보완 코드가 바로 이 SHIM 이다.

- **React 층(②)은 양쪽 동일(19.x)** → 컴포넌트 자체는 호환. SHIM 은 순전히 "빌드 안 됨"을 메우는 것.
- kiki 가 `vite build --lib` 같은 라이브러리 빌드 + publish 를 하면 **이 SHIM 전부 불필요해진다.**

## 찾는 법

```bash
grep -rn "KIKI-SHIM" --exclude-dir=node_modules .
```

## 제거 체크리스트 (kiki 빌드 패키지 제공 시)

전제: kiki 가 `@kiki/ds`(가칭) 같은 **빌드된 패키지**(JS + CSS + `.d.ts` + 에셋 string 해소 완료)를
npm/사내 레지스트리로 제공하거나, `dist/` 를 vendoring 할 수 있게 됐다고 가정.

1. **빌드 패키지 설치/연결**
   - `@cx/external` 을 kiki 빌드물로 교체 (install 하거나 dist 를 vendoring).
   - `@cx/external` 의 `exports["."]` 가 빌드된 barrel(JS+`.d.ts`)을 가리키게.
   - 스타일이 별도 CSS 면 앱 진입점에서 `import "@cx/external/style.css"` 1회 추가.

2. **이미지 로더 삭제** 🗑️
   - `apps/web/loaders/kiki-image-url.cjs` 파일 삭제.
   - `apps/web/next.config.ts` 의 `turbopack` 블록 삭제(이 용도로만 존재 시).

3. **transpilePackages 정리**
   - `apps/web/next.config.ts` `transpilePackages` 배열에서 `"@cx/external"` 제거.
     (빌드된 패키지는 transpile 불필요. 단 다른 `@cx/*` 는 그대로 둘 것.)

4. **타입 선언 shim 삭제** 🗑️
   - `packages/external/src/modules.d.ts` 삭제 (빌드물이 자체 `.d.ts` 제공).

5. **레지스트리 생성기/산출물 제거** 🗑️
   - `scripts/sync-catalog/gen-registry.ts` 삭제.
   - `packages/external/src/registry.generated.ts` 삭제.
   - `scripts/sync-catalog/sync.ts` 의 `genRegistry(...)` 호출/로그 제거 + modules.d.ts 생성 블록 제거.
   - `packages/external/package.json` 의 `exports["./registry"]` 제거.

6. **렌더러 import 소스 변경**
   - `packages/renderer/src/component-by-type.ts`:
     `import * as ExternalModule from "@cx/external/registry"` → `"@cx/external"` 로 변경.
     (kiki 컴포넌트를 등록하는 **로직 자체는 영구**. import 소스만 바뀜.)

7. **tsconfig 제외 제거**
   - `tsconfig.json` `exclude` 에서 `"packages/external/src/components"` 제거
     (vendored 소스가 사라지면 불필요).

8. **vendored 소스 제거**
   - `packages/external/src/components/**` (빌드 패키지로 대체됐으면 삭제).

9. **확인**
   - `grep -rn "KIKI-SHIM"` 결과 0건.
   - `pnpm sync:catalog` 가 catalog 만 생성하고 깨지지 않는지(또는 sync 전략 재검토).
   - `tsc --noEmit` clean (StaticImageData 류 43개 에러 사라짐), 앱 200, 캔버스에 kiki 렌더.

## ⛔ SHIM 이 아닌 것 (빌드 여부와 무관 — 건드리지 말 것)

다음은 "우리 시스템에 kiki 를 통합하는 영구 로직"이라 SHIM 제거와 무관하다:

- `apps/web/src/model/external-palette.ts` — catalog → RenderTreeNode (팔레트/insert)
- `apps/web/src/model/store.ts` `buildAreaComponentCatalog` 의 external 머지
- `packages/renderer/src/component-by-type.ts` — kiki 컴포넌트 **등록 로직** (import 소스만 SHIM)
- `packages/renderer/src/default-renderers.tsx` — fallback → autoRenderLeaf (kiki 무관한 일반 개선)
- `packages/agent/src/deck/build-catalog-deck.ts` — externalCatalog 머지 (AI deck)
- `packages/external/src/catalog.ts` + `scripts/sync-catalog/gen-catalog.ts` — 카탈로그 메타
  (kiki 빌드물이 메타를 제공하면 그때 소스 변경 검토)
