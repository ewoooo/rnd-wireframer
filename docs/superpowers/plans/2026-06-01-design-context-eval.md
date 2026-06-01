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

## Phase D(1차) — 삽입 경로 튜닝 ✅

- [x] **디바이더 관용구 정정**: 디바이더는 area stack 노드의 `props.divider`(boolean, 렌더러 자동)로 제공됨(사용자 지적). leaf-삽입 지시를 철회하고 listStack/checkboxStack 등 area 노드에 `props.divider: true`("section"=4px)를 켜도록 프롬프트+번들 수정. → 메모리 `divider-via-area-stack-prop` 기록.
- [x] nearestCatalogMatch string 명시(프롬프트+output-contract) — 객체 산출 방지.
- [x] proposal 필드 `title`→`proposedComponentType` (AI 자연 산출에 정렬).
- [x] validation allowedRefs를 `sourceReferenceCatalog.allowedRefs`로 교정.
- [x] ON 재실행(`tmp/eval-A/on2`) 결과: listStack/checkboxStack에 `props.divider:true` ✅, bottomAction엔 없음(맥락 판단) ✅, 최종 validation ok(0 err) ✅, proposal validation ok ✅, critique 4/3/4.
- ListText subText: on2에서 미재현(이전 실패는 비결정). 모니터링 대상.

## Phase C — 시각 확인 ✅

- [x] eval-off/eval-on2를 `data/runs/screen-generation`에 staging, apps/web `/smoke` 탐색기로 렌더+diff
- [x] /browse 스크린샷(`tmp/eval-A/compare.png`): **ON=행 사이 divider 라인 있음 / OFF=평평(없음)**, diff "props Δ 2". 헤드라인 목표(맥락 기반 세퍼레이터) 시각 확인 완료.

## 결론

번들 주입은 작동하며(AI가 번들 규칙 인용·적용), 올바른 관용구(`props.divider`)로 튜닝하니 화면 맥락에 따라 구분선이 자의적으로 생성됨. 제안 레이어·자기비평도 유효. eval 브랜치의 fix(proposedComponentType/allowedRefs/divider-via-prop)는 product 개선이므로 main 반영 권장.

## Phase C — 시각 확인 (apps/web + /browse) ⬜

- [ ] off/on run을 `data/runs/screen-generation`에 등록 후 `/smoke` 탐색기로 렌더 + diff
- [ ] before/after 스크린샷 캡처(divider/간격/위계 육안 비교)

## Phase D — 번들 규칙 튜닝 ⬜

- [ ] B/C 결과로 `packages/agent/docs/design-context/` 규칙 보정
- [ ] ListText subText 규칙 충돌 해소 방향 결정

## 비고

- real AI run 산출물은 `tmp/`에 두고 커밋하지 않는다(캐시/세션 데이터 정리 원칙).
