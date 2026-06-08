# Quality Review Prompt Contract

`quality-review` task는 최소한 다음 정보를 review prompt에 포함해야 한다.

- 검수 대상 generation result
- 관련 validation report가 있으면 그 결과
- 필요한 디자인 기준 문서 참조
- 검수 결과는 bounded findings와 제안 중심이어야 한다는 규칙
- 금지 사항: 직접 파일 반영 결정, schema 밖 자유형 산출물 강제
