---
name: promote-proposal
description: component-proposal 백로그를 검토해 신규 컴포넌트(또는 기존 컴포넌트 변형)를 External에 구현하고, sync:catalog로 카탈로그/레지스트리를 갱신한 뒤 PR과 rerun까지 안내하는 승격 워크플로우. "proposal 승격", "컴포넌트 승격", "백로그 검토", "promote proposal" 요청 시 트리거.
---

# Promote Proposal — proposal → 컴포넌트 승격 워크플로우

inference 잡이 남긴 component-proposal artifact를 실제 카탈로그 컴포넌트로 승격한다.
**원칙: inference는 카탈로그에 읽기 전용이다. 카탈로그 mutation은 이 워크플로우(사람 리뷰 게이트)에서만 일어난다.**

## 0. 백로그 확인

```bash
pnpm proposal:backlog          # 빈도순 백로그
pnpm proposal:backlog --json   # 기계 소비용
```

빈도(×N)가 높은 제안부터 검토한다. `evidence`(SourceSpec ref)와 `rationale`로 실제 갭인지 판단한다.

## 1. 변형 우선 판단 (필수 게이트)

신규 컴포넌트는 마지막 수단이다. 순서대로 검토:

1. **기존 prop으로 표현 가능한가?** → 승격 불요. proposal은 무시하고, 필요하면 generation 프롬프트/스킬 보강.
2. **기존 컴포넌트에 prop 추가로 끝나는가?** (예: `kiki.TextField+errorText` → TextField에 `errorText` prop 추가)
   → 신규 컴포넌트 만들지 말 것. 기존 컴포넌트 TSX 수정 + `catalog.source.ts`의 해당 엔트리 props에 계약 추가.
3. **진짜 신규 컴포넌트인가?** (예: 인증 타이머 입력처럼 상태·동작이 독립적) → 2번으로.

## 2. 구현

신규 컴포넌트 기준 (변형이면 기존 디렉터리에서 1~2단계만):

1. `packages/external/src/components/<Name>/<Name>.tsx` — React 구현 + `<Name>.module.css`.
   - 기존 컴포넌트(예: TextField)의 코드 스타일·CSS 모듈 패턴을 따른다.
   - `check-react-hooks-policy`(useMemo/useCallback 금지)를 지킨다.
2. `packages/external/src/catalog.source.ts`에 엔트리 추가:
   - 키/`type`: `kiki.<Name>` (디렉터리명과 일치해야 함 — 드리프트 가드가 강제)
   - `source: "kiki-draft"` (신규는 항상 candidate로 시작)
   - `props`: proposal의 `suggestedProps`를 출발점으로 큐레이션. prop별 `role` 지정.
   - `description`: 어떤 상황에 쓰는 컴포넌트인지 한 문장.
3. `pnpm sync:catalog` — catalog.generated.ts(인퍼런스 어휘) + registry.generated.ts(렌더러 구현 맵) 동시 재생성.
   - 컴포넌트 export 이름이 디렉터리명과 다르면 `scripts/sync-catalog/lib.ts`의 `REGISTRY_EXPORT_ALIASES`에 추가.

## 3. 검증 체크리스트

- [ ] `pnpm vitest run packages/external` — sync-catalog parity/드리프트 테스트 통과
- [ ] `pnpm vitest run packages/renderer` — 렌더러가 registry에서 컴포넌트 해석
- [ ] 렌더러 미리보기에서 `{"type": "kiki.<Name>", "props": {...}}` 노드가 렌더되는지 확인 (kiki 앱 부팅 불가 — 미리보기/테스트가 검증 수단)
- [ ] export-tsx 매핑 확인: 신규 type이 TSX export에서 primitive로 낮춰지는지 (카탈로그 드리프트 잔여 과제 — 미지원이면 이슈로 남길 것)
- [ ] `pnpm lint` (hooks 정책 포함)

## 4. PR (사람 리뷰 게이트)

`/ship` 또는 수동으로 PR 생성. PR 본문에 포함:
- 출처 proposal (`proposedComponentType`, evidence refs, 빈도)
- 변형 우선 판단 결과 (왜 신규인지 / 왜 prop 확장인지)

## 5. 머지 후 — rerun으로 화면 반영

proposal을 냈던 잡을 재실행하면 04-render-tree가 이번엔 카탈로그에서 컴포넌트를 발견한다
(candidate 수용 규칙: source evidence 충족 필요 — proposal의 sourceEvidence가 그 근거).

```bash
# proposal을 낸 jobId는 백로그 --json의 출처나 .data/inference-jobs에서 확인
curl -X POST http://localhost:3000/api/inference/<jobId>/rerun \
  -H "Content-Type: application/json" \
  -d '{"startFromStepId": "04-render-tree"}'
```

## 6. (후속) candidate → stable 승격

컴포넌트가 여러 화면에서 안정적으로 쓰이면:

```bash
pnpm promote:component               # candidate 목록
pnpm promote:component kiki.<Name>   # 승격 (catalog.source.ts 수정 + 재생성)
```
