# Reference Catalog

Inference가 직접 조회하는 reference catalog 문서는 이 디렉토리 아래에서 관리한다. 이 문서들은 skillset에 직접 주입되는 instruction skill이 아니라, `reference-{category}-{index|catalog}` knowledge source로 조회되는 SOT/reference data다.

## Structure

```text
references/
  screens/
    <reference-id>/
      README.md
      source/
        <reference-id>.png
    catalog.generated.ts
  areas/
    <reference-id>/
      README.md
      source/
        <reference-id>.png
    catalog.generated.ts
```

새 reference는 nested scaffold를 기본으로 만든다.

## Responsibilities

- `README.md`는 generation 중 참조할 짧은 판단 힌트를 소유한다.
- `source/`는 Figma SOT 캡처와 원천 보조 자료를 둔다.
- `catalog.generated.ts`는 `pnpm sync:reference`로 생성한다.

## Naming

- screen reference id는 screen pattern 이름을 사용한다. 예: `screen-form-entry`, `detail-confirmation`.
- area reference id는 `area-*`를 사용한다.
- 캡처 파일명은 reference id와 맞춘다.
