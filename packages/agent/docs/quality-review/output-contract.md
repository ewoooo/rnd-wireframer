# Quality Review Output Contract

`quality-review`의 출력은 다음 성격을 만족해야 한다.

- 기계적으로 재사용 가능한 bounded finding 목록
- 필요 시 severity와 target/path를 포함한 구조화된 결과
- direct file mutation이 아닌 suggestion/issue 중심 결과
- `scores` 객체에 hierarchy/separation/fidelity를 0–5 정수로 담는다(선택이지만 권장).
