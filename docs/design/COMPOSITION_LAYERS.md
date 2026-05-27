# 조합 레이어 원칙

> 출처: `AGENTS.md`의 디자인 패턴 문서 기준에 따라 책임 단위로 분리.

## 조합 레이어 원칙

화면 제작 시 외부 문서의 `Atom` 분류는 직접 사용하지 않고, 이 repo의 구현 어휘인 `Component -> Pattern -> Area -> Screen`으로 해석한다.

| 레이어 | 역할 | 화면 route 직접 배치 |
|---|---|---|
| Component | `Button`, `Badge`, `Ico`, `RadioText`, `CheckboxText` 같은 기초 UI 어휘 | 원칙적으로 금지 |
| Pattern | `SinglePrimaryAction`, `PageStackContents`, `FieldStack`, `PopupActionButton` 같은 반복 조합 | 가능 |
| Area | 정책 의미·도메인 모듈 ID·OGN을 담는 의미 단위 | 가능 |
| Screen | `AppScreen` slot에 chrome/section/area을 배치하는 지도 | 해당 |

이 프로젝트의 생성 결과에서는 OGN을 대부분 섹션 단위로 해석한다. 따라서 `Screen`은 하위 `Area` 섹션을 소유하고, 생성 DB에서는 `generated_screens -> generated_areas -> components_json` 관계로 저장한다.

기초 component는 독립 배치보다 pattern이나 area의 이름 있는 slot 안에서 의미가 선명해진다. 예를 들어 primary `Button`은 콘텐츠 중간에 직접 배치하지 않고 `SinglePrimaryAction`, 카드 CTA slot, `PopupActionButton`, bottom sheet action slot 안에 둔다.

### 컴포넌트 후보 분기

화면 패턴을 정한 뒤 각 SB part는 바로 신규 component로 만들지 않고 `reuse` 또는 `new`로 분기한다.

- `reuse`: `@cx/components`의 component, `@cx/layout` pattern, 또는 도메인 `Area` 조합으로 정책 의미와 상태를 표현할 수 있다.
- `tokens`: 색상, 타이포그래피, radius, spacing은 `cx-tokens`와 `DESIGN_FOUNDATION.md`의 semantic token을 기준으로 한다.
- `new`: 기존 vocabulary로 정책 의미, 선택지, 에러, slot, Figma bridge identity를 표현할 수 없어 신규 candidate가 필요하다.

`new` candidate는 `@cx/components` 패키지 내부 status인 `candidate`로 관리한다. candidate는 패키지 내부 `candidates/`에 둘 수 있지만, 외부 catalog에서는 정본 component와 구분되지 않는 단일 component vocabulary로 노출한다. 정식 component vocabulary로 승격할 때는 status를 `stable`로 바꾸고 구현 위치를 `components/`로 이동한다.

---
