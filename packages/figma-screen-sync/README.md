# Genui Spec Tool (Figma Plugin)

Figma 손작업 컴포넌트 → `component-specs/*.json` 포맷 자동 추출 + DS 가이드대로 자동 정규화 (교정).

## 등록 방법 (한 번만)

1. Figma 데스크톱 앱 실행 (브라우저 X — plugin dev 는 데스크톱 전용)
2. 메뉴 → `Plugins` → `Development` → `Import plugin from manifest...`
3. 이 폴더 안 `manifest.json` 선택
4. 메뉴 → `Plugins` → `Development` → `Genui Spec Extractor` 가 보이면 등록 완료

## 사용

플러그인 UI 는 3개 탭:
- **Figma → JSON** — 노드 추출
- **교정** — 손그림 → DS 가이드대로 자동 정규화 (Variable 바인딩 + DP 룰)
- **JSON → Figma** — scripter 빌드 코드 paste & Run

### 1. 추출 (Figma → JSON)
1. Figma 안 추출할 컴포넌트 (또는 frame / instance) 선택
2. plugin UI → 추출 버튼
3. spec JSON 자동 클립보드 복사
4. **(옵션)** "추출 후 자동 교정" 체크박스 → 추출 직후 교정 탭 자동 전환 + dry-run 미리보기

### 2. 교정 (Wash) ⭐ 신규
**사전**: `node scripter/bundle.js --sync` + Figma Run 으로 DS Variables 등록 + lookup 저장 완료해야 함.

1. Figma 안 정규화 대상 노드 선택 (component / frame / 여러 개)
2. plugin UI → "교정" 탭 → **"미리보기 (dry-run)"** 클릭
3. 결과 검토 (변경 사항 통계 + 매칭 못 한 raw 값 list)
4. 문제 없으면 **"변경 적용"** → 실제 노드 변경

자동 처리:
- raw 색 → DS 토큰 (text/surface/border 컨텍스트 인식)
- raw padding/spacing/radius → DS dimension 토큰
- text fontSize / fontWeight / letterSpacing → DS typography 토큰
- chrome 격 ogn (header/GNB/tab-bar 등) width → FILL 자동
- ogn 외피 padding 검출 (DP § 4.3 — 외피 0 + content wrapper 24 권장)
- page 서브 페이지 padding 검출 (DP § 9.1.1 Pattern B — padding 0 권장)

### 3. 빌드 (JSON → Figma)
scripter `.generated.js` 코드를 paste 영역에 ⌘V → ▶ Run.
(Scripter 플러그인 대체 — 별도 플러그인 설치 불필요)

### 페이지 전체 추출 (옵션)
선택된 노드 없을 때 **추출** 클릭 → 현재 페이지 안 모든 top-level component / instance / frame 일괄 추출

## 추출 범위

| 속성 | 추출 |
|---|---|
| `layout` | layoutMode, primaryAxisSizingMode, padding*, itemSpacing, layoutAlign |
| `visual` | fills (color), strokes, cornerRadius, effects (shadow) |
| `children` | text / instance (ref) / nested group (재귀) |
| `exposeAs` | componentProperty (TEXT / BOOLEAN / INSTANCE_SWAP / VARIANT) |
| `variants` | ComponentSet 자식들의 variant axes + overrides |
| 토큰 매칭 | boundVariables (Variable 바인딩) → `{semantic.color.brand.primary}` 형태 |
| Typography composite | 4단계 fallback: textStyleId → Variable path → raw 값 → raw 문자열 |
| 위계 (category) | 이름 prefix 없으면 노드 구조 (width/padding/children) 로 atom/mol/ogn/page 추론 |
| ID slug | 한글 노드명은 `text-1` / `group-1` / `ref-1` sequential id 자동 부여 |

## DS Lookup 갱신

plugin 은 두 종류의 lookup 사용:

### 1. 추출용 typography lookup (plugin code.js 안 마커)
DS (`skt-design-system.json`) 의 `semantic.typography.*` 추가/변경 시:

```bash
node scripter/build-plugin-lookup.js
```

이후 Figma 메뉴에서 plugin reload (Plugins → Development → 우클릭 → Reload).

### 2. 교정용 lookup (figma.root pluginData)
DS 의 color / dimension / fontSize / fontWeight / letterSpacing 변경 시:

```bash
node scripter/bundle.js --sync
```

→ Scripter 결과를 Figma 에서 Run. 자동으로 Variables + lookup 둘 다 갱신됨 (한 번에).

## 한계

- **위계 판정** — atom/mol/ogn 추정 휴리스틱. 결과 spec 의 `category` 필드 검토 필요
- **변형 (variants) 추론** — ComponentSet 형태일 때만 자동. 단일 Component 는 variants 없음으로 처리
- **typography 동률** — DS 에 동일 raw 값/path 의 composite 가 여럿이면 (예: `body` vs `list-label`) DS 정의 순서대로 첫 후보 사용

## 트러블슈팅

- **plugin 등록 X** — Figma 브라우저 버전은 dev plugin 미지원. 데스크톱 앱 사용
- **localhost POST 실패** — `npm run dev` 가 `web/` 에서 돌고 있는지 확인. CORS 문제 시 paste 폴백 사용
- **추출 결과 비어있음** — 선택 노드가 frame / component / instance / group / text 중 하나여야 함
- **교정 시 "DS Variables 동기화 안 됨"** — `node scripter/bundle.js --sync` + Figma Run 먼저. 신규 셋업 / DS 토큰 추가 후 재실행 필수
- **교정 결과에 "매칭 못 한 raw 값"** — DS 에 그 값이 없거나 유사 값이 threshold (color 0.12 / dim 1.5px) 밖. DS 추가 또는 디자인 의도 재검토
