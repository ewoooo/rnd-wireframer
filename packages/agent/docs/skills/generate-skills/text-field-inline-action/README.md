---
id: text-field-inline-action
stage: compose
task: screen-generation
role: inline-action-slot
priority: recommended
---

# text-field-inline-action

입력 필드와 짝이 되는 인라인 액션(인증요청·중복확인·주소찾기·동의요청 등)은 필드 옆 형제 Button 노드로 두지 않고, `kiki.TextField`의 `rightElement` node 슬롯에 넣는다. 렌더러는 카탈로그 계약이 `node`인 prop에 적힌 render-node의 렌더를 보장한다.

## Rule

- "입력 후 즉시 실행하는 1개 액션"이 필드에 종속될 때 = `props.rightElement`에 render-node(주로 `kiki.Button`, size: medium 이하)를 넣는다.
- 슬롯 값은 일반 노드와 같은 모양이다: `type` + `metadata.id`(+`metadata.title`) 필수, `props`/`display` 사용 가능.
- 슬롯 노드 안에서도 `{bind}`, `display.when`, `display.stateRole`이 전부 동작한다. 입력 유효성에 묶인 비활성화는 슬롯 버튼에 `display: { stateRole: "disabled", when: { bind: "<유효성 신호>" } }`로 표현한다.

## Shape

```json
{
  "type": "kiki.TextField",
  "metadata": { "id": "FieldGuardianPhone", "title": "법정대리인 휴대폰번호" },
  "props": {
    "label": "법정대리인 휴대폰번호",
    "value": { "bind": "guardian.phone" },
    "rightElement": {
      "type": "kiki.Button",
      "metadata": { "id": "ButtonGuardianConsentRequest", "title": "법정대리인 동의 요청" },
      "display": { "stateRole": "disabled", "when": { "bind": "guardian.phoneValid" } },
      "props": { "variant": "secondary", "size": "medium", "children": "동의 요청" }
    }
  }
}
```

## Anti-pattern

- 필드에 종속된 단일 액션을 필드 아래 fullWidth 형제 Button으로 평탄화하지 않는다 — 입력과 액션의 종속 관계가 시각적으로 끊긴다.
- 화면 전체를 진행시키는 주 CTA(다음/제출)는 슬롯이 아니라 bottom-fixed-cta 패턴이다. rightElement는 필드 단위 보조 액션 전용.
- `rightElement`에 문자열이나 여러 노드를 넣지 않는다 — 단일 render-node 1개만.
