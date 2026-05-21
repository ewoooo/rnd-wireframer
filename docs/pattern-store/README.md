# Pattern Store

## 책임

Pattern store는 AI와 resolver/generator가 참조하는 레이아웃 레시피 저장소다.

소비 데이터는 `pattern.id`와 `pattern.variant`만 저장하고, 실제 layout recipe는 이 디렉토리의 pattern JSON에서 조회한다.

## 렌더 흐름

```text
consumer sample data
  -> pattern store recipe lookup
  -> generator materializes WireframeNode tree
  -> @cx/renderer validation
  -> @cx/renderer renders WireframeNode
```

`@cx/renderer`는 pattern store를 직접 읽지 않는다.

## 파일

| 파일 | 책임 |
|---|---|
| `pattern-index.json` | AI가 후보 pattern을 먼저 좁히는 검색용 인덱스 |
| `screen-patterns.json` | `Screen.*` region layout, wrapper, divider recipe |
| `organism-patterns.json` | OGN 내부 flow, spacing, composite ordering recipe |
| `composite-patterns.json` | concrete composite node prop preset recipe |

## 스키마

각 pattern은 아래 구조를 따른다.

```json
{
	"id": "field-stack",
	"target": "organism",
	"name": "필드 스택",
	"description": "TextField를 세로로 쌓는 입력 OGN 프리셋",
	"defaultVariant": "default",
	"variants": {
		"default": {
			"recipe": {
				"organism": {
					"props": {
						"flow": "vertical",
						"componentGap": 12
					},
					"compositeOrder": "explicit"
				}
			}
		}
	},
	"guidance": {
		"keywords": ["form", "field", "입력"],
		"rules": ["resolver/generator가 recipe를 WireframeNode 구조로 materialize한다."]
	},
	"examples": []
}
```
