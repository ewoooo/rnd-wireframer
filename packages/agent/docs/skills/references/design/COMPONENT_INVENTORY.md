# 컴포넌트 인벤토리

> 출처: `AGENTS.md`의 디자인 패턴 문서 기준에 따라 책임 단위로 분리. 컴포넌트 사용 빈도, 중첩 패턴, 카테고리 분류를 소유한다.

## 6. 컴포넌트 사용 빈도 TOP 20

| 순위 | 컴포넌트 | 사용 수 | 역할 |
|---|---|---|---|
| 1 | `Divider` | 92 | 콘텐츠 구분선 (1px/4px 두 종류) |
| 2 | `ListText` | 69 | 레이블+값 텍스트 행 |
| 3 | `TitleSection` | 61 | 섹션 헤더 |
| 4 | `Pagestack` | 52 | SDUI 범용 컨테이너 |
| 5 | `Accordion` | 45 | FAQ/상세 접이식 행 |
| 6 | `Default 20/PagestackItem` | 39 | 기본 슬롯 아이템 |
| 7 | `ListSelected` | 39 | 선택형 리스트 행 |
| 8 | `StatusBar` | 27 | 상태바 |
| 9 | `AppBar` | 27 | 내비게이션 바 |
| 10 | `ListProductHorizontal` | 20 | 가로형 상품 카드 |
| 11 | `TextField` | 19 | 텍스트 입력 필드 |
| 12 | `ActionButton` | 16 | 하단 CTA 버튼 블록 |
| 13 | `Card 0/PagestackItem` | 12 | 카드형 슬롯 아이템 |
| 14 | `Local_CardSection` | 11 | 관리 탭 카드 블록 |
| 15 | `Ico` | 10 | 아이콘 컴포넌트 |
| 16 | `Local_CardCarousel` | 9 | 캐러셀 섹션 |
| 17 | `Local_TitleMain` | 9 | 메인 섹션 타이틀 |
| 18 | `CarouselProductModule` | 8 | 캐러셀 상품 카드 |
| 19 | `ListProductRow` | 8 | 단일 행 상품 목록 |
| 20 | `Callout` | 7 | 인라인 안내 박스 |

---

## 7. 컴포넌트 중첩 패턴 상세

### AccordionList 패턴
```
AccordionList
  Accordion (h=95, 첫 항목 펼쳐진 상태)
  Divider (329×1px)
  Accordion (h=21, 닫힌 상태)
  Divider (329×1px)
  ... (반복)
```
- 반드시 Accordion ↔ Divider 교번 구조
- 첫 항목이 열린 상태(h=95), 나머지 닫힌 상태(h=21)로 시작

### ListProductHorizontal 패턴
- 크기: `369×200px` (표준), `369×157px` / `369×168px` / `369×174px` (변형)
- 카드 리스트 화면에서 수직 스택으로 반복 배치
- Card 0/PagestackItem 내부에 포함

### AccordionPriceInfo / AccordionProductInfo 패턴
```
Local_AccordionPriceInfo (Card 0 슬롯 내부)
  TitleContents × 2~3
  Divider
  [States=Open 시] 가격 정보 리스트

Local_AccordionProductInfo (Card 0 슬롯 내부)
  TitleContents
  ThumbnailLogoItem (브랜드 로고)
  Ico (확장 아이콘)
  Divider
```

### Local_Card 패턴
```
Local_Card
  Type=Brand → ThumbnailLogoItem + Local_CardTitle + [Button]
  Type=Place  → ThumbnailLogoItem + Local_CardTitle
```

### Local_Coupon 패턴
```
Local_Coupon
  Badge × 2 (상태 배지)
  ThumbnailLogoItem (브랜드 로고)
  Local_CardTitle (상품명)
  Button (사용하기 등)
```

---

## 8. 컴포넌트 카테고리 분류

### 전역 라이브러리 컴포넌트 (base-component에서 참조)
**크롬/내비게이션:** StatusBar, AppBar, BottomNavigation, Footer, ActionButton, Tab, UnderlineTab  
**콘텐츠 섹션:** Pagestack, TitleSection, TitleMain, TitleContents, TitleBottomSheet  
**리스트 아이템:** ListText, ListSelected, ListProductHorizontal, ListProductRow, TextItem, TextList  
**카드/캐러셀:** CarouselProductModule, CarouselProductTextModule, VerticalProductTextModule  
**폼/선택 컨트롤:** TextField, CheckboxText, Chips, ChipItem, FilterSorting, SearchBar  
**오버레이:** Bottomsheet, Handle, Popup, PopupActionButton  
**구분/구조:** Divider, Accordion, AccordionList  
**표시 요소:** Badge, Callout, Button, Ico, Image, ThumbnailLogoItem, ThumbnailItem

### Local_ 컴포넌트 (화면 전용 복합 컴포넌트)
> 글로벌 시스템 라이브러리가 아닌 페이지 레벨 조합 컴포넌트

| 컴포넌트 | 사용처 |
|---|---|
| `Local_ProductInfo` | 상품 상세 — 상품명·가격·기본정보 블록 |
| `Local_Thumbnail` | 상품 상세 — 히어로 이미지 영역 |
| `Local_CardCarousel` | 쇼핑 메인 — 캐러셀 섹션 조합 |
| `Local_CardSection` | 관리 메인 — 카드형 서비스 목록 |
| `Local_CardTitle` | 카드 내부 — 브랜드+상품명 표시 |
| `Local_TitleMain` | 캐러셀/섹션 — 대형 섹션 타이틀 |
| `Local_BannerHorizontal` | 가로형 배너 |
| `Local_BannerBenefit` | 혜택 배너 (관리 탭) |
| `Local_BannerShop` | 쇼핑 메인 상단 배너 |
| `Local_Summary` | 텍스트 리스트 — 요약 통계 배너 |
| `Local_PayList` | 폼 — 결제 수단 선택 리스트 |
| `Local_PaymentList` | 폼 — 결제 수단 목록 |
| `Local_CartList` | 폼 — 장바구니 아이템 목록 |
| `Local_ListInfo` | 텍스트 리스트 — 정보형 리스트 |
| `Local_OptionList` | 폼 — 옵션 선택 목록 |
| `Local_AccordionPriceInfo` | 상품 상세 — 가격 접이식 |
| `Local_AccordionProductInfo` | 상품 상세 — 상품 정보 접이식 |
| `Local_Coupon` | 쿠폰 카드 |
| `Local_Map` | 지도 영역 |
| `Local_Sheet` | 폼 상단 정보 시트 |
| `Local_Contents` | 일반 콘텐츠 블록 |
| `Local_Chips` | 로컬 탭 칩 바 |
| `Local_ButtonSection` | 버튼 섹션 블록 |
| `Local_ButtonItem` | 더보기 버튼 (텍스트) |
| `Local_ButtonMore` | 더 많은 항목 보기 버튼 |
| `Local_ButtonMoreProduct` | 상품 더보기 버튼 |

---
