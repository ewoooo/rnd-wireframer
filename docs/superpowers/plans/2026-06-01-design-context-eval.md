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

## Phase B — 번들 on/off A/B ✅

- [x] `--no-design-context` 토글 추가(pipeline+smoke), 기본 false라 기존 동작 불변
- [x] off/on 각 1회 real AI 실행, 구조 지표 diff
- 결과(단일 run, 노이즈 감안): Divider off=0/on=0, ListText off=4/on=2, critique(h/s/f) off=4/3/5 on=4/4/2, 최종 validation off=ok / on=2err.
- **근본 원인 3가지**:
  1. 🐛 디바이더 미생성(헤드라인 차단): 프롬프트가 Divider를 pattern-store 후보에 묶어 억제. Divider는 카탈로그 leaf라 layout 후보 없이 삽입 가능. → **Phase D 수정 완료**.
  2. 🐛 `nearestCatalogMatch`를 AI가 객체로 산출 → schema-invalid. 프롬프트/문서에 string 명시. → **수정 완료**.
  3. ⚠️ ListText dot 행 subText 누락 → validation 2err. → Phase D 후보(미해결).

## Phase D(1차) — 삽입 경로 튜닝 🔄 검증 중

- [x] Divider 게이팅 해제 + props.type contents(1px)/section(4px) 명시(프롬프트+visual-foundation 번들)
- [x] nearestCatalogMatch string 명시(프롬프트+output-contract)
- [ ] ON 재실행으로 Divider 생성·proposal 유효성 확인 (`tmp/eval-A/on2`)
- [ ] ListText subText 규칙 충돌 해소(미정)

## Phase C — 시각 확인 (apps/web + /browse) ⬜

- [ ] off/on run을 `data/runs/screen-generation`에 등록 후 `/smoke` 탐색기로 렌더 + diff
- [ ] before/after 스크린샷 캡처(divider/간격/위계 육안 비교)

## Phase D — 번들 규칙 튜닝 ⬜

- [ ] B/C 결과로 `packages/agent/docs/design-context/` 규칙 보정
- [ ] ListText subText 규칙 충돌 해소 방향 결정

## 비고

- real AI run 산출물은 `tmp/`에 두고 커밋하지 않는다(캐시/세션 데이터 정리 원칙).
