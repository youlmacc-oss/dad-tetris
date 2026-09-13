# PRD — DAD TETRIS (웹 재현 명세)

**제품명:** DAD TETRIS / Dad Tetris  
**대상:** 50대 아버지와 가족. 큰 글씨, 선명한 블록, 한 화면 조작.  
**현재 기준 버전:** `1.4.4-allpass`  
**기술 스택 (실제 제품):** 정적 웹앱. Java가 아님.  
`index.html` + `script.js` + `style.css` + `css/settings.css` + `sw.js` + `manifest.json`  
`js/*` 모듈은 저장소에 있으나 **index.html이 로드하지 않는다.** 라이브 로직은 루트 `script.js` 한 파일이다.

이 문서와 `ARCHITECTURE.md`, `UI.md`, `PROMPTS.md`만으로 다른 PC에서 **동일 규칙·동일 ID·동일 저장키·동일 레이아웃**의 게임을 다시 만든다.

**충실도 한계 (정직히):** JPG/MP3 바이트, 12언어 전체 문장(~수백 키×12), 스킨 픽셀 그라데이션, F9 러너 한 줄까지는 텍스트로 복원할 수 없다. 그 부분은 `ARCHITECTURE.md` §16의 부록·폴백 규칙을 따르면 **플레이·저장·레이아웃이 같은 제품**이 된다. 픽셀 클론이 필요하면 원본 `style.css`/`script.js`의 I18N 블록을 추가로 복사한다.

---

## 1. 한 줄 정의

클래식 테트리스에 아빠용 대형 HUD, DAD 스페셜(락 카운트다운·타임스톱), 자동 플레이 AI, 레벨별 이중 배경(창/보드), 이벤트 영상, 12개 언어, PWA, F9 자가진단을 붙인 아케이드 웹게임.

## 2. 제품 원칙 (절대 깨지 말 것)

1. **시니어 가독성:** 점수·NEXT·버튼은 크고 대비가 분명해야 한다.
2. **손맛:** 고스트, 라인 클리어 파티클, 화면 셰이크, 하드드롭 충격파, 전광판 응원.
3. **기록 보호:** 최고점·명예의 전당 키는 설정 초기화·진단·배경 교체로 **절대 지우거나 낮추지 않는다.**
4. **창 배경 ≠ 보드 배경:** `custom_bg_window_*` 와 `custom_bg_board_*` 는 완전히 분리한다.
5. **모바일 20행 고정:** 폭 ≤768px 에서는 보드 높이 24/28을 제공하지 않는다.
6. **자동 플레이 기록 제외:** AI가 한 번이라도 켜지면 그 판은 명예의 전당에 넣지 않는다.
7. **한 화면:** 모바일은 `100dvh`, 스크롤 없음.
8. **모바일 하단 순서 고정:** 보드 아래 **전광판**, 그 아래 **7버튼 패드(맨 하단)**. 이 순서를 바꾸지 않는다.

---

## 3. 핵심 게임플레이

### 3.1 보드

| 항목 | 값 |
|------|-----|
| 가로 | `COLS = 10` 고정 |
| 세로 기본 | `BOARD_ROWS_DEFAULT = 20` |
| PC 옵션 | `20 / 24 / 28` (`board_rows_count`) |
| 모바일 | 항상 20. 셀렉트 24·28은 hidden/disabled |
| 캔버스 논리 크기 | `#bg-canvas`, `#tetris-canvas` = 400×800 |
| 종횡비 | `10 / 20` (`--board-aspect`) |

### 3.2 블록

- 7종: `I J L O S T Z`. 7-bag 랜덤.
- 스폰: `{ type, rot: 0, col: 3, row: 0 }`
- 색:

| 타입 | 색 |
|------|-----|
| I | `#00E8E8` |
| J | `#3B82FF` |
| L | `#FF8A00` |
| O | `#FFD400` |
| S | `#3DDC64` |
| T | `#C44DFF` |
| Z | `#FF3B3B` |
| G (쓰레기) | `#7A889C` |

- 회전: SRS 킥. `JLSTZ_CW`, `I_CW`. O는 `[[0,0]]` 만.
- 스킨 5종: `gemstone` (기본), `glass`, `wire_glass`, `mecha`, `candy`. 키 `block_skin_style`.
- 모양 행렬과 킥 테이블은 `ARCHITECTURE.md` 에 원문 수록.

### 3.3 조작 (PC)

| 입력 | 동작 |
|------|------|
| ← / → | 이동. DAS 후 ARR 반복 |
| ↑ | 시계 회전 (`tryRotate(+1)`) |
| Z | 반시계 회전 (`tryRotate(-1)`) |
| ↓ | 소프트 드롭. 칸당 +1점 |
| Space 1회 | 하드 드롭. 떨어진 행당 +2점 |
| Space 250ms 이내 2회 | 일시정지 |
| H / C / Shift | 홀드. 조각당 1회 |
| P | 일시정지 |
| Enter | 대기·종료 시 시작, 플레이 중엔 재시작 경로 |
| K | DAD 타임스톱 (스페셜 ON, 오토플레이 아님, 턴당 1회) |
| F9 | 자가진단 모달 + 비주얼 오토테스트 |
| Esc | 열린 모달 닫기 |

홀드 키 판정: `KeyH`, `KeyC`, `ShiftLeft`, `ShiftRight`.

### 3.4 조작 (모바일 7버튼)

| ID | 표시 | 동작 |
|----|------|------|
| `#btn-left` | ◀ | 좌 |
| `#btn-down` | ▼ | 소프트 드롭 |
| `#btn-right` | ▶ | 우 |
| `#btn-rotate` | 🔄 | 회전 |
| `#btn-drop` | ⚡ | 하드 드롭 |
| `#btn-hold` | 📦 | 홀드 |
| `#btn-timestop` | ⏳ | 타임스톱 (DAD 스페셜 ON일 때) |

더블 탭 오버레이 = 일시정지 토글. 대기 카드 탭 = 시작.

### 3.5 핸들링 기본값

| 항목 | 기본 | 범위 | 저장 키 |
|------|------|------|---------|
| DAS | 150ms | 100–300 | `dad_tetris_das` |
| ARR | 33ms | 15–80 (루프 바닥 8) | `dad_tetris_arr` |
| 소프트드롭 배율 | 10 | 1–20 | `dad_tetris_softdrop` |
| 낙하 배율 | 1.0 | 0.5–3.0 | `drop_speed_multiplier` |

### 3.6 중력

- 기준 `BASE_GRAVITY_MS = 800`
- Lv1–10: `800 - (lv-1)*70`, 하한 100ms
- Lv11–20: `170 - (lv-10)*15.4`, 하한 16ms
- 실간격: `max(16, levelBaseGravityMs() / dropSpeedMultiplier())`
- 고레벨은 한 프레임에 여러 칸(`gravityFallSteps`). Lv20은 보드 높이만큼.

### 3.7 점수 · 레벨

라인 점수 `LINE_SCORES = [0, 100, 300, 500, 800]`  
획득 = 해당 값 × **클리어 시점 레벨**.

| 줄 | 기본(Lv1) |
|----|-----------|
| 1 | 100 |
| 2 | 300 |
| 3 | 500 |
| 4 테트리스 | 800 |

- 레벨: `startLevel + floor(lines / 10)`, 최대 20.
- 시작 레벨 설정 1–20, 기본 1.
- 콤보: 연속 클리어마다 `lineCombo++`. 0줄 착지 시 0.
- 테트리스: 4줄. 배너 `🔥 TETRIS! 🔥`, 골드 전광판.
- T-스핀: T + 직전 행동이 회전 + 네 모서리 중 3칸 이상 채워짐.

### 3.8 홀드 · 고스트 · 미리보기

- 홀드 슬롯 1개. 스폰 시 `canHold` 리셋.
- **듀얼 큐 모드**(`preview_guide_mode = "dual"`)에서는 홀드 비활성. NEXT1 + NEXT2 표시.
- 표준 모드: NEXT 1개 + HOLD.
- 고스트 기본 ON, 농도 40%.

### 3.9 시작 쓰레기 줄

`start_garbage_lines` 기본 0, 범위 0–10. 구멍 있는 치즈 행.

### 3.10 시작 / 일시정지 / 종료

- 부트: `waitingStart = true`. 보드 중앙 프로필 카드 + “게임 시작을 눌러 주세요”.
- 시작: 카드 탭, `#game-start`, Enter/Space(대기 시).
- 플레이 중 `#game-start` = 일시정지 토글.
- `#game-end`: 플레이 중이면 수동 종료(+ 게임오버 영상), 종료 후면 앱 종료 화면.
- 스폰 불가 = 게임 오버.

### 3.11 레벨 20 정복

수동 플레이는 계속할 수 있다. **오토플레이가 Lv20에 도달하면** 정복 오버레이·팡파르. 그 점수는 홀 오브 페임 불가.

---

## 4. DAD 스페셜

- 설정 `dadSpecial` 기본 **OFF**. 지속 3 / 5 / 10초 (`dadSpecialDuration`, 기본 3).
- 오토플레이 중에는 동작하지 않는다.
- ON이면 바닥에 닿은 조각은 즉시 락이 아니라 **카운트다운** 후 락.
- 카운트다운·타임스톱 중: 벽 관통(`canDadPenetrate`), `DAD_SUPER_KICKS`, 스마트 스냅.
- K 또는 `#btn-timestop`: 턴당 1회 시간 정지. BGM `playbackRate 0.55`, 로우패스 420Hz. 다시 누르면 조기 종료.
- 재개 후 `DAD_RESUME_MS = 480` 동안 카운트다운 재시작 대기.
- 보드 위 `#dad-countdown-overlay` 에 남은 초 표시.

---

## 5. 자동 플레이 AI

- HUD `#autoplay-toggle`. 속도 0.5–20, 기본 1.0, 0.5 단위. `#autoplay-speed`.
- 우물 쌓기 휴리스틱(`findBestMove`). 모드 buildup / survive.
- 속도 ≥8 또는 레벨 ≥11 이면 즉시 드롭 스타일.
- 켜는 순간 `autoplayTouched = true` → 해당 판 랭킹 불가.
- 상단 `#autoplay-badge` 표시.

---

## 6. 응원 전광판 · 연출

- `#dad-cheer-banner`: 뱃지 / 본문 / 팁.
- PC: 사이드바 **160px 높이 고정**.
- 모바일: 가로 슬림 바. **보드·타워와 7버튼 패드 사이.** 패드가 화면 맨 하단이다.
- 콤보·테트리스·위기 탈출·T-스핀 시 문구 + 바운스/골드 펄스.
- 1–3줄: 네온 파티클 + 약한 진동.
- 테트리스 / T-스핀 / 3콤보+: 0.15초 플래시 + 셰이크 + 줌.
- 하드드롭: 하단 충격파.
- `#goal-toast`: 점수 목표·정복 토스트.

---

## 7. 미디어 · 배경

### 7.1 공장 번들 (파일명 고정)

```
assets/images/default_bg.jpg
assets/images/level_1.jpg … level_10.jpg
assets/audio/bgm_default.mp3
```

- `BUNDLED_LEVEL_BG_MAX = 10`
- `LEVEL_BG_MAX = 20` — 11–20은 파일 없으면 level_10 상속.

### 7.2 이중 타깃

| 타깃 | 의미 | 키 prefix |
|------|------|-----------|
| window | 전체 창 `#scene-bg` | `custom_bg_window_*` |
| board | 게임 패널 `#board-bg` | `custom_bg_board_*` |

공통 스코프: `common_bg_window_*`, `common_bg_board_*`.

상속: 레벨 커스텀 → 대기 커스텀 → 공통 레벨 → 공통 대기 → 번들 JPG.

`keepDefaultWindowBg`: **창 대기 배경만** 레벨업 시 고정. 보드는 계속 레벨 페인트를 탄다.

### 7.3 이벤트 영상 (슬롯 3)

| 슬롯 | 기본 트리거 | IndexedDB 키 |
|------|-------------|--------------|
| goal1 | 점수 5000 | `event_video_goal1` |
| goal2 | 점수 10000 | `event_video_goal2` |
| gameover | 수동 종료/게임오버 | `event_video_gameover` |

- 업로드 상한 **15MB**.
- 슬롯별 삭제 버튼 필수.
- 재생 중 BGM `duckBgm(0.1, 0.3)` → 종료 후 `restoreBgm(0.3)`.
- `#celebrate-modal` + `#celebrate-video` / `#celebrate-frame`.

---

## 8. 프로필 · 닉네임

- 대기 카드 원형 아바타. 기본 닉네임 **「시스템」**.
- 크롭 캔버스 320, 표시 120. 줌 50–300%.
- IndexedDB: `profile`, `profileCrop`, `profileSnap`.
- 닉네임 키: `dad_tetris_player_name`, 레거시 `dadTetrisLastName`.

---

## 9. 명예의 전당

- `#best-card` 클릭 또는 설정 스코어 탭.
- 국내 / 글로벌 탭. 표시 10, 저장 상한 50, 점수 캡 9,999,999.
- 오토플레이 판 제외.
- 보호 키 목록은 `ARCHITECTURE.md`.

---

## 10. 설정 탭

1. **게임** — 테마 5, 스킨, 고스트, 셰이크, 사운드/BGM, 언어, 시작 레벨, 보드 높이, 쓰레기 줄, 미리보기 모드, DAS/ARR, DAD, 모바일 패드, 닉네임, 공장 초기화(점수 제외).
2. **배경** — 창/보드, 개인/공통, 블러·투명도, keep-default, 일괄 업로드, Lv1–20 슬롯.
3. **이벤트 동영상** — 3슬롯, 점수, 파일/URL, 미리보기, 삭제, 마스터 토글.
4. **스코어** — 전당 열기.

테마 ID: `neon-blue`(기본), `cyber-pink`, `emerald-green`, `sunset-orange`, `future-cyber`.  
언어 12: `ko, en, hi, zh-CN, es, ja, fr, de, pt-BR, ru, vi, id`. 기본 `ko`. 키 `tetris_lang`.

---

## 11. 자가진단

- F9 또는 `#btn-diagnostics`.
- 코어 C1–C15 + 확장 1–19. 통과 시 ALL GREEN.
- 진단은 설정을 스냅샷했다가 복구. **점수/전당 키는 보호.**
- 상세는 `ARCHITECTURE.md` §진단.

---

## 12. PWA

- `manifest.json`: standalone, portrait, theme `#00d2ff`.
- `sw.js` 캐시명 `dad-tetris-v1.4.4-allpass`.
- localhost 에서는 서비스워커 등록 해제.
- 앱셸 HTML/CSS/JS 는 네트워크 우선.

---

## 13. 비기능

- 60 FPS 게임 루프.
- 터치 패드는 `preventDefault` 로 스크롤/줌 차단.
- 모바일 `user-scalable=no`, `viewport-fit=cover`.
- 랭킹 차트는 운영 필요 시 삭제될 수 있음을 메타 description에 명시.

---

## 14. 완료 정의 (재현 검수)

다른 PC에서 아래가 모두 같으면 동일 제품으로 본다.

- [ ] 10열, 모바일 20행, PC 20/24/28
- [ ] 7-bag + SRS + 위 점수표 + 고스트/홀드
- [ ] DAD 스페셜·K 타임스톱·오토플레이(랭킹 제외)
- [ ] PC 사이드바 350px, 전광판 160px
- [ ] 모바일: 헤더 → 보드+타워 → **전광판** → **7버튼 패드(맨 아래)**
- [ ] `#mobile-controls` 는 `#game-container` **밖** 형제. `main` 안으로 넣지 않는다.
- [ ] 창/보드 배경 키 분리, 최고점 키 보호
- [ ] 이벤트 영상 3슬롯 15MB + 슬롯 삭제
- [ ] 12언어, F9 C1–C15, PWA 버전 문자열 `1.4.4-allpass`
- [ ] 공장 파일명 `default_bg.jpg`, `level_1.jpg`–`level_10.jpg` 만 번들
