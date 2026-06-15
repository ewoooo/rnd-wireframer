---
id: area-phone-verification-code
situation: 사용자가 휴대폰 번호를 입력하고 인증을 요청한 뒤, 발송된 인증번호를 제한시간 안에 입력해 본인/연령을 확인한다
whenToUseThisReference: SourceSpec에 휴대폰 번호 입력 + 인증 요청 액션이 있고, 본인인증·연령확인·법정대리인 확인처럼 발송된 인증번호를 제한시간 안에 입력해야 하는 flow일 때 사용한다
tags:
  - area-pattern
  - phone-verification
  - auth-code
  - countdown-timer
  - resend-action
---

## Related References

- Capture: `source/area-phone-verification-code.png`
- 본 reference는 SOT 캡처가 아직 없는 신규 패턴이다. 구조 규칙과 Component Candidates를 우선 근거로 삼는다.

## Area Pattern

휴대폰 인증은 "번호 입력 → 인증 요청 → 발송된 코드 입력(제한시간) → 확인"의 시간 의존 flow다. 단순히 휴대폰 번호 `TextField`와 인증번호 `TextField`를 나열하면 사용자는 (1) 코드가 발송됐는지, (2) 남은 입력 시간이 얼마인지, (3) 만료 시 어떻게 재요청하는지를 알 수 없다.

이 패턴의 핵심은 인증번호 입력 field가 **상태를 가진 입력**이라는 점이다: 코드 발송 여부, 남은 제한시간 카운트다운, 재요청 affordance를 같은 field 표면에서 보여줘야 한다. 평면 텍스트 인풋 두 개로는 이 시간 의존 상태를 표현할 수 없다.

## Structure Example

- Area
  - `Pagestack`: 인증 입력 section wrapper
    - 휴대폰 번호 입력 row: `TextField`(번호) + field-side 인증 요청 액션
    - 인증번호 입력 row: 코드 입력 field + 남은 제한시간 표시 + 재요청 액션
      - 발송 안내 문구(예: "인증번호를 보내드렸어요")
      - 남은 시간 카운트다운(예: "2분 49초")
      - 재요청 텍스트 버튼(만료 시 활성)

`source/*-sketch.json`은 (있을 경우) 구조 판단용 예제다. literal label, node id, 수치를 그대로 복사하지 말고 hierarchy와 role만 참고한다.

## Structure Rules

- area wrapper는 `Pagestack` section을 기본으로 쓴다.
- 휴대폰 번호 field와 인증번호 field는 같은 area 안의 인접 row로 둔다. 두 입력은 하나의 인증 단위다.
- 휴대폰 번호 field의 인증 요청은 field-side 액션(`TextField`의 버튼 prop)으로 표현한다. 별도 full-width 버튼으로 분리하지 않는다.
- 인증번호 입력 field는 코드 발송 상태·남은 제한시간·재요청을 한 표면에서 노출한다. 카운트다운과 재요청을 별개 leaf로 흩뜨리지 않는다.
- 남은 시간은 카운트다운(감소) 표시로 둔다. 고정 안내 문구로 대체하지 않는다.
- 재요청은 카운트다운이 만료됐을 때의 복구 경로다. 코드 입력 field 표면 안에 둔다.

## SourceSpec Additions

SourceSpec이 인증 flow를 "번호 입력 + 인증번호 입력"으로만 제공하더라도, 시간 의존 인증을 이해시키기 위해 아래 보강은 허용된다.

- 인증 요청 후 코드 발송 안내 문구를 추가한다.
- 인증번호 field에 남은 제한시간 카운트다운을 추가한다.
- 만료 시 재요청 affordance를 추가한다.
- 통신사 선택·내외국인 구분 같은 본인확인 상위 입력이 source에 있으면 인증 입력 위 section으로 둔다. source에 없으면 임의로 추가하지 않는다.

## Component Candidates

- `Pagestack` section
- `TextField`(휴대폰 번호) + field-side 인증 요청 버튼
- 인증번호 입력 field — **카운트다운 타이머 + 재요청 affordance를 가진 코드 입력 컴포넌트**. 현재 카탈로그의 `kiki.TextField`는 이 시간 의존 상태(발송됨/남은시간/재요청)를 prop으로 표현하지 못한다. 이 패턴을 채택하려는데 카탈로그에 해당 컴포넌트가 없으면 `compositionPlan.catalogGaps`에 기록한다(트리는 평면 `TextField`로 격하하되 갭을 남긴다).

## Avoid

- 인증번호 입력을 남은시간·발송상태 없이 평범한 `TextField`로만 두지 않는다.
- 남은 제한시간을 고정 안내 문구나 helperText description으로 대체하지 않는다 — 카운트다운은 변하는 상태다.
- 재요청을 화면 하단 CTA나 별도 area로 분리하지 않는다. 코드 입력 맥락 안에 둔다.
- source에 없는 통신사·약관·마케팅 문구를 인증 입력 area에 추가하지 않는다.
