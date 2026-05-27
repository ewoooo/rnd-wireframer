# Generation V2 Mock Schemas

이 디렉토리는 새 생성 과정을 재설계하기 위한 예시 mock schema 데이터만 둔다.

운영 입력, AI 산출물, 승인 테이블로 사용하지 않는다.

## Flow

```text
00-source-spec
-> 01-generation-context
-> 02-draft-candidate
-> 03-quality-inspection
-> 04-preview
-> 05-apply-result
```

AI 실행 자체의 runner 입출력은 `06-agent-run.mock.json`에 별도로 둔다.

## Stage Responsibility

| 파일 | 단계 | 목적 |
|---|---|---|
| `00-source-spec.mock.json` | 명세 입력 | 사용자가 올린 화면/OGN 명세 원본을 어떤 단위로 보는지 정의 |
| `01-generation-context.mock.json` | 생성 컨텍스트 | AI 또는 deterministic generator가 참고할 정책/패턴/컴포넌트 어휘 묶음 |
| `02-draft-candidate.mock.json` | 후보 생성 | 승인 전 table 후보와 source trace를 표현 |
| `03-quality-inspection.mock.json` | 품질 검수 | 후보 검수 결과와 보강 backlog 표현 |
| `04-preview.mock.json` | 미리보기 | 후보를 렌더링 가능한 preview로 확인한 결과 표현 |
| `05-apply-result.mock.json` | 반영 | 승인된 후보가 소비 테이블로 반영되는 결과 표현 |
| `06-agent-run.mock.json` | AI 실행 | Claude/Codex runner의 실행 요청/응답 표현 |

