# Design Context Injection — Real-AI 검증/튜닝 로그

> 구현(`2026-05-29-design-context-injection.md`) 완료 후, real `--use-ai`로 효과를 검증하고 번들 규칙을 튜닝하는 단계. 단일 화면 피드백 루프(A→B→C→D)로 진행.

대상 화면: `NOVA-MBR-PG-001-0` (약관/폼). 모델: `claude-opus-4-7`.

## Phase A — 단일 화면 feasibility ✅

- [x] real `--use-ai` 단일 실행, 파이프라인 end-to-end 동작 확인(exit 0)
- 발견:
  1. ✅ **주입 작동 확인**: 제안 rationale이 interaction-state 번들의 "전체 동의 → Divider → 필수/선택" 패턴을 인용하며 `CheckboxAllAgree`를 제안. 번들 본문이 모델 추론을 실제로 바꿈.
  2. 🐛 제안 스키마 필드 불일치: AI는 `proposedComponentType`(더 정확)를 산출, 스키마는 `title` 요구 → schema-invalid. **수정: 스키마/프롬프트/문서/테스트를 proposedComponentType로 정렬.**
  3. 🐛 validation allowedRefs 출처 오류: `componentContractCatalog.sourceRefs`(좁음) 사용으로 정당한 근거 false-flag. **수정: `sourceReferenceCatalog.allowedRefs`(전체 vocabulary)로 교정.**
  4. ⚠️ ListText subText: validation은 필수, critique는 redundant라 지적(규칙 충돌). → Phase D 후보.
- 산출물: `tmp/eval-A/on`(초기), 수정 후 재실행은 Phase B A/B에 포함.

## Phase B — 번들 on/off A/B 🔄 진행 중

- [x] `--no-design-context` 토글 추가(pipeline+smoke), 기본 false라 기존 동작 불변
- [ ] off/on 각 1회 real AI 실행 후 구조 지표 diff(divider 수·area 그룹핑·proposal 유효성·critique 점수)
- 산출물: `tmp/eval-A/off`, `tmp/eval-A/on`

## Phase C — 시각 확인 (apps/web + /browse) ⬜

- [ ] off/on run을 `data/runs/screen-generation`에 등록 후 `/smoke` 탐색기로 렌더 + diff
- [ ] before/after 스크린샷 캡처(divider/간격/위계 육안 비교)

## Phase D — 번들 규칙 튜닝 ⬜

- [ ] B/C 결과로 `packages/agent/docs/design-context/` 규칙 보정
- [ ] ListText subText 규칙 충돌 해소 방향 결정

## 비고

- real AI run 산출물은 `tmp/`에 두고 커밋하지 않는다(캐시/세션 데이터 정리 원칙).
