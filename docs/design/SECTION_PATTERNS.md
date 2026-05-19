# 섹션별 케이스 패턴 가이드

> 출처: `AGENTS.md`의 디자인 패턴 문서 기준에 따라 책임 단위로 분리. 각 섹션의 사용 조건, 필수 구성, 선택 구성, 케이스 분기, 주의사항을 소유한다.

## 섹션 패턴 — 메인 (Main)

### 언제 사용
앱의 진입 허브. 탐색·검색·개인화 콘텐츠를 한 화면에 담을 때 사용.  
메인은 단일 화면이 아니라 **탭 또는 세그먼트로 분기**되는 복수 화면 구조로 설계.

### 케이스 분류

| 케이스 | 화면명 | 특징 |
|---|---|---|
| **검색형** | 메인_검색 | SearchBar 중심, 퀵 카테고리 Chip |
| **쇼핑형** | 메인_쇼핑 | 배너 + 다중 캐러셀 섹션 |
| **관리형 (탭)** | 메인_관리_세그먼트1/2 | UnderlineTab + CardSection 그리드 |

---

### 케이스 A — 검색형 메인

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar                            (393×59)          │
│ AppBar  [Logo / 검색 아이콘]           (393×48)          │
├───────────────────────────────────────────────────────┤
│ Pagestack  (x=0, w=393)                               │
│   ContentsTitle → TitleMain  (검색 유도 메시지)          │
│   ContentsSlot → Image (검색 일러스트)                   │
├───────────────────────────────────────────────────────┤
│ 퀵 카테고리 ChipItem 그룹  (x=12, 가로 스크롤)             │
├───────────────────────────────────────────────────────┤
│ SearchBar  (x=20, w=353, h=52)                        │
├───────────────────────────────────────────────────────┤
│ BottomNavigation                     (393×88)          │
└───────────────────────────────────────────────────────┘
```

**필수 구성요소**
- StatusBar + AppBar (고정 헤더 107px)
- SearchBar (x=20, w=353)
- BottomNavigation (하단 88px)

**선택 구성요소**
- TitleMain (검색 유도 문구)
- ChipItem 퀵 카테고리 바
- Image (빈 상태 또는 추천 일러스트)

**주의사항**
- SearchBar는 반드시 x=20 배치 (내부 콘텐츠 너비 기준)
- BottomNavigation과 ActionButton 동시 사용 금지

---

### 케이스 B — 쇼핑형 메인

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar                            (393×59)          │
│ AppBar  [Logo / 장바구니 아이콘]        (393×48)          │
├───────────────────────────────────────────────────────┤
│ Local_BannerShop                     (393×146)         │
├───────────────────────────────────────────────────────┤
│ Local_Chips (카테고리 탭)              (393×57)          │
├───────────────────────────────────────────────────────┤
│ ↓ 반복 섹션 (x=12, w=369) ─────────────────────────── │
│   Local_CardCarousel                                   │
│     Local_TitleMain  (섹션 제목 + 서브레이블)             │
│     슬롯 (가로 스크롤)                                    │
│       CarouselProductModule       또는                  │
│       CarouselProductTextModule   또는                  │
│       VerticalProductTextModule   또는                  │
│       Local_CardContents                               │
│   Local_CardCarousel  (반복 최대 9개 확인)               │
├───────────────────────────────────────────────────────┤
│ BottomNavigation                     (393×88)          │
└───────────────────────────────────────────────────────┘
```

**필수 구성요소**
- StatusBar + AppBar
- Local_Chips (카테고리 필터)
- Local_CardCarousel × 1개 이상
- BottomNavigation

**선택 구성요소**
- Local_BannerShop (상단 광고/프로모션 배너)
- 캐러셀 내 모듈 유형은 콘텐츠 성격에 따라 선택

**캐러셀 모듈 선택 기준**
| 모듈 | 사용 상황 |
|---|---|
| `CarouselProductModule` | 이미지 중심 상품 카드 |
| `CarouselProductTextModule` | 텍스트 정보가 중요한 상품 |
| `VerticalProductTextModule` | 세로형 상품 리스트 |
| `Local_CardContents` | 혜택·서비스 정보 카드 |

**주의사항**
- Local_CardCarousel은 x=12 고정 (369px 섹션 너비)
- 캐러셀은 가로 스크롤 처리, 첫 카드만 화면에 노출

---

### 케이스 C — 관리형 메인 (세그먼트)

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar                   (393×107)         │
├───────────────────────────────────────────────────────┤
│ Local_BannerBenefit  (x=12, w=369, h=48)              │
├───────────────────────────────────────────────────────┤
│ ↓ CardSectionList  (x=12, w=369) ──────────────────── │
│   Local_CardSection  (h=107~229, 콘텐츠에 따라 가변)    │
│   Local_CardSection  (반복, 5~6개)                     │
│   Local_BannerHorizontal  (선택, 369×98)               │
│   Local_ButtonSection     (선택, 369×68)               │
│   Local_ButtonItem  (더보기, w=72, h=33, 중앙 정렬)     │
├───────────────────────────────────────────────────────┤
│ BottomNavigation                     (393×88)          │
└───────────────────────────────────────────────────────┘
```

**탭 분기 처리**
- UnderlineTab으로 세그먼트 전환 (세그먼트1 / 세그먼트2)
- 탭별로 CardSection 구성 및 배너 유형이 달라짐

**필수 구성요소**
- UnderlineTab (세그먼트 전환)
- Local_CardSection × 3개 이상
- BottomNavigation

**선택 구성요소**
- Local_BannerBenefit (혜택 배너)
- Local_BannerHorizontal (가로형 프로모션 배너)
- Local_ButtonSection (버튼 CTA 섹션)
- Local_ButtonItem (더보기)

**Spacing Contract**
- Main chrome은 `StatusBar + AppBar = 107px`를 기본으로 한다.
- 검색형 SearchBar는 content rail 353px 기준으로 x=20에 둔다.
- Chip row는 57px 높이, left 20px, row gap 4px를 기준으로 한다.
- 쇼핑형/관리형 카드 섹션은 section rail 369px(x=12)을 사용한다.
- CardSection 내부 padding은 28px, 내부 gap은 24px를 기준으로 한다.
- Main 계열은 `BottomNavigation(88px)`을 사용하고 `ActionButton`과 동시에 쓰지 않는다.

---

<a name="section-list-card"></a>
## 섹션 패턴 — 리스트\_카드 (Card List)

### 언제 사용
상품·서비스를 카드 형태로 탐색하는 브라우즈 화면.  
각 항목이 이미지, 가격, 주요 스펙을 포함할 때 사용.  
필터·정렬 기능이 필요한 경우에 적합.

### 케이스 분류

| 케이스 | 예시 화면 | 특징 |
|---|---|---|
| **카테고리 필터 있음** | 리스트_요금제, 리스트_혜택 | Chips + FilterSorting |
| **정렬만 있음** | 리스트_부가서비스, 리스트_인터넷 | FilterSorting 단독 |
| **복수 카테고리 그룹** | 리스트_요금제, 리스트_혜택 | ProductListGroup × 2 |

---

### 기본 구조

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar                   (393×107)         │
├───────────────────────────────────────────────────────┤
│ [선택] Chips  (393×57)  ← 카테고리 필터 칩               │
│ FilterSorting  (393×50~52)  ← 정렬/필터 바             │
├───────────────────────────────────────────────────────┤
│ ProductListGroup  (x=0, w=393)                        │
│   TitleSection  (x=20, w=329)  ← 카테고리 제목          │
│   Card 0/PagestackItem                               │
│     ListProductHorizontal  (x=12, w=369, h=200)      │ ← 표준
│     ListProductHorizontal  (반복)                      │
│     ListProductHorizontal  ...                        │
│                                                       │
│ [선택] ProductListGroup  (두 번째 카테고리)               │
│   Divider  (393×4)  ← 카테고리 그룹 구분                │
│   TitleSection + 카드 목록 반복                         │
└───────────────────────────────────────────────────────┘
```

**필수 구성요소**
- StatusBar + AppBar
- FilterSorting (정렬 기능)
- ListProductHorizontal × 1개 이상

**선택 구성요소**
- Chips (카테고리 필터) — 복수 카테고리가 있을 때
- TitleSection (카테고리 그룹 제목)
- 복수 ProductListGroup (카테고리 분리)

**ListProductHorizontal 크기 변형**
| 높이 | 사용 케이스 |
|---|---|
| 369×200px | 표준 (요금제, 단말기) |
| 369×157px | 간소화 (부가서비스) |
| 369×168px | 중형 (인터넷) |
| 369×174px | 중형 변형 |

**주의사항**
- Chips가 없을 때 FilterSorting이 AppBar 바로 아래 위치
- Chips가 있을 때 배치: AppBar → Chips(57) → FilterSorting(50~52) → 콘텐츠
- 카드는 반드시 x=12 배치 (369px 섹션 너비)
- 카드 간 구분은 Divider(329×1px) 사용 금지 → 카드 자체의 여백으로 구분

**Spacing Contract**
- Chips는 57px, FilterSorting은 50~52px 높이를 기준으로 한다.
- ProductListGroup은 section rail 369px(x=12)을 기준으로 반복한다.
- ProductListGroup 내부 padding은 top/bottom 12px, left/right 12px를 기준으로 한다.
- TitleSection과 ListText류 내부 콘텐츠는 inner rail 329px를 기준으로 한다.
- 카드 간 구분은 1px Divider가 아니라 카드 자체 여백과 group rhythm으로 처리한다.

---

<a name="section-list-text"></a>
## 섹션 패턴 — 리스트\_텍스트 (Text List)

### 언제 사용
이미지 없이 텍스트 정보 위주의 내역·목록을 표시할 때.  
이용내역, 포인트 내역, 공지사항, 이용안내 등 **기록·정보 조회 화면**에 적합.

### 케이스 분류

| 케이스 | 예시 화면 | 특징 |
|---|---|---|
| **내역 조회형** | 리스트_이용내역, 리스트_할인내역 | Summary 배너 + 날짜 Chips + ListText |
| **공지/안내 목록형** | 리스트_공지사항 | Local_ListInfo 직접 사용 |
| **포인트 내역형** | 리스트_T플러스포인트 내역 | Summary + Chips + Pagestack |
| **FAQ/이용안내형** | 리스트_이용안내 | Tab + Chips + SearchBar + AccordionList |

---

### 케이스 A — 내역 조회형

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar                   (393×107)         │
├───────────────────────────────────────────────────────┤
│ Local_Summary  (x=12, w=369)  ← 요약 통계 배너         │
│   (잔여 데이터, 포인트 합계 등 숫자 요약)                   │
├───────────────────────────────────────────────────────┤
│ [선택] TitleSection  (x=20, w=329)                    │
│ Chips  (날짜/기간 필터)                                  │
├───────────────────────────────────────────────────────┤
│ Pagestack  (x=0, w=393)                               │
│   ContentsSlot → Default 20/PagestackItem             │
│     ListText  (x=20, w=329, h=22)  ← 반복             │
│     Divider  (329×1px)  ← 각 ListText 사이             │
└───────────────────────────────────────────────────────┘
```

### 케이스 B — 공지/안내 목록형

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar                   (393×107)         │
├───────────────────────────────────────────────────────┤
│ Local_ListInfo  (x=32, w=329)                         │
│   ← 제목+날짜+뱃지 구성의 리스트, Divider로 구분          │
└───────────────────────────────────────────────────────┘
```

### 케이스 C — FAQ/이용안내형

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar                   (393×107)         │
├───────────────────────────────────────────────────────┤
│ Tab  (393×47)  ← 카테고리 탭 전환                       │
│ Chips  (날짜/기간 필터, 393×57)                         │
│ SearchBar  (x=20, w=353, h=45~52)                     │
├───────────────────────────────────────────────────────┤
│ AccordionList  (x=32, w=329)                          │
│   Accordion  (펼침: h=95)                              │
│   Divider  (329×1px)                                  │
│   Accordion  (닫힘: h=21)  ← 반복                      │
│   Divider  ...                                        │
└───────────────────────────────────────────────────────┘
```

**공통 필수 구성요소**
- StatusBar + AppBar
- 1개 이상의 목록 컴포넌트 (Local_ListInfo / ListText / Accordion)

**선택 구성요소 및 판단 기준**

| 요소 | 추가 기준 |
|---|---|
| Local_Summary | 합계·잔량 등 수치 요약이 필요할 때 |
| Chips | 날짜·기간·카테고리 필터가 필요할 때 |
| Tab | 콘텐츠 유형이 2가지로 나뉠 때 |
| SearchBar | 목록이 많아 검색이 필요할 때 |

**주의사항**
- ListText 사이 구분은 반드시 `329×1px` Divider 사용
- Pagestack 없이 Local_ListInfo 직접 배치 가능 (공지 목록형)
- AccordionList는 반드시 `Accordion + Divider` 교번 구조 유지

**Spacing Contract**
- ListText는 inner rail 329px, row 22px + padB 4px를 기준으로 한다.
- ListText의 left/right 관계는 left flex / right fixed, gap 16px를 기본으로 한다.
- 항목 구분은 `Divider(329×1px)`를 사용하고, 단순 vertical gap으로 대체하지 않는다.
- Summary 배너는 section rail 369px(x=12)을 사용한다.
- FAQ/이용안내형의 Chips row는 57px, Tab은 full bleed 393px를 기준으로 한다.

---

<a name="section-detail-product"></a>
## 섹션 패턴 — 상세\_상품 (Product Detail)

### 언제 사용
상품·서비스의 상세 정보를 전달하는 롱폼(long-form) 화면.  
이미지 + 가격 + 구조화된 정보 블록 + 하단 CTA가 필요한 경우.

### 케이스 분류

| 케이스 | 예시 화면 | 특징 |
|---|---|---|
| **구독 상품형** | 상세_구독상품 | 썸네일 + ProductInfo + 탭 이미지갤러리 |
| **기프티콘형** | 상세_기프티콘 | 썸네일 + ProductInfo + 간단한 Pagestack |
| **혜택 브랜드형** | 상세_혜택브랜드 | 썸네일 → 바로 Pagestack (ProductInfo 생략) |
| **단말기형** | 상세_단말기 | 썸네일 + ProductInfo + OptionList + 탭갤러리 |

---

### 기본 구조 (공통)

```
┌──────────────────────── 393px ────────────────────────┐
│ [오버레이] StatusBar + AppBar  ← 스크롤해도 최상단 고정   │
│                                      (393×107)         │
├───────────────────────────────────────────────────────┤
│ ↓ 스크롤 콘텐츠 (y=0부터 시작, 헤더에 가려짐)              │
│                                                       │
│ Local_Thumbnail  (393×480)  ← 히어로 이미지             │
│                                                       │
│ [케이스에 따라] Local_ProductInfo  (393×170~177)        │
│   상품명 / 가격 / 기본 스펙                               │
│                                                       │
│ ─ ─ ─ Pagestack 반복 구간 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ Divider  (393×4)                                      │
│ Pagestack  (x=0 or x=12, w=393 or 369)               │
│   TitleSection + Card 0/PagestackItem                 │
│     (카드형 콘텐츠: 가격정보, 브랜드카드, 쿠폰 등)           │
│     또는                                               │
│   TitleSection + Default 20/PagestackItem             │
│     (텍스트형 콘텐츠: 이용약관, 유의사항 등)                 │
│ Divider  (393×4)                                      │
│ Pagestack  (반복)                                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                       │
│ [선택] Local_BannerHorizontal  (x=12, 369×112)        │
│ Footer  (393×376)                                     │
│                                                       │
│                ActionButton  (393×102, 하단 고정)       │
└───────────────────────────────────────────────────────┘
```

### 케이스별 구성 차이

**구독 상품형 / 단말기형** (상품 정보 풀 버전)
```
Local_Thumbnail (480)
Local_ProductInfo (170~177)  ← 기본 정보
  UnderlineTab  ← "상품정보 / 이용안내" 등
  Image 갤러리  ← 상세 이미지
  Local_ButtonMore  ← "더보기"
Pagestack × N
Footer
```

**기프티콘형** (간략 버전)
```
Local_Thumbnail (480)
Local_ProductInfo (170)
Pagestack × 2~3  ← 유의사항, 이용안내
Footer
```

**혜택 브랜드형** (ProductInfo 생략)
```
Local_Thumbnail (480)
Pagestack × N  ← 바로 상세 콘텐츠
  Local_AccordionProductInfo  ← 브랜드 카드 + 혜택 내역
  Local_BannerHorizontal
Footer
```

**단말기형** (옵션 선택 포함)
```
Local_Thumbnail (480)
Local_ProductInfo (170~177)
Pagestack  ← Local_OptionList (색상/용량 선택)
Pagestack × N  ← 스펙, 이용안내
Footer
```

**필수 구성요소**
- StatusBar + AppBar (오버레이, y=0 고정)
- Local_Thumbnail
- ActionButton (하단 고정, 102px)

**선택 구성요소 판단 기준**

| 요소 | 추가 기준 |
|---|---|
| Local_ProductInfo | 가격/스펙 요약이 필요한 상품 |
| UnderlineTab | 상세정보가 2가지 이상 탭으로 나뉠 때 |
| Local_OptionList | 색상·용량·수량 옵션 선택이 필요할 때 |
| Local_BannerHorizontal | 연관 상품·프로모션 배너 노출 시 |
| Local_AccordionProductInfo | 복수 브랜드/혜택을 접이식으로 표시할 때 |
| Footer | 이용약관·고객센터 등 법적 고지가 필요할 때 |

**주의사항**
- StatusBar+AppBar는 반드시 별도 오버레이 프레임으로 y=0에 고정 (콘텐츠와 분리)
- Pagestack 섹션 간 구분은 반드시 `Divider(393×4px)` 사용
- ActionButton은 콘텐츠 스크롤과 무관하게 화면 최하단에 고정
- Footer는 ActionButton 위 콘텐츠의 마지막 요소

**Spacing Contract**
- 상세 hero는 full bleed 393px로 시작하고, overlay header는 y=0에서 107px를 점유한다.
- Local_Thumbnail은 full bleed 393px, 높이 480px를 기준으로 한다.
- ProductInfo는 full bleed 393px, 높이 170~177px 범위를 기준으로 한다.
- Pagestack 섹션 간 구분은 `Divider(393×4px)`를 사용하고 gap으로 대체하지 않는다.
- Card형 상세 정보는 section rail 369px, 텍스트/약관 정보는 inner rail 329px를 기준으로 한다.
- Bottom ActionButton은 393×102px fixed rail로 둔다.

---

<a name="section-detail-form"></a>
## 섹션 패턴 — 상세\_정보 입력 (Form Entry)

### 언제 사용
사용자 입력·확인·결제·장바구니 등 **입력 기반 트랜잭션 화면**.  
단계가 여러 개일 경우 스텝별로 화면을 분리.

### 케이스 분류

| 케이스 | 예시 화면 | 주요 콘텐츠 |
|---|---|---|
| **입력형** | 상세_정보 입력_인풋 | TextField 중심 |
| **확인/동의형** | 상세_정보 체크 | CheckboxText + ListText + Callout |
| **결제형** | 상세_결제 | Local_PayList + Local_Summary |
| **장바구니형** | 상세_장바구니 | Local_CartList + Local_OptionList |

---

### 기본 구조

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar  (AppBar 제목: 현재 단계명)  (393×107)│
├───────────────────────────────────────────────────────┤
│ [선택] Local_Sheet  (상단 고정 요약 정보, 393×가변)       │
│   ← 선택한 상품 요약, 현재 가입 정보 등                    │
├───────────────────────────────────────────────────────┤
│ ↓ 폼 섹션 반복 구간 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│ Pagestack  (x=0, w=393)                               │
│   ContentsTitle → TitleSection  (섹션 제목)             │
│   ContentsSlot → Default 20/PagestackItem             │
│     TextField        ← 직접 입력                        │
│     ListText         ← 읽기 전용 확인 항목               │
│     ListSelected     ← 선택 항목 (라디오/체크)            │
│     CheckboxText     ← 동의 항목                        │
│     Callout          ← 안내·경고 메시지                  │
│     AccordionList    ← 약관 상세 내용                    │
│     Local_PayList    ← 결제 수단 선택                    │
│     Local_PaymentList ← 결제 수단 목록                  │
│     Local_CartList   ← 장바구니 아이템                   │
│     Local_OptionList ← 옵션 선택                        │
│     Local_Summary    ← 금액 요약                        │
│                                                       │
│ Divider  (393×4)  ← 섹션 구분                          │
│ Pagestack  (반복)                                      │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                ActionButton  (393×102, 하단 고정)       │
└───────────────────────────────────────────────────────┘
```

### 폼 섹션 내 콘텐츠 선택 기준

| 콘텐츠 | 사용 상황 |
|---|---|
| `TextField` | 이름, 연락처, 주소 등 사용자 입력 |
| `ListText` | 이미 확정된 정보 읽기 전용 표시 |
| `ListSelected` | 단일/복수 선택 (결제 수단, 배송 방법 등) |
| `CheckboxText` | 약관 동의, 마케팅 수신 동의 등 |
| `Callout` | 유의사항, 약관 요약, 안내 문구 |
| `AccordionList` | 약관 전문 (접이식 처리) |
| `Local_PayList` | 결제 수단 선택 UI |
| `Local_PaymentList` | 간편결제 로고 목록 |
| `Local_CartList` | 장바구니 상품 목록 + 수량 조절 |
| `Local_OptionList` | 색상·용량·수량 모듈형 선택 |
| `Local_Summary` | 주문 금액 최종 요약 |

### 복수 Pagestack 섹션 구성 원칙

```
섹션 1: 기본 정보 입력 (TextField 중심)
  Divider (393×4)
섹션 2: 선택 및 확인 (ListSelected / ListText)
  Divider (393×4)
섹션 3: 동의 (CheckboxText + Callout + AccordionList)
  Divider (393×4)
섹션 4: 최종 금액 요약 (Local_Summary)
```

**필수 구성요소**
- StatusBar + AppBar
- Pagestack × 1개 이상
- ActionButton (하단 고정)

**선택 구성요소**
- Local_Sheet (최상단 요약 정보, 선택한 상품 표시)

**주의사항**
- Pagestack 섹션 구분은 반드시 `Divider(393×4px)` 사용
- 단일 Pagestack에 너무 많은 폼 요소 혼재 금지 → 의미 단위로 섹션 분리
- CheckboxText + Callout 조합 시: Callout이 CheckboxText 위 또는 아래 배치
- Local_Summary는 항상 마지막 Pagestack 섹션에 배치

**Spacing Contract**
- 일반 form/detail body는 content rail 361px 또는 inner rail 329px를 section contract에 따라 사용한다.
- TextField input은 48px, field 간 gap은 12px를 기준으로 한다.
- form group title과 첫 field 간격은 8px, group 간 vertical rhythm은 24px를 기준으로 한다.
- Pagestack 섹션 간 구분은 `Divider(393×4px)`를 사용한다.
- 입력, 확인, 동의, 요약은 의미 단위로 분리하고 외부 margin으로 섹션 구분을 흉내내지 않는다.
- Bottom ActionButton은 393×102px fixed rail로 둔다.

---

<a name="section-complete"></a>
## 섹션 패턴 — 완료 (Completion)

### 언제 사용
트랜잭션 완료 후의 성공 상태 화면.  
개통·요금제 변경·결제·해지 등 **되돌릴 수 없는 액션의 결과**를 표시.

### 케이스 분류

| 케이스 | 예시 화면 | 화면 높이 | 특징 |
|---|---|---|---|
| **단순 완료형** | 완료_개통, 완료_요금제 변경, 완료_해지 | 852px (1뷰포트) | 성공 메시지 + 요약 카드 + 버튼 |
| **결제 완료형** | 완료_결제 | 2051px (롱폼) | 영수증 형태의 상세 내역 포함 |

---

### 케이스 A — 단순 완료형

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar  (AppBar: 닫기 또는 홈 버튼)  (393×107)│
├───────────────────────────────────────────────────────┤
│ Pagestack                                             │
│   ContentsTitle                                       │
│     TitleMain  ← 완료 메시지 (display 타이포, 대형)      │
│       예) "개통이 완료되었어요" / "해지 신청이 완료되었어요"  │
│   ContentsSlot → Card 0/PagestackItem                 │
│     Local_Contents 또는 ListText 요약                  │
│       ← 처리된 내역 요약 (요금제명, 적용일 등)             │
├───────────────────────────────────────────────────────┤
│ ActionButton  (393×102, "확인" 또는 "홈으로")           │
└───────────────────────────────────────────────────────┘
```

### 케이스 B — 결제 완료형 (롱폼)

```
┌──────────────────────── 393px ────────────────────────┐
│ StatusBar + AppBar                   (393×107)         │
├───────────────────────────────────────────────────────┤
│ Pagestack  (성공 헤딩)                                  │
│   TitleMain  ← "결제가 완료되었어요"                     │
│   Card 0/PagestackItem  ← 결제 금액 요약 카드            │
│ Divider  (393×4)                                      │
│ Pagestack  (주문 상품 정보)                              │
│   TitleSection + Default 20/PagestackItem             │
│     ListText × N  ← 상품명, 수량, 금액                   │
│ Divider  (393×4)                                      │
│ Pagestack  (결제 수단)                                  │
│   TitleSection + Default 20/PagestackItem             │
│     ListText × N  ← 결제 방법, 승인번호, 결제일           │
│ Divider  (393×4)                                      │
│ Pagestack  (배송/이용 정보, 추가 섹션 가변)               │
├───────────────────────────────────────────────────────┤
│ ActionButton  (393×102, "홈으로" 또는 "쇼핑 계속")       │
└───────────────────────────────────────────────────────┘
```

**완료 메시지 타이포그래피 원칙**
- 메인 완료 문구: `typography/display` (24px, 500) 또는 `typography/headline` (20px, 500)
- TitleMain 컴포넌트 사용 → `Type=Complete` 변형

**필수 구성요소**
- StatusBar + AppBar
- TitleMain (완료 메시지 헤딩)
- ActionButton

**선택 구성요소**

| 요소 | 추가 기준 |
|---|---|
| 요약 카드 (Card 0/PagestackItem) | 항상 포함 권장 (처리 결과 확인) |
| 추가 Pagestack 섹션 | 결제·주문 등 상세 내역이 있을 때 |
| Local_ButtonSection | 부가 액션이 필요할 때 (예: "이용내역 보기") |

**주의사항**
- AppBar에는 '닫기(X)' 또는 '홈' 버튼만 배치 — 뒤로가기 금지 (완료 후 재진입 방지)
- 단순 완료형은 1뷰포트(852px)로 제한 — 스크롤 없는 단일 화면 권장
- 성공 일러스트/아이콘이 필요하면 TitleMain의 Image 슬롯 활용

**Spacing Contract**
- 완료 TitleMain은 inner title rail을 사용하며, title/subtitle 간격은 `TitleMain` component-owned rhythm을 따른다.
- 완료 메시지 block의 좌우 기준은 20px inset을 사용한다.
- 완료 제목과 보조 문구의 vertical rhythm은 component-owned spacing을 우선하고, route-level margin으로 보정하지 않는다.
- 요약 카드는 `Card 0/PagestackItem` 또는 card-key-value-summary component가 padding/radius를 소유해야 한다.
- 결과 요약 카드 padding은 20px를 기준으로 하되, 선택된 component의 card contract가 있으면 component-owned 값을 우선한다.
- 단순 완료형은 Bottom ActionButton 393×102px를 포함해 1 viewport 안에 들어오는지 확인한다.

---

<a name="section-bottomsheet"></a>
## 섹션 패턴 — 바텀시트 (Bottom Sheet)

### 언제 사용
현재 화면 컨텍스트를 유지하면서 추가 선택·정보를 표시할 때.  
모달 수준의 중요도이지만 화면 전환 없이 처리 가능한 경우.

### 케이스 분류

| 케이스 | 내부 콘텐츠 | 특징 |
|---|---|---|
| **선택형 (기본)** | ListSelected 목록 | 단일/복수 선택 |
| **탭 선택형** | Tab + ListSelected | 탭별 선택 목록 |
| **상품 쇼케이스형** | CarouselProductModule | 상품 둘러보기 |
| **날짜/필터형** | ListSelected (날짜/옵션) | 기간·조건 선택 |
| **확인형** | ListText 요약 | 정보 확인 후 진행 |

---

### 기본 구조

```
┌──────────────────────── 393px ────────────────────────┐
│ [Dim 오버레이]  (393×852, gray-alpha-600)              │
│   ┌──────────────────────────────────────────────┐   │
│   │ Bottomsheet  (393×384~554)                   │   │
│   │                                              │   │
│   │  Handle  (393×32)  ← 드래그 핸들              │   │
│   │                                              │   │
│   │  TitleBottomSheet                           │   │
│   │    (x=32, w=329, h=68 기준)                │   │
│   │    ← 제목 텍스트 + [선택] 닫기 버튼             │   │
│   │                                              │   │
│   │  Con 슬롯  (콘텐츠 영역)                       │   │
│   │    기본 좌우 20px 또는 자식 component 정의       │   │
│   │    ← ListSelected × N                        │   │
│   │    ← 또는 Tab + ListSelected                 │   │
│   │    ← 또는 CarouselProductModule              │   │
│   │                                              │   │
│   │  ActionButton  (393×102 or 149)             │   │
│   └──────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

### 케이스별 Con 슬롯 구성

**케이스 A — 선택형 (가장 일반적)**
```
Con 슬롯
  ListSelected  (x=20, w=353, h=42~52)  ← 반복, 최대 8개 내외
  ListSelected  ...
  ListSelected  ...
```

**케이스 B — 탭 선택형**
```
Con 슬롯
  Tab  (393×47)  ← 상단 탭
  ListSelected × N  ← 탭별 콘텐츠 전환
```

**케이스 C — 상품 쇼케이스형**
```
Con 슬롯
  CarouselProductModule  (w=369, 가로 스크롤)
```

**케이스 D — 확인형**
```
Con 슬롯
  ListText × N  (x=20, w=353 또는 자식 정의 폭)  ← 선택/주문 내용 확인
  Divider (329×1px)  ← 항목 사이
```

**필수 구성요소**
- Dim 오버레이 프레임 (393×852, 배경 전체 커버)
- Bottomsheet 컴포넌트
- Handle (393×32)
- TitleBottomSheet

**선택 구성요소**

| 요소 | 추가 기준 |
|---|---|
| Tab | 선택 목록이 2가지 이상 카테고리로 나뉠 때 |
| ActionButton | 선택 확인이 명시적으로 필요할 때 |

**높이 산정 가이드**
```
Bottomsheet 최소 높이 = Handle(32) + Title(68 기준) + 콘텐츠 + ActionButton(102)

콘텐츠 높이 계산:
  ListSelected 1개 = 42px
  8개 선택 목록 = 42 × 8 = 336px
  → 최소 Bottomsheet ≈ 32 + 68 + 336 + 102 = 538px
```

**주의사항**
- Bottomsheet 높이는 화면 높이(852px)를 초과하지 않도록 설계
- Handle은 항상 최상단 32px
- TitleBottomSheet는 x=32 (바텀시트 내 양쪽 32px 마진 적용)
- Con 슬롯은 기본 x=20, w=353을 사용한다. 단, ActionButton이 있는 시트처럼 자식 component가 자체 padding을 정의하는 구조에서는 Con 슬롯 padding을 0으로 두고 자식의 contract를 따른다.
- 아이템이 많을 경우 Con 슬롯 내에서 스크롤 처리 (Bottomsheet 높이 고정)

**Spacing Contract**
- BottomSheet shell은 full bleed 393px를 기준으로 하단에 anchor된다.
- Handle area는 32px, Title area는 68px를 기준으로 한다.
- TitleBottomSheet는 좌우 32px inset으로 inner width 329px를 사용한다.
- 일반 Con 슬롯은 x=20, w=353을 기본으로 한다.
- ActionButton이 있는 BottomSheet의 Con 슬롯은 자식 component padding contract를 우선하며 중복 padding을 만들지 않는다.
- BottomSheet ActionButton은 102px를 기준으로 하고, 내부 변형은 component contract를 따른다.

---

<a name="section-popup"></a>
## 섹션 패턴 — 팝업 (Popup)

### 언제 사용
사용자의 의사결정이 반드시 필요한 **차단형(blocking) 모달**.  
확인/취소, 2가지 선택지, 경고·알림 등 간단한 인터랙션에 적합.  
바텀시트보다 콘텐츠 양이 적을 때 사용.

### 케이스 분류

| 케이스 | 내부 콘텐츠 | ActionButton 유형 |
|---|---|---|
| **단순 확인형** | 제목 + 본문 텍스트 | 1버튼 또는 2버튼 |
| **선택형** | 제목 + ListSelected | 2버튼 |
| **정보 확인형** | 제목 + TitleSection + ListText | 2버튼 |

---

### 기본 구조

```
┌──────────────────────── 393px ────────────────────────┐
│ [Dim 오버레이]  (393×852, gray-alpha-600)              │
│                                                       │
│        ┌────────────────────────────────┐             │
│        │ Popup  (x=16, w=361, h=220~288)│             │
│        │                                │             │
│        │  [padding 32px]                │             │
│        │  Title frame  (h=26)           │             │
│        │    ← 팝업 제목 텍스트            │             │
│        │                                │             │
│        │  SubText frame  (h=49~70)      │             │
│        │    ← 설명 본문 텍스트            │             │
│        │                                │             │
│        │  Contents 슬롯  (h=가변, 선택)  │             │
│        │    ← ListSelected              │             │
│        │    ← TitleSection + ListText   │             │
│        │                                │             │
│        │  PopupActionButton  (361×60)   │             │
│        │    ← Options=2Buttons          │             │
│        │    ← 또는 Options=1Button      │             │
│        └────────────────────────────────┘             │
└───────────────────────────────────────────────────────┘
```

### 케이스별 구성

**케이스 A — 단순 확인형** (가장 일반적)
```
Popup (361×220)
  Title  "정말 해지하시겠어요?"
  SubText  "해지 후에는 혜택이 종료됩니다."
  PopupActionButton  Options=2Buttons
    ← "취소" (secondary) + "해지" (primary, danger)
```

**케이스 B — 선택형**
```
Popup (361×288)
  Title  "배송지 선택"
  SubText  "배송받을 주소를 선택해 주세요."
  Contents 슬롯
    ListSelected × 3  ← 주소 목록
  PopupActionButton  Options=2Buttons
    ← "취소" + "선택 완료"
```

**케이스 C — 정보 확인형**
```
Popup (361×260)
  Title  "변경 내역 확인"
  SubText  "아래 내용으로 변경됩니다."
  Contents 슬롯
    TitleSection  ← 카테고리 제목
    ListText × 2~3  ← 변경 전/후 정보
  PopupActionButton  Options=2Buttons
    ← "취소" + "변경"
```

**PopupActionButton 버튼 구성**

| 유형 | 사용 상황 | 버튼 배치 |
|---|---|---|
| `Options=1Button` | 단순 알림·안내 (확인만) | 전체 너비 1개 |
| `Options=2Buttons` | 취소/확인 선택이 필요할 때 | 좌(취소) + 우(확인) |

**팝업 너비·여백 규격**
```
팝업 너비:     361px  (393 - 16×2 = 361, x=16)
내부 여백:     32px  (양쪽, 361 - 32×2 = 297px 내부 콘텐츠 너비)
PopupActionButton: 361×60  (팝업 전체 너비, 하단 배치)
```

**필수 구성요소**
- Dim 오버레이 프레임
- Popup 컴포넌트 (x=16, w=361)
- Title 텍스트
- PopupActionButton

**선택 구성요소**

| 요소 | 추가 기준 |
|---|---|
| SubText | 설명이 필요할 때 (없으면 Title만으로 충분) |
| Contents 슬롯 | 목록 선택·정보 확인이 필요할 때 |

**팝업 vs 바텀시트 사용 판단**

| 상황 | 권장 컴포넌트 |
|---|---|
| 5개 이하의 간단한 선택 + 확인/취소 | 팝업 |
| 6개 이상 선택 목록 또는 탭 분기 | 바텀시트 |
| 상품 탐색, 캐러셀 콘텐츠 | 바텀시트 |
| 차단형 경고, 동의 요청 | 팝업 |
| 필터/정렬 옵션 선택 | 바텀시트 |

**주의사항**
- 팝업은 반드시 x=16 수평 배치 (좌우 마진 16px)
- SubText 없이 Title + PopupActionButton만으로도 완성 가능
- Contents 슬롯 아이템이 4개를 초과하면 바텀시트로 전환 권장
- Dim 오버레이는 팝업 아래에 별도 프레임으로 반드시 포함

**Spacing Contract**
- Popup card는 361px width, x=16을 기준으로 한다.
- Popup text content는 297px width, card edge에서 좌우 32px inset을 기준으로 한다.
- title-body gap은 16px, content-button gap은 24px를 기준으로 한다.
- checkbox/list 내부 gap은 8px를 기준으로 한다.
- PopupActionButton은 361×60px로 popup 하단에 붙인다.

---
