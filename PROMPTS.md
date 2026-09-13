# PROMPTS — 다른 PC에서 동일 DAD TETRIS를 다시 만드는 법

이 폴더의 네 문서만 있으면 된다.

| 순서 | 파일 | 역할 |
|------|------|------|
| 1 | `PRD.md` | 무엇을 만드는지 (규칙·기능) |
| 2 | `ARCHITECTURE.md` | 어떻게 붙이는지 (파일·키·공식) |
| 3 | `UI.md` | 어디에 그리는지 (ID·그리드·색) |
| 4 | `PROMPTS.md` | 에이전트에게 시킬 말 (이 파일) |

이미지·MP3는 텍스트로 복원할 수 없다. **같은 파일명**의 1920×1080 JPG / MP3 플레이스홀더를 넣고, 나중에 교체한다 (`assets/README.md`).

---

## 사용 방법

1. 빈 폴더를 만든다.
2. 네 MD를 그대로 복사한다.
3. 아래 **마스터 프롬프트**를 코딩 에이전트 첫 메시지로 붙인다.
4. 검수 체크리스트를 통과할 때까지 페이즈 프롬프트를 이어서 넣는다.

원본 저장소가 있다면 코드 복사보다 **이 명세를 충족하는지 대조**하는 편이 안전하다. `js/*` 를 엔트리로 쓰지 말 것.

---

## 0. 마스터 프롬프트 (첫 메시지)

아래 블록을 그대로 붙여 넣는다.

```text
너는 DAD TETRIS를 처음부터 다시 구현하는 시니어 웹 엔지니어다.

입력 문서(이 워크스페이스):
- PRD.md
- ARCHITECTURE.md
- UI.md
- PROMPTS.md

목표: 문서에 적힌 제품과 100% 동일한 정적 웹게임.
기술: index.html + script.js + style.css + css/settings.css + sw.js + manifest.json
버전 문자열: 1.4.5-mobile 를 모든 진입점에 동일하게 쓴다.

절대 규칙:
1. js/*.js 를 index.html 에 로드하지 마라. 로직은 루트 script.js 한곳.
2. 최고점/전당 localStorage 키는 삭제·하향 금지 (ARCHITECTURE 보호 키).
3. custom_bg_window_* 와 custom_bg_board_* 를 섞어 쓰지 마라.
4. 모바일(max-width:768px) 보드는 20행만. 24/28은 PC 전용.
5. 모바일 하단 순서: 7버튼 패드(row3) 위, DAD 전광판(row4) 맨 아래.
6. 공장 배경 파일명은 assets/images/default_bg.jpg 와 level_1.jpg–level_10.jpg 만.
7. 오토플레이가 켜진 판은 명예의 전당에 넣지 마라.
8. 대기 카드는 보드 패널 정중앙 flex. 50%+translate 금지.
9. 전광판 PC 높이 160px 고정.
10. 문서에 없는 기능/탭/키를 창작하지 마라.

구현 순서:
A. 파일 골격과 DOM ID (UI.md 트리 그대로)
B. 엔진: 7-bag, SRS 표, 점수/중력 공식, 홀드/고스트
C. HUD 데스크톱 350px 사이드바
D. 모바일 100dvh 그리드 + 7버튼
E. 설정 4탭, IndexedDB 미디어, 이중 배경
F. DAD 스페셜, 타임스톱 K, 오토플레이
G. 12언어 i18n, 이벤트 영상 15MB 3슬롯
H. F9 진단 C1–C15 골격, PWA

각 단계가 끝나면 문서의 완료 정의/회귀 체크로 스스로 검증하고, 실패한 항목만 고쳐라.
지금 A부터 시작해라.
```

---

## 1. 페이즈 프롬프트

한 번에 전체가 실패하면 아래를 순서대로 보낸다. 앞 페이즈를 깨지 말라고 매번 못 박는다.

### A. 골격

```text
PRD/ARCHITECTURE/UI만 보고 정적 셸을 만들어라.
index.html 의 ID 트리를 UI.md 와 한 글자도 틀리지 않게.
canvas #bg-canvas #tetris-canvas 는 400×800.
style.css 에 :root 변수, neon-blue, 데스크톱 flex, 모바일 768 그리드를 넣어라.
script.js 는 아직 빈 루프여도 된다. 버전 1.4.5-mobile.
다른 파일/기능을 추가하지 마라.
```

### B. 엔진

```text
ARCHITECTURE의 SHAPES, JLSTZ_CW, I_CW, 점수/중력 공식을 그대로 코드로 옮겨라.
7-bag, 스폰 col=3 row=0, 소프트 +1, 하드 +2, 라인점수×레벨.
DAS 150 / ARR 33 / 홀드 H,C,Shift / Space 250ms 더블탭 일시정지.
기존 DOM ID와 CSS를 바꾸지 마라.
```

### C. 데스크톱 HUD

```text
UI.md 데스크톱: 사이드바 350px, 전광판 160px, 2×2 점수판,
NEXT/HOLD, 시작/종료, 오토플레이, DAD, AI 속도.
사이드바 시각 순서는 CSS order 표를 따른다.
#best-card 는 전당 모달을 연다.
모바일 쿼리는 건드리지 마라.
```

### D. 모바일

```text
max-width 768px 만 수정하라.
main.stage 4행: header / board+tower / 48px pad / cheer.
#mobile-controls 는 main 의 자식, grid-row 3.
#dad-cheer-banner 는 grid-row 4.
버튼 7개 ID·색은 UI.md 표.
폭 ≤768 에서 ROWS=20 강제.
PC 레이아웃·JS 규칙을 바꾸지 마라.
```

### E. 저장 · 배경

```text
IndexedDB DadTetrisDB / media_files.
창/보드 키 함수 bgStoreKey 를 ARCHITECTURE 그대로.
보호 점수 키는 remove/set 에서 거부.
keepDefaultWindowBg 는 창 대기만 고정.
번들 경로 default_bg.jpg, level_1–10.jpg.
설정 기본값은 SETTING_DEFAULTS 복사.
```

### F. DAD · AI

```text
dadSpecial OFF 기본. 지속 3/5/10초.
접지 카운트다운, K 타임스톱 턴당 1회, 오토플레이 중 비활성.
AI 토글 시 autoplayTouched → 랭킹 제외.
레벨 20 + 오토플레이 = 정복 오버레이.
기존 점수 공식 변경 금지.
```

### G. i18n · 영상

```text
언어 12: ko en hi zh-CN es ja fr de pt-BR ru vi id. 키 tetris_lang.
data-i18n 으로 DOM 갱신. 레이아웃은 항상 LTR.
영상 슬롯 goal1/goal2/gameover, 15MB, 슬롯별 삭제.
재생 중 duckBgm(0.1,0.3), 끝나면 restoreBgm(0.3).
```

### H. 진단 · PWA

```text
F9 → #diag-modal, C1–C15 러너를 ARCHITECTURE 표대로.
C1은 PC에서 전광판 160px을 검사한다. 모바일에선 높이 검사를 건너뛴다.
C6은 모바일 20행·100dvh·패드가 전광판보다 위인지 본다.
sw.js 캐시명 dad-tetris-v1.4.5-mobile. localhost는 SW 미등록.
```

---

## 2. 수정용 가드 프롬프트

이미 동작하는 빌드에 손댈 때:

```text
다른 체계에는 영향을 주지 마라.
이번 요청의 파일/미디어 쿼리/함수만 변경한다.
점수 키, 창/보드 키, 모바일 20행, 패드↔전광판 순서, 버전 문자열을
요청에 없으면 건드리지 마라.
js/* 를 살리지 마라.
```

모바일 하단만 고칠 때:

```text
max-width: 768px 블록만 수정한다.
min-width: 769px 과 게임 로직, i18n, 저장은 금지.
#mobile-controls 와 #dad-cheer-banner 의 grid-row 만 다룬다.
```

---

## 3. 검수 프롬프트

구현이 끝났다고 하면 이것을 돌린다.

```text
PRD.md 14장 체크리스트와 UI.md 12장 회귀를 항목마다
코드 근거(파일+심볼)로 통과/실패를 표로 보고하라.
실패만 고치고, 통과 항목의 코드를 리팩터하지 마라.
브라우저가 있으면 390×844 와 1280×800 에서
패드/전광판 top 좌표와 전광판 높이를 실측하라.
```

기대 실측 (390×844 근처):

- `pad.bottom <= cheer.top + 2`
- `cheer` 가 게임 UI 중 가장 아래
- 헤더·보드·타워가 그 위에 남음

기대 실측 (1280×800):

- cheer height ≈ 160
- pad display none
- sidebar width ≈ 350

---

## 4. 에이전트가 자주 실수하는 것

| 실수 | 올바른 것 |
|------|-----------|
| Java Swing으로 시작 | 정적 웹앱 |
| `js/gameEngine.js` 를 로드 | 루트 `script.js` 만 |
| 전광판을 패드 위에 둠 (모바일) | 패드 row3, 전광판 row4 |
| 배경 한 장만 둠 | 창/보드 이중 키 |
| reset이 `localStorage.clear()` | 보호 키 제외 |
| 번들 `bg-default.png` | `default_bg.jpg` |
| 모바일 24행 | 20만 |
| 오버레이를 `position:absolute; left:50%; transform` | 보드 flex 중앙 |
| 전광판에 `transform` 으로 위치 이동 | grid-row 만. 애니와 충돌 |
| 오토플레이 점수 저장 | 저장 금지 |
| 언어 10개만 (옛 PRD) | 12개 (ARCHITECTURE) |

---

## 5. 에셋 프롬프트

```text
assets/images/default_bg.jpg 와 level_1.jpg–level_10.jpg 를
1920×1080 JPEG 플레이스홀더로 만들어라. 글자를 넣지 마라.
레벨마다 색/구도가 구분되게.
assets/audio/bgm_default.mp3 는 짧은 무음/루프 가능 MP3.
assets/README.md 의 교체 표를 지켜라.
게임 로직은 변경하지 마라.
```

---

## 6. 산출물 최소 목록

에이전트 작업 끝에 이 파일이 있어야 한다.

```
index.html
script.js
style.css
css/settings.css
sw.js
manifest.json
404.html
assets/images/default_bg.jpg
assets/images/level_1.jpg … level_10.jpg
assets/audio/bgm_default.mp3
icons/icon.svg
```

선택: `icons/icon-192.png`, `icons/icon-512.png`, `data/leaderboard.json`.

열기: 로컬 정적 서버로 `index.html`. 파일 프로토콜보다 http를 권장.

---

## 7. 한 줄 재시작

문서가 있고 대화가 끊겼을 때:

```text
이 폴더의 PRD.md, ARCHITECTURE.md, UI.md, PROMPTS.md 를 읽고
마스터 프롬프트의 절대 규칙 10개를 지키며 DAD TETRIS를 이어서 구현해라.
이미 있는 파일이 명세와 다르면 명세를 이긴다. js/* 는 무시한다.
```
