# Figma-Derived Design References

이 디렉토리는 Figma 디자인 정본을 screen inference pipeline과 agent가 참조할 수 있는 Markdown reference로 분해해 보관한다.

원본 Figma 링크와 node provenance는 [figma-source.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/figma-source.md)에 먼저 등록한다. 실제 화면 유형, 컴포넌트 사용, 레이아웃 리듬, 상태 규칙은 Figma 분석 후 책임 문서로 분리한다.

조회 중인 SOT 화면의 1차 관찰과 skill 승격 후보는 [figma-sot-observations.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/figma-sot-observations.md)에 누적한다.

## 운영 원칙

- Figma 원본이 최상위 디자인 정본이다.
- 이 디렉토리의 문서는 Figma 관찰을 agent가 읽을 수 있게 압축한 reference contract다.
- 패키지 구현 세부사항, stage 실행 순서, Claude runner 계약은 이 디렉토리에 쓰지 않는다.
- reference 변경이 agent prompt에 영향을 주면 `packages/agent/docs/design-context/` 또는 `packages/agent/docs/design-skills/`도 함께 갱신한다.

## 문서 목록

| 문서 | 책임 |
|---|---|
| [figma-source.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/figma-source.md) | Figma file, node URL, provenance 등록 |
| [figma-sot-observations.md](/Users/plusx/Documents/rnd-screen-generator/docs/design/reference/figma-sot-observations.md) | 화면별 SOT 관찰, inference 적용 후보, skill 승격 후보 누적 |
