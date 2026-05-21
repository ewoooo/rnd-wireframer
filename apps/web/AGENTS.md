# apps/web 에이전트 지침

## Workbench Data Loader

- `src/data/*loader.ts`는 앱이 소비할 workbench read model을 만드는 loader 계층이다.
- 로컬 JSON loader와 후속 DB/API loader는 같은 소비 데이터 계약을 반환해야 한다.
- workbench, store, renderer는 데이터 출처가 로컬 JSON인지 DB/API인지 알지 못해야 한다.
- table JSON, DB read model, API 응답을 render tree로 바꾸는 순수 변환 로직은 `src/adapters/`에 둔다.
- `mock`이라는 이름은 fixture 자체에만 사용하고, 앱 실행 데이터 공급자는 `loader`라는 이름을 포함한다.
