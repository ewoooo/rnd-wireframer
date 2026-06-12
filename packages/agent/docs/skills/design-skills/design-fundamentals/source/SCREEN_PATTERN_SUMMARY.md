# 스크린 패턴 분석 요약

> 출처: `AGENTS.md`의 디자인 패턴 문서 기준에 따라 책임 단위로 분리. 36개 스크린 분석 요약과 화면 구성 패턴을 소유한다.

## 1. 전체 페이지 구조 (8개 섹션, 36개 스크린)

모든 스크린은 **393px 너비** (표준 iPhone 뷰포트)로 통일.

| 섹션명 | 영문 | 스크린 수 | 목적 |
|---|---|---|---|
| `메인` | Main | 4 | 검색, 쇼핑, 관리(탭 2개) |
| `리스트_카드` | Card List | 6 | 요금제·단말기·구독·혜택·부가서비스·인터넷 |
| `리스트_텍스트` | Text List | 5 | 이용내역·포인트·할인·공지·이용안내 |
| `상세_상품` | Product Detail | 4 | 구독상품·기프티콘·혜택브랜드·단말기 |
| `상세_정보 입력` | Form Entry | 4 | 인풋·체크·결제·장바구니 |
| `완료` | Completion | 4 | 개통·요금제 변경·결제·해지 |
| `바텀시트` | Bottom Sheet | 6 | 선택·탭 선택·상품 쇼케이스 등 |
| `팝업` | Popup | 3 | 확인·선택·알림 |

---

## 2. 레이아웃 그리드 (너비 체계)

```
393px ── 풀블리드 (StatusBar, AppBar, ActionButton, 섹션 구분 Divider, BottomSheet)
  └── 369px ── 12px 양쪽 마진 (Pagestack, CardCarousel, CardSection)
  └── 361px ── 16px 양쪽 마진 (일반 본문, 상세/폼 콘텐츠, 2열 그리드)
        └── 329px ── 20px 양쪽 내부 패딩 (TitleSection, ListText, TextField, Accordion)
              └── 297px ── Popup 내부 콘텐츠 (361px 팝업에서 32px 양쪽)
```

361px tier는 기존 393/369/329 그리드를 대체하지 않는다. 369px는 카드형 section wrapper와 리스트 그룹, 361px는 일반 본문 콘텐츠와 폼/상세 화면의 기본 콘텐츠 폭으로 사용한다.

**BottomSheet 너비 예외:** title 영역은 screen 기준 32px 마진으로 329px, 일반 Con 슬롯은 20px 마진으로 353px를 기본으로 한다. ActionButton이 있는 시트의 Con 슬롯은 자식 component의 padding contract를 우선한다.

---

## 3. 수직 공간 체계 (Vertical Rhythm)

```
┌─ y=0   StatusBar (393×59)
├─ y=59  AppBar    (393×48)
├─ y=107 ─── 콘텐츠 시작선
│
│  [Pagestack 그룹]
│    ├─ Pagestack top padding: 28px
│    ├─ ContentsTitle (TitleSection 37px)
│    ├─ ContentsSlot (콘텐츠 영역)
│    └─ Divider 섹션 구분선 (393×4px)
│
│  [리스트 내부]
│    ├─ ListItem 간 Divider: 329×1px
│    ├─ 공간 Spacer: 329×17px / 329×21px / 329×41px
│
├─ y=(화면 높이 - 88)  BottomNavigation (393×88) — 메인 화면
└─ y=(화면 높이 - 102) ActionButton (393×102) — 상세/폼 화면

Footer: 393×376 (콘텐츠 최하단)
```

---

## 4. SDUI 슬롯 패턴 (핵심 구조)

### Pagestack — 범용 SDUI 컨테이너

```
Pagestack
├── ContentsTitle frame
│   └── TitleSection (섹션 제목)
└── ContentsSlot_복사금지 ← 서버가 콘텐츠를 주입하는 슬롯
    ├── Default 20/PagestackItem_이친구를복붙하세요  ← 기본 슬롯 아이템
    │   └── [ListText | TextField | ListSelected | Callout | CheckboxText |
    │         AccordionList | Local_PayList | Local_PaymentList | Local_CartList |
    │         Local_OptionList | Local_CartList | TitleContents | Local_ListInfo]
    └── Card 0/PagestackItem_이친구를복붙하세요  ← 카드형 슬롯 아이템
        └── [Local_Card | CarouselProductModule | Local_AccordionPriceInfo |
              Local_AccordionProductInfo | TextList | Local_Contents |
              BannerHorizontal | Local_Coupon | Local_Map]
```

**슬롯 네이밍 관례:**
- `ContentsSlot_복사금지` → 디자이너 원칙: 슬롯 자체를 직접 복사하지 말 것
- `이친구를복붙하세요` → 이 슬롯 아이템을 복사해서 사용하라는 의미
- 슬롯 2종: `Default 20` (텍스트/폼 콘텐츠) / `Card 0` (카드형 콘텐츠)

---

## 5. 스크린 구성 패턴 (8가지)

### Pattern A — 폼/정보 입력 화면
> 사용: 상세_정보 입력_인풋, 상세_정보 체크, 상세_결제, 상세_장바구니

```
StatusBar (393×59)
AppBar (393×48)
━━━ 콘텐츠 (y=107~) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[선택] Local_Sheet
Pagestack
  TitleSection + Default 20/PagestackItem
    TextField | ListText | ListSelected | Callout
    CheckboxText | AccordionList | Local_PayList
Divider (393×4)
Pagestack ... (반복)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ActionButton (393×102, 하단 고정)
```

### Pattern B — 카드 리스트 화면
> 사용: 리스트_요금제, 리스트_단말기, 리스트_구독상품, 리스트_혜택 등

```
StatusBar + AppBar (107)
[선택] Chips (393×57) ← 카테고리 필터 칩
FilterSorting (393×50~52) ← 정렬/필터 바
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ProductListGroup
  TitleSection
  Card 0/PagestackItem
    ListProductHorizontal × N (369×200px, 수직 반복)
[선택] ProductListGroup × 2 (카테고리 구분 시)
```

### Pattern C — 텍스트 리스트 화면
> 사용: 리스트_이용내역, 리스트_T플러스포인트, 리스트_할인내역 등

```
StatusBar + AppBar (107)
[선택] Local_Summary (요약 배너)
[선택] TitleSection
[선택] Chips (날짜/기간 필터)
[선택] Local_ListInfo | Pagestack
  Default 20/PagestackItem
    ListText × N
```
이용안내 화면 한정: `Tab + Chips + SearchBar + AccordionList` (FAQ 구조)

### Pattern D — 메인_쇼핑 화면
```
StatusBar + AppBar (107)
Local_BannerShop (393×146)
Local_Chips (393×57) ← 카테고리 탭
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Local_CardCarousel × 9 (x=12, w=369)
  Local_TitleMain (타이틀 + 서브레이블)
  슬롯 → CarouselProductModule × 4
         CarouselProductTextModule × 3
         VerticalProductTextModule × 1
         Local_CardContents × 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BottomNavigation (393×88)
```

### Pattern E — 메인_관리 화면 (탭 2종)
```
StatusBar + AppBar (107)
Local_BannerBenefit (x=12, 369×48)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CardSectionList (x=12, w=369)
  Local_CardSection × 5~6 (높이 107~229px 가변)
  [선택] Local_BannerHorizontal (369×98)
  [선택] Local_ButtonSection (369×68)
  Local_ButtonItem (더보기 버튼, 72×33)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BottomNavigation (393×88)
```

### Pattern F — 상품 상세 화면
> 사용: 상세_구독상품, 상세_기프티콘, 상세_혜택브랜드, 상세_단말기

```
[오버레이] StatusBar + AppBar (107, 스크롤 시 콘텐츠 위에 고정)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Local_Thumbnail (393×480, 히어로 이미지)
Local_ProductInfo (393×170~177, 상품명+가격+기본정보)
Pagestack × N (구조화된 콘텐츠 블록, Divider로 구분)
  Card 0/PagestackItem (카드형 상세 정보)
  Default 20/PagestackItem (텍스트형 상세 정보)
[선택] Local_ProductInfo expanded (탭+이미지갤러리 포함)
[선택] Local_BannerHorizontal (369×112)
Footer (393×376)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ActionButton (393×102, 하단 고정)
```

### Pattern G — 완료 화면
```
StatusBar + AppBar (107)
Pagestack
  ContentsTitle → TitleMain (대형 성공 헤딩)
  Card 0/PagestackItem (요약 카드)
[선택] 추가 Pagestack (상세 내역)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ActionButton (393×102)
```

### Pattern H — 바텀시트 / 팝업
**바텀시트:**
```
[Dim 오버레이 (393×852, 반투명)]
Bottomsheet (393×384~554, 하단 앵커)
  Handle (393×32)
  TitleBottomSheet (x=32, w=329, h=68 기준)
  Con 슬롯 (콘텐츠, 기본 x=20/w=353 또는 자식 정의)
    [Variant A] ListSelected × 8 (선택 목록)
    [Variant B] Tab + ListSelected (탭 선택)
    [Variant C] CarouselProductModule (상품 쇼케이스)
  ActionButton (393×102)
```
**팝업:**
```
[Dim 오버레이]
Popup (361×220~288, x=16 수평 중앙)
  Title (placeholder: "타이틀")
  SubText (placeholder: "텍스트")
  콘텐츠 슬롯 → ListSelected | TitleSection+ListText
  PopupActionButton (361×60)
```

---
