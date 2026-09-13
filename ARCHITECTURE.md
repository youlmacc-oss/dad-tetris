# ARCHITECTURE — DAD TETRIS

라이브 소스는 루트 파일만이다. `js/gameEngine.js`, `js/ui.js`, `js/i18n.js` 등은 **복제본/초안**이며 `index.html`이 불러오지 않는다.

기준 버전: `1.4.4-allpass`

---

## 1. 런타임 파일

```
index.html              셸 · DOM · 모달
script.js               전 로직 (엔진+UI+저장+진단+i18n)
style.css               전역 · 보드 · 모바일 그리드
css/settings.css        설정 모달 보조
sw.js                   PWA 캐시
manifest.json           standalone / 아이콘
404.html                폴백
assets/images/          default_bg.jpg, level_1.jpg … level_10.jpg
assets/audio/           bgm_default.mp3
icons/                  icon.svg, icon-192.png, icon-512.png
data/leaderboard.json   공유 랭킹 폴백 (네트워크 no-store)
```

버전 문자열을 **모든** 진입점에 동일하게 박는다.

| 위치 | 값 |
|------|-----|
| `script.js` `APP_VERSION` | `1.4.4-allpass` |
| `window.__DAD_TETRIS_VERSION` | 동일 |
| `index.html` `?v=` 쿼리, meta | 동일 |
| `manifest.json` version / id | 동일 |
| `sw.js` 캐시 접두사 `dad-tetris-v` | 동일 |

`index.html` 로드 순서:

1. `<base href="./">` 를 현재 디렉터리로 보정하는 인라인 스크립트
2. `style.css?v=…`, `css/settings.css?v=…`
3. body 하단 `script.js?v=…` (모듈 아님, 일반 스크립트)

---

## 2. 모듈 경계 (한 파일 안 논리 구역)

`script.js`는 IIFE/엔진 클로저 형태다. 재현 시 한 파일로 두거나 아래 경계로만 쪼갠다. **쪼개도 index.html이 로드하는 엔트리는 하나여야 동작이 같다.**

| 구역 | 책임 |
|------|------|
| i18n | `I18N` 사전, `t()`, `data-i18n` 적용, `tetris_lang` |
| storage | localStorage 래퍼, 보호 키, IndexedDB `DadTetrisDB` |
| audio | Web Audio, SFX, BGM, duck/restore, 타임스톱 피치 |
| render | 듀얼 캔버스, 스킨, 고스트, 파티클, 셰이크 |
| engine | 보드, 중력, 잠금, 가방, AI, DAD |
| ui | HUD, 모달, 패드, 오버레이, 가이드 |
| diagnostics | F9, C1–C15, 1–19 |

필수 캔버스가 없으면 엔진은 `{ ok: false }` 로 중단하고 HUD 클릭 폴백만 남긴다.

```
#bg-canvas + #tetris-canvas + #next  가 있어야 엔진 기동
#hold 는 있으면 사용
```

---

## 3. 게임 루프

- 목표 60fps, `FRAME_MS = 1000/60`
- `requestAnimationFrame` + 누적 시간으로 중력/DAS 처리
- 상태 플래그: `waitingStart`, `paused`, `gameOver`, `autoplay`, `dadSpecial`

흐름:

```
boot → waitingStart
  → startNewGame() → 루프
    → gravity / input / lockAndSpawn
      → clear lines → score/level/cheer/FX
      → spawn next (blocked → game over)
  → pause / endGame / startNewGame
```

락:

- 스페셜 OFF: 더 내려갈 수 없으면 즉시 `lockAndSpawn()`
- 스페셜 ON: 접지 후 카운트다운, 만료 시 락. 타임스톱 중 중력 정지.

---

## 4. 블록 데이터 (원문)

좌표는 `[col, row]` 오프셋. 회전 인덱스 0–3.

```
TYPES = ["I","J","L","O","S","T","Z"]

SHAPES.I = [
  [[0,1],[1,1],[2,1],[3,1]],
  [[2,0],[2,1],[2,2],[2,3]],
  [[0,2],[1,2],[2,2],[3,2]],
  [[1,0],[1,1],[1,2],[1,3]],
]
SHAPES.J = [
  [[0,0],[0,1],[1,1],[2,1]],
  [[1,0],[2,0],[1,1],[1,2]],
  [[0,1],[1,1],[2,1],[2,2]],
  [[1,0],[1,1],[0,2],[1,2]],
]
SHAPES.L = [
  [[2,0],[0,1],[1,1],[2,1]],
  [[1,0],[1,1],[1,2],[2,2]],
  [[0,1],[1,1],[2,1],[0,2]],
  [[0,0],[1,0],[1,1],[1,2]],
]
SHAPES.O = [
  [[1,0],[2,0],[1,1],[2,1]],  ×4 동일
]
SHAPES.S = [
  [[1,0],[2,0],[0,1],[1,1]],
  [[1,0],[1,1],[2,1],[2,2]],
  [[1,1],[2,1],[0,2],[1,2]],
  [[0,0],[0,1],[1,1],[1,2]],
]
SHAPES.T = [
  [[1,0],[0,1],[1,1],[2,1]],
  [[1,0],[1,1],[2,1],[1,2]],
  [[0,1],[1,1],[2,1],[1,2]],
  [[1,0],[0,1],[1,1],[1,2]],
]
SHAPES.Z = [
  [[0,0],[1,0],[1,1],[2,1]],
  [[2,0],[1,1],[2,1],[1,2]],
  [[0,1],[1,1],[1,2],[2,2]],
  [[1,0],[0,1],[1,1],[0,2]],
]

JLSTZ_CW = [
  [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  [[0,0],[1,0],[1,-1],[0,2],[1,2]],
  [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
]
I_CW = [
  [[0,0],[-2,0],[1,0],[-2,1],[1,-2]],
  [[0,0],[-1,0],[2,0],[-1,-2],[2,1]],
  [[0,0],[2,0],[-1,0],[2,-1],[-1,2]],
  [[0,0],[1,0],[-2,0],[1,2],[-2,-1]],
]
```

7-bag: `TYPES` 를 셔플한 가방에서 `takeFromBag()`. 내부적으로 `next` 와 `next2` 를 항상 유지.

---

## 5. 공식

```
nextLevel = clamp(startLevel + floor(lines / 10), 1, 20)

gravity L1-10  = max(100, 800 - (lv-1)*70)
gravity L11-20 = max(16, 170 - (lv-10)*15.4)
interval       = max(16, gravity / dropSpeedMultiplier)

lineScore = [0,100,300,500,800][cleared] * level
softDrop  += 1 per cell
hardDrop  += 2 per row

T-spin = type==T && lastPieceAction=="rotate" && filledCorners>=3
(가장자리 밖은 채워진 것으로 친다)
```

AI 상수: `AI_BUILD_MIN=7`, `AI_BUILD_TARGET=9`, `AI_BUILD_MAX=10`, `AI_WARN_HEIGHT=10`, `AI_EMERGENCY_HEIGHT=14`.

---

## 6. 저장소

### 6.1 IndexedDB

- DB: `DadTetrisDB` / store `media_files` / version `1`
- 레거시 마이그레이션: `dadTetrisMedia`, `dad_tetris_media_db`

| 키 | 용도 |
|----|------|
| `bgm` | 사용자 BGM |
| `profile`, `profileCrop`, `profileSnap` | 프로필 |
| `board_idle_bg_blob` | 보드 대기 별칭 |
| `custom_bg_window_default` | 창 대기 |
| `custom_bg_board_default` | 보드 대기 |
| `custom_bg_window_level_N` | 창 레벨 1–20 |
| `custom_bg_board_level_N` | 보드 레벨 1–20 |
| `common_bg_window_default` / `common_bg_board_default` | 공통 대기 |
| `common_bg_window_level_N` / `common_bg_board_level_N` | 공통 레벨 |
| `bg_idle`, `bg_lvl_N`, `bg_panel_idle`, `bg_panel_lvl_N` | 벌크 별칭 |
| `idleBg`, `bg_level_N` | 레거시 |
| `event_video_goal1` / `goal2` / `gameover` | 이벤트 영상 |

키 생성:

```
bgStoreKey(target, kind)
  target = "board" | "window"
  kind default|idle → custom_bg_{t}_default
  kind level N      → custom_bg_{t}_level_{N}
```

창 벌크 업로드가 보드 키를 쓰면 안 된다. 그 반대도 금지. C3/C9/C14가 이를 검사한다.

### 6.2 localStorage — 설정

| 키 | 용도 |
|----|------|
| `dadTetrisSettings` | 마스터 JSON |
| `board_rows_count` | 보드 높이 |
| `block_skin_style` | 스킨 |
| `dad_tetris_das` / `dad_tetris_arr` / `dad_tetris_softdrop` | 핸들링 |
| `drop_speed_multiplier` | 낙하 배율 |
| `preview_guide_mode` | `standard` \| `dual` |
| `start_garbage_lines` | 0–10 |
| `dad_tetris_theme` | 테마 |
| `tetris_lang` | 언어 |
| `dad_tetris_keep_default_bg` | 창 대기 고정 |
| `keep_default_window_bg` | 위 키의 레거시 미러 (항상 같이 기록) |
| `disable_all_custom_bg` | 커스텀 배경 전부 끄기 |
| `dadTetrisHelpSeen` | 가이드 이미 봄 |
| `dadTetrisProfile` / `dadTetrisProfileCrop` | 프로필 메타 |
| `dad_tetris_profile_img` | 프로필 dataURL |
| `dad_tetris_player_name` / `dadTetrisLastName` | 닉네임 |
| `board_bg_blur` / `board_bg_opacity` | 보드 FX |
| `window_bg_blur` / `window_bg_opacity` | 창 FX |
| `dad_tetris_bgm_vol` / `bgmVolume` | BGM 볼륨 |
| `dad_tetris_sfx_vol` / `sfxVolume` / `soundVolume` | SFX |
| `dad_tetris_muted` / `dadTetrisMuted` | 뮤트 |
| `auto_record_mode` | 자동 기록 |
| `dad_tetris_board_idle_bg_custom` | 보드 대기 커스텀 플래그 |

### 6.3 localStorage — 보호 (삭제·하향 금지)

```
dad_tetris_best_score
bestScore
dadTetrisBest
dad_tetris_hall_of_fame
dad_tetris_rankings
dadTetrisHall
dad_tetris_rank_domestic
dad_tetris_rank_global
dad_tetris_rank_shared
```

추가 랭킹: `dad_tetris_rank_hidden`, `dad_tetris_rank_outbox`, `dad_tetris_country_code`.

규칙:

- `storageUtil.remove/set` 은 보호 키 삭제 및 점수 하향을 거부한다.
- 부트 `preserveBestScoresOnBoot()` 는 별칭을 **위로만** 맞춘다.
- 공장 초기화는 배경·프로필·설정만 지운다. 점수/전당은 리스트에 넣지 않는다.

### 6.4 sessionStorage

`dad_tetris_rank_token`, `dad-sw-reloaded`.

---

## 7. 설정 기본값 (`SETTING_DEFAULTS`)

```
sound: true, soundVolume: 80
landSfxLowpass: 40, landSfxDecay: 30
shake: true, shakeStrength: 70, particles: true
ghost: true, ghostStrength: 40
bgm: false, bgmVolume: 70
startLevel: 1
videosEnabled: true, goal1Score: 5000, goal2Score: 10000
bgDim: 55, bgBlur: 6
levelBgEnabled: true, bgTarget: "window"
boardBgBlur: 0, boardBgOpacity: 80
windowBgBlur: 0, windowBgOpacity: 100
keepDefaultWindowBg: false, disableAllCustomBg: false
startGarbageLines: 0, previewGuideMode: "standard"
dropSpeedMultiplier: 1, blockSkinStyle: "gemstone"
boardRowsCount: 20, language: "ko"
autoplaySpeed: 1, mobilePad: "auto"
dadSpecial: false, dadSpecialDuration: 3
haptic: true, theme: "neon-blue"
dasMs: 150, arrMs: 33, softdropMultiplier: 10
```

토글 키 집합:  
`sound, shake, particles, ghost, bgm, videosEnabled, bgEnabled, levelBgEnabled, keepDefaultWindowBg, disableAllCustomBg, autoRecordMode, dadSpecial, haptic`

---

## 8. 배경 페인트

두 레이어를 독립 페인트한다.

1. `#scene-bg` / `#scene-bg-image` / `#scene-bg-image-next` — 창
2. `#board-bg` / `#board-bg-image` / `#board-bg-image-next` — 패널

크로스페이드는 다음 이미지 엘리먼트를 미리 넣고 `is-visible` 토글.  
레벨 11–20 번들 파일이 없으면 `level_10.jpg` 로 폴백.  
`disableAllCustomBg` 면 번들/기본 테마만.

---

## 9. 오디오

- Web Audio Graph. 슬라이더 ↔ GainNode (C10).
- 기본 BGM 파일 `assets/audio/bgm_default.mp3`. 사용자 파일이 있으면 IndexedDB `bgm` 우선.
- 축하 영상: `duckBgm(0.1, 0.3)` → `restoreBgm(0.3)` (C15).
- 타임스톱: playbackRate 0.55, lowpass 420Hz. 종료 시 복구.

---

## 10. i18n

- 사전은 **`script.js` 인라인 `I18N`**. `window.DAD_I18N.dict`, `window.TRANSLATIONS`.
- 언어 12: `ko, en, hi, zh-CN, es, ja, fr, de, pt-BR, ru, vi, id`
- `I18N.zh = I18N["zh-CN"]`
- DOM: `data-i18n`, `data-i18n-title`, `data-i18n-aria`
- 레이아웃은 항상 LTR.
- C4: 12언어 missing=0.

---

## 11. 진단 (F9)

| ID | 검사 |
|----|------|
| C1 | 듀얼 캔버스, 전광판 160px(PC), 오버레이 중앙, SRS, 워터마크 |
| C2 | 스킨 5종 렌더 |
| C3 | IDB CRUD, 창/보드 키 격리, 파일명 |
| C4 | LS 키, 12언어 사전, 닉네임 |
| C5 | Web Audio 초기화 |
| C6 | 모바일 감지, 20행, 100dvh, 전광판+하단 패드 |
| C7 | 터치 DOM ID 존재 |
| C8 | AI 스트레스, 충돌 0 |
| C9 | 창/보드 독립, Idle–Lv20 썸네일 |
| C10 | 볼륨↔Gain, 뮤트 |
| C11 | keepDefault, K, 듀얼큐, 쓰레기줄, 낙하배율 |
| C12 | 레벨 배경 페인트, 번들 JPG |
| C13 | `resolveLevelBg` 상속 |
| C14 | custom vs common 격리 |
| C15 | duck→restore |

이후 단계 1-1 … 19-1 (타임스톱, 패드, PWA, 테마 등).  
진단 중 SFX 뮤트, 종료 후 스냅샷 복구.

모바일 필수 ID (`mobileTouchDomOk`):

```
header-mini-menu, settings-open, btn-guide, btn-diagnostics,
overlay, overlay-hint, start-overlay,
mobile-controls, btn-left, btn-down, btn-right,
btn-rotate, btn-drop, btn-hold, btn-timestop,
stats-bar-row, score, level, lines, best,
game-start, game-end, mobile-pad-toggle, autoplay-toggle
```

레이아웃 ID: `board-wrap`, `mobile-right-tower`, `stats-bar-row`, `dad-cheer-banner`, `mobile-controls`.

---

## 12. PWA / 네트워크

`sw.js` precache:

```
./, index.html, 404.html, style.css, css/settings.css,
script.js, manifest.json,
assets/images/default_bg.jpg,
assets/images/level_1.jpg … level_10.jpg,
assets/audio/bgm_default.mp3,
icons/icon.svg
```

- HTML/CSS/JS: network-first, 실패 시 캐시, HTML은 `index.html` 폴백
- 미디어: network-first + cache put
- `data/leaderboard.json`: 항상 `no-store`. 실패 시 빈 JSON
- activate 시 옛 `dad-tetris-v*` 삭제
- `SKIP_WAITING` 메시지 지원

랭킹 원격: owner `youlmacc-oss`, repo `dad-tetris`. 오프라인에서도 로컬 전당은 동작해야 한다.

---

## 13. 입력 파이프라인

PC: `keydown`/`keyup` → `held` Set → DAS/ARR.  
모바일: `#mobile-controls` 에 pointer/touch. `data-touch` = `left|down|right|rotate|drop|hold|freeze`.  
패드와 보드에서 스크롤 방지. 모달·인풋은 예외.

Space 더블탭 창: `SPACE_DOUBLE_MS = 250`.

---

## 14. DOM 위치 (깨지면 전체 레이아웃이 흔들린다)

```
#game-container
  main.stage
    #board-wrap
    aside.sidebar
      … #dad-cheer-banner (사이드바 dock 안. 모바일에서는 display:contents 로 stage row 3)
#mobile-controls          ← container 밖, body 직속 형제
```

- `#mobile-controls` 를 `main` 이나 `#game-container` 안으로 **옮기지 말 것.**
- 모바일 `main.stage` 는 **3행**: header / board+tower / cheer.
- 패드 높이 48px 는 컨테이너 밖 flex 아이템. 컨테이너 높이는 `calc(100dvh - 48px)`.

---

## 15. 재현 시 하지 말 것

- `index.html` 에 `js/*.js` 를 추가로 로드해 이중 엔진을 만들지 말 것.
- 보호 점수 키를 `localStorage.clear()` 로 지우는 리셋 버튼을 만들지 말 것.
- 창 배경 업로드가 보드 키를 덮어쓰게 하지 말 것.
- `assets/bg-default.png` 같은 옛 파일명을 부활시키지 말 것. 대기는 `default_bg.jpg` 만.
- 모바일에서 24/28 행을 열어주지 말 것.
- 패드와 전광판 자리를 맞바꾸거나, 패드를 그리드 4행으로 넣지 말 것.

---

## 16. 재현에 빠져 있으면 다른 게임이 되는 부록

### 16.1 회전 방향 · 킥

```
ArrowUp → tryRotate(+1)  시계. rot = (from+1) & 3
KeyZ    → tryRotate(-1)  반시계. rot = (from+3) & 3
모바일 #btn-rotate → 시계 (+1)

kicks(type, from, to):
  O → [[0,0]]
  clockwise = (to === (from+1)&3)
  index = clockwise ? from : to
  table = type==I ? I_CW[index] : JLSTZ_CW[index]
  clockwise면 table 그대로, 아니면 각 [x,y] → [-x,-y]
```

DAD 관통 중에는 `[[0,0]] + baseKicks + DAD_SUPER_KICKS` 를 합친 뒤 중복 제거.

```
DAD_SLIDE_OFFSETS = [
  [1,-1],[1,1],[1,-2],[1,2],[1,-3],[1,-4],
  [2,0],[2,-1],[2,1],[2,-2],[2,2],[2,-3],
  [3,0],[3,-1],[3,1],[3,-2],
]
DAD_SUPER_KICKS = [
  [0,0],
  [-1,0],[1,0],[-2,0],[2,0],[-3,0],[3,0],
  [0,-1],[0,-2],[0,-3],[0,-4],
  [-1,-1],[1,-1],[-2,-1],[2,-1],[-3,-1],[3,-1],
  [-1,-2],[1,-2],[-2,-2],[2,-2],
  [-1,-3],[1,-3],
  [0,1],[-1,1],[1,1],[0,2],
  [-2,2],[2,2],[-1,2],[1,2],
]
```

### 16.2 전광판 트리거 (한국어 원문)

| 조건 | kind | 본문 키 / 기본 문구 | 팁 키 | 지속 |
|------|------|---------------------|-------|------|
| 대기 | idle | cheerDefault `🎮 아빠의 멋진 플레이를 응원합니다!` | cheerTipDefault | — |
| 1줄 | clear | cheerClear1 | cheerTipClear1 | 3s |
| 2줄 | clear | cheerClear2 | cheerTipClear2 | 3s |
| 3줄 | clear | cheerClear3 | cheerTipClear3 | 3s |
| 4줄 | tetris | cheerTetrisCrush `⚡ TETRIS CRUSH!` | cheerTipTetris | 3s |
| T-스핀 | combo | cheerTSpin `🌀 T-SPIN!` | cheerTipClear3 | 3s |
| 콤보≥3 | combo | cheerUltraCombo `🔥 ULTRA COMBO!` | cheerTipCombo | 3s |
| 콤보≥2 | combo | cheerCombo `{combo}` | cheerTipCombo | 3s |
| 타임스톱 | status | cheerFreeze | cheerTipFreeze | 3s |
| 게임오버 | over | cheerGameover | cheerTipGameover | 3s |
| 레벨업 | level | cheerLevelGuide* | 같은 계열 | 4.5s |

우선순위(클리어 시): 테트리스 → T-스핀 → 콤보≥3 → 콤보≥2 → 3줄 → 2줄 → 1줄.

레벨 가이드: Lv1–10 `cheerLevelGuideCalm`, 11–15 `Speed`, 16–19 `Special`, 20 `Master`. `{lv}` 치환.

뱃지: 평소 `cheerBadgeDad` `💬 DAD STATUS`, 상태성 `cheerBadgeStatus` `⚡ STATUS`.

### 16.3 명예의 전당 레코드

```
{
  id: `${Date.now()}-${score}`,
  name, playerName,          // 닉네임
  score,                     // number, cap 9999999
  level, lines,
  date,                      // 로케일 날짜 문자열
  countryCode                // 예: KR
}
```

표시 10, 저장 50. `isRankEligible()` 가 false(오토플레이)면 `addHallRecord` no-op.  
`autoRecordMode` ON이면 종료 팝업 없이 닉네임(없으면 `시스템`)으로 즉시 저장.

### 16.4 공장 초기화가 지우는 것 / 안 지우는 것

지움: IndexedDB `media_files` 전부, 프로필 키, 창/보드 커스텀 배경 키·레벨 1–20, blur/opacity, disable/autoRecord/garbage/preview/drop/skin/rows, 닉네임, 테마. 그 후 `settings = defaultSettings()` + `saveSettings()`.

**안 지움:** §6.3 보호 점수/전당 키.

### 16.5 오토플레이 평가 (동일 AI가 되게)

모드 `aiModeForBoard`:

| 조건 | mode |
|------|------|
| maxH≥14 또는 stack≥14 또는 (holes≥2 && maxH≥12) | survive |
| maxH≥10 또는 stack≥10 또는 holes≥3 | stabilize |
| I 보유 && stack≥7 && wellDepth≥3 && maxH≤10 | storm |
| 그 외 | buildup |

`scoreSim` 핵심 (buildup 기본):

- 스폰 막힘 −5000
- 구멍·범프 페널티, 우물 채움 페널티
- 1줄 −2.8, 2줄 −1.2, 3줄 +1.5, 4줄 +14
- 스택을 7–10(목표 9)에 맞춤
- survive/stabilize/storm 가중은 `script.js` `scoreSim` 원문과 같게 복사

lookahead 가중: survive 0.72, stabilize 0.58, storm 0.28, buildup 0.48.  
홀드 후보도 같은 트리로 비교. 듀얼 모드에서는 홀드 탐색 안 함.  
실행: 최선 rot/col 맞춘 뒤 `hardDrop()`. 속도≥8 또는 Lv≥11 이면 즉시 드롭 스타일.

### 16.6 스킨 의도 (픽셀 코드는 폴백 가능)

| ID | 그려야 하는 느낌 |
|----|------------------|
| gemstone | 보석 하이라이트, 기본 |
| glass | 반투명 유리 |
| wire_glass | 외곽선+유리. 레거시 `classic` → 이 ID |
| mecha | 기계식 패널/리벳 |
| candy | 둥글고 밝은 사탕 |

고스트: 같은 스킨, 알파 `ghostStrength/100` (기본 0.4).  
셀 크기 논리: 보드 폭/COLS. HTML 캔버스 400×800, cell 기본 40.

### 16.7 테마 CSS 변수 (5종)

```
neon-blue:     primary #00d2ff  accent #7cf0ff  bg #05070c
cyber-pink:    primary #ff4fa3  accent #ff7ad9  bg #12060e
emerald-green: primary #22f0b2  accent #86efac  bg #050c0a
sunset-orange: primary #ff8a3d  accent #ffd76a  bg #0c0805
future-cyber:  primary #c084fc  accent #facc15  bg #090614
```

세부 glow/border/muted 는 `UI.md` 또는 `style.css` `:root` 블록을 복사.

### 16.8 i18n 재현 규칙

- 키는 12언어에 동일하게 있어야 C4 missing=0.
- **한국어 게임/전광판/버튼 문구는 이 문서와 index.html 기본 텍스트를 정본으로 쓴다.**
- 나머지 11언어: 원본 `script.js` `I18N` 이 있으면 그 블록을 통째로 복사. 없으면 `en`을 채우고 없는 키는 `ko`로 폴백 (`t()` 폴백).
- `t(key, {combo, lv, ...})` 는 `{name}` 치환.
- `I18N.zh = I18N["zh-CN"]`.

MD만으로 12×전체 가이드 문장을 재현할 수는 없다. 가이드 모달은 한국어 HTML 시드 + `data-i18n` 키만 맞춰도 플레이에는 충분하다. C4를 통과시키려면 `script.js` I18N 복사가 필요하다.

### 16.9 오디오 이벤트 이름

최소한 재생할 SFX 키: `move`, `rotate`, `softdrop`, `lock`, `clear`, `tetris`, `tspin`, 하드드롭/착지. 없으면 Web Audio 짧은 펄스로 대체. BGM은 `bgm_default.mp3` 루프.

### 16.10 오버레이 표시

`showGameOverlay(mode)`: `start` | `pause` | `gameOver` | `conquer`.  
`#overlay` 클래스 `is-start` `is-pause` `is-result` `is-conquer`.  
정복은 오토플레이 Lv20. 수동은 계속 플레이 가능.
