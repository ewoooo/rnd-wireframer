# `@cx/agent` Reference Assets

이 디렉토리는 `@cx/agent`가 참조하는 생성/검수 문서 자산의 정본 위치다.

목적:

- prompt 코드와 문장형 규칙을 분리한다.
- 생성/검수 기준을 패키지 내부에서 버전화한다.
- runtime 계약 문서와 연결되는 참조 자산 루트를 고정한다.

구성:

```text
packages/agent/docs/
  README.md
  session-policy.md
  screen-generation/
    prompt-contract.md
    checklist.md
    output-contract.md
  quality-review/
    prompt-contract.md
    checklist.md
    output-contract.md
```

운영 규칙:

- 실제 Claude 호출 코드는 `src/` 아래에 둔다.
- prompt 원문, 체크리스트, 예시 출력 규약은 이 디렉토리에서 관리한다.
- 문서 자산을 즉시 코드가 읽지 않더라도, 기준선은 먼저 이 위치에 고정한다.
- smoke/pipeline은 필요한 경우 이 디렉토리의 문서 자산을 참조 artifact로 기록할 수 있지만, 생성/검수 규칙의 정본은 이 패키지 내부에 둔다.
