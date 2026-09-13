# ARCHITECTURE — DAD TETRIS

라이브 소스는 루트 파일만이다. `js/gameEngine.js`, `js/ui.js`, `js/i18n.js` 등은 **복제본/초안**이며 `index.html`이 불러오지 않는다.

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
| `script.js` `APP_VERSION` | `1.4.5-mobile` |
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

DAD 오프셋: `DAD_SLIDE_OFFSETS`, `DAD_SUPER_KICKS` (PRD 엔진과 동일 테이블을 script.js에서 복사).

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
- 레이아웃은 항상 LTR. 아랍어를 넣더라도 미러하지 않는다 (현행 12개에는 ar 없음).
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
| C6 | 모바일 감지, 20행, 100dvh, 패드/전광판 |
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

## 14. 재현 시 하지 말 것

- `index.html` 에 `js/*.js` 를 추가로 로드해 이중 엔진을 만들지 말 것.
- 보호 점수 키를 `localStorage.clear()` 로 지우는 리셋 버튼을 만들지 말 것.
- 창 배경 업로드가 보드 키를 덮어쓰게 하지 말 것.
- `assets/bg-default.png` 같은 옛 파일명을 부활시키지 말 것. 대기는 `default_bg.jpg` 만.
- 모바일에서 24/28 행을 열어주지 말 것.
- 전광판을 모바일에서 패드 **위**에 두지 말 것. 패드를 위에, 전광판을 맨 아래에 둔다.
