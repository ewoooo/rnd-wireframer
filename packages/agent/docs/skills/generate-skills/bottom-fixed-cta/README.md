---
id: bottom-fixed-cta
stage: compose
task: screen-generation
role: bottom-action
priority: required
---

# bottom-fixed-cta

화면 완료로 이어지는 primary action은 `Screen.Bottom`의 고정 action rail에 둔다. Figma SOT에서 하단 CTA는 bottom fixed 영역에 있으며 content와 별도의 action rail로 읽힌다. (근거: `docs/design/reference/figma-sot-observations.md` §4.6, §4.7)

## Rule

- primary CTA는 `Screen.Bottom` region의 `layout.area.bottomActionArea`에 `componentActionButton`으로 배치한다. Contents 영역 안에 끼우지 않는다.
- bottom CTA는 scroll 위치와 무관하게 다음 단계로 이어지도록 sticky/fixed로 둔다.
- primary는 하나로 명확히 한다. 보조 action(예: "나중에 다시 보기")은 TextButton 등으로 시각적 후순위 처리.

## Label / Gating

- CTA label은 source intent의 다음 행동을 그대로 반영한다(예: "계속하기", "결제하기"). 임의 일반 문구 금지.
- source가 입력/검증/동의 완료를 전제로 하면, 그 미충족 시 disabled gating을 CTA props에 명시한다. 게이팅 의미를 후속 단계로 미루지 않는다.

## Anti-pattern

- contents와 action을 같은 rail로 섞지 않는다 — content는 스크롤, action은 고정.
- home/dashboard성 shell처럼 단일 완료 action이 없는 화면에 억지 bottom CTA를 만들지 않는다.
