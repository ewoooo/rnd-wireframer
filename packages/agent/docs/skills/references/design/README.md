# Agent Design References

이 디렉토리는 `@cx/agent`가 prompt, skill, review context에서 참조하는 SKT SDUI 디자인 정본을 관리한다.

책임:

- Figma-derived 화면 구성, spacing, interaction, component inventory 관찰값을 책임 문서 단위로 유지한다.
- Agent prompt용 압축 규칙은 `packages/agent/docs/design-context/`에서 관리하고, 이 디렉토리의 문서를 원천으로 참조한다.
- 구현 패키지의 실제 계약은 `@cx/tokens`, `@cx/components`, `@cx/layout`, `@cx/schema`의 공개 surface를 따른다.

운영 원칙:

- 새 패턴을 추가할 때는 해당 책임 문서 하나에만 상세를 작성한다.
- 다른 문서에는 중복 설명 대신 이 디렉토리의 책임 문서를 링크한다.
- Design Review, generation, quality review가 남기는 `designReferences`는 이 디렉토리의 문서명을 기준으로 기록한다.
