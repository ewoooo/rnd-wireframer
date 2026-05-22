# Pattern Store

## 책임

Pattern store는 **children layout preset catalog**다.

Pattern은 node의 의미 분류가 아니라, 그 node가 소유한 `children`을 어떻게 배치할지 정의한다. Pattern은 자기 node의 children만 다루며, 자식 node 내부 레이아웃에는 침범하지 않는다.

```text
node
  pattern
    -> node.children layout resolve
```

## Target

| target | 적용 대상 | 책임 |
|---|---|---|
| `region` | `Screen.Header`, `Screen.Contents`, `Screen.Bottom` | region children인 composite/organism 배치 |
| `organism` | `Organism` | organism children인 composite 배치 |
| `composite` | composite wrapper | composite 내부 children/slot 배치 |

Resolver 로직은 별도 단계에서 구현한다. 이 디렉터리는 우선 catalog schema와 preset 정의만 소유한다.

## 파일

| 파일 | 책임 |
|---|---|
| `pattern-index.json` | 후보 pattern 검색용 인덱스 |
| `region-patterns.json` | region children layout preset |
| `area-patterns.json` | organism children layout preset |
| `composite-patterns.json` | composite children/slot layout preset |

## 스키마

각 pattern은 아래 구조를 따른다.

```json
{
	"id": "section-stack",
	"target": "region",
	"name": "섹션 스택",
	"description": "Region children을 PageStack으로 감싸는 레이아웃 프리셋",
	"layout": {
		"direction": "vertical",
		"childOrder": "explicit",
		"childWrap": {
			"kind": "page-stack",
			"appliesTo": ["composite", "area"],
			"itemPaddingX": 20,
			"sectionPaddingX": 12,
			"paddingY": 28,
			"divider": { "type": "section" }
		}
	}
}
```

`childWrap`은 parent node가 자기 children을 감쌀 때만 적용된다. 예를 들어 OGN 전체를 `PageStack`에 넣는 것은 `Screen.Contents` 같은 `region` pattern의 책임이고, OGN 내부 composite 배치는 `organism` pattern의 책임이다.
