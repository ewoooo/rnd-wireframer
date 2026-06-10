# Figma Source References

## 1. 문서 책임

이 문서는 screen inference reference 구축에 사용할 Figma 디자인 SOT 링크와 node provenance를 등록한다.

분석 결과 자체는 이 문서에 길게 쓰지 않는다. 화면 유형별 정답 구조, component usage, layout rhythm, visual hierarchy, interaction state, promotion readiness는 `docs/design/reference/`의 책임 문서로 분리한다.

## 2. Figma File

- 파일명: `SKT GenUI Test 0514`
- URL: [SKT GenUI Test 0514](https://www.figma.com/design/ovg86eZdOa16MRWkuQXY7s/SKT_GenUI_Test_0514?node-id=10042-57541&t=zeiBzIdBwRDFfxnm-1)
- 등록일: 2026-06-01
- 상태: 링크 등록 완료, 사용자 정보입력 묶음 4개 frame, 상품 상세화면 묶음 3개 frame, 텍스트 리스트 묶음 5개 frame, 메인 페이지 묶음 4개 frame, 카드 리스트 묶음 6개 frame, 결과 및 확인 완료 묶음 4개 frame 1차 관찰 완료

## 3. Registered SOT Nodes

| 영역 | Figma node | URL | 예상 reference 영향 |
|---|---:|---|---|
| 메인 페이지 | `10042:57541` | [link](https://www.figma.com/design/ovg86eZdOa16MRWkuQXY7s/SKT_GenUI_Test_0514?node-id=10042-57541&t=zeiBzIdBwRDFfxnm-1) | `screen-archetypes`, `visual-hierarchy`, `layout-rhythm` |
| 사용자 정보입력 | `10095:23483` | [link](https://www.figma.com/design/ovg86eZdOa16MRWkuQXY7s/SKT_GenUI_Test_0514?node-id=10095-23483&t=zeiBzIdBwRDFfxnm-1) | `screen-archetypes`, `interaction-states`, `source-to-screen-mapping`, `component-usage` |
| 상품 상세화면 | `10069:97828` | [link](https://www.figma.com/design/ovg86eZdOa16MRWkuQXY7s/SKT_GenUI_Test_0514?node-id=10069-97828&t=zeiBzIdBwRDFfxnm-1) | `screen-archetypes`, `visual-hierarchy`, `component-usage`, `promotion-readiness` |
| 텍스트 리스트 | `10042:46203` | [link](https://www.figma.com/design/ovg86eZdOa16MRWkuQXY7s/SKT_GenUI_Test_0514?node-id=10042-46203&t=zeiBzIdBwRDFfxnm-1) | `screen-archetypes`, `component-usage`, `layout-rhythm`, `promotion-readiness` |
| 카드 리스트 | `9896:91122` | [link](https://www.figma.com/design/ovg86eZdOa16MRWkuQXY7s/SKT_GenUI_Test_0514?node-id=9896-91122&t=zeiBzIdBwRDFfxnm-1) | `screen-archetypes`, `component-usage`, `visual-hierarchy`, `promotion-readiness` |
| 결과 및 확인 완료 | `10090:60588` | [link](https://www.figma.com/design/ovg86eZdOa16MRWkuQXY7s/SKT_GenUI_Test_0514?node-id=10090-60588&t=zeiBzIdBwRDFfxnm-1) | `screen-archetypes`, `visual-hierarchy`, `interaction-states`, `anti-patterns` |

## 4. Analysis Checklist

각 node를 분석할 때 아래 항목을 확인한다.

- 화면의 primary user action
- 화면 유형과 domain design skill 후보
- section order와 region 배치
- visible hierarchy와 emphasis 방식
- CTA 위치와 bottom action rhythm
- list/card/detail/form 반복 구조
- component type, variant, prop surface
- state, validation, disabled, completion behavior
- source-to-screen mapping 근거
- component proposal/promotion 후보
- anti-pattern과 금지 대체

## 5. Next Actions

1. 각 Figma node를 열어 화면 구조와 컴포넌트 사용을 확인하고 [figma-sot-observations.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/figma-sot-observations.md)에 누적한다.
2. `screen-archetypes.md` 초안을 작성한다.
3. component promotion 강화 작업과 맞춰 `component-usage.md`, `promotion-readiness.md`를 우선 작성한다.
4. domain design skill 후보를 확정하고 `packages/agent/docs/design-skills/`의 required references를 갱신한다.
