# UI — DAD TETRIS

픽셀·ID·반응형 재현 명세. 스타일 원본은 `style.css` + `css/settings.css`.

---

## 1. 시각 언어

- 기본 테마 `html[data-theme="neon-blue"]`
- 바탕 `#05070c`, 글자 `#f3fbff`, 보조 `#8ec8d8`
- 네온 `#00d2ff`, 글로우 `rgba(0,210,255,0.55)`
- 카드 `rgba(10,16,28,0.92)`, 보더 `rgba(0,210,255,0.38)`
- 폰트: `"Malgun Gothic", "Segoe UI", "Noto Sans", sans-serif`
- 진단 모노: `Consolas, "Cascadia Mono", monospace`
- 메타 theme-color `#00d2ff`

`:root` 변수 (반드시 둘 것):

```
--theme-primary --theme-secondary --theme-glow --theme-accent
--bg --well --card --ink --muted --neon --border --shadow
--board-aspect: 10 / 20
--mobile-pad-h --mobile-hud-h
--board-bg-blur --board-bg-opacity --window-bg-blur --window-bg-opacity
--page-bg  (이중 라디얼 + 세로 그라데이션)
```

테마 5종 전부 `html[data-theme="…"]` 오버라이드:

| ID | primary 계열 |
|----|----------------|
| neon-blue | `#00d2ff` |
| cyber-pink | `#ff4fa3` |
| emerald-green | 에메랄드 그린 |
| sunset-orange | 오렌지 |
| future-cyber | 사이버 민트/퍼플 |

---

## 2. DOM 골격 (ID 고정)

다른 구현체가 진단 C6/C7을 통과하려면 **아래 ID를 그대로** 쓴다.

```
body
├ #autoplay-badge
├ #goal-toast > #goal-toast-text
├ #scene-bg
│   ├ #scene-bg-image
│   ├ #scene-bg-image-next
│   ├ #scene-bg-dim
│   └ #scene-bg-extreme
├ #game-container.app.game-container
│   └ main.stage.game-layout
│       ├ #board-wrap
│       │   ├ #board-bg / #board-bg-image / #board-bg-image-next
│       │   ├ #tetris-board-wrapper
│       │       ├ #bg-canvas (400×800)
│       │       └ #tetris-canvas (400×800)
│       │   ├ #overlay.is-start  (data-pause-dbltap="1")
│       │       ├ #idle-overlay [hidden]
│       │       ├ #start-prompt-overlay [hidden]
│       │       └ #profile-card > #start-overlay
│       │           ├ #profile-frame
│       │               ├ #profile-main-canvas
│       │               ├ #profile-image
│       │               └ #profile-fallback  (헤드셋 실루엣 SVG)
│       │           ├ #profile-nickname
│       │           ├ #overlay-hint
│       │           └ #overlay-actions (#overlay-restart, #overlay-quit)
│       │   ├ #clear-banner
│       │   └ #dad-countdown-overlay
│       │       ├ #dad-countdown-label
│       │       └ #dad-countdown-num
│       ├ aside.sidebar
│       │   ├ #game-header
│       │       ├ #sidebar-profile-frame
│       │       └ #header-mini-menu
│       │           ├ #settings-open
│       │           ├ #btn-guide
│       │           └ #btn-diagnostics
│       │   ├ #mobile-right-tower
│       │       ├ #stats-panel > #block-guide-row
│       │           ├ #next-card > canvas#next
│       │           └ #hold-card > #btn-toggle-guide-mode + canvas#hold
│       │       ├ #stats-bar-row
│       │           ├ #score / #level / #lines
│       │           └ #best-card > #best
│       │       └ #mobile-game-controls
│       │           ├ #game-start  #game-end
│       │           ├ #autoplay-toggle
│       │           └ #dad-special-toggle  #autoplay-speed
│       │   ├ #hud-control-grid > #mobile-pad-toggle
│       │   └ .sidebar-dock
│       │       ├ #dad-cheer-banner
│       │           ├ #dad-cheer-badge
│       │           ├ #dad-cheer-text
│       │           └ #dad-cheer-tip
│       │       └ #controls-guide
│       └ #mobile-controls          ← main의 자식 (aside 밖)
│           ├ #btn-left #btn-down #btn-right
│           └ #btn-rotate #btn-drop #btn-hold #btn-timestop
├ #guide-modal
├ #settings-modal
├ #celebrate-modal
├ #score-save-modal
├ #autoplay-end-modal
├ #hall-modal > #hall-of-fame-modal
├ #diag-modal
├ #pwa-guide-modal
├ #ingame-confirm-modal
└ #shutdown-screen
```

`#overlay-title` 은 HTML에 없을 수 있다. JS가 없으면 생성한다.

`#mobile-controls` 초기 클래스: `mobile-controls mobile-dpad hidden`.  
폭 ≤768px CSS는 `display: flex !important` 로 켠다.

---

## 3. 데스크톱 (≥769px)

### 3.1 뼈대

- `#game-container`: 가로 flex, 중앙, `max-width: 1080px`, gap 16–20px
- `main.stage`: 가로 flex. 왼쪽 보드, 오른쪽 사이드바
- `#board-wrap`: `aspect-ratio: 10/20`, 뷰포트 높이에 맞춤
- `aside.sidebar`: **350px** (`flex: 0 0 350px`, min 330px), 세로 flex

### 3.2 사이드바 시각 순서 (CSS order)

`#mobile-right-tower` 과 `#mobile-game-controls` 는 `display: contents` 여서 자식이 사이드바 flex에 직접 참여한다.

| order | 블록 | 크기 힌트 |
|-------|------|-----------|
| 0 | `#game-header` | 타이틀 + 미니메뉴. 아바타 약 42px |
| 1 | NEXT + HOLD | 높이 약 168px, 캔버스 132×132 (HTML은 240×240) |
| 2 | 시작 / 종료 | 2열, 높이 42px |
| 3 | `#hud-control-grid` | 가이드·진단 자리 + 모바일 패드 토글 |
| 4 | `#stats-bar-row` 2×2 | 높이 약 118px |
| 5 | 자동 플레이 | 전폭 36px |
| 6 | DAD 스페셜 + AI 속도 | 1fr / 1.6fr |
| 7 | `.sidebar-dock` | 전광판 **160×160 고정** + 조작법 카드 |

전광판:

```
#dad-cheer-banner
  height/min/max: 160px
  flex: 0 0 160px
  세로 스택: badge / text / tip
```

조작법 `#controls-guide` 는 PC에서만 보인다.

### 3.3 2×2 점수판

```
SCORE #score    LEVEL #level
LINES #lines    BEST  #best   ← #best-card 클릭 = 전당
```

그리드 `1fr 1fr`, 라벨 작고 값은 네온.

### 3.4 오버레이 (보드 위)

`#overlay` 가 `#board-wrap` 을 덮는다. **화면 전체가 아니라 보드 기하 중심**에 카드를 둔다 (50%+translate 금지, flex 중앙).

| 클래스 | 용도 |
|--------|------|
| `is-start` | 대기. 프로필 + 힌트. 타이틀 숨김 |
| `is-pause` | 일시정지. 같은 카드 계열 |
| `is-result` | 게임오버. 블러 강화, 재시작/종료 |
| `is-conquer` | Lv20. 골드 보더 |

대기 힌트: 캡슐 버튼 「게임 시작을 눌러 주세요」 (`#overlay-hint`).

프로필 원: 최대 약 300px, 4px 네온 보더, 헤드셋 폴백 SVG.

---

## 4. 스마트폰 (≤768px)

### 4.1 셸

```
html, body { height: 100dvh; overflow: hidden; }
#game-container { width: 100%; max-width: 480px; height: 100dvh; padding: 4px 6px 0; }
--mobile-header-h: 48px
--mobile-pad-h: 48px
```

`aside.sidebar`, `.sidebar-dock` → `display: contents`  
그래서 헤더·보드·타워·패드·전광판이 `main.stage` 그리드 아이템이 된다.

### 4.2 그리드 (현재 확정)

```
main.stage
  columns: minmax(0, min(65%, calc(100% - 110px)))  minmax(105px, 1fr)
  rows:    auto   calc(100dvh - 190px)   48px   minmax(34px, 1fr)
```

| row | col | 요소 |
|-----|-----|------|
| 1 | 1 / -1 | `#game-header` |
| 2 | 1 | `#board-wrap` 10×20 |
| 2 | 2 | `#mobile-right-tower` |
| **3** | **1 / -1** | **`#mobile-controls` 높이 48px** |
| **4** | **1 / -1** | **`#dad-cheer-banner` 맨 아래** |

**손 조작이 너무 아래에 있으면 안 된다.** 패드가 전광판보다 위다.  
전광판이 패드 위에 오면 오구현이다.

전광판 모바일: 가로 flex, 뱃지+한 줄 텍스트. `#dad-cheer-tip` 숨김.  
하단 safe-area 패딩은 전광판이 받는다. 패드는 `padding: 0 2px`.

### 4.3 헤더

- 사이드바 아바타 숨김
- 타이틀 13px 중앙 시안
- `#header-mini-menu` 3등분: 설정 / 가이드 / 진단. 높이 22px

### 4.4 오른쪽 타워 순서 (flex order)

1. 시작·종료 (24px)
2. NEXT·HOLD (카드 52px, 캔버스 36×36)
3. 2×2 점수판 (셀 24px)
4. 자동 플레이
5. AI 속도 슬라이더 + DAD 스페셜

숨김: `#hud-control-grid`, `#controls-guide`

### 4.5 7버튼 색

| 버튼 | 그라데이션 | 보더 | 글자 |
|------|------------|------|------|
| ◀▼▶ | cyan-blue | `#00f0ff` | `#00f0ff` |
| 🔄 | purple | `#c084fc` | `#f3e8ff` |
| ⚡ | gold | `#facc15` | `#fef08a` |
| 📦 | orange | `#fb923c` | `#ffedd5` |
| ⏳ | sky | `#67e8f9` | `#ecfeff` |

버튼 높이 44px, 활성 시 `scale(0.92)`.  
`.mobile-pad-move` / `.mobile-pad-action` 은 모바일에서 `display: contents` 로 7칸이 한 줄.

### 4.6 폴더블 (520–900px 폭, 높이 ≤1000)

- 패드 전폭, 좌우 분할
- 이동키 `margin-left: 112px`
- 액션키 `margin-left: auto`
- 버튼 56×46

---

## 5. 모바일 패드 (PC에서 토글)

`body.is-mobile-pad` 일 때 `#mobile-controls` 는 `position: fixed; bottom: 0` 기본 스타일을 가진다.  
≤768 쿼리가 이를 그리드 인플로우로 덮는다.

PC에서 `#mobile-pad-toggle` / 설정 `mobilePad` 로 켠다.  
값 `"auto"`: 모바일 뷰포트면 자동 ON.

---

## 6. 설정 모달 `#settings-modal`

탭 버튼 `data-tab`: `game` | `levelbg` | `videos` | `scores`  
패널 `data-tab-panel` 동일.

**게임 탭 주요 컨트롤**

- 테마 스와치 `data-theme`
- `#select-block-skin`
- 고스트 토글 + `#ghost-strength`
- 셰이크 + `#shake-strength`
- 창 딤/블러 `#bg-dim` `#bg-blur`
- 프로필 업로드·크롭
- SFX/BGM 토글·볼륨, BGM 파일
- DAD 스페셜, 햅틱
- `#select-language` 12개
- `#start-level`
- `#select-board-size` 20/24/28 (24·28 클래스 `board-size-pc-only`)
- 쓰레기 줄, 미리보기 모드, 낙하 배율
- `#handling-settings` DAS/ARR/소프트드롭
- DAD 지속 3/5/10
- `#mobile-pad-setting`
- 닉네임, 자동기록
- 푸터 `#settings-reset` `#settings-save`

**배경 탭:** 마스터 끄기, 일괄 업로드, 개인/공통, 창/보드 타깃, 블러·투명도, Lv1–20 `#level-bg-list`.

**영상 탭:** `videosEnabled`, 슬롯 `data-video="goal1|goal2|gameover"`, 점수 입력, 파일/URL, 미리보기, **슬롯별 삭제**.

**스코어 탭:** `#open-hall-from-settings`.

---

## 7. 가이드 `#guide-modal`

탭 `data-guide-tab`:

| 값 | 라벨 |
|----|------|
| controls | 아케이드 코어 |
| dad | DAD 시그니처 |
| media | 미디어·배경 |
| skins | 비주얼·오디오 |
| lang | 자가진단 |

푸터 `#guide-close` `#guide-start`.  
첫 방문(`dadTetrisHelpSeen` 없음) 시 가이드를 띄울 수 있다.

---

## 8. 기타 모달

| ID | 역할 |
|----|------|
| `#celebrate-modal` | 목표/종료 영상. `#celebrate-video` `#celebrate-frame` `#celebrate-fallback` |
| `#score-save-modal` | 게임오버 이름 저장 |
| `#autoplay-end-modal` | AI 종료 요약 (전당 없음) |
| `#hall-modal` | 국내/글로벌 탭 `#hall-list` `#hall-reset` |
| `#diag-modal` | F9 로그 |
| `#pwa-guide-modal` | 홈 화면 추가 안내 |
| `#ingame-confirm-modal` | 위험 확인 |
| `#shutdown-screen` | 앱 종료 |

영상 스테이지 16:9, min-height 220px.

---

## 9. 전광판 상태 클래스

```
.dad-cheer-banner.is-bounce     짧은 바운스
.dad-cheer-banner.is-tetris     골드 보더 + 펄스
.dad-cheer-banner.is-level      시안 보더
```

PC 160px 세로 스택 / 모바일 가로 한 줄.  
애니메이션은 `transform` 을 쓰므로 배너에 레이아웃용 `transform` 을 걸지 말 것.

---

## 10. 포인터 · 레이어

일부 배경/캔버스는 `pointer-events: none`.  
버튼·사이드바·모달은 `pointer-events: auto`.  
보드 오버레이는 기본적으로 none, `is-pause|is-result|is-conquer` 일 때 auto.

종료 상태 `body.is-game-terminated` 는 `.app`, `.scene-bg`, `.modal`, `#mobile-controls` 를 숨긴다.

---

## 11. 카피 톤

한국어 기본. 짧고 직접적. 예:

- 대기: 「게임 시작을 눌러 주세요」
- 전광판 기본: 「아빠의 멋진 플레이를 응원합니다!」
- 시작 버튼: 「▶ 게임 시작」
- 종료: 「■ 게임 종료」
- 자동: 「🤖 자동 플레이」
- 스페셜: 「👑 DAD 스페셜」

12언어는 `script.js` `I18N` 키를 그대로 옮긴다. 키를 새로 만들지 말고 `data-i18n` 기존 키를 쓴다.

---

## 12. 레이아웃 회귀 체크

**PC 1280×800**

- 사이드바 350px, 전광판 높이 160±12
- 패드 `display: none` (토글 OFF)
- 보드와 사이드바 가로 배치
- 대기 카드가 보드 정중앙

**폰 390×844**

- 컨테이너 max 480
- 패드 top < 전광판 top
- 전광판이 뷰포트에서 가장 아래 게임 UI
- 타워가 보드 오른쪽
- 헤더 3버튼 보임
- 스크롤 없음 (`overflow: hidden`)
