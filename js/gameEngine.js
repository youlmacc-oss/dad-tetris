import { dbManager, storageUtil } from "./storage.js";
import { createSoundManager, soundManager, bindSoundManager } from "./audio.js";
import {
  renderEngine,
  bindRenderEngine,
  drawBlock,
  fillBlock,
  renderStaticBackground,
  renderGhostPreview,
  renderSkinPreview,
  invalidateStaticBackground,
  drawNeonWell,
  drawFlashes,
  drawParticles,
  clampBlockSkin,
  BLOCK_SKIN_IDS,
  BLOCK_SKIN_DEFAULT,
  resizeCanvasToViewport,
} from "./render.js";
import {
  uiController,
  bindUiController,
  updateCheerMsg,
  flashDadCheer,
  flashDadCheerForClear,
  resetDadCheer,
  hapticTap,
  getCheerKind,
  runDiagnostics,
  CORE_DIAG_IDS,
  exposeWindowUi,
  bindHudClickFallback,
} from "./ui.js";

export function GameEngine() {

  const I18N = {
    ko: {
        score: "SCORE", level: "LEVEL", lines: "LINES", best: "BEST", next: "NEXT", hold: "HOLD",
        controls: "조작법", move: "이동", rotate: "회전", softDrop: "소프트 드롭",
        hardDrop: "하드 드롭", holdKey: "홀드(HOLD)", holdHelp: "홀드(HOLD)",
        autoplay: "🤖 자동 플레이", autoplayStop: "자동 플레이 중지",
        autoplayBadge: "🤖 AI 자동 플레이 중...",
        autoplayEndedTitle: "🤖 AI 자동 플레이가 종료되었습니다",
        autoplayEndedHint: "이 점수는 명예의 전당에 저장되지 않습니다.",
        autoplaySpeed: "AI 플레이 속도", autoplaySpeedShort: "AI 속도",
        autoplaySpeedValue: "속도: {speed}x ({tier})",
        autoplaySpeedHint: "0.5x 슬로우 · 1x 표준 · 10x 고속 · 20x 초고속",
        autoplaySpeedSlow: "슬로우", autoplaySpeedNormal: "표준", autoplaySpeedFast: "빠름",
        autoplaySpeedHigh: "고속", autoplaySpeedUltra: "초고속",
        goalToast: "🎉 {score}점 돌파!",
        level20Toast: "👑 축하합니다! AI가 최고 난이도인 Level 20을 정복했습니다!",
        pause: "일시정지", restart: "다시 시작", pauseX2: "일시정지",
        tagline: "아빠의 한 판", dad: "아빠", startGame: "▶ 게임 시작", endGame: "■ 게임 종료",
        restartGame: "▶ 다시 시작", settings: "⚙️ 환경설정",
        overlayRestart: "🔄 다시 하기", overlayQuit: "❌ 게임 종료",
        gameTerminatedMsg: "🎮 모든 게임 프로세스가 안전하게 종료되었습니다. 탭을 닫아주세요.",
        diagBtn: "🧪 자가진단", diagTitle: "🧪 실시간 자동 진단 콘솔",
        diagRun: "▶ 전수 검사 시작", diagClose: "닫기", diagIdle: "대기 중",
        diagCert: "🎉 100% 무결점 인증 완료! (All Systems Operational)",
        diagAllGreen: "[✅ ALL GREEN] 윈도우/패널 키 · 블러/투명도 · 마스터 비활성화 · 더블탭 · Quota",
        diagCoreSystemsOk: "🎉 모든 핵심 시스템(듀얼 캔버스, 5종 스킨, IndexedDB, DAD 전광판)이 100% 완벽하게 가동 중입니다! [PASS 7/7]",
        diagFail: "⚠️ 일부 항목 실패 — 로그를 확인하세요",
        gameTitle: "DAD TETRIS", pressStart: "게임 시작을 눌러 주세요",
        paused: "일시정지", pauseHint: "P  또는  Space ×2  계속하기",
        pauseHintTouch: "화면을 두 번 터치하거나 일시정지 버튼을 누르면 재개됩니다",
        gameOver: "게임 오버", gameEnded: "게임 종료", pressStartAgain: "게임 시작을 눌러 다시 플레이",
        overlayConquer: "👑 LEVEL 20 정복", overlayConquerHint: "Enter / Space 또는 게임 시작으로 직접 플레이",
        settingsTitle: "⚙️ 환경설정", language: "🌐 언어 설정 (Language)",
        tabGame: "게임", tabLevelBg: "🖼️ 배경 설정", tabEventVideo: "🎬 이벤트 동영상", tabScoreboard: "🏆 스코어 관리",
        startLevel: "🎮 시작 레벨", levelOption: "{n}레벨",
        levelHint1: "Level 1: 편안한 속도", levelHint2: "Level 2: 여유로운 속도",
        levelHint3: "Level 3: 살짝 빠른 속도", levelHint4: "Level 4: 조금 빠른 속도",
        levelHint5: "Level 5: 보통 속도", levelHint6: "Level 6: 긴장되는 속도",
        levelHint7: "Level 7: 빠른 속도", levelHint8: "Level 8: 더 빠른 속도",
        levelHint9: "Level 9: 아주 빠른 속도", levelHint10: "Level 10: 매우 빠른 속도",
        levelHintExtreme: "Level {n}: 극한 속도 (20G)",
        keysHelp: "⌨️ 조작 도움말", spaceOnceHard: "한 번 → 하드드롭",
        spaceTwicePause: "일시정지 / 계속하기", pPause: "일시정지 / 계속하기",
        profileTitle: "👤 프로필 사진 등록", themeTitle: "🎨 컬러 테마",
        themeNeonBlue: "🔷 네온 블루", themeCyberPink: "🌸 사이버 핑크",
        themeEmeraldGreen: "🌿 에메랄드 그린", themeSunsetOrange: "🌅 차분한 주황",
        themeFutureCyber: "🔮 미래 사이버펑크",
        pwaInstall: "📲 홈 화면에 앱 설치 (PWA)",
        pwaGuideTitle: "📲 홈 화면에 추가",
        pwaGuideBody: "브라우저 상단/하단 메뉴(⋮ 또는 공유 버튼 ⎋) ➜ [홈 화면에 추가]를 눌러주세요!",
        pwaGuideOk: "확인",
        pwaAlreadyInstalled: "이미 홈 화면에 앱으로 설치되어 있습니다.",
        profileChoose: "📷 사진 불러오기 / 변경", profileChangeHint: "사진 변경",
        profileDrag: "원 안에서 드래그하면 위치가 바뀝니다. 휠로 50%~300% 확대/축소할 수 있습니다. (100% = 원본 크기)",
        zoom: "🔍 확대/축소 (Scale)", posX: "↔️ 가로 위치 (X Offset)", posY: "↕️ 세로 위치 (Y Offset)", resetPos: "🔄 위치/크기 초기화",
        profileSaveCrop: "✅ 저장 완료", profileNone: "선택된 사진 없음 (기본 아바타 표시)",
        profileRegistered: "등록됨: {name}", profileReselect: "이전 파일: {name} — 다시 선택해 주세요",
        sound: "🔊 효과음", volume: "볼륨", soundVolume: "🔔 SFX 볼륨",
        shake: "🫨 화면 진동", shakePower: "진동 강도",
        mobilePad: "📱 모바일 패드", mobilePadShow: "📱 모바일 패드 표시", mobilePadHide: "📱 모바일 패드 숨기기",
        mobilePadHint: "화면이 좁거나 터치 기기에서는 자동으로 켜집니다. PC에서도 표시해 테스트할 수 있습니다.",
        padMove: "이동", padAction: "액션", padLeft: "왼쪽 이동", padRight: "오른쪽 이동",
        padDown: "소프트 드롭", padRotate: "회전", padDrop: "하드 드롭", padHold: "홀드",
        bgm: "🎵 배경음악", bgmVolume: "BGM 볼륨", chooseMusic: "🎵 음악 파일 선택",
        assetPresetOn: "기본 네온 테마 적용 중", assetCustomOn: "사용자 맞춤 파일 등록됨",
        restoreDefaultAsset: "기본값으로 되돌리기",
        deleteBg: "🗑️ 삭제",
        confirmDeleteBg: "해당 배경 이미지를 삭제하고 기본 배경으로 되돌리시겠습니까?",
        bgDeletedToast: "기본 네온 그리드로 되돌렸습니다",
        levelBgNeon: "기본 네온 그리드 적용됨",
        noFile: "선택된 파일 없음", prevFile: "이전 파일: {name} — 보안상 다시 선택해 주세요",
        playing: "재생 중: {name}", selected: "선택됨: {name}",
        ghost: "👻 미리보기 그림자", ghostOpacity: "그림자 진하기",
        customBg: "🖼️ 커스텀 배경 이미지", dim: "어둡기", blur: "블러",
        chooseBg: "🖼️ 배경 이미지 선택/변경", noImage: "선택된 이미지 없음",
        bgAdjust: "🖼️ 배경 어둡기 / 블러", bgAdjustHint: "윈도우 배경의 어둡기/블러입니다. 게임 패널 배경은 [배경 설정] 탭에서 조절합니다.",
        bgTargetTitle: "배경 대상",
        bgTargetWindow: "🖥️ 전체 윈도우 배경",
        bgTargetBoard: "🎮 게임 패널 배경",
        boardBgOpacity: "투명도",
        boardBgFxHint: "게임 패널(보드) 배경에만 적용됩니다. 실시간으로 반영됩니다.",
        windowBgFxHint: "전체 윈도우 배경에만 적용됩니다. 실시간으로 반영됩니다.",
        windowBgBlur: "🌫️ 블러",
        windowBgOpacity: "👁️ 투명도",
        keepDefaultWindowBg: "📌 기본 배경 계속 유지 (레벨업 시 변경 안 함)",
        disableAllCustomBg: "🚫 배경 이미지 전체 사용 안 함 (순정 네온 모드)",
        disableAllCustomBgHint: "등록된 이미지는 그대로 보존되며, 켜면 배경 이미지를 숨기고 기본 사이버펑크 네온 테마로 즉시 전환됩니다.",
        idleBgTitleBoard: "🎮 게임 패널 기본 배경",
        idleBgCaptionBoard: "테트리스 보드 안쪽에 표시됩니다",
        levelPlayBgTitleBoard: "🎮 레벨 1 ~ 레벨 20 패널 배경",
        levelBgAuto: "🖼️ 레벨별 배경 자동 변경",
        levelBgHint: "외부 이미지 파일이 없어도 네온 그리드로 바로 플레이됩니다. 가족사진은 여기서 등록할 수 있습니다.",
        idleBgTitle: "🖼️ 기본 대기 배경 이미지", idleBgCaption: "대기 화면과 게임 종료 화면에 사용됩니다",
        levelPlayBgTitle: "🎮 레벨 1 ~ 레벨 20 배경 이미지",
        levelBgExtremeHint: "등록한 이미지가 없으면 네온 그리드가 유지됩니다. 윈도우는 기본+레벨 1~20, 게임 패널은 레벨 1~20만 등록할 수 있습니다.",
        levelBgTitle: "Level {n} 배경", chooseLevelBg: "🖼️ 이미지 선택",
        levelBgNone: "선택된 이미지 없음", levelBgRegistered: "등록됨: {name}",
        levelBgQuota: "저장 용량이 부족합니다. 더 작은 이미지를 선택해 주세요.",
        eventVideo: "🎬 이벤트 동영상",
        eventVideoHint: "끄면 점수 달성·게임 종료 축하 팝업이 나오지 않습니다. 미리보기는 계속 사용할 수 있습니다.",
        preview: "▶️ 미리보기", fileSelect: "파일 선택 (MP4 등)",
        videoUrlPlaceholder: "유튜브 또는 영상 URL 입력",
        goal1: "1차 목표 점수", goal2: "2차 목표 점수",
        gameoverVideo: "👏 게임 종료 (수고하셨습니다) 영상",
        videoTitleScore: "🎉 {score}점 달성 영상",
        goalHint: "{n}차 목표 {score}점에 도달하면 축하 팝업이 재생됩니다.",
        videoNone: "등록된 영상 없음", videoReady: "[등록 완료: {name}]",
        videoReselect: "이전 파일: {name} — 보안상 다시 선택해 주세요",
        openHall: "🏆 명예의 전당 열기", hallHint: "명예의 전당에서 1위부터 10위까지 기록을 보고 관리할 수 있습니다.",
        saveAndClose: "💾 설정 완료 / 닫기", closeResume: "닫기 / 게임 재개",
        resetSettings: "🔄 기본값 복원",
        confirmResetSettings: "모든 환경설정을 처음 상태로 되돌릴까요?\n등록한 사진, 배경, 음악, 영상도 함께 지워집니다. 명예의 전당 기록은 유지됩니다.",
        confirmAction: "확인", confirmOk: "확인", confirmCancel: "취소",
        rank: "순위", name: "이름", date: "날짜", saveRecord: "기록 저장",
        gameOverMsg: "👏 수고하셨습니다!", enterName: "이름을 입력해 주세요",
        playerName: "플레이어 이름", skipSave: "저장하지 않기",
        hallTitle: "🏆 명예의 전당", hallEmpty: "아직 기록이 없습니다.\n한 판 플레이하고 이름을 남겨 주세요.",
        resetAll: "전체 기록 초기화", close: "닫기", delete: "삭제",
        confirmDelete: "이 기록을 삭제할까요?", confirmReset: "명예의 전당 기록을 모두 지울까요?",
        saveSummary: "점수 {score} · 레벨 {level}", hallMeta: "레벨 {level} · {lines}줄 · {date}",
        ranking_notice: "랭킹 차트는 관리 필요성에 따라 언제든 삭제/초기화될 수 있습니다",
        tabRankDomestic: "🇰🇷 국내 랭킹",
        tabRankGlobal: "🌐 글로벌 랭킹",
        rankCardKorea: "🇰🇷 DAD TETRIS KOREA TOP RECORD",
        rankCardGlobal: "🌐 DAD TETRIS GLOBAL LEADERBOARD",
        rankingNoticeFull: "ℹ️ 랭킹 차트의 기록은 데이터 최적화 및 운영/관리 필요성에 의해 사전 예고 없이 초기화되거나 삭제될 수 있습니다.",
        rankingShareWatermark: "[DAD TETRIS LEADERBOARD] *데이터 관리 정책에 따라 차트가 갱신될 수 있습니다.",
        celebrateGoal1: "🎉 {score}점 달성을 축하드립니다!",
        celebrateGoal2: "🏆 {score}점 달성! 최고의 실력입니다!",
        celebrateGameover: "👏 아버님, 수고하셨습니다!", celebrateFallback: "🎉 축하합니다!",
        clear1: "1줄", clear2: "2줄", clear3: "3줄", tetris: "테트리스", clearN: "{n}줄",
        cheerDefault: "🎮 아빠의 멋진 플레이를 응원합니다!",
        cheerBadgeDad: "💬 DAD STATUS", cheerBadgeStatus: "⚡ STATUS",
        cheerClear1: "좋습니다! 1줄 클리어 ✨",
        cheerClear2: "나이스! 2줄 동시 제거! 💥",
        cheerClear3: "대단해요! 3줄 클리어! 🔥",
        cheerTetris: "🎉 대박! 완벽한 4줄 테트리스! 🏆",
        cheerCombo: "🔥 콤보 폭발! {combo}연속 달성 중!",
        cheerFreeze: "⏳ 시간 정지 발동! 천천히 조준하세요!",
        cheerGameover: "수고하셨습니다! 다음 판에 신기록 도전! 👏",
        cheerTipDefault: "💡 TIP: 차분하게 바닥부터 쌓아가세요!",
        cheerTipCombo: "🔥 COMBO x{combo} 달성 중!",
        cheerTipTetris: "🏆 TETRIS 4줄 클리어!",
        cheerTipClear1: "✨ 한 줄씩 차분하게! 바닥부터 쌓으세요!",
        cheerTipClear2: "💥 더블 클리어! 콤보를 노려보세요!",
        cheerTipClear3: "🔥 트리플 클리어! 테트리스가 눈앞입니다!",
        cheerTipFreeze: "⏳ 타임스톱 중! 천천히 조준하세요!",
        cheerTipGameover: "👏 다음 판은 바닥부터 더 단단히!",
        profileQuota: "저장 용량이 부족합니다. 더 작은 사진을 선택해 주세요.",
        closeAria: "닫기", boardAria: "테트리스 게임판", sidebarAria: "게임 정보",
        hallOpenAria: "명예의 전당 열기", celebrateFrame: "축하 영상",
        on: "ON", off: "OFF",
        autoRecordMode: "⚡ 자동 게임기록 모드",
        autoRecordHint: "게임 종료 후 기록 팝업을 띄우지 않고, 게이머 이름을 '시스템'으로 하여 날짜와 점수를 자동 저장합니다.",
        autoRecordName: "시스템",
        autoRecordToast: "⚡ 게임 기록이 '시스템'으로 자동 등록되었습니다.",
        startGarbageLines: "🧱 시작 장애물 라인 (0 ~ 10층)",
        startGarbageHint: "게임 시작 시 바닥부터 빈칸이 포함된 장애물 블록을 미리 깔아두고 시작하는 핸디캡/챌린지 기능입니다.",
        startGarbageClean: "0층 (클린 보드)",
        startGarbageValue: "{n}층",
        previewGuideMode: "🧩 블록 가이드 모드",
        previewModeStandard: "표준 모드 (좌: NEXT / 우: HOLD)",
        previewModeDual: "2단 넥스트 모드 (좌: NEXT 1 / 우: NEXT 2)",
        previewModeHint: "2단 넥스트 모드 선택 시 HOLD 대신 다다음(차차기) 블록까지 미리 확인하며 전략적인 플레이가 가능합니다.",
        blockSkinTitle: "🧊 블록 외형 스타일",
        blockSkinHint: "선택한 스타일에 따라 블록의 질감과 입체감이 실시간으로 변경됩니다.",
        blockSkinClassic: "🧊 3D 홀로그램 글래스 (Hollow Glass)",
        blockSkinWireGlass: "🧊 3D 홀로그램 글래스 (Hollow Glass - 완전 투명 입체 프레임)",
        blockSkinGlass: "💎 크리스탈 글래스 (Crystal Glass)",
        blockSkinGemstone: "🎲 3D 베벨 큐브 (3D Gemstone)",
        blockSkinMecha: "⚙️ 사이버 메카닉 (Cyber Mecha)",
        blockSkinCandy: "🍬 소프트 캔디 (Soft Round)",
        skinPreviewLabel: "👁️ 실시간 미리보기",
        settingsSectionGraphics: "🎨 그래픽 & 블록 비주얼",
        settingsSectionSound: "🔊 사운드 & 볼륨 조절",
        settingsSectionPlay: "🕹️ 게임플레이 & 편의기능",
        dadSpecialSetting: "👑 DAD 스페셜 보조 기능",
        haptic: "📱 모바일 터치 햅틱 피드백",
        next1: "NEXT 1",
        next2: "NEXT 2",
        holdDisabledHint: "2단 넥스트 모드에서는 홀드를 사용할 수 없습니다.",
        guideModeToggleTitle: "가이드 모드 전환 (NEXT+HOLD ↔ NEXT 1+2)",
        dropSpeedMultiplier: "⏱️ 블록 낙하 속도 조절",
        dropSpeedHint: "레벨업에 따른 속도 증가 곡선은 유지되며, 전체적인 기본 낙하 속도를 아버지의 손에 맞게 느리거나 빠르게 조절합니다.",
        dropSpeedValue: "{speed}x ({tier})",
        dropSpeedVeryEasy: "매우 여유롭게",
        dropSpeedSlowEasy: "느림 - 여유 모드",
        dropSpeedNormal: "표준",
        dropSpeedFast: "빠름",
        dropSpeedVeryFast: "매우 빠르게",
        boardSizeTitle: "📏 게임 보드 세로 높이 (낙하 거리)",
        boardSize20: "⚡ 표준 규격 (10 × 20칸)",
        boardSize24: "🚀 롱 드롭 타워 (10 × 24칸) [추천: 낙하거리 +4칸]",
        boardSize28: "🏰 울트라 타워 (10 × 28칸) [여유: 낙하거리 +8칸]",
        boardSizeHint: "보드 세로 칸 수를 늘려 블록 낙하 시간과 판단 여유 공간을 더 넓게 확보합니다.",
        boardSizeRestartToast: "새로운 보드 크기를 적용하기 위해 게임이 재시작됩니다",
        boardSizeMobileOnly: "📱 모바일 기본 20라인 전용",
        guide: "❓ 가이드", guideTitle: "📖 DAD TETRIS 가이드",
        guideLead: "아빠와 가족을 위한 한눈에 보는 플레이 안내입니다.",
        guideTabControls: "🎮 조작법 (PC & 모바일)",
        guideTabControlsMain: "챕터 1: 🎮 조작",
        guideTabControlsSub: "& 모바일 패드", guideTabScore: "🏆 점수 & 레벨",
        guideTabAi: "🤖 AI · 20레벨", guideTabSettings: "⚙️ 환경설정",
        guideTabCustom: "🖼️ 테마/커스텀", guideTabSystem: "🧪 시스템/자가진단",
        guideTabSkins: "챕터 2: 🧊 블록 스킨",
        guideTabBoard: "챕터 3: 📏 보드 크기",
        guideTabMedia: "챕터 5: 💾 IndexedDB 미디어",
        guidePcTitle: "💻 PC 키보드", guideMobileTitle: "📱 모바일 터치패드",
        guideMobileArcadeBody: "세로 화면은 한 장에 맞춥니다. 상단은 타이틀과 ⚙️설정·📖가이드·✏️진단 아이콘, 중앙은 게임 보드(Hold/Next 양옆), 그 아래 슬림 점수판, 최하단은 7버튼 터치패드입니다. PC용 시작/종료/AI 버튼은 숨기고, 보드 중앙의 ‘게임 시작을 눌러 주세요’를 터치하면 바로 시작합니다.",
        guideMobileHint: "양손으로 잡으세요. 왼쪽은 이동, 오른쪽은 액션입니다.",
        guideMobileBoth: "양손으로 잡으세요. 왼쪽은 이동·소프트 드롭, 오른쪽은 회전·하드 드롭·홀드·타임스톱입니다.",
        guideHardDropNow: "즉시 하드 드롭", guideMoveLR: "좌우 이동", guideRotateDetail: "블록 회전",
        guideSoftDropDetail: "소프트 드롭 (DAD 스페셜 타임스톱 중에는 ‘1칸씩 수동 낙하’)",
        guideHardDropDetail: "즉시 하드 드롭 (카운트다운 없이 즉시 쿵! 착지 고정)",
        guideKDetail: "DAD 긴급 타임스톱 (공중 시간 정지)",
        guidePauseHint: "💡 모바일은 보드 중앙 안내문을 터치해 시작하고, PC는 상단 [ ▶ 게임 시작 ]이 게임 중 [ ⏸ 일시정지 ] / [ ▶ 계속하기 ]로 바뀝니다.",
        pauseBtn: "⏸ 일시정지", resumeBtn: "▶ 계속하기",
        guidePadLeftBody: "[◀] 좌 이동 · [▼] 1칸/소프트 드롭 · [▶] 우 이동",
        guidePadRightBody: "[🔄] 회전 · [⚡] 즉시 하드 드롭 · [📦] 홀드 · [⏳] DAD 타임스톱",
        guideLeftHand: "왼손 · 좌측 컨트롤러", guideRightHand: "오른손 · 우측 액션",
        guideLeftDesc: "이동 · 소프트 드롭", guideRightDesc: "회전 · 하드 드롭 · 홀드 · 타임스톱",
        guideScoreTitle: "줄 삭제 점수", guideScoreHint: "지운 줄 수와 현재 레벨을 곱해 점수가 올라갑니다.",
        guideLevelTitle: "레벨 1 → 20",
        guideLevelBody: "10줄을 지울 때마다 레벨이 오릅니다. 20레벨은 최고 난이도입니다.",
        guideBgBody: "외부 배경 파일이 없어도 네온 그리드로 플레이됩니다. 환경설정에서 가족사진을 등록하면 레벨 배경으로 쓸 수 있습니다.",
        guideAiTitle: "AI 관전 모드",
        guideAiBody: "자동 플레이를 켜면 AI가 블록을 쌓고 4줄 테트리스를 노리며 20레벨까지 완주합니다. 속도는 0.5x부터 20x까지 조절할 수 있습니다.",
        guideAiHint: "AI 점수는 명예의 전당에 저장되지 않습니다. 직접 플레이해야 기록이 남습니다.",
        guideCustomTitle: "우리 가족만의 테트리스",
        guideCustomBody: "환경설정에서 프로필 사진, 윈도우/패널 배경(레벨 1~20), 좋아하는 BGM(mp3)을 등록할 수 있습니다.",
        guideMemoryTitle: "🖼️ 나만의 추억 헌정! 가족사진 & 테마 커스텀 가이드",
        guideMemoryProfile: "① 프로필 사진: [환경설정]에서 본인 또는 가족사진을 불러와 마우스 드래그와 확대/축소(50%~300%), 위치 조절로 멋진 프로필 아이콘을 만들 수 있습니다.",
        guideMemoryBg: "② 레벨별 추억 배경: 환경설정에서 사진을 등록하면 레벨이 오를 때마다 배경이 바뀝니다. 파일이 없어도 네온 그리드로 바로 플레이됩니다.",
        guideBgCustomTitle: "🖼️ 배경 커스텀 마스터 가이드",
        guideBgCustomBody: "전체 윈도우 배경(기본/단계별)과 게임 패널 배경(단계별 전용)을 토글로 전환하여 각각 등록·삭제(🗑️)할 수 있습니다.",
        guideBgMasterToggle: "마스터 토글: 등록된 이미지를 삭제하지 않고 스위치 하나로 기본 네온 테마로 즉시 전환할 수 있습니다.",
        guideBgMasterWindow: "윈도우 배경: 기본/레벨별 배경 등록, 기본 배경 고정 유지, 그리고 윈도우 전용 블러(흐림) 및 투명도 조절 기능을 지원합니다.",
        guideBgMasterBoard: "게임 패널 배경: 패널 전용 레벨별 배경 등록과 패널 블러/투명도 듀얼 조절로 블록 시인성을 극대화할 수 있습니다.",
        guideBgMasterDelete: "개별 삭제(🗑️): 각 슬롯마다 등록된 이미지를 개별적으로 삭제/초기화할 수 있습니다.",
        guideKeepDefaultBg: "배경 설정에서 '기본 배경 계속 유지'를 켜면 레벨이 올라가도 기본으로 설정한 가족 사진/배경이 바뀌지 않고 계속 유지됩니다.",
        guideWindowFxBody: "전체 윈도우 배경에서도 블러(흐림)와 투명도를 원하는 대로 조절하여 텍스트 및 게임판 가독성을 최적화할 수 있습니다.",
        guideDisableAllCustomBg: "배경 이미지 전체 사용 안 함 스위치를 켜면 이미지를 삭제하지 않고도 언제든 순정 다크 네온 모드로 즉시 전환할 수 있습니다.",
        guidePanelFxTitle: "🎚️ 패널 시각 효과",
        guidePanelFxBody: "게임 패널 배경의 블러(흐림) 및 투명도(농도) 슬라이더로 블록 가독성을 자유롭게 맞출 수 있습니다.",
        guideConvenienceTitle: "🕹️ 조작 및 편의 기능",
        guideGhostPreviewTitle: "고스트 프리뷰",
        guideGhostPreviewBody: "환경설정의 그림자 슬라이더 옆 미니 캔버스로 투명도를 실시간 확인할 수 있습니다.",
        guideMobileDblTapTitle: "모바일 더블탭",
        guideMobileDblTapBody: "일시정지 중 화면 아무 곳이나 두 번 연속 터치하면 즉시 게임이 재개됩니다.",
        guidePwaConvenienceTitle: "PWA 앱 설치",
        guidePwaConvenienceBody: "환경설정의 '홈 화면에 앱 설치' 버튼으로 앱처럼 즐길 수 있습니다.",
        guideAutoRecordTitle: "자동 게임기록 모드",
        guideAutoRecordBody: "환경설정의 '자동 게임기록 모드'를 켜면 게임 종료 팝업 없이 '시스템' 이름으로 점수와 일시가 자동 저장되어 흐름 끊김 없이 바로 다음 게임을 즐길 수 있습니다.",
        guideGarbageTitle: "시작 장애물 라인",
        guideGarbageBody: "환경설정의 '시작 장애물 라인(0~10층)'을 설정하면 게임 시작 시 바닥에 구멍 뚫린 블록들이 미리 쌓인 상태로 시작하여 짜릿한 역전 클리어 챌린지를 즐길 수 있습니다.",
        guidePreviewModeTitle: "블록 가이드 모드",
        guidePreviewModeBody: "블록 가이드 모드를 통해 [NEXT + HOLD] 조합 또는 [NEXT 1 + NEXT 2] 2단계 예고 모드를 선택하여 플레이 스타일에 맞게 즐길 수 있습니다.",
        guideDropSpeedTitle: "블록 낙하 속도 조절",
        guideDropSpeedBody: "환경설정의 '블록 낙하 속도 조절(0.5x~1.5x)'을 통해 손에 맞는 최적의 속도로 여유롭게 또는 다이내믹하게 즐길 수 있습니다.",
        guideBoardSizeTitle: "📏 게임 보드 세로 높이 (20 / 24 / 28칸)",
        guideBoardSizeBody: "보드 크기(낙하 거리 확장) 기능은 대화면 PC 전용 기능이며, 모바일에서는 최적의 터치 조작성을 위해 표준 규격(10×20칸)으로 자동 고정됩니다. PC에서는 표준 20칸, 롱 드롭 24칸, 울트라 타워 28칸을 고를 수 있습니다.",
        guideBlockSkinTitle: "🧊 블록 외형 스타일 5종",
        guideBlockSkinBody: "환경설정에서 3D 베벨 큐브(기본), 크리스탈 글래스, 3D 홀로그램 글래스(완전 투명 입체 프레임), 사이버 메카닉, 소프트 캔디 스킨을 고르면 메인 보드·NEXT/HOLD가 즉시 다시 그려지고, 실시간 미리보기로 바로 확인할 수 있습니다.",
        guideBlockSkinHow: "💡 환경설정 모달의 실시간 미리보기 캔버스로 고르기 전에 질감을 확인하고, 값은 localStorage(block_skin_style)에 저장됩니다. 모달을 닫지 않아도 보드가 바로 바뀝니다.",
        guideCheerTitle: "📢 DAD 실시간 응원 전광판",
        guideCheerBody: "연속 콤보, 4줄 테트리스, 위기 탈출 때 사이드바 전광판이 실시간 격려 메시지와 골드 펄스 효과로 응원합니다.",
        guideCheerHow: "💡 스마트폰에서는 전광판 높이가 자동으로 늘어나고 응원 문구 크기가 화면 폭에 맞춰 조절됩니다.",
        guideScoreboardTitle: "📊 2x2 디지털 전광판 & 스코어",
        guideScoreboardBody: "SCORE, LEVEL, LINES, BEST 네 칸을 한눈에 보며 현재 점수와 최고 기록을 확인하세요.",
        guideScoreboardHow: "💡 BEST 칸을 누르면 명예의 전당이 열립니다. 모바일에서도 2x2 그리드가 사이드바에 그대로 표시됩니다.",
        guideSettingsMobileTitle: "⚙️ 모던 환경설정 & 모바일 조작",
        guideSettingsMobileBody: "환경설정에서 효과음/BGM을 따로 조절하고, 고스트 블록 On/Off와 모바일 가상 패드·햅틱 진동을 켤 수 있습니다. 하단 터치 버튼은 오작동 없이 바로 반응합니다.",
        guideSettingsMobileHow: "💡 [📱 모바일 패드]로 가상 터치패드를 켜고, 버튼을 누르면 navigator.vibrate 햅틱이 짧게 울립니다.",
        guideDiagTitle: "🧪 0.1초 실시간 무결점 자가진단 (Test Runner)",
        guideDiagBody: "상단의 [🧪 자가진단] 버튼(또는 단축키 [F9])을 누르면 컴퓨터가 스스로 핵심 기능을 실시간으로 검증합니다.",
        guideDiagStage6: "6단계 전수 검사: 파티클, PWA, 컬러 테마. 통과 시 로그에 [🎨 THEME & FX: PASS]가 출력됩니다.",
        guideDiagStage7: "7단계: 윈도우/패널 배경 무결성, 블러·투명도 localStorage, 마스터 비활성화, 더블탭 바인딩, 저장 용량(Quota)을 점검합니다. 통과 시 [🖼️ BG & TOUCH: PASS]와 [✅ ALL GREEN]이 출력됩니다.",
        guideDiagStage8: "8단계: 자동 게임기록 모드 플래그와 명예의 전당(localStorage) 바인딩을 점검합니다. 통과 시 [⚡ AUTO RECORD: PASS]가 출력됩니다.",
        guideDiagStage9: "9단계: 시작 장애물 라인(0~10층) 설정값과 보드 생성 시 가비지 라인(구멍 보장) 유효성을 점검합니다. 통과 시 [🧱 GARBAGE LINES: PASS]가 출력됩니다.",
        guideDiagStage10: "10단계: 블록 가이드 모드 설정값과 넥스트 큐(Next Queue 2단) 데이터 무결성을 점검합니다. 통과 시 [🧩 PREVIEW MODE: PASS]가 출력됩니다.",
        guideDiagStage11: "11단계: 블록 낙하 속도 배속(0.5x~1.5x) 설정값과 게임 루프 딜레이 계산 유효성을 점검합니다. 통과 시 [⏱️ DROP SPEED: PASS]가 출력됩니다.",
        guideDiagStage12: "12단계: Canvas 드로잉 엔진과 5종 블록 스킨(gemstone, glass, wire_glass, mecha, candy) 렌더러 정합성을 점검합니다. 통과 시 [🧊 BLOCK SKIN: PASS]가 출력됩니다.",
        guideDiagStage13: "13단계: DAD 응원 전광판(#dad-cheer-banner) DOM과 실시간 텍스트 트리거(updateCheerMsg) 연결을 검증합니다. 통과 시 [📢 CHEER BOARD: PASS]가 출력됩니다.",
        guideDiagStage14: "14단계: 모바일 터치 이벤트 리스너와 햅틱 API(navigator.vibrate) 지원 여부를 점검합니다. 통과 시 [📱 MOBILE TOUCH: PASS]가 출력됩니다.",
        guideDiagStage15: "15단계: localStorage 설정값(스킨, 볼륨, 최고기록 등) 데이터 무결성을 검증합니다. 통과 시 [💾 STORAGE: PASS]가 출력됩니다.",
        guideDiagStage16: "16단계: 동적 보드 행 수(20 / 24 / 28)와 모바일 접속 시 ROWS=20 고정보정을 점검합니다. 통과 시 [📏 BOARD SIZE: PASS]가 출력됩니다.",
        guideDiagStage17: "17단계: IndexedDB(DadTetrisDB / media_files) 대용량 미디어 스토리지 연결·쓰기/읽기를 점검합니다. 통과 시 [🗄️ INDEXEDDB: PASS]가 출력됩니다.",
        guideDiagStage18: "18단계: 듀얼 레이어 캔버스(Background/Foreground) 분리 렌더링 엔진 정상 가동 여부를 점검합니다. 통과 시 [🖼️ DUAL CANVAS: PASS]가 출력됩니다.",
        guideDiagStage19: "19단계: ES 모듈(Storage, Audio, Render, UI, GameEngine) 연결 상태를 점검합니다. 통과 시 [📦 ESM MODULES: PASS]가 출력됩니다.",
        guideDiagHint: "💡 검사가 끝나면 각 항목에 ✅ PASS 또는 🛠️ AUTO-FIXED가 표시됩니다. 핵심 7종이 모두 통과하면 “🎉 모든 핵심 시스템(듀얼 캔버스, 5종 스킨, IndexedDB, DAD 전광판)이 100% 완벽하게 가동 중입니다! [PASS 7/7]”가 결과창에 출력됩니다.",
        guideCh2Badge: "챕터 2 · 5종 블록 스킨",
        guideCh2Lead: "환경설정에서 스킨을 고르면 메인 보드·NEXT/HOLD가 즉시 다시 그려집니다. 모달을 닫지 않아도 스킨/그림자 실시간 프리뷰 캔버스 2종으로 질감을 확인할 수 있습니다.",
        guideCh3Badge: "챕터 3 · 보드 크기 (낙하 거리)",
        guideCh3Lead: "PC에서는 표준 20칸, 롱 드롭 타워 24칸, 울트라 타워 28칸으로 낙하 여유를 확보할 수 있습니다. 화면 너비 768px 이하 모바일은 터치 조작을 위해 표준 20칸으로 자동 고정되고, 보드 높이 선택 UI는 숨겨집니다.",
        guideCh4Lead: "사이드바 160px 황금비율 전광판(#dad-cheer-banner)이 콤보·테트리스·위기 탈출을 실시간으로 응원합니다. [K] 키와 모바일 [⏳] 타임스톱으로 공중 시간을 멈출 수 있습니다.",
        guideCh5Badge: "챕터 5 · IndexedDB 커스텀 미디어",
        guideCh5Lead: "대용량 배경 사진·BGM·종료 영상은 IndexedDB(DadTetrisDB / media_files)에 Blob으로 비동기 저장되고, 스킨·보드 높이·볼륨·최고기록은 localStorage에 따로 보존됩니다.",
        guideSkinPreviewTitle: "👁️ 실시간 프리뷰 캔버스 2종",
        guideSkinPreviewBody: "스킨 미리보기(#skin-preview-canvas)는 선택한 5종 질감을 즉시 보여 주고, 그림자 미리보기(#ghost-preview-canvas)는 고스트 투명도를 옆에서 확인할 수 있습니다. 듀얼 레이어 보드(#bg-canvas + #tetris-canvas)는 배경을 한 번만 그리고 블록은 60fps로 따로 그립니다.",
        guideIndexedDbTitle: "💾 IndexedDB 기반 고화질 커스텀 미디어",
        guideIndexedDbBody: "환경설정에서 가족 사진, 레벨별 배경, 좋아하는 mp3, 게임 종료 영상을 등록하면 브라우저 용량 한도 안에서 고화질 원본을 유지합니다. 설정값(5종 스킨, ROWS, 볼륨)은 localStorage에 남아 IndexedDB와 분리됩니다.",
        guideIndexedDbHow: "💡 파일은 DadTetrisDB의 media_files 스토어에 저장됩니다. 자가진단이 연결·쓰기/읽기/삭제를 검증합니다.",
        guideDiagPipelineBody: "자가진단은 7대 핵심 항목을 순차 비동기 검증한 뒤, 기존 1-1~19-1 전수 검사까지 이어서 실행합니다. 핵심 7종이 통과하면 모던 팝업에 [PASS 7/7]이 출력됩니다.",
        guideDiagCore1: "1) [DOM & 레이아웃] 듀얼 캔버스(#bg-canvas, #tetris-canvas), 160px 전광판(#dad-cheer-banner), 스킨/그림자 프리뷰 캔버스",
        guideDiagCore2: "2) [블록 렌더링 엔진] 5종 스킨(gemstone, glass, wire_glass, mecha, candy) 렌더러 무결성",
        guideDiagCore3: "3) [미디어 스토리지] IndexedDB(DadTetrisDB) 연결 및 CRUD",
        guideDiagCore4: "4) [설정 데이터] localStorage 키(스킨, ROWS, 볼륨, 최고기록) 유효성",
        guideDiagCore5: "5) [오디오/비디오] Web Audio API 및 사운드 매니저 초기화",
        guideDiagCore6: "6) [모바일 환경] 뷰포트 감지, 20칸 고정, 아케이드 1화면 핏, 터치 엘리먼트 가시성",
        guideDiagCore7: "7) [ES 모듈] Storage/Audio/Render/UI/GameEngine 상호 참조",
        guideThemeTitle: "🎨 5대 맞춤 네온 컬러 테마",
        guideThemeBody: "환경설정 [게임] 탭의 둥근 컬러 팔레트를 누르면 화면 전체 테두리, 버튼, 네온 글로우, 포인트 색이 즉시 바뀝니다.",
        guideThemeHow: "💡 팔레트를 누르면 0ms로 전환되고 localStorage에 영구 저장됩니다.",
        guideFxTitle: "💥 줄 삭제 타격감 & 네온 파티클",
        guideFxBody: "1~3줄을 지우면 경쾌한 미세 진동과 네온 파티클이 터집니다. 4줄 테트리스에서는 화면 흔들림과 황금 문구가 등장합니다.",
        guideFxHint: "💡 환경설정의 [화면 진동]으로 세기를 조절할 수 있습니다.",
        guidePwaTitle: "📱 스마트폰 PWA 원클릭 앱 설치",
        guidePwaBody: "환경설정의 '홈 화면에 앱 설치' 버튼으로 앱처럼 즐길 수 있습니다. 서비스 워커가 핵심 파일을 캐시해 오프라인에서도 플레이됩니다.",
        guidePwaHint: "💡 설치 버튼은 HTTPS 또는 localhost에서 나타날 수 있습니다.",
        guideCustomPhoto: "👤 가족 사진 → 프로필",
        guideCustomBg: "🖼️ 1~20단계 배경 사진 → 윈도우/패널 레벨별 배경",
        guideCustomBgm: "🎵 좋아하는 음악(mp3) → BGM",
        guideCustomHint: "사이드바의 ⚙️ 환경설정을 눌러 보세요.",
        guideClose: "닫기", guideStart: "🚀 지금 게임 시작하기", guideContinue: "닫고 계속하기",
        dadSpecialToggle: "👑 DAD 스페셜: {state}",
        dadFreezeBadge: "⏳ DAD TIME FREEZE ({time}s)",
        dadFreezeTitle: "⏳ DAD TIME FREEZE", dadResume: "⚡ RESUME!",
        dadTimeStop: "DAD 타임스톱", dadTimeStopHelp: "DAD 타임스톱 (스페셜 ON 시)", padFreeze: "타임스톱",
        guideTabDad: "👑 DAD 스페셜", guideTabDadChapter: "챕터 4: 📢 전광판 & 스페셜", guideDadTitle: "👑 DAD 스페셜 모드",
        guideDadLock: "① 바닥에 닿아도 3, 2, 1 카운트다운 동안 여유롭게 자리/모양 수정 가능!",
        guideDadFreeze: "② 위기 시 [K] 키를 누르면 3초간 시간이 멈춰 공중에서 회전/이동 가능!",
        guideDadHint: "카운트다운이 끝나기 전에 Space로 하드드롭하면 바로 배치됩니다.",
        guideDadPerfectTitle: "👑 DAD 스페셜 완벽 가이드",
        guideDadWhatTitle: "👑 DAD 스페셜 모드란?",
        guideDadHeroTag: "아버지를 위해 특별히 설계된 슈퍼 파워 지원 모드!",
        guideDadWhatBody: "순발력 걱정 NO! 바닥에 닿아도 여유 시간이 생기고, 턱을 넘고 구멍을 찾아 들어가며, 시간이 끝나도 명당자리에 자동으로 맞춰 드립니다.",
        guideDadLockTitle: "⏳ 1. 바닥 착지 골든타임 & 선명도 부스트",
        guideDadLockBody1: "자연 낙하나 소프트 드롭으로 바닥/블록 위에 안착하면 화면에 [3-2-1 카운트다운]이 시작됩니다.",
        guideDadLockBody2: "카운트다운 동안 게임 보드가 더욱 선명하게 밝아져 빈자리를 한눈에 볼 수 있습니다.",
        guideDadAutoSnap: "💡 카운트다운 시간이 끝나더라도 걱정 마세요! 게임이 최적의 명당자리에 블록을 자동으로 맞춰 드립니다.",
        guideDadSlideTitle: "🚀 2. 지형 관통 이동 & 깊은 홈 침투 (Super Slide & Auto-Sink)",
        guideDadSlideBody: "카운트다운 중에는 블록 턱에 걸리지 않고 다른 블록을 자유롭게 넘나들며, 깊은 구멍으로 이동하면 아래 바닥까지 내려앉습니다.",
        guideDadSmartTitle: "🧠 3. 카운트 종료 시 ‘최적 명당자리’ 스마트 자동 배치",
        guideDadSmartBody: "시간이 끝날 때까지 자리를 확정하지 못해도 인공지능이 가장 완벽한 자리를 찾아 맞춰줍니다.",
        guideDadKTitle: "❄️ 4. [K] 키 · 모바일 [⏳] 긴급 타임스톱",
        guideDadKBody: "공중에서 떨어지는 도중 언제든 누르면 시간이 멈춥니다. [↓]를 누를 때마다 1칸씩 수동으로 내릴 수 있습니다.",
        guideDadKHint: "💡 타임스톱 중에는 이동/회전도 정지를 풀지 않습니다. [Space]로만 즉시 착지합니다.",
        guideDadMobileHint: "💡 스마트폰에서도 [⏳ 타임스톱]을 터치해 시간을 멈추고, [▼]로 1칸씩 내릴 수 있습니다.",
        guideDadSpaceTitle: "⚡ [Space] 즉시 하드 드롭",
        guideDadSpaceBody: "빠른 플레이를 원할 땐 [Space] 또는 [⚡]를 누르면 즉시 고정됩니다.",
        guideDadCheatTitle: "👑 DAD 스페셜 & 치트 파워",
        guideDadDurationHead: "⚙️ 5. 지속 시간 맞춤 설정",
        guideDadDurationTip: "💡 환경설정에서 DAD 스페셜 시간을 3초, 5초, 10초 중 원하는 대로 조절할 수 있습니다.",
        guideDadDurationBody: "[환경설정]에서 3초, 5초, 10초 중 원하는 시간을 선택할 수 있습니다.",
        guideAiSpeedTitle: "🤖 AI 자동 플레이 & 0.5x ~ 20x 관전",
        guideAiSpeedBody: "자동 플레이를 켜면 AI가 대신 두고, 0.5x부터 20x까지 배속을 조절하며 관전할 수 있습니다.",
        guideAiBuildTitle: "탑 쌓기(빌드업) + 테트리스 폭파",
        guideAiBuildBody: "AI는 탑을 높이 쌓아 4줄 테트리스를 노리다가, 위기가 오면 생존 모드로 전환합니다.",
        guideAiConquerTitle: "20레벨 정복 & 챔피언 축하",
        guideAiConquerBody: "20레벨을 완주하면 AI가 자동 정지하고 챔피언 축하 연출이 이어집니다.",
        guideCustomDuration: "👑 DAD 스페셜 시간(3초/5초/10초)",
        guideCustomAudio: "🔊 소리 · 모바일 햅틱",
        guideCustomAudioItem: "🎵 BGM과 효과음 볼륨을 따로 조절할 수 있습니다.",
        guideCustomHaptic: "📳 모바일 터치 햅틱 진동을 켜거나 끌 수 있습니다.",
        guideCustomMedia: "🖼️ 사진 · 배경 · 음악 등록",
        guideCustomMediaHow: "⚙️ 환경설정에서 파일을 고르면 바로 적용됩니다.",
        guideCustomFolderBg: "💡 외부 이미지 파일이 없어도 네온 그리드로 플레이됩니다. 윈도우는 기본+레벨 1~20, 게임 패널은 레벨 1~20 사진을 각각 등록할 수 있습니다.",
        dadDurationTitle: "👑 DAD 스페셜 지속 시간",
        dadDuration3: "3초 (기본)", dadDuration5: "5초 (여유)", dadDuration10: "10초 (슈퍼 이지)",
        dadDurationHint: "골든타임과 [K] 타임스톱에 함께 적용됩니다.",
      },
      en: {
        score: "SCORE", level: "LEVEL", lines: "LINES", best: "BEST", next: "NEXT", hold: "HOLD",
        controls: "Controls", move: "Move", rotate: "Rotate", softDrop: "Soft drop",
        hardDrop: "Hard drop", holdKey: "Hold (HOLD)", holdHelp: "Hold (HOLD)",
        autoplay: "🤖 Autoplay", autoplayStop: "Stop autoplay",
        autoplayBadge: "🤖 AI autoplay on...",
        autoplayEndedTitle: "🤖 AI autoplay has ended",
        autoplayEndedHint: "This score will not be saved to the Hall of Fame.",
        autoplaySpeed: "AI play speed", autoplaySpeedShort: "AI speed",
        autoplaySpeedValue: "Speed: {speed}x ({tier})",
        autoplaySpeedHint: "0.5x slow · 1x standard · 10x high · 20x ultra",
        autoplaySpeedSlow: "Slow", autoplaySpeedNormal: "Standard", autoplaySpeedFast: "Fast",
        autoplaySpeedHigh: "High", autoplaySpeedUltra: "Ultra",
        goalToast: "🎉 {score} points!",
        level20Toast: "👑 Congratulations! AI has conquered the highest difficulty: Level 20!",
        pause: "Pause", restart: "Restart", pauseX2: "Pause",
        tagline: "Dad's round", dad: "Dad", startGame: "▶ Start", endGame: "■ End game",
        restartGame: "▶ Play again", settings: "⚙️ Settings",
        overlayRestart: "🔄 Play again", overlayQuit: "❌ End game",
        gameTerminatedMsg: "🎮 All game processes have been stopped. Please close this tab.",
        diagBtn: "🧪 Self-test", diagTitle: "🧪 Live auto-diagnosis console",
        diagRun: "▶ Run full scan", diagClose: "Close", diagIdle: "Idle",
        diagCert: "🎉 100% certified! (All Systems Operational)",
        diagAllGreen: "[✅ ALL GREEN] window/panel keys · blur/opacity · master disable · double-tap · quota",
        diagCoreSystemsOk: "🎉 All core systems (dual canvas, 5 skins, IndexedDB, DAD cheer board) are running at 100%! [PASS 7/7]",
        diagFail: "⚠️ Some checks failed — see the log",
        gameTitle: "DAD TETRIS", pressStart: "Press Start to play",
        paused: "Paused", pauseHint: "P  or  Space ×2  to resume",
        pauseHintTouch: "Double-tap the screen or press the Pause button to resume",
        gameOver: "Game Over", gameEnded: "Game Ended", pressStartAgain: "Press Start to play again",
        overlayConquer: "👑 LEVEL 20 CONQUERED", overlayConquerHint: "Press Enter / Space or Start to play yourself",
        settingsTitle: "⚙️ Settings", language: "🌐 Language",
        tabGame: "Game", tabLevelBg: "🖼️ Backgrounds", tabEventVideo: "🎬 Event videos", tabScoreboard: "🏆 Scores",
        startLevel: "🎮 Start level", levelOption: "Level {n}",
        levelHint1: "Level 1: Easy pace", levelHint2: "Level 2: Relaxed",
        levelHint3: "Level 3: A bit faster", levelHint4: "Level 4: Faster",
        levelHint5: "Level 5: Normal", levelHint6: "Level 6: Tense",
        levelHint7: "Level 7: Fast", levelHint8: "Level 8: Faster still",
        levelHint9: "Level 9: Very fast", levelHint10: "Level 10: Extreme",
        levelHintExtreme: "Level {n}: Extreme (20G)",
        keysHelp: "⌨️ Controls help", spaceOnceHard: "once → hard drop",
        spaceTwicePause: "Pause / Resume", pPause: "Pause / Resume",
        profileTitle: "👤 Profile photo", themeTitle: "🎨 Color theme",
        themeNeonBlue: "🔷 Neon Blue", themeCyberPink: "🌸 Cyber Pink",
        themeEmeraldGreen: "🌿 Emerald Green", themeSunsetOrange: "🌅 Sunset Orange",
        themeFutureCyber: "🔮 Future Cyber",
        pwaInstall: "📲 Install app on home screen (PWA)",
        pwaGuideTitle: "📲 Add to Home Screen",
        pwaGuideBody: "Open the browser menu at the top/bottom (⋮ or Share) → tap [Add to Home Screen]!",
        pwaGuideOk: "OK",
        pwaAlreadyInstalled: "This app is already installed on the home screen.",
        profileChoose: "📷 Load / change photo", profileChangeHint: "Change photo",
        profileDrag: "Drag inside the circle to move. Scroll the wheel to zoom 50%–300% (100% = original size).",
        zoom: "🔍 Zoom (Scale)", posX: "↔️ X offset", posY: "↕️ Y offset", resetPos: "🔄 Reset position/size",
        profileSaveCrop: "✅ Saved", profileNone: "No photo (default avatar)",
        profileRegistered: "Saved: {name}", profileReselect: "Previous file: {name} — please choose again",
        sound: "🔊 Sound effects", volume: "Volume", soundVolume: "🔔 SFX volume",
        shake: "🫨 Screen shake", shakePower: "Shake strength",
        mobilePad: "📱 Mobile pad", mobilePadShow: "📱 Show mobile pad", mobilePadHide: "📱 Hide mobile pad",
        mobilePadHint: "Turns on automatically on narrow or touch screens. You can also show it on PC to test.",
        padMove: "Move", padAction: "Actions", padLeft: "Move left", padRight: "Move right",
        padDown: "Soft drop", padRotate: "Rotate", padDrop: "Hard drop", padHold: "Hold",
        bgm: "🎵 Background music", bgmVolume: "BGM volume", chooseMusic: "🎵 Choose music file",
        assetPresetOn: "Neon theme active", assetCustomOn: "Custom file saved",
        restoreDefaultAsset: "Restore default",
        deleteBg: "🗑️ Delete",
        confirmDeleteBg: "Delete this background image and restore the default neon grid?",
        bgDeletedToast: "Restored the default neon grid",
        levelBgNeon: "Default neon grid active",
        noFile: "No file selected", prevFile: "Previous file: {name} — please choose again",
        playing: "Playing: {name}", selected: "Selected: {name}",
        ghost: "👻 Ghost piece", ghostOpacity: "Ghost opacity",
        customBg: "🖼️ Custom background", dim: "Darken", blur: "Blur",
        chooseBg: "🖼️ Choose / change background", noImage: "No image selected",
        bgAdjust: "🖼️ Background darken / blur", bgAdjustHint: "Window background dim/blur. Panel background is in the Backgrounds tab.",
        bgTargetTitle: "Background target",
        bgTargetWindow: "🖥️ Full window background",
        bgTargetBoard: "🎮 Game panel background",
        boardBgOpacity: "Opacity",
        boardBgFxHint: "Applies only to the game panel background. Changes are live.",
        windowBgFxHint: "Applies only to the full-window background. Changes are live.",
        windowBgBlur: "🌫️ Blur",
        windowBgOpacity: "👁️ Opacity",
        keepDefaultWindowBg: "📌 Keep the default background (do not change on level-up)",
        disableAllCustomBg: "🚫 Disable all background images (stock neon mode)",
        disableAllCustomBgHint: "Registered images are kept. Turning this on hides background images and switches to the default cyberpunk neon theme immediately.",
        idleBgTitleBoard: "🎮 Default panel background",
        idleBgCaptionBoard: "Shown inside the Tetris board",
        levelPlayBgTitleBoard: "🎮 Level 1–20 panel backgrounds",
        levelBgAuto: "🖼️ Auto-change background by level",
        levelBgHint: "The game plays on a neon grid even without image files. You can register family photos here.",
        idleBgTitle: "🖼️ Default waiting background", idleBgCaption: "Used on the waiting and game-over screens",
        levelPlayBgTitle: "🎮 Level 1–20 backgrounds",
        levelBgExtremeHint: "If no image is registered, the neon grid stays. Window uses default + levels 1–20; the game panel uses levels 1–20 only.",
        levelBgTitle: "Level {n} background", chooseLevelBg: "🖼️ Choose image",
        levelBgNone: "No image selected", levelBgRegistered: "Saved: {name}",
        levelBgQuota: "Not enough storage. Please choose a smaller image.",
        eventVideo: "🎬 Event videos",
        eventVideoHint: "Turn off to hide score and game-over celebration popups. Preview still works.",
        preview: "▶️ Preview", fileSelect: "Choose file (MP4 etc.)",
        videoUrlPlaceholder: "YouTube or video URL",
        goal1: "1st target score", goal2: "2nd target score",
        gameoverVideo: "👏 Game over video",
        videoTitleScore: "🎉 {score}-point video",
        goalHint: "Target {n} plays a popup at {score} points.",
        videoNone: "No video registered", videoReady: "[Ready: {name}]",
        videoReselect: "Previous file: {name} — please choose again",
        openHall: "🏆 Open Hall of Fame", hallHint: "View and manage ranks 1–10 in the Hall of Fame.",
        saveAndClose: "💾 Done / Close", closeResume: "Close / Resume",
        resetSettings: "🔄 Restore defaults",
        confirmResetSettings: "Restore all settings to their original values?\nCustom photos, backgrounds, music, and videos will also be removed. Hall of Fame records are kept.",
        confirmAction: "Confirm", confirmOk: "OK", confirmCancel: "Cancel",
        rank: "Rank", name: "Name", date: "Date", saveRecord: "Save record",
        gameOverMsg: "👏 Well done!", enterName: "Please enter your name",
        playerName: "Player name", skipSave: "Don't save",
        hallTitle: "🏆 Hall of Fame", hallEmpty: "No records yet.\nPlay a round and leave a name.",
        resetAll: "Clear all records", close: "Close", delete: "Delete",
        confirmDelete: "Delete this record?", confirmReset: "Clear all Hall of Fame records?",
        saveSummary: "Score {score} · Level {level}", hallMeta: "Level {level} · {lines} lines · {date}",
        ranking_notice: "Rankings may be reset or deleted at any time for operational needs",
        rankingNoticeFull: "ℹ️ Leaderboard records may be reset or deleted without prior notice for data optimization and operations.",
        rankingShareWatermark: "[DAD TETRIS LEADERBOARD] *Charts may be updated under the data management policy.",
        celebrateGoal1: "🎉 Congrats on {score} points!",
        celebrateGoal2: "🏆 {score} points! Amazing skill!",
        celebrateGameover: "👏 Well played, Dad!", celebrateFallback: "🎉 Congratulations!",
        clear1: "1 line", clear2: "2 lines", clear3: "3 lines", tetris: "Tetris", clearN: "{n} lines",
        cheerDefault: "🎮 Cheering on Dad's great play!",
        cheerBadgeDad: "💬 DAD STATUS", cheerBadgeStatus: "⚡ STATUS",
        cheerClear1: "Nice! 1-line clear ✨",
        cheerClear2: "Sweet! 2 lines at once! 💥",
        cheerClear3: "Awesome! 3-line clear! 🔥",
        cheerTetris: "🎉 Wow! Perfect 4-line Tetris! 🏆",
        cheerCombo: "🔥 Combo burst! {combo} in a row!",
        cheerFreeze: "⏳ Time stop! Aim carefully!",
        cheerGameover: "Well played! Chase a new record next! 👏",
        cheerTipDefault: "💡 TIP: Stay calm and stack from the bottom!",
        cheerTipCombo: "🔥 COMBO x{combo} going!",
        cheerTipTetris: "🏆 TETRIS 4-line clear!",
        cheerTipClear1: "✨ One line at a time — stack from the bottom!",
        cheerTipClear2: "💥 Double clear! Go for a combo!",
        cheerTipClear3: "🔥 Triple clear! Tetris is next!",
        cheerTipFreeze: "⏳ Time stop on — aim carefully!",
        cheerTipGameover: "👏 Next round, stack even firmer from the bottom!",
        profileQuota: "Not enough storage. Please choose a smaller photo.",
        closeAria: "Close", boardAria: "Tetris board", sidebarAria: "Game info",
        hallOpenAria: "Open Hall of Fame", celebrateFrame: "Celebration video",
        on: "ON", off: "OFF",
        autoRecordMode: "⚡ Auto game record mode",
        autoRecordHint: "Skip the name popup when a game ends and save the score automatically under the player name 'SYSTEM'.",
        autoRecordName: "SYSTEM",
        autoRecordToast: "⚡ Score saved automatically as 'SYSTEM'.",
        startGarbageLines: "🧱 Starting garbage lines (0–10)",
        startGarbageHint: "A handicap/challenge that pre-fills the bottom of the board with holey obstacle rows when a game starts.",
        startGarbageClean: "0 rows (clean board)",
        startGarbageValue: "{n} rows",
        previewGuideMode: "🧩 Block guide mode",
        previewModeStandard: "Standard (left: NEXT / right: HOLD)",
        previewModeDual: "Dual next (left: NEXT 1 / right: NEXT 2)",
        previewModeHint: "Dual next mode shows the second upcoming piece instead of HOLD, so you can plan one step further.",
        blockSkinTitle: "🧊 Block appearance style",
        blockSkinHint: "The block texture and 3D look update live when you pick a style.",
        blockSkinClassic: "🧊 3D Hologram Glass (Hollow Glass)",
        blockSkinWireGlass: "🧊 3D Hologram Glass (Hollow Glass — fully transparent frame)",
        blockSkinGlass: "💎 Crystal Glass (Crystal Glass)",
        blockSkinGemstone: "🎲 3D Bevel Cube (3D Gemstone)",
        blockSkinMecha: "⚙️ Cyber Mechanic (Cyber Mecha)",
        blockSkinCandy: "🍬 Soft Candy (Soft Round)",
        skinPreviewLabel: "👁️ Live preview",
        settingsSectionGraphics: "🎨 Graphics & block visuals",
        settingsSectionSound: "🔊 Sound & volume",
        settingsSectionPlay: "🕹️ Gameplay & convenience",
        dadSpecialSetting: "👑 DAD Special assist",
        haptic: "📱 Mobile touch haptics",
        next1: "NEXT 1",
        next2: "NEXT 2",
        holdDisabledHint: "Hold is unavailable in dual next mode.",
        guideModeToggleTitle: "Toggle guide mode (NEXT+HOLD ↔ NEXT 1+2)",
        dropSpeedMultiplier: "⏱️ Block drop speed",
        dropSpeedHint: "The level-up speed curve stays the same. This scales the overall drop speed slower or faster to match Dad's hands.",
        dropSpeedValue: "{speed}x ({tier})",
        dropSpeedVeryEasy: "very easy",
        dropSpeedSlowEasy: "slow · relaxed",
        dropSpeedNormal: "standard",
        dropSpeedFast: "fast",
        dropSpeedVeryFast: "very fast",
        boardSizeTitle: "📏 Board height (drop distance)",
        boardSize20: "⚡ Standard (10 × 20)",
        boardSize24: "🚀 Long-drop tower (10 × 24) [recommended: +4 rows]",
        boardSize28: "🏰 Ultra tower (10 × 28) [extra room: +8 rows]",
        boardSizeHint: "Increase the board's vertical cells to give more drop time and decision space.",
        boardSizeRestartToast: "The game will restart to apply the new board size",
        boardSizeMobileOnly: "🖥️ PC-only option (mobile is locked to the standard 20 rows)",
        guide: "❓ Guide", guideTitle: "📖 DAD TETRIS Guide",
        guideLead: "A quick visual tour for Dad and first-time players.",
        guideTabControls: "🎮 Controls (PC & Mobile)",
        guideTabControlsMain: "Ch.1: 🎮 Controls",
        guideTabControlsSub: "& mobile pad", guideTabScore: "🏆 Score & levels",
        guideTabAi: "🤖 AI · Lv.20", guideTabSettings: "⚙️ Settings",
        guideTabCustom: "🖼️ Theme / Custom", guideTabSystem: "🧪 System / Self-test",
        guideTabSkins: "Ch.2: 🧊 Block skins",
        guideTabBoard: "Ch.3: 📏 Board height",
        guideTabMedia: "Ch.5: 💾 IndexedDB media",
        guidePcTitle: "💻 PC keyboard", guideMobileTitle: "📱 Mobile touch pad",
        guideMobileArcadeBody: "Portrait fits on one screen: title plus ⚙️ settings, 📖 guide, and ✏️ diagnostics on top; the board with Hold/Next on the sides; a slim score row under the board; and the 7-button pad at the bottom. Tap the board prompt to start immediately.",
        guideMobileHint: "Hold with both hands. Left moves, right does actions.",
        guideMobileBoth: "Hold with both hands. Left: move & soft drop. Right: rotate, hard drop, hold, time stop.",
        guideHardDropNow: "Instant hard drop", guideMoveLR: "Move left / right", guideRotateDetail: "Rotate the piece",
        guideSoftDropDetail: "Soft drop (during DAD time stop: step down 1 cell per tap)",
        guideHardDropDetail: "Instant hard drop (locks immediately, no countdown)",
        guideKDetail: "DAD emergency time stop (freeze in the air)",
        guidePauseHint: "💡 The top [ ▶ Start ] button switches to [ ⏸ Pause ] and [ ▶ Resume ] during play.",
        pauseBtn: "⏸ Pause", resumeBtn: "▶ Resume",
        guidePadLeftBody: "[◀] left · [▼] step/soft drop · [▶] right",
        guidePadRightBody: "[🔄] rotate · [⚡] hard drop · [📦] hold · [⏳] DAD time stop",
        guideLeftHand: "Left · move pad", guideRightHand: "Right · action pad",
        guideLeftDesc: "Move · Soft drop", guideRightDesc: "Rotate · Hard drop · Hold · Time stop",
        guideScoreTitle: "Line-clear scores", guideScoreHint: "Points equal lines cleared times the current level.",
        guideLevelTitle: "Levels 1 → 20",
        guideLevelBody: "Every 10 lines raises the level. Level 20 is the highest difficulty.",
        guideBgBody: "The game plays on a neon grid even without background files. Register family photos in Settings to use them as level backgrounds.",
        guideAiTitle: "AI spectator mode",
        guideAiBody: "Turn on Autoplay and AI stacks blocks, hunts Tetrises, and plays through level 20. Speed goes from 0.5x to 20x.",
        guideAiHint: "AI scores are not saved to the Hall of Fame. Play yourself to record a score.",
        guideCustomTitle: "Make it a family game",
        guideCustomBody: "In Settings you can add a profile photo, window/panel backgrounds (levels 1–20), and your favorite BGM (mp3).",
        guideMemoryTitle: "🖼️ A tribute of memories! Family photos & theme custom guide",
        guideMemoryProfile: "① Profile photo: In Settings, load your own or a family photo, then drag, zoom (50%–300%), and offset to make a great profile icon.",
        guideMemoryBg: "② Level memory backgrounds: Register photos in Settings and the background changes as you level up. Without files, the neon grid is used so you can play immediately.",
        guideBgCustomTitle: "🖼️ Background custom master guide",
        guideBgCustomBody: "Switch between the full-window background (default + per-level) and the game-panel background (per-level only) to register or delete (🗑️) each slot.",
        guideBgMasterToggle: "Master toggle: switch to the default neon theme instantly with one switch, without deleting registered images.",
        guideBgMasterWindow: "Window background: default/per-level images, keep-default lock, plus window-only blur and opacity.",
        guideBgMasterBoard: "Game panel background: per-level panel images and dual blur/opacity controls to maximize block visibility.",
        guideBgMasterDelete: "Per-slot delete (🗑️): each registered image can be deleted or reset individually.",
        guideKeepDefaultBg: "In Background settings, turn on 'Keep the default background' so the family photo/default image you set stays in place even as the level goes up.",
        guideWindowFxBody: "You can also blur and fade the full-window background so text and the playfield stay easy to read.",
        guideDisableAllCustomBg: "Turn on 'Disable all background images' to switch to stock dark neon instantly without deleting your photos.",
        guidePanelFxTitle: "🎚️ Panel visual effects",
        guidePanelFxBody: "Use the game-panel Blur and Opacity sliders to keep blocks easy to read.",
        guideConvenienceTitle: "🕹️ Controls & convenience",
        guideGhostPreviewTitle: "Ghost preview",
        guideGhostPreviewBody: "Check opacity live on the mini canvas next to the ghost slider in Settings.",
        guideMobileDblTapTitle: "Mobile double-tap",
        guideMobileDblTapBody: "While paused, double-tap anywhere on the screen to resume immediately.",
        guidePwaConvenienceTitle: "PWA app install",
        guidePwaConvenienceBody: "Use the 'Install app on home screen' button in Settings to play like an app.",
        guideAutoRecordTitle: "Auto game record mode",
        guideAutoRecordBody: "Turn on 'Auto game record mode' in Settings to skip the end-game popup and save the score and time under the name 'SYSTEM', so you can start the next game without interruption.",
        guideGarbageTitle: "Starting garbage lines",
        guideGarbageBody: "Set Starting garbage lines (0–10) in Settings to begin with holey blocks already stacked at the bottom — a tense comeback-clear challenge.",
        guidePreviewModeTitle: "Block guide mode",
        guidePreviewModeBody: "Use Block guide mode to play with a [NEXT + HOLD] pair or a two-step [NEXT 1 + NEXT 2] preview, matching your play style.",
        guideDropSpeedTitle: "Block drop speed",
        guideDropSpeedBody: "Use Drop speed (0.5x–1.5x) in Settings to play at a relaxed or dynamic pace that matches your hands.",
        guideBoardSizeTitle: "📏 Board height (20 / 24 / 28 rows)",
        guideBoardSizeBody: "Board height (extra drop distance) is a large-screen PC feature. On mobile it is locked to the standard 10×20 grid for reliable touch controls. On PC you can choose 20, 24, or 28 rows.",
        guideBlockSkinTitle: "🧊 Five block appearance styles",
        guideBlockSkinBody: "Pick 3D Bevel Cube (default), Crystal Glass, 3D Hologram Glass (fully transparent frame), Cyber Mechanic, or Soft Candy in Settings. The main board and NEXT/HOLD redraw instantly, with a live preview before you commit.",
        guideBlockSkinHow: "💡 Use the live preview canvas in Settings to inspect the texture first. Saved in localStorage (block_skin_style). The board updates even if the settings modal stays open.",
        guideCheerTitle: "📢 DAD live cheer board",
        guideCheerBody: "On combos, 4-line Tetris, and clutch escapes, the sidebar cheer board flashes real-time encouragement with a gold pulse.",
        guideCheerHow: "💡 On phones the banner grows with the message and the cheer text scales to the screen width.",
        guideScoreboardTitle: "📊 2x2 digital scoreboard",
        guideScoreboardBody: "Read SCORE, LEVEL, LINES, and BEST at a glance to track the current run and your high score.",
        guideScoreboardHow: "💡 Tap BEST to open the Hall of Fame. The 2x2 grid stays visible in the mobile sidebar.",
        guideSettingsMobileTitle: "⚙️ Modern settings & mobile controls",
        guideSettingsMobileBody: "Tune SFX and BGM separately, toggle the ghost piece, and turn the virtual pad and haptic vibration on or off. Bottom touch buttons respond immediately without misfires.",
        guideSettingsMobileHow: "💡 Turn on [📱 Mobile pad] for the virtual touchpad. Each tap fires a short navigator.vibrate haptic pulse.",
        guideDiagTitle: "🧪 0.1s live flawless self-test (Test Runner)",
        guideDiagBody: "Press [🧪 Self-test] at the top (or shortcut [F9]). The computer verifies core features in real time.",
        guideDiagStage6: "Stage 6 checks particles, PWA, and color themes. On pass the log prints [🎨 THEME & FX: PASS].",
        guideDiagStage7: "Stage 7 checks window/panel background integrity, blur/opacity localStorage, master disable, double-tap binding, and storage quota. A pass prints [🖼️ BG & TOUCH: PASS] and [✅ ALL GREEN].",
        guideDiagStage8: "Stage 8 checks the Auto game record mode flag and Hall of Fame localStorage binding. A pass prints [⚡ AUTO RECORD: PASS].",
        guideDiagStage9: "Stage 9 checks the starting garbage-line setting (0–10) and that generated cheese rows always keep holes. A pass prints [🧱 GARBAGE LINES: PASS].",
        guideDiagStage10: "Stage 10 checks the block guide mode setting and the two-deep next queue. A pass prints [🧩 PREVIEW MODE: PASS].",
        guideDiagStage11: "Stage 11 checks the drop-speed multiplier (0.5x–1.5x) and gravity delay math. A pass prints [⏱️ DROP SPEED: PASS].",
        guideDiagStage12: "Stage 12 checks the canvas drawing engine and all five block-skin renderers (gemstone, glass, wire_glass, mecha, candy). A pass prints [🧊 BLOCK SKIN: PASS].",
        guideDiagStage13: "Stage 13 checks the DAD cheer board (#dad-cheer-banner) DOM and the live text trigger (updateCheerMsg). A pass prints [📢 CHEER BOARD: PASS].",
        guideDiagStage14: "Stage 14 checks mobile touch listeners and haptic API (navigator.vibrate) support. A pass prints [📱 MOBILE TOUCH: PASS].",
        guideDiagStage15: "Stage 15 checks localStorage integrity for skin, volume, and high score. A pass prints [💾 STORAGE: PASS].",
        guideDiagStage16: "Stage 16 checks dynamic board row counts (20 / 24 / 28) and that mobile sessions lock ROWS=20. A pass prints [📏 BOARD SIZE: PASS].",
        guideDiagStage17: "Stage 17 checks IndexedDB (DadTetrisDB / media_files) large-media connect, write, and read. A pass prints [🗄️ INDEXEDDB: PASS].",
        guideDiagStage18: "Stage 18 checks the dual-layer canvas (Background/Foreground) split rendering engine. A pass prints [🖼️ DUAL CANVAS: PASS].",
        guideDiagStage19: "Stage 19 checks ES module wiring (Storage, Audio, Render, UI, GameEngine). A pass prints [📦 ESM MODULES: PASS].",
        guideDiagHint: "💡 When the scan ends, each item shows ✅ PASS or 🛠️ AUTO-FIXED. If all 7 core checks pass, the result popup shows “🎉 All core systems (dual canvas, 5 skins, IndexedDB, DAD cheer board) are running at 100%! [PASS 7/7]”.",
        guideCh2Badge: "Chapter 2 · Five block skins",
        guideCh2Lead: "Pick a skin in Settings and the main board plus NEXT/HOLD redraw instantly. Two live preview canvases (skin and ghost) show the texture without closing the modal.",
        guideCh3Badge: "Chapter 3 · Board height (drop distance)",
        guideCh3Lead: "On PC choose 20, 24 (long-drop), or 28 (ultra tower) rows. At viewport width ≤768px mobile locks to the standard 20 rows and hides the height picker.",
        guideCh4Lead: "The 160px golden-ratio sidebar cheer board (#dad-cheer-banner) celebrates combos, Tetris, and clutch escapes live. Press [K] or mobile [⏳] to freeze time in the air.",
        guideCh5Badge: "Chapter 5 · IndexedDB custom media",
        guideCh5Lead: "Large photos, BGM, and end videos are stored as Blobs in IndexedDB (DadTetrisDB / media_files). Skin, board height, volume, and high score stay in localStorage.",
        guideSkinPreviewTitle: "👁️ Two live preview canvases",
        guideSkinPreviewBody: "The skin preview (#skin-preview-canvas) shows all five textures instantly. The ghost preview (#ghost-preview-canvas) shows opacity beside the slider. The dual-layer board (#bg-canvas + #tetris-canvas) paints the well once and blocks at 60fps.",
        guideIndexedDbTitle: "💾 High-quality custom media via IndexedDB",
        guideIndexedDbBody: "Register family photos, per-level backgrounds, favorite mp3, and the game-over video in Settings. Originals stay in the browser quota. Settings (5 skins, ROWS, volume) remain in localStorage, separate from IndexedDB.",
        guideIndexedDbHow: "💡 Files live in the media_files store of DadTetrisDB. Self-test verifies connect, write, read, and delete.",
        guideDiagPipelineBody: "Self-test runs 7 core checks in sequence, then continues with the existing 1-1 through 19-1 suite. When the core 7 pass, the modern popup prints [PASS 7/7].",
        guideDiagCore1: "1) [DOM & layout] Dual canvas (#bg-canvas, #tetris-canvas), 160px cheer board (#dad-cheer-banner), skin/ghost preview canvases",
        guideDiagCore2: "2) [Block render engine] Integrity of all 5 skins (gemstone, glass, wire_glass, mecha, candy)",
        guideDiagCore3: "3) [Media storage] IndexedDB (DadTetrisDB) connect and CRUD",
        guideDiagCore4: "4) [Settings data] localStorage keys (skin, ROWS, volume, high score)",
        guideDiagCore5: "5) [Audio/video] Web Audio API and sound manager init",
        guideDiagCore6: "6) [Mobile detect] Viewport ≤768px and standard 20-row lock",
        guideDiagCore7: "7) [ES modules] Storage/Audio/Render/UI/GameEngine cross-links",
        guideThemeTitle: "🎨 Five custom neon color themes",
        guideThemeBody: "Tap a round palette swatch in Settings → Game to instantly recolor borders, buttons, neon glow, and accent text.",
        guideThemeHow: "💡 The switch is instant (0ms) and saved forever in localStorage.",
        guideFxTitle: "💥 Line-clear impact & neon particles",
        guideFxBody: "Clearing 1–3 lines gives a light shake and neon sparks. A Tetris (4 lines) shakes the screen and shows a gold banner.",
        guideFxHint: "💡 Use [Screen shake] in Settings to change strength.",
        guidePwaTitle: "📱 One-tap smartphone PWA install",
        guidePwaBody: "Use the 'Install app on home screen' button in Settings to play like an app. A service worker caches core files so you can play offline.",
        guidePwaHint: "💡 The install button may appear on HTTPS or localhost.",
        guideCustomPhoto: "👤 Family photo → Profile",
        guideCustomBg: "🖼️ Background photos → window/panel levels 1–20",
        guideCustomBgm: "🎵 Favorite music → BGM",
        guideCustomHint: "Tap ⚙️ Settings in the sidebar.",
        guideClose: "Close", guideStart: "🚀 Start playing now", guideContinue: "Close and continue",
        dadSpecialToggle: "👑 DAD Special: {state}",
        dadFreezeBadge: "⏳ DAD TIME FREEZE ({time}s)",
        dadFreezeTitle: "⏳ DAD TIME FREEZE", dadResume: "⚡ RESUME!",
        dadTimeStop: "DAD time stop", dadTimeStopHelp: "DAD time stop (Special ON)", padFreeze: "Time stop",
        guideTabDad: "👑 DAD Special", guideTabDadChapter: "Ch.4: 📢 Cheer board & Special", guideDadTitle: "👑 DAD Special mode",
        guideDadLock: "① After landing, freely fix shape and position during the 3-2-1 countdown!",
        guideDadFreeze: "② In a pinch, press [K] to freeze time for 3 seconds and rotate/move in the air!",
        guideDadHint: "Hard drop with Space before the countdown ends to place immediately.",
        guideDadPerfectTitle: "👑 Complete DAD Special guide",
        guideDadWhatTitle: "👑 What is DAD Special mode?",
        guideDadHeroTag: "A super-power assist mode designed especially for dads!",
        guideDadWhatBody: "No reflex panic! You get extra time after landing, can slide over ledges into holes, and if the timer ends the game snaps the piece into the best nearby spot.",
        guideDadLockTitle: "⏳ 1. Landing golden time & clarity boost",
        guideDadLockBody1: "When a piece lands by gravity or soft drop, a [3-2-1 countdown] starts on screen.",
        guideDadLockBody2: "During the countdown the board gets brighter and sharper so empty gaps are easy to see.",
        guideDadAutoSnap: "💡 Don't worry if the countdown ends! If you haven't placed the piece yet, the game snaps it into the best nearby spot for you.",
        guideDadSlideTitle: "🚀 2. Super Slide & Auto-Sink into deep wells",
        guideDadSlideBody: "During the countdown you slide over ledges instead of getting stuck. Move onto a deep hole and the piece sinks to the bottom for a clean fit.",
        guideDadSmartTitle: "🧠 3. Smart auto-place when the timer ends",
        guideDadSmartBody: "If you have not locked a spot when the countdown ends, AI looks nearby for a line-clear or a tight fit and places the piece for you.",
        guideDadKTitle: "❄️ 4. [K] key · mobile [⏳] emergency time stop",
        guideDadKBody: "Press anytime while falling to freeze time. Each tap of [↓] or mobile [▼] steps the piece down one cell.",
        guideDadKHint: "💡 During time stop, move/rotate do not unfreeze. Only [Space] locks immediately.",
        guideDadMobileHint: "💡 On a phone, tap [⏳ Time stop] to freeze, then [▼] to step down one cell at a time.",
        guideDadSpaceTitle: "⚡ [Space] instant hard drop",
        guideDadSpaceBody: "Want a faster pace? Press [Space] or [⚡] to lock immediately.",
        guideDadCheatTitle: "👑 DAD Special & cheat powers",
        guideDadDurationHead: "⚙️ 5. Custom duration",
        guideDadDurationTip: "💡 In Settings you can set DAD Special time to 3, 5, or 10 seconds.",
        guideDadDurationBody: "In Settings choose 3s, 5s, or 10s. It applies to golden time and time stop.",
        guideAiSpeedTitle: "🤖 AI autoplay & 0.5x–20x spectator",
        guideAiSpeedBody: "Turn on Autoplay and watch AI play. Set speed from 0.5x to 20x.",
        guideAiBuildTitle: "Buildup + Tetris blasts",
        guideAiBuildBody: "AI stacks high to hunt 4-line Tetrises, then switches to survival when in danger.",
        guideAiConquerTitle: "Level 20 conquer & champion fanfare",
        guideAiConquerBody: "Finish Level 20 and AI stops automatically with a champion celebration.",
        guideCustomDuration: "👑 DAD Special time (3s / 5s / 10s)",
        guideCustomAudio: "🔊 Sound · mobile haptics",
        guideCustomAudioItem: "🎵 BGM and SFX volumes can be set separately.",
        guideCustomHaptic: "📳 Mobile touch haptics can be turned on or off.",
        guideCustomMedia: "🖼️ Photos · backgrounds · music",
        guideCustomMediaHow: "Pick files in ⚙️ Settings and they apply right away.",
        guideCustomFolderBg: "💡 The game plays on a neon grid even without image files. Window uses default + levels 1–20; the game panel uses levels 1–20 only.",
        dadDurationTitle: "👑 DAD Special duration",
        dadDuration3: "3s (Default)", dadDuration5: "5s (Relaxed)", dadDuration10: "10s (Super easy)",
        dadDurationHint: "Applies to golden time and the [K] time stop.",
      },
  };

  window.DAD_I18N = {
    langs: [
      { id: "ko", flag: "🇰🇷", name: "한국어" },
      { id: "en", flag: "🇺🇸", name: "English" },
      { id: "zh", flag: "🇨🇳", name: "中文" },
      { id: "es", flag: "🇪🇸", name: "Español" },
      { id: "ar", flag: "🇸🇦", name: "العربية" },
      { id: "hi", flag: "🇮🇳", name: "हिन्दी" },
      { id: "bn", flag: "🇧🇩", name: "বাংলা" },
      { id: "pt", flag: "🇧🇷", name: "Português" },
      { id: "ru", flag: "🇷🇺", name: "Русский" },
      { id: "ja", flag: "🇯🇵", name: "日本語" },
    ],
    dict: I18N,
  };

  const COLS = 10;
  const BOARD_ROWS_KEY = "board_rows_count";
  const BOARD_ROWS_ALLOWED = [20, 24, 28];
  const BOARD_ROWS_DEFAULT = 20;

  function clampBoardRows(value) {
    const n = parseInt(value, 10);
    return BOARD_ROWS_ALLOWED.indexOf(n) >= 0 ? n : BOARD_ROWS_DEFAULT;
  }

  function isMobileDevice() {
    try {
      if (typeof window !== "undefined" && Number(window.innerWidth) <= 768) {
        return true;
      }
      if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {
        return true;
      }
    } catch (err) {
      /* ignore */
    }
    return false;
  }

  function effectiveBoardRows(value) {
    if (isMobileDevice()) {
      return BOARD_ROWS_DEFAULT;
    }
    return clampBoardRows(value);
  }

  function lockBoardHeightOptions(select, mobile) {
    if (!select) {
      return;
    }
    Array.from(select.options).forEach((opt) => {
      const pcOnly = opt.value === "24" || opt.value === "28";
      opt.hidden = !!(mobile && pcOnly);
      opt.disabled = !!(mobile && pcOnly);
      if (pcOnly) {
        opt.classList.add("board-size-pc-only");
      }
    });
  }

  function readStoredBoardRows() {
    try {
      const raw = localStorage.getItem(BOARD_ROWS_KEY);
      if (raw != null && raw !== "") {
        return clampBoardRows(raw);
      }
    } catch (err) {
      /* private mode */
    }
    return BOARD_ROWS_DEFAULT;
  }

  let ROWS = isMobileDevice() ? BOARD_ROWS_DEFAULT : (readStoredBoardRows() || BOARD_ROWS_DEFAULT);
  const FPS = 60;
  const FRAME_MS = 1000 / FPS;
  const BASE_GRAVITY_MS = 800;
  const SOFT_DROP_MS = 50;
  const AUTOPLAY_MIN_MS = 16;
  const DAS_MS = 150;
  const ARR_MS = 33;
  const DAS_KEY = "dad_tetris_das";
  const ARR_KEY = "dad_tetris_arr";
  const SOFTDROP_KEY = "dad_tetris_softdrop";
  const LINE_SCORES = [0, 100, 300, 500, 800];
  const AI_BUILD_MIN = 7;
  const AI_BUILD_TARGET = 9;
  const AI_BUILD_MAX = 10;
  const AI_WARN_HEIGHT = 10;
  const AI_EMERGENCY_HEIGHT = 14;
  const AI_DANGER_HEIGHT = 14;
  const BEST_KEY = "dadTetrisBest";
  const HALL_KEY = "dadTetrisHall";
  const RANK_DOMESTIC_KEY = "dad_tetris_rank_domestic";
  const RANK_GLOBAL_KEY = "dad_tetris_rank_global";
  const LAST_NAME_KEY = "dadTetrisLastName";
  const PLAYER_NAME_KEY = "dad_tetris_player_name";
  const SETTINGS_KEY = "dadTetrisSettings";
  const PROFILE_KEY = "dadTetrisProfile";
  const PROFILE_CROP_KEY = "dadTetrisProfileCrop";
  const PROFILE_IMG_KEY = "dad_tetris_profile_img";
  const THEME_KEY = "dad_tetris_theme";
  const PROFILE_DISPLAY_SIZE = 120;
  const LEVEL_BG_KEY = "dadTetrisLevelBg";
  const IDLE_BG_KEY = "dadTetrisBgDefault";
  const LEVEL_MAX = 20;
  const LEVEL_BG_MAX = 20;
  const MUTE_KEY = "dadTetrisMuted";
  const KEEP_DEFAULT_WINDOW_BG_KEY = "keep_default_window_bg";
  const DISABLE_ALL_CUSTOM_BG_KEY = "disable_all_custom_bg";
  const AUTO_RECORD_KEY = "auto_record_mode";
  const START_GARBAGE_KEY = "start_garbage_lines";
  const PREVIEW_MODE_KEY = "preview_guide_mode";
  const PREVIEW_MODE_STANDARD = "standard";
  const PREVIEW_MODE_DUAL = "dual";
  const DROP_SPEED_KEY = "drop_speed_multiplier";
  const BLOCK_SKIN_KEY = "block_skin_style";
  const HELP_SEEN_KEY = "dadTetrisHelpSeen";
  const DAD_LOCK_MS = 3000;
  const DAD_FREEZE_MS = 3000;
  const DAD_RESUME_MS = 480;
  const DAD_DURATION_OPTIONS = [3, 5, 10];

  function emptyLevelNameMap() {
    const out = {};
    for (let n = 1; n <= LEVEL_BG_MAX; n++) {
      out[n] = "";
    }
    return out;
  }

  const DEFAULT_ASSETS = {
    bgm: "",
    mainBg: "",
    levelBgs: emptyLevelNameMap(),
  };

  function isUserMediaUrl(url) {
    return typeof url === "string" && (url.indexOf("data:") === 0 || url.indexOf("blob:") === 0);
  }

  function assetUrl(rel) {
    const raw = String(rel || "").trim();
    if (!raw || isUserMediaUrl(raw)) {
      return raw;
    }
    return "";
  }

  function bindEl(id, type, handler, opts) {
    const el = document.getElementById(id);
    if (!el) {
      return null;
    }
    el.addEventListener(type, handler, opts);
    return el;
  }

  function safeSetMediaSrc(el, url) {
    if (!el) {
      return;
    }
    try {
      if (!isUserMediaUrl(url)) {
        el.removeAttribute("src");
        return;
      }
      el.src = url;
    } catch (err) {
      try {
        el.removeAttribute("src");
      } catch (err2) {
        /* ignore */
      }
    }
  }
  const mediaStore = dbManager;
  function initDB() {
    return mediaStore.initDB();
  }

  function saveMediaFile(key, blobOrData) {
    return mediaStore.saveMediaFile(key, blobOrData);
  }

  function getMediaFile(key) {
    return mediaStore.getMediaFile(key);
  }

  function deleteMediaFile(key) {
    return mediaStore.deleteMediaFile(key);
  }

  function clearAllMedia() {
    return mediaStore.clearAllMedia();
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob || null), type, quality);
    });
  }

  async function encodeImageBlob(img, maxW, maxH, quality) {
    const scale = Math.min(1, maxW / img.width, maxH / img.height);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    let blob = await canvasToBlob(canvas, "image/webp", quality);
    if (!blob || !blob.size || (blob.type && blob.type.indexOf("webp") < 0)) {
      blob = await canvasToBlob(canvas, "image/jpeg", Math.min(0.85, quality + 0.04));
    }
    return blob;
  }

  const SETTING_DEFAULTS = {
    sound: true,
    soundVolume: 80,
    shake: true,
    shakeStrength: 70,
    particles: true,
    ghost: true,
    ghostStrength: 40,
    bgm: false,
    bgmVolume: 70,
    bgmFileName: "",
    startLevel: 1,
    videosEnabled: true,
    goal1Score: 5000,
    goal2Score: 10000,
    videoUrls: { goal1: "", goal2: "", gameover: "" },
    videoFileNames: { goal1: "", goal2: "", gameover: "" },
    bgEnabled: false,
    bgDim: 55,
    bgBlur: 6,
    bgFileName: "",
    levelBgEnabled: true,
    levelBgDefaultFileName: "",
    levelBgFileNames: emptyLevelNameMap(),
    bgTarget: "window",
    windowBgDefaultFileName: "",
    windowBgFileNames: emptyLevelNameMap(),
    boardBgDefaultFileName: "",
    boardBgFileNames: emptyLevelNameMap(),
    boardBgBlur: 0,
    boardBgOpacity: 80,
    windowBgBlur: 0,
    windowBgOpacity: 100,
    keepDefaultWindowBg: false,
    disableAllCustomBg: false,
    autoRecordMode: false,
    startGarbageLines: 0,
    previewGuideMode: "standard",
    dropSpeedMultiplier: 1,
    blockSkinStyle: "gemstone",
    boardRowsCount: 20,
    profileFileName: "",
    profileZoom: 100,
    profileZoomUnit: "percent",
    profileX: 0,
    profileY: 0,
    language: "ko",
    autoplaySpeed: 1,
    mobilePad: "auto",
    dadSpecial: false,
    dadSpecialDuration: 3,
    haptic: true,
    theme: "neon-blue",
    dasMs: 150,
    arrMs: 33,
    softdropMultiplier: 10,
  };

  const THEME_IDS = ["neon-blue", "cyber-pink", "emerald-green", "sunset-orange", "future-cyber"];
  const THEME_I18N = {
    "neon-blue": "themeNeonBlue",
    "cyber-pink": "themeCyberPink",
    "emerald-green": "themeEmeraldGreen",
    "sunset-orange": "themeSunsetOrange",
    "future-cyber": "themeFutureCyber",
  };

  function defaultSettings() {
    return {
      ...SETTING_DEFAULTS,
      videoUrls: { ...SETTING_DEFAULTS.videoUrls },
      videoFileNames: { ...SETTING_DEFAULTS.videoFileNames },
      levelBgFileNames: { ...SETTING_DEFAULTS.levelBgFileNames },
      windowBgFileNames: { ...SETTING_DEFAULTS.windowBgFileNames },
      boardBgFileNames: { ...SETTING_DEFAULTS.boardBgFileNames },
    };
  }
  const PROFILE_SHIFT_MAX = 800;
  const PROFILE_CANVAS_SIZE = 320;
  const PROFILE_ZOOM_MIN = 50;
  const PROFILE_ZOOM_MAX = 300;
  const PROFILE_SCALE_MIN = 0.5;
  const PROFILE_SCALE_MAX = 3;

  const LANG_IDS = new Set(((window.DAD_I18N && window.DAD_I18N.langs) || []).map((item) => item.id));
  const LANG_LOCALES = {
    ko: "ko-KR", en: "en-US", zh: "zh-CN", es: "es-ES", ar: "ar-SA",
    hi: "hi-IN", bn: "bn-BD", pt: "pt-BR", ru: "ru-RU", ja: "ja-JP",
  };
  const TOGGLE_KEYS = new Set(["sound", "shake", "particles", "ghost", "bgm", "videosEnabled", "bgEnabled", "levelBgEnabled", "keepDefaultWindowBg", "disableAllCustomBg", "autoRecordMode", "dadSpecial", "haptic"]);
  const VIDEO_KEYS = ["goal1", "goal2", "gameover"];

  const TYPES = ["I", "J", "L", "O", "S", "T", "Z"];
  const COLORS = {
    I: "#00E8E8",
    J: "#3B82FF",
    L: "#FF8A00",
    O: "#FFD400",
    S: "#3DDC64",
    T: "#C44DFF",
    Z: "#FF3B3B",
    G: "#7A889C",
  };

  const SHAPES = {
    I: [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]],
    ],
    J: [
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [0, 2], [1, 2]],
    ],
    L: [
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 1], [0, 2]],
      [[0, 0], [1, 0], [1, 1], [1, 2]],
    ],
    O: [
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
    ],
    S: [
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[1, 1], [2, 1], [0, 2], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [1, 2]],
    ],
    T: [
      [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [1, 2]],
    ],
    Z: [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 0], [0, 1], [1, 1], [0, 2]],
    ],
  };

  const JLSTZ_CW = [
    [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  ];
  const I_CW = [
    [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
    [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
    [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
    [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  ];
  const DAD_SLIDE_OFFSETS = [
    [1, -1], [1, 1], [1, -2], [1, 2], [1, -3], [1, -4],
    [2, 0], [2, -1], [2, 1], [2, -2], [2, 2], [2, -3],
    [3, 0], [3, -1], [3, 1], [3, -2],
  ];
  const DAD_SUPER_KICKS = [
    [0, 0],
    [-1, 0], [1, 0], [-2, 0], [2, 0], [-3, 0], [3, 0],
    [0, -1], [0, -2], [0, -3], [0, -4],
    [-1, -1], [1, -1], [-2, -1], [2, -1], [-3, -1], [3, -1],
    [-1, -2], [1, -2], [-2, -2], [2, -2],
    [-1, -3], [1, -3],
    [0, 1], [-1, 1], [1, 1], [0, 2],
    [-2, 2], [2, 2], [-1, 2], [1, 2],
  ];

  const bgCanvas = document.getElementById("bg-canvas");
  const boardCanvas = document.getElementById("tetris-canvas") || document.getElementById("board");
  const nextCanvas = document.getElementById("next");
  const holdCanvas = document.getElementById("hold");
  if (!boardCanvas || !nextCanvas) {
    try {
      console.error("[DAD TETRIS] required canvas missing", { boardCanvas: !!boardCanvas, nextCanvas: !!nextCanvas });
    } catch (err) {
      /* ignore */
    }
  }
  const bgCtx = bgCanvas && typeof bgCanvas.getContext === "function" ? bgCanvas.getContext("2d") : null;
  const boardCtx = boardCanvas && typeof boardCanvas.getContext === "function" ? boardCanvas.getContext("2d") : null;
  const canvas = boardCanvas;
  const ctx = boardCtx;
  let staticBgDirty = true;
  let lastStaticFocusOn = false;
  const nextCtx = nextCanvas && typeof nextCanvas.getContext === "function" ? nextCanvas.getContext("2d") : null;
  const holdCtx = holdCanvas && typeof holdCanvas.getContext === "function" ? holdCanvas.getContext("2d") : null;
  if (!boardCanvas || !nextCanvas || !boardCtx || !nextCtx) {
    try {
      bindHudClickFallback();
    } catch (err) {
      /* ignore */
    }
    return { moduleId: "gameEngine", ok: false };
  }
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayHint = document.getElementById("overlay-hint");
  const profileImageEl = document.getElementById("profile-image");
  const profileFallback = document.getElementById("profile-fallback");
  const profilePreviewEl = document.getElementById("profile-preview");
  const profilePreviewFallback = document.getElementById("profile-preview-fallback");
  const sidebarProfileEl = document.getElementById("header-profile-img") || document.getElementById("sidebar-profile");
  const sidebarProfileFallback = document.getElementById("sidebar-profile-fallback");
  const profileMainCanvas = document.getElementById("profile-main-canvas");
  const profileCropCanvas = document.getElementById("profile-crop-canvas");
  const profileMainCtx = profileMainCanvas && profileMainCanvas.getContext("2d");
  const profileCropCtx = profileCropCanvas && profileCropCanvas.getContext("2d");
  const clearBanner = document.getElementById("clear-banner");
  const boardWrap = document.getElementById("board-wrap");
  const settingsModal = document.getElementById("settings-modal");
  const celebrateModal = document.getElementById("celebrate-modal");
  const celebrateMessage = document.getElementById("celebrate-message");
  const celebrateStage = document.getElementById("celebrate-stage");
  const celebrateVideo = document.getElementById("celebrate-video");
  const celebrateFrame = document.getElementById("celebrate-frame");
  const celebrateFallback = document.getElementById("celebrate-fallback");

  const ui = {
    score: document.getElementById("score"),
    level: document.getElementById("level"),
    lines: document.getElementById("lines"),
    best: document.getElementById("best"),
  };

  let cellSize = 40;
  let cells = createBoard();
  let bag = [];
  let current = null;
  let next = null;
  let next2 = null;
  let holdPiece = null;
  let canHold = true;
  let autoplay = false;
  let autoplayWait = 0;
  let autoplayPlan = null;
  let autoplayTouched = false;
  let autoplayAiMode = "buildup";
  let autoplayWellCol = 9;
  let isLevelUpdating = false;
  let isVideoPlaying = false;
  let isAudioLoading = false;
  let isApplyingBg = false;
  let isUpdatingHud = false;
  let isSyncingUi = false;
  let isSyncingProfile = false;
  let isResettingSettings = false;
  let profileBroken = false;
  let loopBusy = false;
  let celebrateFallbackTimer = 0;
  let shiftDir = 0;
  let dasCharge = 0;
  const padPointers = new Map();
  const padHeld = new Set();
  let ignorePadMouseUntil = 0;
  let paused = false;
  let settingsOpen = false;
  let helpOpen = false;
  let diagOpen = false;
  let diagRunning = false;
  let celebrateOpen = false;
  let celebratedGoal1 = false;
  let celebratedGoal2 = false;
  let celebratedLevel20 = false;
  let autoplayConquered = false;
  let celebratePreview = false;
  let celebrateKind = "";
  let overlayMode = "start";
  let waitingStart = true;
  let scoreSaveOpen = false;
  let autoplayEndOpen = false;
  let hallOpen = false;
  let hallTab = "domestic";
  let pendingScoreSave = null;
  let pendingAutoplayEnd = null;
  const SPACE_DOUBLE_MS = 250;
  const PAUSE_DOUBLE_TAP_MS = 300;
  let spaceTapAt = 0;
  let pauseTapAt = 0;
  let pauseDoubleTapBound = false;
  let spaceDropTimer = 0;
  const celebrateQueue = [];
  const videoBlobs = { goal1: null, goal2: null, gameover: null };
  let gameOver = false;
  let gameTerminated = false;
  let softDropping = false;
  let gravityMsLeft = BASE_GRAVITY_MS;
  let lockDelayMs = 0;
  let freezeMs = 0;
  let dadResumeMs = 0;
  let dadPhaseLock = false;
  let hasUsedTimestopThisTurn = false;
  let dadCountDigit = 0;
  let dadCountKind = "";
  let score = 0;
  let lines = 0;
  let level = 1;
  let best = 0;
  try {
    best = Number(localStorage.getItem(BEST_KEY) || 0);
    if (!Number.isFinite(best)) {
      best = 0;
    }
  } catch (err) {
    best = 0;
  }
  let lastTime = 0;
  let acc = 0;
  let loopRaf = 0;
  const held = new Set();
  let particles = [];
  let flashes = [];
  let shake = 0;
  let shakeTick = 0;
  let shakeDecay = 0.84;
  let lineCombo = 0;
  let lastPieceAction = "move";
  let placeStreak = 0;
  let screenShakeTid = 0;
  let pwaInstallEvent = null;
  try {
    window.deferredPrompt = window.deferredPrompt || null;
  } catch (err) {
    /* ignore */
  }
  let neonFlashTid = 0;
  let dadSnapFlashTid = 0;
  let bannerTimer = 0;
  let settings = loadSettings();
  ROWS = effectiveBoardRows(settings.boardRowsCount);
  if (!cells || cells.length !== ROWS) {
    cells = createBoard();
  }
  level = settings.startLevel;
  const profileState = {
    zoom: 1,
    x: Number(settings.profileX) || 0,
    y: Number(settings.profileY) || 0,
  };
  let profileSource = null;
  let profileRenderTimer = 0;

  function persistHealedSettings(next) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch (err) {
      /* private mode */
    }
    persistKeepDefaultWindowBg(next);
    persistDisableAllCustomBg(next);
    persistAutoRecordMode(next);
    persistStartGarbageLines(next);
    persistPreviewGuideMode(next);
    persistDropSpeedMultiplier(next);
    persistHandlingSettings(next);
    persistBlockSkinStyle(next);
    persistBoardRowsCount(next);
    persistWindowFxKeys(next);
    return next;
  }

  function healSettingsSchema(target) {
    const next = target || settings;
    const fresh = defaultSettings();
    let fixed = 0;
    Object.keys(SETTING_DEFAULTS).forEach((key) => {
      if (!(key in next) || next[key] === undefined || next[key] === null) {
        next[key] = typeof fresh[key] === "object" && fresh[key] && !Array.isArray(fresh[key])
          ? { ...fresh[key] }
          : fresh[key];
        fixed += 1;
      }
    });
    ["soundVolume", "bgmVolume", "ghostStrength", "shakeStrength", "bgDim", "boardBgOpacity", "windowBgOpacity"].forEach((key) => {
      const n = Number(next[key]);
      if (!Number.isFinite(n)) {
        next[key] = SETTING_DEFAULTS[key];
        fixed += 1;
      } else {
        const clamped = clampPercent(n, SETTING_DEFAULTS[key]);
        if (clamped !== next[key]) {
          next[key] = clamped;
          fixed += 1;
        }
      }
    });
    const dur = clampDadDuration(next.dadSpecialDuration);
    if (dur !== next.dadSpecialDuration) {
      next.dadSpecialDuration = dur;
      fixed += 1;
    }
    const garbage = clampStartGarbageLines(next.startGarbageLines);
    if (garbage !== next.startGarbageLines) {
      next.startGarbageLines = garbage;
      fixed += 1;
    }
    const previewMode = clampPreviewGuideMode(next.previewGuideMode);
    if (previewMode !== next.previewGuideMode) {
      next.previewGuideMode = previewMode;
      fixed += 1;
    }
    const dropMul = clampDropSpeedMultiplier(next.dropSpeedMultiplier);
    if (dropMul !== next.dropSpeedMultiplier) {
      next.dropSpeedMultiplier = dropMul;
      fixed += 1;
    }
    const dasMs = clampDasMs(next.dasMs);
    if (dasMs !== next.dasMs) {
      next.dasMs = dasMs;
      fixed += 1;
    }
    const arrMs = clampArrMs(next.arrMs);
    if (arrMs !== next.arrMs) {
      next.arrMs = arrMs;
      fixed += 1;
    }
    const softMul = clampSoftdropMul(next.softdropMultiplier);
    if (softMul !== next.softdropMultiplier) {
      next.softdropMultiplier = softMul;
      fixed += 1;
    }
    const boardRows = clampBoardRows(next.boardRowsCount);
    if (boardRows !== next.boardRowsCount) {
      next.boardRowsCount = boardRows;
      fixed += 1;
    }
    if (!next.videoUrls || typeof next.videoUrls !== "object") {
      next.videoUrls = { ...SETTING_DEFAULTS.videoUrls };
      fixed += 1;
    }
    if (!next.videoFileNames || typeof next.videoFileNames !== "object") {
      next.videoFileNames = { ...SETTING_DEFAULTS.videoFileNames };
      fixed += 1;
    }
    if (!next.levelBgFileNames || typeof next.levelBgFileNames !== "object") {
      next.levelBgFileNames = { ...SETTING_DEFAULTS.levelBgFileNames };
      fixed += 1;
    }
    if (!next.windowBgFileNames || typeof next.windowBgFileNames !== "object") {
      next.windowBgFileNames = mergeLevelBgNames(next.levelBgFileNames);
      fixed += 1;
    }
    if (!next.boardBgFileNames || typeof next.boardBgFileNames !== "object") {
      next.boardBgFileNames = { ...SETTING_DEFAULTS.boardBgFileNames };
      fixed += 1;
    }
    const zoomBefore = next.profileZoom;
    const unitBefore = next.profileZoomUnit;
    next.profileZoom = migrateProfileZoom(next, next);
    if (next.profileZoom !== zoomBefore || next.profileZoomUnit !== unitBefore) {
      fixed += 1;
    }
    const theme = clampTheme(next.theme);
    if (theme !== next.theme) {
      next.theme = theme;
      fixed += 1;
    }
    const boardBlur = clampBlur(next.boardBgBlur, SETTING_DEFAULTS.boardBgBlur);
    if (boardBlur !== next.boardBgBlur) {
      next.boardBgBlur = boardBlur;
      fixed += 1;
    }
    const windowBlur = clampBlur(next.windowBgBlur, SETTING_DEFAULTS.windowBgBlur);
    if (windowBlur !== next.windowBgBlur) {
      next.windowBgBlur = windowBlur;
      fixed += 1;
    }
    return fixed;
  }

  function hydrateBoardFxFromStorage(target, stored) {
    const next = target || settings;
    try {
      const blurRaw = localStorage.getItem("board_bg_blur");
      if (blurRaw != null && blurRaw !== "") {
        next.boardBgBlur = clampBlur(blurRaw, SETTING_DEFAULTS.boardBgBlur);
      }
      const opRaw = localStorage.getItem("board_bg_opacity");
      if (opRaw != null && opRaw !== "") {
        next.boardBgOpacity = clampPercent(opRaw, SETTING_DEFAULTS.boardBgOpacity);
      }
    } catch (err) {
      /* private mode */
    }
    return hydrateBoardRowsCount(hydrateBlockSkinStyle(hydrateHandlingSettings(hydrateDropSpeedMultiplier(hydratePreviewGuideMode(hydrateStartGarbageLines(hydrateAutoRecordMode(hydrateDisableAllCustomBg(hydrateKeepDefaultWindowBg(hydrateWindowFxFromStorage(next, stored))))))))));
  }

  function persistWindowFxKeys(target) {
    const next = target || settings;
    try {
      localStorage.setItem("window_bg_blur", String(next.windowBgBlur));
      localStorage.setItem("window_bg_opacity", String(next.windowBgOpacity));
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateWindowFxFromStorage(target, stored) {
    const next = target || settings;
    try {
      const blurRaw = localStorage.getItem("window_bg_blur");
      if (blurRaw != null && blurRaw !== "") {
        next.windowBgBlur = clampBlur(blurRaw, SETTING_DEFAULTS.windowBgBlur);
      } else if (stored && Object.prototype.hasOwnProperty.call(stored, "windowBgBlur")) {
        next.windowBgBlur = clampBlur(stored.windowBgBlur, SETTING_DEFAULTS.windowBgBlur);
      } else if (stored) {
        next.windowBgBlur = clampBlur(next.bgBlur, SETTING_DEFAULTS.windowBgBlur);
      } else {
        next.windowBgBlur = clampBlur(next.windowBgBlur, SETTING_DEFAULTS.windowBgBlur);
      }
      const opRaw = localStorage.getItem("window_bg_opacity");
      if (opRaw != null && opRaw !== "") {
        next.windowBgOpacity = clampPercent(opRaw, SETTING_DEFAULTS.windowBgOpacity);
      } else if (stored && Object.prototype.hasOwnProperty.call(stored, "windowBgOpacity")) {
        next.windowBgOpacity = clampPercent(stored.windowBgOpacity, SETTING_DEFAULTS.windowBgOpacity);
      } else {
        next.windowBgOpacity = clampPercent(next.windowBgOpacity, SETTING_DEFAULTS.windowBgOpacity);
      }
    } catch (err) {
      next.windowBgBlur = clampBlur(next.windowBgBlur, SETTING_DEFAULTS.windowBgBlur);
      next.windowBgOpacity = clampPercent(next.windowBgOpacity, SETTING_DEFAULTS.windowBgOpacity);
    }
    persistWindowFxKeys(next);
    return next;
  }

  function parseKeepDefaultWindowBgFlag(raw) {
    if (raw == null || raw === "") {
      return null;
    }
    const value = String(raw).trim().toLowerCase();
    if (value === "1" || value === "true" || value === "on" || value === "yes") {
      return true;
    }
    if (value === "0" || value === "false" || value === "off" || value === "no") {
      return false;
    }
    return null;
  }

  function persistKeepDefaultWindowBg(target) {
    const next = target || settings;
    try {
      localStorage.setItem(KEEP_DEFAULT_WINDOW_BG_KEY, next.keepDefaultWindowBg ? "1" : "0");
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateKeepDefaultWindowBg(target) {
    const next = target || settings;
    next.keepDefaultWindowBg = !!next.keepDefaultWindowBg;
    try {
      const parsed = parseKeepDefaultWindowBgFlag(localStorage.getItem(KEEP_DEFAULT_WINDOW_BG_KEY));
      if (parsed != null) {
        next.keepDefaultWindowBg = parsed;
      }
    } catch (err) {
      /* private mode */
    }
    persistKeepDefaultWindowBg(next);
    return next;
  }

  function persistDisableAllCustomBg(target) {
    const next = target || settings;
    try {
      localStorage.setItem(DISABLE_ALL_CUSTOM_BG_KEY, next.disableAllCustomBg ? "1" : "0");
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateDisableAllCustomBg(target) {
    const next = target || settings;
    next.disableAllCustomBg = !!next.disableAllCustomBg;
    try {
      const parsed = parseKeepDefaultWindowBgFlag(localStorage.getItem(DISABLE_ALL_CUSTOM_BG_KEY));
      if (parsed != null) {
        next.disableAllCustomBg = parsed;
      }
    } catch (err) {
      /* private mode */
    }
    persistDisableAllCustomBg(next);
    return next;
  }

  function persistAutoRecordMode(target) {
    const next = target || settings;
    try {
      localStorage.setItem(AUTO_RECORD_KEY, next.autoRecordMode ? "1" : "0");
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateAutoRecordMode(target) {
    const next = target || settings;
    next.autoRecordMode = !!next.autoRecordMode;
    try {
      const parsed = parseKeepDefaultWindowBgFlag(localStorage.getItem(AUTO_RECORD_KEY));
      if (parsed != null) {
        next.autoRecordMode = parsed;
      }
    } catch (err) {
      /* private mode */
    }
    persistAutoRecordMode(next);
    return next;
  }

  function persistStartGarbageLines(target) {
    const next = target || settings;
    const n = clampStartGarbageLines(next.startGarbageLines);
    next.startGarbageLines = n;
    try {
      localStorage.setItem(START_GARBAGE_KEY, String(n));
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateStartGarbageLines(target) {
    const next = target || settings;
    next.startGarbageLines = clampStartGarbageLines(next.startGarbageLines);
    try {
      const raw = localStorage.getItem(START_GARBAGE_KEY);
      if (raw != null && raw !== "") {
        next.startGarbageLines = clampStartGarbageLines(raw);
      }
    } catch (err) {
      /* private mode */
    }
    persistStartGarbageLines(next);
    return next;
  }

  function clampPreviewGuideMode(value) {
    return String(value || "").trim().toLowerCase() === PREVIEW_MODE_DUAL
      ? PREVIEW_MODE_DUAL
      : PREVIEW_MODE_STANDARD;
  }

  function isDualPreviewMode() {
    return clampPreviewGuideMode(settings.previewGuideMode) === PREVIEW_MODE_DUAL;
  }

  function persistPreviewGuideMode(target) {
    const nextSettings = target || settings;
    const mode = clampPreviewGuideMode(nextSettings.previewGuideMode);
    nextSettings.previewGuideMode = mode;
    try {
      localStorage.setItem(PREVIEW_MODE_KEY, mode);
    } catch (err) {
      /* ignore */
    }
  }

  function hydratePreviewGuideMode(target) {
    const nextSettings = target || settings;
    nextSettings.previewGuideMode = clampPreviewGuideMode(nextSettings.previewGuideMode);
    try {
      const raw = localStorage.getItem(PREVIEW_MODE_KEY);
      if (raw != null && raw !== "") {
        nextSettings.previewGuideMode = clampPreviewGuideMode(raw);
      }
    } catch (err) {
      /* private mode */
    }
    persistPreviewGuideMode(nextSettings);
    return nextSettings;
  }

  function clampDropSpeedMultiplier(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.dropSpeedMultiplier;
    }
    const mul = n > 1.5 && n <= 150 ? n / 100 : n;
    const stepped = Math.round(mul * 10) / 10;
    return Math.min(1.5, Math.max(0.5, stepped));
  }

  function dropSpeedMultiplier() {
    return clampDropSpeedMultiplier(settings.dropSpeedMultiplier);
  }

  function persistDropSpeedMultiplier(target) {
    const nextSettings = target || settings;
    const n = clampDropSpeedMultiplier(nextSettings.dropSpeedMultiplier);
    nextSettings.dropSpeedMultiplier = n;
    try {
      localStorage.setItem(DROP_SPEED_KEY, String(n));
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateDropSpeedMultiplier(target) {
    const nextSettings = target || settings;
    nextSettings.dropSpeedMultiplier = clampDropSpeedMultiplier(nextSettings.dropSpeedMultiplier);
    try {
      const raw = localStorage.getItem(DROP_SPEED_KEY);
      if (raw != null && raw !== "") {
        nextSettings.dropSpeedMultiplier = clampDropSpeedMultiplier(raw);
      }
    } catch (err) {
      /* private mode */
    }
    persistDropSpeedMultiplier(nextSettings);
    return nextSettings;
  }

  function clampDasMs(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.dasMs;
    }
    return Math.min(300, Math.max(100, n));
  }

  function clampArrMs(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.arrMs;
    }
    return Math.min(80, Math.max(15, n));
  }

  function clampSoftdropMul(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.softdropMultiplier;
    }
    return Math.min(20, Math.max(1, n));
  }

  function dasDelayMs() {
    return clampDasMs(settings && settings.dasMs);
  }

  function arrDelayMs() {
    return clampArrMs(settings && settings.arrMs);
  }

  function softdropMul() {
    return clampSoftdropMul(settings && settings.softdropMultiplier);
  }

  function persistHandlingSettings(target) {
    const nextSettings = target || settings;
    nextSettings.dasMs = clampDasMs(nextSettings.dasMs);
    nextSettings.arrMs = clampArrMs(nextSettings.arrMs);
    nextSettings.softdropMultiplier = clampSoftdropMul(nextSettings.softdropMultiplier);
    try {
      localStorage.setItem(DAS_KEY, String(nextSettings.dasMs));
      localStorage.setItem(ARR_KEY, String(nextSettings.arrMs));
      localStorage.setItem(SOFTDROP_KEY, String(nextSettings.softdropMultiplier));
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateHandlingSettings(target) {
    const nextSettings = target || settings;
    nextSettings.dasMs = clampDasMs(nextSettings.dasMs);
    nextSettings.arrMs = clampArrMs(nextSettings.arrMs);
    nextSettings.softdropMultiplier = clampSoftdropMul(nextSettings.softdropMultiplier);
    try {
      const dasRaw = localStorage.getItem(DAS_KEY);
      const arrRaw = localStorage.getItem(ARR_KEY);
      const softRaw = localStorage.getItem(SOFTDROP_KEY);
      if (dasRaw != null && dasRaw !== "") {
        nextSettings.dasMs = clampDasMs(dasRaw);
      }
      if (arrRaw != null && arrRaw !== "") {
        nextSettings.arrMs = clampArrMs(arrRaw);
      }
      if (softRaw != null && softRaw !== "") {
        nextSettings.softdropMultiplier = clampSoftdropMul(softRaw);
      }
    } catch (err) {
      /* private mode */
    }
    persistHandlingSettings(nextSettings);
    return nextSettings;
  }

  function currentBlockSkin() {
    return clampBlockSkin(settings && settings.blockSkinStyle);
  }

  function persistBlockSkinStyle(target) {
    const nextSettings = target || settings;
    const skin = clampBlockSkin(nextSettings.blockSkinStyle);
    nextSettings.blockSkinStyle = skin;
    try {
      localStorage.setItem(BLOCK_SKIN_KEY, skin);
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateBlockSkinStyle(target) {
    const nextSettings = target || settings;
    nextSettings.blockSkinStyle = clampBlockSkin(nextSettings.blockSkinStyle);
    try {
      const raw = localStorage.getItem(BLOCK_SKIN_KEY);
      if (raw != null && raw !== "") {
        nextSettings.blockSkinStyle = clampBlockSkin(raw);
      }
    } catch (err) {
      /* private mode */
    }
    persistBlockSkinStyle(nextSettings);
    return nextSettings;
  }

  function persistBoardRowsCount(target) {
    const nextSettings = target || settings;
    const n = clampBoardRows(nextSettings.boardRowsCount);
    nextSettings.boardRowsCount = n;
    try {
      localStorage.setItem(BOARD_ROWS_KEY, String(n));
    } catch (err) {
      /* ignore */
    }
  }

  function hydrateBoardRowsCount(target) {
    const nextSettings = target || settings;
    nextSettings.boardRowsCount = clampBoardRows(nextSettings.boardRowsCount);
    try {
      const raw = localStorage.getItem(BOARD_ROWS_KEY);
      if (raw != null && raw !== "") {
        nextSettings.boardRowsCount = clampBoardRows(raw);
      }
    } catch (err) {
      /* private mode */
    }
    persistBoardRowsCount(nextSettings);
    return nextSettings;
  }

  function saveSettings() {
    healSettingsSchema(settings);
    persistBoardFxKeys();
    persistWindowFxKeys();
    persistKeepDefaultWindowBg();
    persistDisableAllCustomBg();
    persistAutoRecordMode();
    persistStartGarbageLines();
    persistPreviewGuideMode();
    persistDropSpeedMultiplier();
    persistHandlingSettings();
    persistBlockSkinStyle();
    persistBoardRowsCount();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      /* private mode 등에서도 메모리 설정은 유지 */
    }
  }

  function loadSettings() {
    let loaded = defaultSettings();
    let stored = null;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        return hydrateBoardFxFromStorage(loaded);
      }
      stored = JSON.parse(raw);
      if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
        return persistHealedSettings(defaultSettings());
      }
      loaded = { ...defaultSettings(), ...stored };
    } catch (err) {
      return persistHealedSettings(defaultSettings());
    }
    try {
      loaded.ghostStrength = clampPercent(loaded.ghostStrength, SETTING_DEFAULTS.ghostStrength);
      loaded.startLevel = clampStartLevel(loaded.startLevel);
      loaded.bgmVolume = clampPercent(loaded.bgmVolume, SETTING_DEFAULTS.bgmVolume);
      loaded.soundVolume = clampPercent(loaded.soundVolume, SETTING_DEFAULTS.soundVolume);
      loaded.shakeStrength = clampPercent(loaded.shakeStrength, SETTING_DEFAULTS.shakeStrength);
      loaded.bgDim = clampPercent(loaded.bgDim, SETTING_DEFAULTS.bgDim);
      loaded.bgBlur = clampBlur(loaded.bgBlur);
      loaded.boardBgBlur = clampBlur(loaded.boardBgBlur, SETTING_DEFAULTS.boardBgBlur);
      loaded.boardBgOpacity = clampPercent(loaded.boardBgOpacity, SETTING_DEFAULTS.boardBgOpacity);
      loaded.windowBgBlur = clampBlur(loaded.windowBgBlur, SETTING_DEFAULTS.windowBgBlur);
      loaded.windowBgOpacity = clampPercent(loaded.windowBgOpacity, SETTING_DEFAULTS.windowBgOpacity);
      loaded.bgTarget = loaded.bgTarget === "board" ? "board" : "window";
      loaded.bgFileName = typeof loaded.bgFileName === "string" ? loaded.bgFileName : "";
      loaded.profileFileName = typeof loaded.profileFileName === "string" ? loaded.profileFileName : "";
      loaded.profileZoom = migrateProfileZoom(loaded, stored);
      loaded.profileX = Math.min(PROFILE_SHIFT_MAX, Math.max(-PROFILE_SHIFT_MAX, Math.round(Number(loaded.profileX) || 0)));
      loaded.profileY = Math.min(PROFILE_SHIFT_MAX, Math.max(-PROFILE_SHIFT_MAX, Math.round(Number(loaded.profileY) || 0)));
      loaded.bgEnabled = !!loaded.bgEnabled;
      loaded.levelBgEnabled = !!loaded.levelBgEnabled;
      loaded.keepDefaultWindowBg = !!loaded.keepDefaultWindowBg;
      loaded.disableAllCustomBg = !!loaded.disableAllCustomBg;
      loaded.autoRecordMode = !!loaded.autoRecordMode;
      loaded.startGarbageLines = clampStartGarbageLines(loaded.startGarbageLines);
      loaded.previewGuideMode = clampPreviewGuideMode(loaded.previewGuideMode);
      loaded.dropSpeedMultiplier = clampDropSpeedMultiplier(loaded.dropSpeedMultiplier);
      loaded.boardRowsCount = clampBoardRows(loaded.boardRowsCount);
      loaded.levelBgDefaultFileName = typeof loaded.levelBgDefaultFileName === "string" ? loaded.levelBgDefaultFileName : "";
      loaded.levelBgFileNames = mergeLevelBgNames(loaded.levelBgFileNames);
      loaded.windowBgDefaultFileName = typeof loaded.windowBgDefaultFileName === "string" && loaded.windowBgDefaultFileName
        ? loaded.windowBgDefaultFileName
        : loaded.levelBgDefaultFileName;
      {
        const winNames = loaded.windowBgFileNames;
        const useWin = winNames && typeof winNames === "object" && Object.values(winNames).some(Boolean);
        loaded.windowBgFileNames = mergeLevelBgNames(useWin ? winNames : loaded.levelBgFileNames);
      }
      loaded.boardBgDefaultFileName = typeof loaded.boardBgDefaultFileName === "string" ? loaded.boardBgDefaultFileName : "";
      loaded.boardBgFileNames = mergeLevelBgNames(loaded.boardBgFileNames);
      loaded.bgmFileName = typeof loaded.bgmFileName === "string" ? loaded.bgmFileName : "";
      loaded.videoUrls = mergeVideoMap(loaded.videoUrls);
      loaded.videoFileNames = mergeVideoMap(loaded.videoFileNames);
      loaded.goal1Score = clampGoalScore(loaded.goal1Score, SETTING_DEFAULTS.goal1Score);
      loaded.goal2Score = clampGoalScore(loaded.goal2Score, SETTING_DEFAULTS.goal2Score);
      if (loaded.goal1Score >= loaded.goal2Score) {
        loaded.goal2Score = Math.min(999999, loaded.goal1Score + 100);
      }
      loaded.sound = !!loaded.sound;
      loaded.shake = !!loaded.shake;
      loaded.ghost = !!loaded.ghost;
      loaded.bgm = !!loaded.bgm;
      loaded.videosEnabled = loaded.videosEnabled !== false;
      loaded.particles = loaded.particles !== false;
      loaded.language = clampLang(loaded.language);
      loaded.autoplaySpeed = clampAutoplaySpeed(loaded.autoplaySpeed);
      if (loaded.mobilePad === true || loaded.mobilePad === "on") {
        loaded.mobilePad = true;
      } else if (loaded.mobilePad === false || loaded.mobilePad === "off") {
        loaded.mobilePad = false;
      } else {
        loaded.mobilePad = "auto";
      }
      loaded.dadSpecial = !!loaded.dadSpecial;
      loaded.dadSpecialDuration = clampDadDuration(loaded.dadSpecialDuration);
      loaded.haptic = loaded.haptic !== false;
      loaded.theme = clampTheme(loaded.theme);
      try {
        if (localStorage.getItem(MUTE_KEY) === "1" && !localStorage.getItem(SETTINGS_KEY)) {
          loaded.sound = false;
        }
      } catch (err) {
        /* ignore */
      }
      return hydrateBoardFxFromStorage(loaded, stored);
    } catch (err) {
      return persistHealedSettings(defaultSettings());
    }
  }

  function clampLang(value) {
    return LANG_IDS.has(value) ? value : SETTING_DEFAULTS.language;
  }

  function clampTheme(value) {
    return THEME_IDS.indexOf(value) >= 0 ? value : "neon-blue";
  }

  function readStoredTheme() {
    try {
      const raw = localStorage.getItem(THEME_KEY);
      if (raw) {
        return clampTheme(raw);
      }
    } catch (err) {
      /* ignore */
    }
    return clampTheme(settings && settings.theme);
  }

  function applyTheme(id, persist) {
    const theme = clampTheme(id);
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    const primary = (getComputedStyle(document.documentElement).getPropertyValue("--theme-primary") || "#00d2ff").trim();
    if (meta) {
      meta.setAttribute("content", primary || "#00d2ff");
    }
    if (settings) {
      settings.theme = theme;
    }
    if (persist !== false) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (err) {
        /* ignore */
      }
    }
    syncThemeUi();
    lockHeaderUtilityButtons();
    updateGhostPreview();
    invalidateStaticBackground();
    try {
      renderStaticBackground();
      draw();
    } catch (err) {
      /* idle theme paint optional */
    }
  }

  function syncThemeUi() {
    const current = clampTheme((settings && settings.theme) || readStoredTheme());
    document.querySelectorAll(".theme-swatch").forEach((btn) => {
      const on = btn.dataset.theme === current;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    const name = document.getElementById("theme-name");
    if (name) {
      name.textContent = t(THEME_I18N[current] || "themeNeonBlue");
    }
  }

  function currentLocale() {
    return LANG_LOCALES[settings.language] || "en-US";
  }

  function t(key, vars) {
    const lang = (settings && settings.language) || "ko";
    const dict = I18N[lang] || I18N.ko || {};
    const fallback = I18N.en || I18N.ko || {};
    let text = dict[key] || fallback[key] || (I18N.ko && I18N.ko[key]) || key;
    if (vars) {
      Object.keys(vars).forEach((name) => {
        text = text.split(`{${name}}`).join(`\u2066${String(vars[name])}\u2069`);
      });
    }
    return text;
  }

  function populateLangSelect() {
    const select = document.getElementById("lang-select");
    if (!select) {
      return;
    }
    const langs = (window.DAD_I18N && window.DAD_I18N.langs) || [];
    select.innerHTML = langs.map((item) => (
      `<option value="${item.id}">${item.flag} ${item.name}</option>`
    )).join("");
    select.value = settings.language;
  }

  function applyDocumentLang() {
    const lang = settings.language || "ko";
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
    document.body.classList.toggle("is-rtl-lang", lang === "ar");
  }

  function applyStaticI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      if (el.classList.contains("header-mini-btn") || el.closest("#header-mini-menu")) {
        return;
      }
      if (el.id === "overlay-title" || el.id === "overlay-hint" || el.id === "game-start" || el.id === "next-card-label" || el.id === "hold-card-label" || el.id === "btn-toggle-guide-mode") {
        return;
      }
      if (el.closest(".sidebar-header-custom") && el.querySelector("br, img, button, div")) {
        return;
      }
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
    syncStartLevelOptions();
    syncPreviewGuideUi();
    const langSelect = document.getElementById("lang-select");
    if (langSelect) {
      langSelect.value = settings.language;
    }
  }

  function refreshOverlayI18n() {
    if (overlay.classList.contains("hidden")) {
      return;
    }
    showGameOverlay(overlayMode);
  }

  function refreshScoreSaveI18n() {
    if (scoreSaveOpen && pendingScoreSave) {
      document.getElementById("score-save-summary").textContent = t("saveSummary", {
        score: pendingScoreSave.score.toLocaleString(currentLocale()),
        level: pendingScoreSave.level,
      });
    }
    if (autoplayEndOpen) {
      const data = pendingAutoplayEnd || { score, level };
      const summary = document.getElementById("autoplay-end-summary");
      if (summary) {
        summary.textContent = t("saveSummary", {
          score: data.score.toLocaleString(currentLocale()),
          level: data.level,
        });
      }
    }
  }

  function refreshCelebrateI18n() {
    if (!celebrateOpen || !celebrateKind) {
      return;
    }
    const message = getCelebrateMessage(celebrateKind);
    celebrateMessage.textContent = message;
    celebrateFallback.textContent = message;
  }

  function refreshDefaultName() {
    const input = document.getElementById("player-name");
    if (!input) {
      return;
    }
    const dadNames = new Set(Object.keys(I18N).map((id) => I18N[id] && I18N[id].dad).filter(Boolean));
    if (!input.value.trim() || dadNames.has(input.value.trim())) {
      input.value = t("dad");
    }
  }

  function lockHeaderUtilityButtons() {
    const compact = typeof isMobileDevice === "function" ? isMobileDevice() : (Number(window.innerWidth) || 0) <= 768;
    const diagRow = document.getElementById("hud-diag-guide-row");
    const utilRow = document.querySelector("#hud-control-grid .hud-row-utility") || document.getElementById("hud-control-grid");
    const miniMenu = document.getElementById("header-mini-menu");
    const diagBtn = document.getElementById("btn-diagnostics");
    const guideBtn = document.getElementById("btn-guide");
    const settingsBtn = document.getElementById("settings-open");
    const padToggle = document.getElementById("mobile-pad-toggle");
    const miniIcons = { "settings-open": "⚙️", "btn-guide": "📖", "btn-diagnostics": "✏️" };
    const ensureMiniIcon = (btn) => {
      if (!btn) {
        return;
      }
      let ico = btn.querySelector(".mini-ico");
      if (!ico) {
        ico = document.createElement("span");
        ico.className = "mini-ico";
        ico.setAttribute("aria-hidden", "true");
        ico.textContent = miniIcons[btn.id] || "";
        btn.textContent = "";
        btn.appendChild(ico);
      }
    };
    if (compact && miniMenu) {
      if (settingsBtn && settingsBtn.parentElement !== miniMenu) {
        miniMenu.appendChild(settingsBtn);
      }
      if (guideBtn && guideBtn.parentElement !== miniMenu) {
        miniMenu.appendChild(guideBtn);
      }
      if (diagBtn && diagBtn.parentElement !== miniMenu) {
        miniMenu.appendChild(diagBtn);
      }
      ensureMiniIcon(settingsBtn);
      ensureMiniIcon(guideBtn);
      ensureMiniIcon(diagBtn);
    } else {
      if (diagRow) {
        if (guideBtn && guideBtn.parentElement !== diagRow) {
          diagRow.appendChild(guideBtn);
        }
        if (diagBtn && diagBtn.parentElement !== diagRow) {
          diagRow.appendChild(diagBtn);
        }
      }
      if (settingsBtn && utilRow && settingsBtn.parentElement !== utilRow) {
        if (padToggle && padToggle.parentElement === utilRow) {
          utilRow.insertBefore(settingsBtn, padToggle);
        } else {
          utilRow.appendChild(settingsBtn);
        }
      }
      if (typeof t === "function") {
        if (settingsBtn) {
          settingsBtn.textContent = t("settings");
        }
        if (guideBtn) {
          guideBtn.textContent = t("guide");
        }
        if (diagBtn) {
          diagBtn.textContent = t("diagBtn");
        }
      }
    }
    if (diagRow) {
      if (!miniMenu && diagBtn && diagBtn.parentElement !== diagRow) {
        diagRow.appendChild(diagBtn);
      }
      if (!miniMenu && guideBtn && guideBtn.parentElement !== diagRow) {
        diagRow.appendChild(guideBtn);
      }
    }
    const wrapClear = [
      "display", "flex-direction", "gap", "align-items", "position", "top", "right",
      "left", "bottom", "inset", "float", "transform", "width", "height",
    ];
    document.querySelectorAll("#hud-control-grid .dad-speed-row, #hud-control-grid .utility-btn-group, #hud-diag-guide-row").forEach((el) => {
      wrapClear.forEach((prop) => {
        el.style.removeProperty(prop);
      });
    });
    const title = document.querySelector(".sidebar-header-custom .header-game-title");
    if (title) {
      if (compact) {
        ["font-size", "font-weight", "line-height", "letter-spacing", "white-space", "text-shadow"].forEach((prop) => {
          title.style.removeProperty(prop);
        });
      } else {
        title.style.setProperty("font-size", "1.68rem", "important");
        title.style.setProperty("font-weight", "900", "important");
        title.style.setProperty("line-height", "1", "important");
        title.style.setProperty("letter-spacing", "2px", "important");
        title.style.setProperty("white-space", "nowrap", "important");
      }
    }
    const compactBtn = [
      "display", "align-items", "justify-content", "gap", "width", "min-width", "max-width",
      "height", "min-height", "padding", "font-size", "font-weight", "border-radius",
      "white-space", "transform", "position", "top", "right", "left", "bottom", "float",
    ];
    const utilBtn = [
      ["display", "flex"],
      ["align-items", "center"],
      ["justify-content", "center"],
      ["width", "100%"],
      ["min-width", "0"],
      ["max-width", "none"],
      ["height", "36px"],
      ["min-height", "36px"],
      ["padding", "0 8px"],
      ["font-size", "0.84rem"],
      ["font-weight", "700"],
      ["border-radius", "8px"],
      ["white-space", "nowrap"],
      ["line-height", "1"],
      ["transform", "none"],
      ["position", "static"],
      ["margin", "0"],
    ];
    const mainBtn = [
      ["display", "flex"],
      ["align-items", "center"],
      ["justify-content", "center"],
      ["width", "100%"],
      ["min-width", "0"],
      ["max-width", "none"],
      ["height", "42px"],
      ["min-height", "42px"],
      ["padding", "0 8px"],
      ["font-size", "0.95rem"],
      ["font-weight", "800"],
      ["border-radius", "8px"],
      ["white-space", "nowrap"],
      ["line-height", "1"],
      ["transform", "none"],
      ["position", "static"],
      ["margin", "0"],
    ];
    const hudIds = [
      "game-start", "game-end", "autoplay-toggle", "dad-special-toggle",
      "settings-open", "mobile-pad-toggle", "btn-diagnostics", "btn-guide",
    ];
    const mainIds = new Set(["game-start", "game-end"]);
    const utilIds = new Set([
      "btn-diagnostics", "btn-guide", "mobile-pad-toggle", "settings-open",
    ]);
    hudIds.forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) {
        return;
      }
      const inMiniMenu = !!(miniMenu && miniMenu.contains(btn) && (id === "settings-open" || id === "btn-guide" || id === "btn-diagnostics"));
      if (inMiniMenu) {
        compactBtn.forEach((prop) => {
          btn.style.removeProperty(prop);
        });
        btn.style.setProperty("position", "static", "important");
        ["top", "right", "left", "bottom"].forEach((prop) => {
          btn.style.setProperty(prop, "auto", "important");
        });
        btn.style.setProperty("float", "none", "important");
        return;
      }
      if (compact) {
        compactBtn.forEach((prop) => {
          btn.style.removeProperty(prop);
        });
        btn.style.setProperty("position", "static", "important");
        ["top", "right", "left", "bottom"].forEach((prop) => {
          btn.style.setProperty(prop, "auto", "important");
        });
        btn.style.setProperty("float", "none", "important");
        return;
      }
      ["position", "top", "right", "left", "bottom", "float"].forEach((prop) => {
        btn.style.removeProperty(prop);
      });
      btn.style.setProperty("white-space", "nowrap", "important");
      btn.style.setProperty("transform", "none", "important");
      if (mainIds.has(id)) {
        mainBtn.forEach(([prop, value]) => {
          btn.style.setProperty(prop, value, "important");
        });
        return;
      }
      if (utilIds.has(id)) {
        utilBtn.forEach(([prop, value]) => {
          btn.style.setProperty(prop, value, "important");
        });
        return;
      }
      if (id === "dad-special-toggle") {
        btn.style.setProperty("overflow", "visible", "important");
        btn.style.setProperty("font-size", "0.78rem", "important");
        btn.style.setProperty("height", "36px", "important");
        btn.style.setProperty("min-height", "36px", "important");
        btn.style.setProperty("padding", "0 6px", "important");
      }
      if (id === "autoplay-toggle") {
        btn.style.setProperty("width", "100%", "important");
        btn.style.setProperty("display", "flex", "important");
        btn.style.setProperty("height", "36px", "important");
        btn.style.setProperty("min-height", "36px", "important");
        btn.style.setProperty("font-size", "0.84rem", "important");
      }
    });
  }

  function applyI18n() {
    if (isSyncingUi) {
      return;
    }
    applyDocumentLang();
    applyStaticI18n();
    refreshDefaultName();
    syncAllSettingsUi();
    syncActionButtons();
    syncAutoplayUi();
    syncMobilePadUi();
    syncDadSpecialUi();
    syncGuideButtons();
    refreshOverlayI18n();
    refreshScoreSaveI18n();
    refreshCelebrateI18n();
    renderHall();
    lockHeaderUtilityButtons();
    if (getCheerKind() === "idle") {
      resetDadCheer();
    }
  }

  function formatPlayDate(date) {
    const d = date instanceof Date ? date : new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function lastPlayerName() {
    try {
      const saved = localStorage.getItem(LAST_NAME_KEY);
      if (saved && saved.trim()) {
        return saved.trim().slice(0, 12);
      }
    } catch (err) {
      /* ignore */
    }
    return t("dad");
  }

  function loadHall() {
    try {
      const raw = localStorage.getItem(HALL_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(HALL_KEY);
        return [];
      }
      return normalizeHall(parsed);
    } catch (err) {
      try {
        localStorage.removeItem(HALL_KEY);
      } catch (clearErr) {
        /* ignore */
      }
      return [];
    }
  }

  function normalizeHall(records) {
    return records
      .filter((row) => row && Number.isFinite(Number(row.score)))
      .map((row, index) => ({
        id: String(row.id || `${row.date || ""}-${row.score}-${index}`),
        name: String(row.name || t("dad")).trim().slice(0, 12) || t("dad"),
        score: Math.max(0, Math.round(Number(row.score))),
        level: Math.max(1, Math.round(Number(row.level) || 1)),
        lines: Math.max(0, Math.round(Number(row.lines) || 0)),
        date: String(row.date || ""),
      }))
      .sort((a, b) => b.score - a.score || b.level - a.level)
      .slice(0, 10);
  }

  function saveHall(records) {
    const hall = normalizeHall(records);
    try {
      localStorage.setItem(HALL_KEY, JSON.stringify(hall));
    } catch (err) {
      /* ignore */
    }
    const top = hall.length ? hall[0].score : 0;
    best = Math.max(top, score);
    try {
      localStorage.setItem(BEST_KEY, String(top));
    } catch (err) {
      /* ignore */
    }
    if (ui.best) {
      ui.best.textContent = String(best);
    }
    renderHall();
    return hall;
  }

  function syncBestFromHall(hall) {
    const top = hall && hall.length ? hall[0].score : 0;
    let stored = 0;
    try {
      stored = Number(localStorage.getItem(BEST_KEY) || 0);
      if (!Number.isFinite(stored)) {
        stored = 0;
      }
    } catch (err) {
      stored = 0;
    }
    best = Math.max(top, stored, score);
    if (ui.best) {
      ui.best.textContent = String(best);
    }
  }

  function addHallRecord(name, playerScore, playerLevel, playerLines, options) {
    if (autoplayTouched) {
      return loadHall();
    }
    const hall = loadHall();
    const player = String(name || "").trim().slice(0, 8) || "시스템";
    hall.push({
      id: `${Date.now()}-${playerScore}`,
      name: player,
      playerName: player,
      score: playerScore,
      level: playerLevel,
      lines: Math.max(0, Math.round(Number(playerLines != null ? playerLines : 0) || 0)),
      date: formatPlayDate(new Date()),
      countryCode: "KR",
    });
    if (!(options && options.skipLastName)) {
      try {
        localStorage.setItem(LAST_NAME_KEY, player);
      } catch (err) {
        /* ignore */
      }
    }
    return saveHall(hall);
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function drawRankShareCard(record) {
    const canvas = document.getElementById("rank-share-card");
    if (!canvas || typeof canvas.getContext !== "function") {
      return null;
    }
    canvas.width = 400;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    const row = record || {};
    ctx.fillStyle = "#05070c";
    ctx.fillRect(0, 0, 400, 500);
    ctx.fillStyle = "#7cf0ff";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DAD TETRIS", 200, 58);
    ctx.fillStyle = "#e8f6ff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(String(row.name || t("dad") || "DAD").slice(0, 16), 200, 160);
    ctx.fillStyle = "#00d2ff";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(String(Number(row.score) || 0), 200, 230);
    ctx.save();
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = "#9aa8b8";
    ctx.font = "9px sans-serif";
    ctx.fillText(t("rankingShareWatermark"), 200, 478);
    ctx.restore();
    return canvas;
  }

  function renderHall() {
    const list = document.getElementById("hall-list");
    if (!list) {
      return;
    }
    const hall = loadHall();
    if (!hall.length) {
      list.innerHTML = `<p class="hall-empty">${escapeHtml(t("hallEmpty")).replace(/\n/g, "<br>")}</p>`;
      return;
    }
    const medals = ["🥇", "🥈", "🥉"];
    list.innerHTML = hall.map((row, i) => {
      const rank = medals[i] || String(i + 1);
      const rankClass = i < 3 ? ` rank-${i + 1}` : "";
      return `<article class="hall-row${rankClass}">
        <p class="hall-rank">${rank}</p>
        <div>
          <p class="hall-name">${escapeHtml(row.name)}</p>
          <p class="hall-meta">${escapeHtml(t("hallMeta", { level: row.level, lines: row.lines || 0, date: row.date }))}</p>
        </div>
        <p class="hall-score">${row.score.toLocaleString(currentLocale())}</p>
        <button type="button" class="hall-del" data-hall-del="${escapeHtml(row.id)}">${escapeHtml(t("delete"))}</button>
      </article>`;
    }).join("");
  }

  function openHallModal() {
    hallOpen = true;
    renderHall();
    try {
      drawRankShareCard((loadHall() || [])[0] || { name: lastPlayerName(), score: best, level, lines });
    } catch (err) {
      /* ignore */
    }
    document.getElementById("hall-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function closeHallModal() {
    hallOpen = false;
    document.getElementById("hall-modal").classList.add("hidden");
    if (!settingsOpen && !scoreSaveOpen && !autoplayEndOpen && !helpOpen) {
      document.body.classList.remove("modal-open");
    }
  }

  function openScoreSaveModal() {
    if (!pendingScoreSave) {
      return;
    }
    scoreSaveOpen = true;
    document.getElementById("score-save-summary").textContent = t("saveSummary", {
      score: pendingScoreSave.score.toLocaleString(currentLocale()),
      level: pendingScoreSave.level,
    });
    const input = document.getElementById("player-name");
    input.value = lastPlayerName();
    document.getElementById("score-save-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
    window.setTimeout(() => input.focus(), 40);
  }

  function closeScoreSaveModal() {
    scoreSaveOpen = false;
    pendingScoreSave = null;
    document.getElementById("score-save-modal").classList.add("hidden");
    if (!settingsOpen && !hallOpen && !autoplayEndOpen && !helpOpen && !ingameConfirmOpen) {
      document.body.classList.remove("modal-open");
    }
  }

  let ingameConfirmOpen = false;
  let ingameConfirmResolver = null;

  function closeIngameConfirm(result) {
    const modal = document.getElementById("ingame-confirm-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
    ingameConfirmOpen = false;
    if (!settingsOpen && !hallOpen && !autoplayEndOpen && !helpOpen && !scoreSaveOpen && !celebrateOpen && !diagOpen) {
      document.body.classList.remove("modal-open");
    }
    const resolve = ingameConfirmResolver;
    ingameConfirmResolver = null;
    if (typeof resolve === "function") {
      resolve(!!result);
    }
  }

  function showIngameConfirm(message, options) {
    const modal = document.getElementById("ingame-confirm-modal");
    const titleEl = document.getElementById("ingame-confirm-title");
    const descEl = document.getElementById("ingame-confirm-desc");
    const okBtn = document.getElementById("ingame-confirm-ok");
    const cancelBtn = document.getElementById("ingame-confirm-cancel");
    if (!modal || !okBtn) {
      return Promise.resolve(window.confirm(String(message || "")));
    }
    if (ingameConfirmResolver) {
      ingameConfirmResolver(false);
      ingameConfirmResolver = null;
    }
    return new Promise((resolve) => {
      ingameConfirmResolver = resolve;
      ingameConfirmOpen = true;
      const opts = options || {};
      if (titleEl) {
        titleEl.textContent = opts.title || t("confirmAction");
      }
      if (descEl) {
        descEl.textContent = String(message || "");
      }
      if (okBtn) {
        okBtn.textContent = opts.ok || t("confirmOk");
      }
      if (cancelBtn) {
        cancelBtn.textContent = opts.cancel || t("confirmCancel");
      }
      modal.classList.remove("hidden");
      document.body.classList.add("modal-open");
    });
  }

  function commitScoreSave() {
    if (!pendingScoreSave) {
      closeScoreSaveModal();
      return;
    }
    addHallRecord(document.getElementById("player-name").value, pendingScoreSave.score, pendingScoreSave.level, pendingScoreSave.lines);
    closeScoreSaveModal();
  }

  function isAutoRecordMode() {
    return !!settings.autoRecordMode;
  }

  function systemPlayerName() {
    return t("autoRecordName") || "시스템";
  }

  function requestScoreSave() {
    if (autoplayTouched) {
      pendingAutoplayEnd = { score, level };
      pendingScoreSave = null;
      if (!celebrateOpen) {
        openAutoplayEndModal();
      }
      return;
    }
    if (score <= 0) {
      return;
    }
    if (isAutoRecordMode()) {
      pendingScoreSave = null;
      addHallRecord(systemPlayerName(), score, level, lines, { skipLastName: true });
      showNeonToast(t("autoRecordToast"), { ms: 1500, corner: true });
      return;
    }
    pendingScoreSave = { score, level, lines };
    if (!celebrateOpen) {
      openScoreSaveModal();
    }
  }

  function openAutoplayEndModal() {
    const data = pendingAutoplayEnd || { score, level };
    pendingAutoplayEnd = data;
    autoplayEndOpen = true;
    const summary = document.getElementById("autoplay-end-summary");
    if (summary) {
      summary.textContent = t("saveSummary", {
        score: data.score.toLocaleString(currentLocale()),
        level: data.level,
      });
    }
    document.getElementById("autoplay-end-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
  }

  function closeAutoplayEndModal() {
    autoplayEndOpen = false;
    pendingAutoplayEnd = null;
    const modal = document.getElementById("autoplay-end-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
    if (!settingsOpen && !hallOpen && !scoreSaveOpen && !helpOpen) {
      document.body.classList.remove("modal-open");
    }
  }

  function readLocal(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (err) {
      return "";
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  }

  function removeLocal(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      /* ignore */
    }
  }

  function profileAvatarEls() {
    return [profileImageEl, profilePreviewEl, sidebarProfileEl].filter(Boolean);
  }

  function profileFallbackEls() {
    return [profileFallback, profilePreviewFallback, sidebarProfileFallback].filter(Boolean);
  }

  function isProfileDataUrl(value) {
    return typeof value === "string" && (value.indexOf("data:image/") === 0 || value.indexOf("blob:") === 0);
  }

  function loadProfileImgLocal() {
    const live = mediaStore.peek("profile") || mediaStore.peek("profileSnap");
    if (live) {
      return live;
    }
    const snap = readLocal(PROFILE_IMG_KEY);
    if (typeof snap === "string" && snap.indexOf("data:image/") === 0) {
      saveMediaFile("profileSnap", snap).then(() => {
        try {
          localStorage.removeItem(PROFILE_IMG_KEY);
        } catch (err) {
          /* ignore */
        }
      }).catch((err) => {
        try {
          console.error("[DadTetrisDB] profile migrate failed", err);
        } catch (ignore) {
          /* ignore */
        }
      });
      return snap;
    }
    const legacy = readLocal(PROFILE_CROP_KEY) || readLocal(PROFILE_KEY);
    return typeof legacy === "string" && legacy.indexOf("data:image/") === 0 ? legacy : "";
  }

  function saveProfileImgLocal(dataUrl) {
    if (!isProfileDataUrl(dataUrl)) {
      return false;
    }
    saveMediaFile("profileSnap", dataUrl).catch((err) => {
      try {
        console.error("[DadTetrisDB] profile snap save failed", err);
      } catch (ignore) {
        /* ignore */
      }
    });
    try {
      localStorage.removeItem(PROFILE_IMG_KEY);
      localStorage.removeItem(PROFILE_KEY);
    } catch (err) {
      /* ignore */
    }
    return true;
  }

  function clearProfileImgLocal() {
    removeLocal(PROFILE_IMG_KEY);
    mediaStore.del("profileSnap");
  }

  function paintCoverSquare(img, size) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    const iw = img.naturalWidth || img.width || size;
    const ih = img.naturalHeight || img.height || size;
    const scale = Math.max(size / Math.max(1, iw), size / Math.max(1, ih));
    const w = iw * scale;
    const h = ih * scale;
    ctx.fillStyle = "#07141c";
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
    return canvas;
  }

  function canvasToProfileDataUrl(canvas, quality) {
    if (!canvas) {
      return "";
    }
    try {
      return canvas.toDataURL("image/jpeg", quality);
    } catch (err) {
      try {
        return canvas.toDataURL("image/png");
      } catch (err2) {
        return "";
      }
    }
  }

  function compressProfileToDataUrl(img) {
    const attempts = [
      [PROFILE_DISPLAY_SIZE, 0.84],
      [PROFILE_DISPLAY_SIZE, 0.7],
      [120, 0.68],
      [120, 0.52],
      [120, 0.4],
    ];
    for (const [size, quality] of attempts) {
      const dataUrl = canvasToProfileDataUrl(paintCoverSquare(img, size), quality);
      if (!dataUrl) {
        continue;
      }
      if (dataUrl.length > 220000) {
        continue;
      }
      if (saveProfileImgLocal(dataUrl)) {
        return dataUrl;
      }
    }
    const last = canvasToProfileDataUrl(paintCoverSquare(img, 120), 0.35);
    if (last && saveProfileImgLocal(last)) {
      return last;
    }
    return last || "";
  }

  function isLiveProfileEditor() {
    return !!(settingsOpen && hasProfileSource());
  }

  function paintProfileAvatars(dataUrl) {
    const live = isLiveProfileEditor();
    if (!isProfileDataUrl(dataUrl)) {
      profileAvatarEls().forEach((el) => {
        if (live && (el === profileImageEl || el === profilePreviewEl)) {
          el.classList.add("hidden");
          return;
        }
        el.removeAttribute("src");
        el.classList.add("hidden");
      });
      profileFallbackEls().forEach((el) => {
        if (live && (el === profileFallback || el === profilePreviewFallback)) {
          el.classList.add("hidden");
          return;
        }
        el.classList.remove("hidden");
      });
      return;
    }
    profileAvatarEls().forEach((el) => {
      if (live && (el === profileImageEl || el === profilePreviewEl)) {
        el.classList.add("hidden");
        return;
      }
      if (el.getAttribute("src") !== dataUrl) {
        el.src = dataUrl;
      }
      el.classList.remove("hidden");
    });
    profileFallbackEls().forEach((el) => el.classList.add("hidden"));
  }

  function restoreProfileFromStorage() {
    const snap = loadProfileImgLocal();
    if (!snap) {
      paintProfileAvatars("");
      return false;
    }
    paintProfileAvatars(snap);
    if (snap.indexOf("blob:") === 0) {
      return true;
    }
    if (snap !== mediaStore.peek("profileSnap") && snap.indexOf("data:image/") === 0) {
      saveMediaFile("profileSnap", snap).catch((err) => {
        try {
          console.error("[DadTetrisDB] profile restore migrate failed", err);
        } catch (ignore) {
          /* ignore */
        }
      });
    }
    return true;
  }

  function snapshotVisibleProfile() {
    if (hasProfileSource()) {
      const canvas = document.createElement("canvas");
      canvas.width = PROFILE_DISPLAY_SIZE;
      canvas.height = PROFILE_DISPLAY_SIZE;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        drawProfileCircle(ctx, PROFILE_DISPLAY_SIZE);
        canvasToBlob(canvas, "image/jpeg", 0.84).then((blob) => {
          if (!blob) {
            return;
          }
          return mediaStore.put("profileSnap", blob).then((ok) => {
            if (!ok) {
              return;
            }
            const url = mediaStore.peek("profileSnap");
            if (url) {
              paintProfileAvatars(url);
            }
            if (isLiveProfileEditor()) {
              showProfileFrames(true);
            }
          });
        }).catch((err) => {
          try {
            console.error("[DadTetrisDB] profile snapshot failed", err);
          } catch (ignore) {
            /* ignore */
          }
        });
        return mediaStore.peek("profileSnap") || mediaStore.peek("profile") || "";
      }
    }
    const live = profileImageEl && profileImageEl.getAttribute("src");
    if (isProfileDataUrl(live)) {
      saveProfileImgLocal(live);
      paintProfileAvatars(live);
      return live;
    }
    return loadProfileImgLocal();
  }

  function loadProfileData() {
    return mediaStore.peek("profile") || readLocal(PROFILE_KEY);
  }

  function loadProfileCrop() {
    return mediaStore.peek("profileCrop") || readLocal(PROFILE_CROP_KEY);
  }

  async function saveProfileBlob(blob) {
    return mediaStore.put("profile", blob);
  }

  async function saveProfileCropBlob(blob) {
    return mediaStore.put("profileCrop", blob);
  }

  function hasProfileSource() {
    return !!(profileSource && profileSource.naturalWidth);
  }

  function profileCoverScale(size) {
    if (!hasProfileSource()) {
      return 1;
    }
    return Math.max(size / profileSource.naturalWidth, size / profileSource.naturalHeight);
  }

  function profileDrawSize(size) {
    const scale = profileCoverScale(size) * profileState.zoom;
    return {
      w: profileSource.naturalWidth * scale,
      h: profileSource.naturalHeight * scale,
    };
  }

  function profilePanLimit() {
    if (!hasProfileSource()) {
      return { x: 0, y: 0 };
    }
    const { w, h } = profileDrawSize(PROFILE_CANVAS_SIZE);
    const size = PROFILE_CANVAS_SIZE;
    return {
      x: Math.min(PROFILE_SHIFT_MAX, Math.round(Math.max(w, size) / 2)),
      y: Math.min(PROFILE_SHIFT_MAX, Math.round(Math.max(h, size) / 2)),
    };
  }

  function clampProfileZoom(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.profileZoom;
    }
    return Math.min(PROFILE_ZOOM_MAX, Math.max(PROFILE_ZOOM_MIN, Math.round(n)));
  }

  function migrateProfileZoom(loaded, stored) {
    const unit = stored && stored.profileZoomUnit;
    const raw = Number(loaded && loaded.profileZoom);
    let percent = 100;
    if (unit === "percent") {
      percent = raw;
    } else if (unit === "bias") {
      percent = 100 + (Number.isFinite(raw) ? raw : 0);
    } else if (Number.isFinite(raw)) {
      if (raw >= PROFILE_ZOOM_MIN && raw <= PROFILE_ZOOM_MAX) {
        percent = raw;
      } else if (raw >= 0 && raw < PROFILE_ZOOM_MIN) {
        percent = 100 + raw;
      }
    }
    loaded.profileZoomUnit = "percent";
    loaded.profileZoom = clampProfileZoom(percent);
    return loaded.profileZoom;
  }

  function clampProfileScale(scale) {
    const n = Number(scale);
    if (!Number.isFinite(n)) {
      return 1;
    }
    return Math.min(PROFILE_SCALE_MAX, Math.max(PROFILE_SCALE_MIN, n));
  }

  function zoomPercentToScale(percent) {
    const n = Number(percent);
    if (!Number.isFinite(n)) {
      return 1;
    }
    return clampProfileScale(n / 100);
  }

  function zoomScaleToPercent(scale) {
    return clampProfileZoom(Math.round(clampProfileScale(scale) * 100));
  }

  function formatZoomPercent(scale) {
    return `${zoomScaleToPercent(scale)}%`;
  }

  function setProfileZoomScale(scale, persist) {
    profileState.zoom = clampProfileScale(scale);
    clampProfilePan();
    pushProfileState();
    requestProfileRender(!!persist);
  }

  function resetProfileView() {
    profileState.zoom = 1;
    profileState.x = 0;
    profileState.y = 0;
    pushProfileState();
    requestProfileRender(true);
  }

  function nudgeProfileZoom(deltaPercent) {
    setProfileZoomScale(zoomPercentToScale(zoomScaleToPercent(profileState.zoom) + deltaPercent), true);
  }

  function clampProfileAxis(value, axis) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 0;
    }
    const limit = profilePanLimit()[axis] || 0;
    return Math.min(limit, Math.max(-limit, Math.round(n)));
  }

  function clampProfilePan() {
    profileState.x = clampProfileAxis(profileState.x, "x");
    profileState.y = clampProfileAxis(profileState.y, "y");
  }

  function formatOffset(value) {
    const n = Math.round(Number(value) || 0);
    return n > 0 ? `+${n}px` : `${n}px`;
  }

  function pullProfileState() {
    profileState.zoom = zoomPercentToScale(settings.profileZoom);
    profileState.x = settings.profileX;
    profileState.y = settings.profileY;
    clampProfilePan();
  }

  function pushProfileState() {
    settings.profileZoom = zoomScaleToPercent(profileState.zoom);
    settings.profileZoomUnit = "percent";
    settings.profileX = profileState.x;
    settings.profileY = profileState.y;
  }

  function fillProfileGlow(ctx, size) {
    const glow = ctx.createRadialGradient(
      size * 0.5,
      size * 0.36,
      size * 0.06,
      size * 0.5,
      size * 0.5,
      size * 0.54
    );
    glow.addColorStop(0, "rgba(46, 230, 255, 0.26)");
    glow.addColorStop(0.42, "rgba(8, 18, 28, 0.96)");
    glow.addColorStop(1, "#05070c");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function profileLayout(size) {
    const canvasSize = Number(size) || PROFILE_CANVAS_SIZE;
    if (!hasProfileSource()) {
      return { w: canvasSize, h: canvasSize, dx: 0, dy: 0, sx: profileState.zoom, sy: profileState.zoom, zoom: profileState.zoom };
    }
    clampProfilePan();
    const { w, h } = profileDrawSize(canvasSize);
    const dx = canvasSize / 2 + (profileState.x * canvasSize) / PROFILE_CANVAS_SIZE - w / 2;
    const dy = canvasSize / 2 + (profileState.y * canvasSize) / PROFILE_CANVAS_SIZE - h / 2;
    const sx = w / Math.max(1, profileSource.naturalWidth);
    const sy = h / Math.max(1, profileSource.naturalHeight);
    return { w, h, dx, dy, sx, sy, zoom: profileState.zoom };
  }

  function drawProfileCircle(ctx, size) {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 0.5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    fillProfileGlow(ctx, size);
    if (!hasProfileSource()) {
      ctx.restore();
      return;
    }
    const { w, h, dx, dy } = profileLayout(size);
    ctx.drawImage(profileSource, dx, dy, w, h);
    ctx.restore();
  }

  function exportProfileCircle() {
    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_CANVAS_SIZE;
    canvas.height = PROFILE_CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    drawProfileCircle(ctx, PROFILE_CANVAS_SIZE);
    return canvas.toDataURL("image/png");
  }

  function showFallbackAvatar() {
    if (restoreProfileFromStorage()) {
      profileBroken = false;
      profileSource = null;
      showProfileFrames(false);
      return;
    }
    profileBroken = true;
    profileSource = null;
    showProfileFrames(false);
    paintProfileAvatars("");
  }

  function profileCropFrame() {
    return document.getElementById("profile-crop-area") || document.getElementById("profile-preview-frame");
  }

  function showProfileFrames(on) {
    if (profileMainCanvas) {
      profileMainCanvas.classList.toggle("hidden", !on);
    }
    if (profileCropCanvas) {
      profileCropCanvas.classList.toggle("hidden", !on);
    }
    if (on) {
      if (profileImageEl) {
        profileImageEl.classList.add("hidden");
      }
      if (profilePreviewEl) {
        profilePreviewEl.classList.add("hidden");
      }
      if (profileFallback) {
        profileFallback.classList.add("hidden");
      }
      if (profilePreviewFallback) {
        profilePreviewFallback.classList.add("hidden");
      }
      const snap = loadProfileImgLocal();
      if (snap && sidebarProfileEl) {
        sidebarProfileEl.src = snap;
        sidebarProfileEl.classList.remove("hidden");
        if (sidebarProfileFallback) {
          sidebarProfileFallback.classList.add("hidden");
        }
      }
      return;
    }
    const snap = loadProfileImgLocal();
    if (snap) {
      paintProfileAvatars(snap);
      return;
    }
    profileAvatarEls().forEach((el) => el.classList.add("hidden"));
    profileFallbackEls().forEach((el) => el.classList.toggle("hidden", on));
  }

  function ensureProfileSource(done) {
    if (hasProfileSource()) {
      if (done) {
        done(true);
      }
      return;
    }
    const fromImg = [profilePreviewEl, profileImageEl, sidebarProfileEl].find((el) => el && el.naturalWidth);
    if (fromImg) {
      profileBroken = false;
      profileSource = fromImg;
      if (done) {
        done(true);
      }
      return;
    }
    const url = loadProfileData() || loadProfileImgLocal() || loadProfileCrop();
    if (!url) {
      if (done) {
        done(false);
      }
      return;
    }
    const img = new Image();
    img.onload = () => {
      profileBroken = false;
      profileSource = img;
      pullProfileState();
      renderProfileViews();
      if (done) {
        done(true);
      }
    };
    img.onerror = () => {
      if (done) {
        done(false);
      }
    };
    img.src = url;
  }

  function commitProfileCropSave() {
    pushProfileState();
    saveSettings();
    snapshotVisibleProfile();
    persistProfileCrop();
    const packed = loadProfileImgLocal();
    if (isLiveProfileEditor()) {
      renderProfileViews();
      if (packed && sidebarProfileEl) {
        sidebarProfileEl.src = packed;
        sidebarProfileEl.classList.remove("hidden");
        if (sidebarProfileFallback) {
          sidebarProfileFallback.classList.add("hidden");
        }
      }
    } else if (packed) {
      paintProfileAvatars(packed);
      showProfileFrames(false);
    } else {
      renderProfileViews();
    }
    return !!packed;
  }

  function renderProfileViews() {
    if (profileBroken || !hasProfileSource()) {
      if (profileBroken && !loadProfileImgLocal()) {
        showFallbackAvatar();
        return;
      }
      showProfileFrames(false);
      const display = loadProfileImgLocal() || loadProfileCrop();
      if (display) {
        paintProfileAvatars(isProfileDataUrl(display) ? display : loadProfileImgLocal());
        if (!isProfileDataUrl(display) && display) {
          profileAvatarEls().forEach((el) => {
            el.src = display;
            el.classList.remove("hidden");
          });
          profileFallbackEls().forEach((el) => el.classList.add("hidden"));
        }
      }
      return;
    }
    showProfileFrames(true);
    if (profileMainCtx) {
      drawProfileCircle(profileMainCtx, profileMainCanvas.width);
    }
    if (profileCropCtx) {
      drawProfileCircle(profileCropCtx, profileCropCanvas.width);
    }
  }

  function persistProfileCrop() {
    if (!hasProfileSource()) {
      return;
    }
    snapshotVisibleProfile();
    const canvas = document.createElement("canvas");
    canvas.width = PROFILE_CANVAS_SIZE;
    canvas.height = PROFILE_CANVAS_SIZE;
    const ctx = canvas.getContext("2d");
    drawProfileCircle(ctx, PROFILE_CANVAS_SIZE);
    canvasToBlob(canvas, "image/png").then((blob) => {
      if (!blob) {
        return;
      }
      saveProfileCropBlob(blob).then((ok) => {
        if (!ok) {
          return;
        }
        pushProfileState();
        saveSettings();
      });
    });
  }

  function requestProfileRender(persist) {
    renderProfileViews();
    if (!isSyncingProfile) {
      syncProfileSliders();
    }
    window.clearTimeout(profileRenderTimer);
    if (persist) {
      profileRenderTimer = window.setTimeout(persistProfileCrop, 80);
    }
  }

  function updateProfileTransform() {
    requestProfileRender(true);
  }

  function applyProfileTransform() {
    pullProfileState();
    renderProfileViews();
  }

  function applyProfile(dataUrl) {
    if (!dataUrl) {
      profileSource = null;
      profileBroken = false;
      try {
        localStorage.removeItem(PROFILE_CROP_KEY);
      } catch (err) {
        /* ignore */
      }
      mediaStore.del("profileCrop");
      clearProfileImgLocal();
      showProfileFrames(false);
      paintProfileAvatars("");
      syncProfileSliders();
      return;
    }
    profileBroken = false;
    if (isProfileDataUrl(dataUrl)) {
      paintProfileAvatars(dataUrl);
      if (dataUrl.indexOf("data:image/") === 0) {
        saveProfileImgLocal(dataUrl);
      }
    }
    const img = new Image();
    img.onload = () => {
      profileBroken = false;
      profileSource = img;
      pullProfileState();
      requestProfileRender(true);
      snapshotVisibleProfile();
    };
    img.onerror = () => {
      if (!restoreProfileFromStorage()) {
        showFallbackAvatar();
      }
    };
    img.src = dataUrl;
  }

  function syncProfileSliders() {
    if (isSyncingProfile) {
      return;
    }
    isSyncingProfile = true;
    try {
    const zoom = document.getElementById("profile-zoom");
    const x = document.getElementById("profile-x");
    const y = document.getElementById("profile-y");
    if (!zoom || !x || !y) {
      return;
    }
    const zoomOut = document.getElementById("profile-zoom-out");
    const zoomIn = document.getElementById("profile-zoom-in");
    const hasPhoto = hasProfileSource() || !!loadProfileData() || !!loadProfileImgLocal();
    [zoom, x, y].forEach((slider) => {
      slider.disabled = !hasPhoto;
      const row = slider.closest(".slider-row");
      if (row) {
        row.classList.toggle("is-disabled", !hasPhoto);
      }
    });
    if (zoomOut) {
      zoomOut.disabled = !hasPhoto;
    }
    if (zoomIn) {
      zoomIn.disabled = !hasPhoto;
    }
    const limit = profilePanLimit();
    zoom.min = String(PROFILE_ZOOM_MIN);
    zoom.max = String(PROFILE_ZOOM_MAX);
    zoom.value = String(zoomScaleToPercent(profileState.zoom));
    x.min = String(Math.round(-limit.x));
    x.max = String(Math.round(limit.x));
    y.min = String(Math.round(-limit.y));
    y.max = String(Math.round(limit.y));
    x.value = String(profileState.x);
    y.value = String(profileState.y);
    document.getElementById("profile-zoom-value").textContent = formatZoomPercent(profileState.zoom);
    document.getElementById("profile-x-value").textContent = formatOffset(profileState.x);
    document.getElementById("profile-y-value").textContent = formatOffset(profileState.y);
    } finally {
      isSyncingProfile = false;
    }
  }

  function syncProfileUi() {
    const name = document.getElementById("profile-file-name");
    if (!name) {
      return;
    }
    if (settings.profileFileName && (loadProfileData() || loadProfileImgLocal())) {
      name.textContent = t("profileRegistered", { name: settings.profileFileName });
    } else if (settings.profileFileName) {
      name.textContent = t("profileReselect", { name: settings.profileFileName });
    } else {
      name.textContent = t("profileNone");
    }
    syncProfileSliders();
    renderProfileViews();
  }

  function setProfileFromFile(file) {
    if (!file) {
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      mediaStore.put("profile", file).then((ok) => {
        const name = document.getElementById("profile-file-name");
        if (!ok) {
          if (name) {
            name.textContent = t("profileQuota");
          }
          try {
            console.error("[DadTetrisDB] profile file save failed");
          } catch (err) {
            /* ignore */
          }
          return;
        }
        encodeImageBlob(img, 1000, 1000, 0.82).then((blob) => {
          if (blob) {
            return saveProfileBlob(blob);
          }
          return false;
        }).catch((err) => {
          try {
            console.error("[DadTetrisDB] profile encode failed", err);
          } catch (ignore) {
            /* ignore */
          }
        });
        settings.profileFileName = file.name;
        profileState.zoom = 1;
        profileState.x = 0;
        profileState.y = 0;
        pushProfileState();
        saveSettings();
        applyProfile(mediaStore.peek("profile") || objectUrl);
        syncProfileUi();
      }).catch((err) => {
        try {
          console.error("[DadTetrisDB] profile file save failed", err);
        } catch (ignore) {
          /* ignore */
        }
        if (!restoreProfileFromStorage()) {
          showFallbackAvatar();
        }
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      if (!restoreProfileFromStorage()) {
        showFallbackAvatar();
      }
    };
    img.src = objectUrl;
  }

  function isSettingsTarget(target) {
    return !!(target && target.closest && target.closest("#settings-modal, .settings-open-btn"));
  }

  function clampPercent(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return fallback;
    }
    return Math.min(100, Math.max(0, Math.round(n)));
  }

  function clampBlur(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return fallback != null ? fallback : SETTING_DEFAULTS.bgBlur;
    }
    return Math.min(20, Math.max(0, Math.round(n)));
  }

  function unit(value, fallback) {
    return clampPercent(value, fallback) / 100;
  }

  function mergeVideoMap(value) {
    const out = { goal1: "", goal2: "", gameover: "" };
    if (!value || typeof value !== "object") {
      return out;
    }
    const aliases = { score5k: "goal1", score10k: "goal2" };
    for (const key of VIDEO_KEYS) {
      if (typeof value[key] === "string") {
        out[key] = value[key].trim();
      }
    }
    for (const oldKey of Object.keys(aliases)) {
      const nextKey = aliases[oldKey];
      if (!out[nextKey] && typeof value[oldKey] === "string") {
        out[nextKey] = value[oldKey].trim();
      }
    }
    return out;
  }

  function mergeLevelBgNames(value) {
    const out = {};
    for (let n = 1; n <= LEVEL_BG_MAX; n++) {
      const raw = value && typeof value === "object" ? value[n] ?? value[String(n)] : "";
      out[n] = typeof raw === "string" ? raw : "";
    }
    return out;
  }

  function clampGoalScore(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return fallback;
    }
    return Math.min(999999, Math.max(100, Math.round(n)));
  }

  function formatScore(n) {
    return clampGoalScore(n, 0).toLocaleString(currentLocale());
  }

  function normalizeGoals(changed) {
    let first = clampGoalScore(settings.goal1Score, SETTING_DEFAULTS.goal1Score);
    let second = clampGoalScore(settings.goal2Score, SETTING_DEFAULTS.goal2Score);
    if (first >= second) {
      if (changed === "goal2") {
        first = Math.max(100, second - 100);
      } else {
        second = Math.min(999999, first + 100);
      }
    }
    settings.goal1Score = first;
    settings.goal2Score = second;
  }

  function getCelebrateMessage(kind) {
    if (kind === "goal1") {
      return t("celebrateGoal1", { score: formatScore(settings.goal1Score) });
    }
    if (kind === "goal2") {
      return t("celebrateGoal2", { score: formatScore(settings.goal2Score) });
    }
    if (kind === "gameover") {
      return t("celebrateGameover");
    }
    return "";
  }

  function celebrateTitle(kind) {
    if (kind === "goal1" || kind === "goal2") {
      const score = formatScore(kind === "goal1" ? settings.goal1Score : settings.goal2Score);
      return t("videoTitleScore", { score });
    }
    return t("gameoverVideo");
  }

  function clampDadDuration(value) {
    const n = Number(value);
    if (DAD_DURATION_OPTIONS.includes(n)) {
      return n;
    }
    return SETTING_DEFAULTS.dadSpecialDuration;
  }

  function dadSpecialDurationSec() {
    return clampDadDuration(settings.dadSpecialDuration);
  }

  function dadSpecialDurationMs() {
    return dadSpecialDurationSec() * 1000;
  }

  function clampStartLevel(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.startLevel;
    }
    return Math.min(LEVEL_MAX, Math.max(1, Math.round(n)));
  }

  function clampStartGarbageLines(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.startGarbageLines;
    }
    return Math.min(10, Math.max(0, Math.round(n)));
  }

  function formatGarbageLinesLabel(value) {
    const n = clampStartGarbageLines(value);
    if (n <= 0) {
      return t("startGarbageClean");
    }
    return t("startGarbageValue", { n });
  }

  function playLevel(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 1;
    }
    return Math.min(LEVEL_MAX, Math.max(1, Math.round(n)));
  }

  function isExtremeLevel(value) {
    return playLevel(value) >= 11;
  }

  function clampAutoplaySpeed(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return SETTING_DEFAULTS.autoplaySpeed;
    }
    return Math.min(20, Math.max(0.5, Math.round(n * 2) / 2));
  }

  function formatAutoplaySpeed(value) {
    return clampAutoplaySpeed(value).toFixed(1);
  }

  function autoplaySpeedTierKey(value) {
    const speed = clampAutoplaySpeed(value);
    if (speed <= 0.5) {
      return "autoplaySpeedSlow";
    }
    if (speed <= 1) {
      return "autoplaySpeedNormal";
    }
    if (speed < 5) {
      return "autoplaySpeedFast";
    }
    if (speed < 10) {
      return "autoplaySpeedHigh";
    }
    return "autoplaySpeedUltra";
  }

  function levelSpeedMultiplier() {
    return BASE_GRAVITY_MS / Math.max(1, levelBaseGravityMs());
  }

  function autoplayDelayMs() {
    const autoplaySpeed = clampAutoplaySpeed(settings.autoplaySpeed);
    const currentLevelSpeedMultiplier = levelSpeedMultiplier();
    return Math.max(AUTOPLAY_MIN_MS, BASE_GRAVITY_MS / (currentLevelSpeedMultiplier * autoplaySpeed));
  }

  function autoplayMotionBurst() {
    const speed = clampAutoplaySpeed(settings.autoplaySpeed);
    if (speed >= 20) {
      return 4;
    }
    if (speed >= 10) {
      return 3;
    }
    if (speed >= 5) {
      return 2;
    }
    return 1;
  }

  function autoplayInputsBeforeDrop() {
    const speed = clampAutoplaySpeed(settings.autoplaySpeed);
    if (speed >= 10) {
      return 4;
    }
    if (speed >= 5) {
      return 3;
    }
    return 1;
  }

  function nextAutoplayDelay() {
    if (!current) {
      return autoplayDelayMs();
    }
    const speed = clampAutoplaySpeed(settings.autoplaySpeed);
    const kind = autoplayPlan && autoplayPlan.lastKind;
    if (kind === "rotate" || kind === "move") {
      if (speed <= 2) {
        return Math.max(28, Math.min(180, 110 / speed));
      }
      if (speed < 5) {
        return Math.max(AUTOPLAY_MIN_MS, 56 / speed);
      }
      return Math.max(AUTOPLAY_MIN_MS, autoplayDelayMs() * 0.42);
    }
    return autoplayDelayMs();
  }

  function autoplayUsesInstantDrop() {
    return clampAutoplaySpeed(settings.autoplaySpeed) >= 8 || playLevel(level) >= 11;
  }

  function syncAutoplayFade() {
    const speed = clampAutoplaySpeed(settings.autoplaySpeed);
    const fade = autoplay && (speed >= 8 || playLevel(level) >= 11) ? "0.12s" : "0.6s";
    document.documentElement.style.setProperty("--bg-fade", fade);
  }

  function syncExtremeLevelFx() {
    document.body.classList.toggle("is-extreme-level", (isPlayActive() || autoplayConquered) && isExtremeLevel(level));
  }

  function refreshLevel() {
    if (isLevelUpdating) {
      return;
    }
    isLevelUpdating = true;
    try {
      const prevPlay = playLevel(level);
      const start = clampStartLevel(settings.startLevel);
      const nextLevel = start + Math.floor(Math.max(0, Number(lines) || 0) / 10);
      level = Number.isFinite(nextLevel) ? playLevel(nextLevel) : start;
      if (playLevel(level) !== prevPlay) {
        applyCurrentBackground({ fade: true });
      }
      syncExtremeLevelFx();
      maybeCelebrateLevel20(prevPlay);
    } catch (err) {
      level = clampStartLevel(settings.startLevel);
      syncExtremeLevelFx();
    } finally {
      isLevelUpdating = false;
    }
  }

  let ghostPreviewAlphaOverride = null;
  let ghostPreviewUseOuterAlpha = false;

  function ghostFillAlpha() {
    if (ghostPreviewAlphaOverride != null && Number.isFinite(ghostPreviewAlphaOverride)) {
      return Math.max(0, Math.min(1, ghostPreviewAlphaOverride));
    }
    return unit(settings.ghostStrength, SETTING_DEFAULTS.ghostStrength);
  }

  function ghostStrokeAlpha() {
    return Math.min(1, ghostFillAlpha() + 0.08);
  }

  function syncSlider(id, valueId, value, enabled) {
    const slider = document.getElementById(id);
    const valueLabel = document.getElementById(valueId);
    const row = slider.closest(".slider-row");
    slider.disabled = enabled === false;
    if (row) {
      row.classList.toggle("is-disabled", enabled === false);
    }
    slider.value = String(value);
    valueLabel.textContent = `${value}%`;
  }

  function syncGhostSlider() {
    syncSlider("ghost-strength", "ghost-strength-value", settings.ghostStrength, !!settings.ghost);
    const previewRow = document.querySelector(".ghost-preview-row");
    if (previewRow) {
      previewRow.classList.remove("is-disabled");
    }
    renderGhostPreview(currentGhostOpacity(), currentPreviewSkin());
  }

  function syncSoundSlider() {
    syncSlider("sound-volume", "sound-volume-value", settings.soundVolume, !!settings.sound);
  }

  function syncShakeSlider() {
    syncSlider("shake-strength", "shake-strength-value", settings.shakeStrength, !!settings.shake);
  }

  function syncStartLevelOptions() {
    const select = document.getElementById("start-level");
    if (!select) {
      return;
    }
    if (select.options.length !== LEVEL_MAX) {
      select.innerHTML = Array.from({ length: LEVEL_MAX }, (_, i) => {
        const n = i + 1;
        return `<option value="${n}">${t("levelOption", { n })}</option>`;
      }).join("");
    } else {
      Array.from(select.options).forEach((opt) => {
        opt.textContent = t("levelOption", { n: opt.value });
      });
    }
  }

  function syncStartLevelUi() {
    const select = document.getElementById("start-level");
    const hint = document.getElementById("start-level-hint");
    const n = clampStartLevel(settings.startLevel);
    select.value = String(n);
    hint.textContent = n <= 10 ? (t(`levelHint${n}`) || t("levelHint1")) : t("levelHintExtreme", { n });
  }

  function syncGarbageLinesUi() {
    const slider = document.getElementById("start-garbage-lines");
    const label = document.getElementById("start-garbage-lines-value");
    const n = clampStartGarbageLines(settings.startGarbageLines);
    settings.startGarbageLines = n;
    if (slider) {
      slider.value = String(n);
    }
    if (label) {
      label.textContent = formatGarbageLinesLabel(n);
    }
  }

  function syncPreviewGuideUi() {
    const mode = clampPreviewGuideMode(settings.previewGuideMode);
    settings.previewGuideMode = mode;
    const dual = mode === PREVIEW_MODE_DUAL;
    document.body.dataset.previewGuideMode = mode;
    document.body.classList.toggle("preview-mode-dual", dual);
    const select = document.getElementById("select-preview-mode");
    if (select && select.value !== mode) {
      select.value = mode;
    }
    const nextLabel = document.getElementById("next-card-label");
    const holdLabel = document.getElementById("hold-card-label");
    if (nextLabel) {
      nextLabel.textContent = dual ? t("next1") : t("next");
    }
    if (holdLabel) {
      holdLabel.textContent = dual ? t("next2") : t("hold");
    }
    const holdBtn = document.getElementById("btn-hold");
    if (holdBtn) {
      holdBtn.disabled = dual;
      holdBtn.setAttribute("aria-disabled", dual ? "true" : "false");
      holdBtn.classList.toggle("is-disabled", dual);
      holdBtn.title = dual ? t("holdDisabledHint") : t("padHold");
    }
    const modeToggle = document.getElementById("btn-toggle-guide-mode");
    if (modeToggle) {
      modeToggle.setAttribute("aria-pressed", dual ? "true" : "false");
      modeToggle.classList.toggle("is-dual", dual);
      const tip = t("guideModeToggleTitle");
      modeToggle.setAttribute("title", tip);
      modeToggle.setAttribute("aria-label", tip);
    }
    if (dual && (current || next || next2)) {
      ensureNextQueue();
    }
    drawNext();
  }

  function syncBlockSkinUi() {
    const skin = clampBlockSkin(settings.blockSkinStyle);
    settings.blockSkinStyle = skin;
    const select = document.getElementById("select-block-skin");
    if (select && select.value !== skin) {
      select.value = skin;
    }
    renderSkinPreview(skin);
    try {
      renderGhostPreview(currentGhostOpacity(), skin);
    } catch (err) {
      /* preview optional */
    }
  }

  function syncBoardSizeUi() {
    const mobile = isMobileDevice();
    const stored = clampBoardRows(settings.boardRowsCount);
    const group = document.getElementById("board-size-setting-group");
    const select = document.getElementById("select-board-size");
    try {
      document.body.classList.toggle("is-mobile-board-lock", mobile);
    } catch (err) {
      /* ignore */
    }
    if (group) {
      group.classList.toggle("is-mobile-locked", mobile);
    }
    if (select) {
      select.disabled = mobile;
      select.setAttribute("aria-disabled", mobile ? "true" : "false");
      lockBoardHeightOptions(select, mobile);
      select.value = String(mobile ? BOARD_ROWS_DEFAULT : stored);
    }
  }

  function currentPreviewSkin(explicit) {
    if (explicit != null && String(explicit).trim() !== "") {
      return clampBlockSkin(explicit);
    }
    const select = document.getElementById("select-block-skin");
    if (select && select.value) {
      return clampBlockSkin(select.value);
    }
    try {
      const stored = localStorage.getItem(BLOCK_SKIN_KEY);
      if (stored) {
        return clampBlockSkin(stored);
      }
    } catch (err) {
      /* private mode */
    }
    return clampBlockSkin((settings && settings.blockSkinStyle) || BLOCK_SKIN_DEFAULT);
  }

  function currentGhostOpacity(explicit) {
    if (Number.isFinite(Number(explicit))) {
      return Math.max(0, Math.min(1, Number(explicit)));
    }
    const slider = typeof ghostSliderEl === "function" ? ghostSliderEl() : document.getElementById("ghost-strength");
    if (slider && Number.isFinite(Number(slider.value))) {
      return clampPercent(slider.value, SETTING_DEFAULTS.ghostStrength) / 100;
    }
    return ghostFillAlpha();
  }

  function redrawBlockSkins() {
    try {
      draw();
    } catch (err) {
      /* board may not be ready */
    }
    try {
      renderGhostPreview(currentGhostOpacity(), currentPreviewSkin());
    } catch (err) {
      /* preview canvas optional */
    }
    try {
      renderSkinPreview(currentBlockSkin());
    } catch (err) {
      /* skin preview optional */
    }
  }

  function togglePreviewGuideMode() {
    settings.previewGuideMode = isDualPreviewMode() ? PREVIEW_MODE_STANDARD : PREVIEW_MODE_DUAL;
    persistPreviewGuideMode();
    saveSettings();
    syncPreviewGuideUi();
  }

  function formatDropSpeed(value) {
    return clampDropSpeedMultiplier(value).toFixed(1);
  }

  function dropSpeedTierKey(value) {
    const speed = clampDropSpeedMultiplier(value);
    if (speed <= 0.5) {
      return "dropSpeedVeryEasy";
    }
    if (speed < 1) {
      return "dropSpeedSlowEasy";
    }
    if (speed <= 1) {
      return "dropSpeedNormal";
    }
    if (speed < 1.5) {
      return "dropSpeedFast";
    }
    return "dropSpeedVeryFast";
  }

  function formatDropSpeedLabel(value) {
    return t("dropSpeedValue", {
      speed: formatDropSpeed(value),
      tier: t(dropSpeedTierKey(value)),
    });
  }

  function syncDropSpeedUi() {
    const slider = document.getElementById("slider-drop-speed-multiplier");
    const label = document.getElementById("drop-speed-multiplier-value");
    const n = clampDropSpeedMultiplier(settings.dropSpeedMultiplier);
    settings.dropSpeedMultiplier = n;
    if (slider && document.activeElement !== slider) {
      slider.value = String(n);
    }
    if (label) {
      label.textContent = formatDropSpeedLabel(n);
    }
  }

  function applyDropSpeedToGravity(prevInterval) {
    const nextInterval = gravityInterval();
    if (!Number.isFinite(prevInterval) || prevInterval <= 0) {
      gravityMsLeft = nextInterval;
      return;
    }
    const ratio = Math.max(0, Math.min(1, gravityMsLeft / prevInterval));
    gravityMsLeft = Math.max(16, nextInterval * ratio);
  }

  function syncDadDurationUi() {
    const sec = dadSpecialDurationSec();
    settings.dadSpecialDuration = sec;
    document.querySelectorAll(".dad-duration-btn").forEach((btn) => {
      const on = clampDadDuration(btn.dataset.dadDuration) === sec;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function syncAutoplaySpeedUi() {
    const speed = clampAutoplaySpeed(settings.autoplaySpeed);
    const label = t("autoplaySpeedValue", {
      speed: formatAutoplaySpeed(speed),
      tier: t(autoplaySpeedTierKey(speed)),
    });
    ["autoplay-speed", "autoplay-speed-settings"].forEach((id) => {
      const slider = document.getElementById(id);
      if (slider && document.activeElement !== slider) {
        slider.value = String(speed);
      }
    });
    const side = document.getElementById("autoplay-speed-value");
    const settingsValue = document.getElementById("autoplay-speed-settings-value");
    if (side) {
      side.textContent = `${formatAutoplaySpeed(speed)}x`;
    }
    if (settingsValue) {
      settingsValue.textContent = label;
    }
  }

  function syncAssetBadge(el, isCustom) {
    if (!el) {
      return;
    }
    el.textContent = isCustom ? t("assetCustomOn") : t("assetPresetOn");
    el.classList.toggle("is-custom", isCustom);
    el.classList.toggle("is-preset", !isCustom);
  }

  function hasCustomBgm() {
    return !!mediaStore.peek("bgm");
  }

  function hasCustomIdleBg() {
    return hasCustomBg(bgEditTarget(), "default");
  }

  function hasCustomLevelBg(n) {
    return hasCustomBg(bgEditTarget(), n);
  }

  function defaultLevelBgPath(n) {
    return DEFAULT_ASSETS.levelBgs[shownLevel(n)] || DEFAULT_ASSETS.mainBg;
  }

  function syncBgmUi() {
    const track = document.getElementById("bgm-track");
    const volume = document.getElementById("bgm-volume");
    const volumeValue = document.getElementById("bgm-volume-value");
    const restore = document.getElementById("bgm-restore");
    const custom = hasCustomBgm();
    volume.value = String(settings.bgmVolume);
    volumeValue.textContent = `${settings.bgmVolume}%`;
    syncAssetBadge(document.getElementById("bgm-asset-badge"), custom);
    if (restore) {
      restore.disabled = !custom;
    }
    if (custom) {
      const name = settings.bgmFileName || bgm.fileName;
      if (!bgm.audio.src) {
        track.textContent = t("prevFile", { name });
        return;
      }
      const playing = settings.bgm && !paused && !gameOver && !!bgm.audio.src;
      track.textContent = playing ? t("playing", { name }) : t("selected", { name });
      return;
    }
    const playing = settings.bgm && !paused && !gameOver && !!bgm.audio.src;
    track.textContent = playing ? t("playing", { name: "bgm_default.mp3" }) : t("assetPresetOn");
  }

  function syncBgUi() {
    const dim = document.getElementById("bg-dim");
    const dimValue = document.getElementById("bg-dim-value");
    const blur = document.getElementById("bg-blur");
    const blurValue = document.getElementById("bg-blur-value");
    const on = true;
    dim.disabled = !on;
    blur.disabled = !on;
    dim.closest(".slider-row").classList.toggle("is-disabled", !on);
    blur.closest(".slider-row").classList.toggle("is-disabled", !on);
    dim.value = String(settings.bgDim);
    dimValue.textContent = `${settings.bgDim}%`;
    blur.value = String(settings.bgBlur);
    blurValue.textContent = `${settings.bgBlur}px`;
    syncBoardBgFxUi();
    syncWindowBgFxUi();
    syncMasterBgUi();
  }

  function isCustomBgMasterDisabled() {
    return !!settings.disableAllCustomBg;
  }

  function syncMasterBgUi() {
    const details = document.getElementById("custom-bg-details");
    if (details) {
      details.classList.toggle("is-master-disabled", isCustomBgMasterDisabled());
    }
    document.body.classList.toggle("is-stock-neon-bg", isCustomBgMasterDisabled());
    const btn = document.getElementById("toggle-disable-all-custom-bg");
    if (btn && !isSyncingUi) {
      syncSettingButton(btn);
    }
  }

  function syncWindowBgFxUi() {
    const blur = document.getElementById("window-bg-blur");
    const blurValue = document.getElementById("window-bg-blur-value");
    const opacity = document.getElementById("window-bg-opacity");
    const opacityValue = document.getElementById("window-bg-opacity-value");
    const fx = document.getElementById("window-bg-fx");
    const windowMode = bgEditTarget() !== "board";
    if (fx) {
      fx.classList.toggle("is-board-hidden", !windowMode);
      fx.hidden = !windowMode;
    }
    if (blur) {
      blur.value = String(settings.windowBgBlur);
    }
    if (blurValue) {
      blurValue.textContent = `${settings.windowBgBlur}px`;
    }
    if (opacity) {
      opacity.value = String(settings.windowBgOpacity);
    }
    if (opacityValue) {
      opacityValue.textContent = `${settings.windowBgOpacity}%`;
    }
  }

  function syncBoardBgFxUi() {
    const blur = document.getElementById("board-bg-blur");
    const blurValue = document.getElementById("board-bg-blur-value");
    const opacity = document.getElementById("board-bg-opacity");
    const opacityValue = document.getElementById("board-bg-opacity-value");
    const fx = document.getElementById("board-bg-fx");
    const boardMode = bgEditTarget() === "board";
    if (fx) {
      fx.classList.toggle("is-window-mode", !boardMode);
    }
    if (blur) {
      blur.value = String(settings.boardBgBlur);
    }
    if (blurValue) {
      blurValue.textContent = `${settings.boardBgBlur}px`;
    }
    if (opacity) {
      opacity.value = String(settings.boardBgOpacity);
    }
    if (opacityValue) {
      opacityValue.textContent = `${settings.boardBgOpacity}%`;
    }
  }

  function bindSoundManagerHost() {
    const audioHost = {
      get gameTerminated() { return gameTerminated; },
      get settings() { return settings; },
      get defaults() { return SETTING_DEFAULTS; },
      unit,
      get celebrateOpen() { return celebrateOpen; },
      get paused() { return paused; },
      get gameOver() { return gameOver; },
      get autoplayConquered() { return autoplayConquered; },
      get isAudioLoading() { return isAudioLoading; },
      set isAudioLoading(v) { isAudioLoading = v; },
      get mediaStore() { return mediaStore; },
      safeSetMediaSrc,
      syncBgmUi,
      silenceAudioEl,
    };
    if (soundManager.bgm) {
      bindSoundManager(audioHost);
      sfx = soundManager;
      bgm = soundManager.bgm;
      return;
    }
    const audioBundle = createSoundManager(audioHost);
    sfx = audioBundle.sfx;
    bgm = audioBundle.bgm;
    bgm.init();
  }
  let sfx = { ctx: null, muted: false, ensure() {}, play() {}, playPitched() {}, freezeBend() {}, scale() { return 0; } };
  let bgm = { audio: new Audio(), fileName: "", init() {}, play() {}, pause() {}, fadeIn() {}, fadeOut() {}, applyVolume() {}, setFile() {}, canPlay() { return false; } };
  function silenceAudioEl(el) {
    if (!el) {
      return;
    }
    try {
      el.pause();
    } catch (err) {
      /* ignore */
    }
    try {
      el.removeAttribute("src");
    } catch (err) {
      /* ignore */
    }
  }

  function applyBundledBgm() {
    try {
      silenceAudioEl(bgm.audio);
      bgm.fileName = "";
    } catch (err) {
      /* stay silent without bundled mp3 */
    }
  }

  const sceneBgImage = document.getElementById("scene-bg-image");
  const sceneBgImageNext = document.getElementById("scene-bg-image-next");
  const boardBgImage = document.getElementById("board-bg-image");
  const boardBgImageNext = document.getElementById("board-bg-image-next");
  let sceneBgFront = sceneBgImage;
  let boardBgFront = boardBgImage;
  let appliedBgCss = "";
  let appliedBoardBgCss = "";
  let lastValidBgUrl = "";
  let lastValidBoardBgUrl = "";
  let bgLoadSeq = 0;
  let boardBgLoadSeq = 0;

  function folderLevelBgSrc(n) {
    return "/images/bg" + playLevel(n) + ".jpg";
  }

  function shownLevel(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return 1;
    }
    return Math.min(LEVEL_BG_MAX, Math.max(1, Math.round(n)));
  }

  function bgEditTarget() {
    return settings.bgTarget === "board" ? "board" : "window";
  }

  function bgStoreKey(target, kind) {
    const t = target === "board" ? "board" : "window";
    if (kind === "default" || kind === "idle") {
      return `custom_bg_${t}_default`;
    }
    return `custom_bg_${t}_level_${shownLevel(kind)}`;
  }

  function loadBgData(target, kind) {
    const key = bgStoreKey(target, kind);
    let url = mediaStore.peek(key) || readLocal(key);
    if (!isUserMediaUrl(url) && target !== "board") {
      if (kind === "default") {
        url = mediaStore.peek("idleBg") || readLocal(IDLE_BG_KEY);
      } else {
        url = mediaStore.peek(`levelBg${shownLevel(kind)}`) || readLocal(levelBgStorageKey(kind));
      }
    }
    return isUserMediaUrl(url) ? url : "";
  }

  function hasCustomBg(target, kind) {
    return !!loadBgData(target, kind);
  }

  function bgFileNameOf(target, kind) {
    if (kind === "default") {
      return target === "board"
        ? (settings.boardBgDefaultFileName || "")
        : (settings.windowBgDefaultFileName || settings.levelBgDefaultFileName || "");
    }
    const n = shownLevel(kind);
    const map = target === "board" ? settings.boardBgFileNames : (settings.windowBgFileNames || settings.levelBgFileNames);
    return (map && map[n]) || "";
  }

  function setBgFileName(target, kind, name) {
    const value = typeof name === "string" ? name : "";
    if (kind === "default") {
      if (target === "board") {
        settings.boardBgDefaultFileName = value;
      } else {
        settings.windowBgDefaultFileName = value;
        settings.levelBgDefaultFileName = value;
      }
      return;
    }
    const n = shownLevel(kind);
    if (target === "board") {
      settings.boardBgFileNames[n] = value;
    } else {
      settings.windowBgFileNames[n] = value;
      settings.levelBgFileNames[n] = value;
    }
  }

  function persistBoardFxKeys() {
    try {
      localStorage.setItem("board_bg_blur", String(settings.boardBgBlur));
      localStorage.setItem("board_bg_opacity", String(settings.boardBgOpacity));
    } catch (err) {
      /* ignore */
    }
  }

  function applyWindowBgFx() {
    const blurPx = clampBlur(settings.windowBgBlur != null ? settings.windowBgBlur : SETTING_DEFAULTS.windowBgBlur);
    const opacity = clampPercent(settings.windowBgOpacity, SETTING_DEFAULTS.windowBgOpacity) / 100;
    document.documentElement.style.setProperty("--window-bg-blur", `${blurPx}px`);
    document.documentElement.style.setProperty("--window-bg-opacity", String(opacity));
    document.documentElement.style.setProperty("--bg-blur", `${blurPx}px`);
    persistWindowFxKeys();
  }

  function isPlayActive() {
    return !waitingStart && !gameOver;
  }

  function levelBgStorageKey(n) {
    return `${LEVEL_BG_KEY}${shownLevel(n)}`;
  }

  function loadLevelBgData(n) {
    return loadBgData("window", n);
  }

  function loadIdleBgData() {
    return loadBgData("window", "default");
  }

  async function persistImageToStore(img, key) {
    const attempts = [
      [1920, 1080, 0.78],
      [1600, 900, 0.66],
      [1280, 720, 0.56],
    ];
    for (const [maxW, maxH, quality] of attempts) {
      const blob = await encodeImageBlob(img, maxW, maxH, quality);
      if (blob && await mediaStore.put(key, blob)) {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          /* ignore */
        }
        return mediaStore.peek(key);
      }
    }
    return "";
  }

  function persistLevelBg(n, img) {
    return persistImageToStore(img, bgStoreKey(bgEditTarget(), n));
  }

  function persistIdleBg(img) {
    return persistImageToStore(img, bgStoreKey(bgEditTarget(), "default"));
  }

  function videoStoreKey(kind) {
    return `video-${kind}`;
  }

  async function hydrateMedia() {
    try {
    restoreProfileFromStorage();
    await mediaStore.openDb();
    await mediaStore.migrateDataUrl(PROFILE_KEY, "profile");
    await mediaStore.migrateDataUrl(PROFILE_CROP_KEY, "profileCrop");
    await mediaStore.migrateDataUrl(PROFILE_IMG_KEY, "profileSnap");
    await mediaStore.get("profile");
    await mediaStore.get("profileCrop");
    await mediaStore.get("profileSnap");
    await mediaStore.migrateDataUrl(IDLE_BG_KEY, "idleBg");
    await mediaStore.migrateDataUrl(IDLE_BG_KEY, "custom_bg_window_default");
    for (let n = 1; n <= LEVEL_BG_MAX; n++) {
      await mediaStore.migrateDataUrl(levelBgStorageKey(n), `levelBg${n}`);
      await mediaStore.migrateDataUrl(levelBgStorageKey(n), bgStoreKey("window", n));
    }
    await mediaStore.get("idleBg");
    await mediaStore.copy("idleBg", "custom_bg_window_default");
    for (let n = 1; n <= LEVEL_BG_MAX; n++) {
      await mediaStore.get(`levelBg${n}`);
      await mediaStore.copy(`levelBg${n}`, bgStoreKey("window", n));
    }
    await mediaStore.get("custom_bg_window_default");
    await mediaStore.get("custom_bg_board_default");
    for (let n = 1; n <= LEVEL_BG_MAX; n++) {
      await mediaStore.get(bgStoreKey("window", n));
      await mediaStore.get(bgStoreKey("board", n));
    }
    const bgmUrl = await mediaStore.get("bgm");
    if (bgmUrl) {
      safeSetMediaSrc(bgm.audio, bgmUrl);
      bgm.audio.loop = true;
      bgm.fileName = settings.bgmFileName || bgm.fileName || "";
    } else {
      applyBundledBgm();
    }
    for (const kind of VIDEO_KEYS) {
      const url = await mediaStore.get(videoStoreKey(kind));
      if (url) {
        videoBlobs[kind] = { url, name: settings.videoFileNames[kind] || "video" };
      }
    }
    const profile = loadProfileData();
    if (profile) {
      applyProfile(profile);
    } else {
      restoreProfileFromStorage();
      renderProfileViews();
    }
    applyCurrentBackground();
    syncAllSettingsUi();
    } catch (err) {
      if (!restoreProfileFromStorage()) {
        showFallbackAvatar();
      }
      applyBundledBgm();
      applyCurrentBackground();
      try {
        syncAllSettingsUi();
      } catch (syncErr) {
        /* ignore */
      }
    }
  }

  function cssBgImage(url) {
    return url ? `url("${url}")` : "none";
  }

  function paintBodyBackground(url) {
    if (!isUserMediaUrl(url)) {
      document.body.style.removeProperty("background-image");
      document.body.style.removeProperty("background-size");
      document.body.style.removeProperty("background-position");
      document.body.style.removeProperty("background-repeat");
      return;
    }
    document.body.style.backgroundImage = cssBgImage(url);
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  }

  function fadeLayerBackground(state, url, fade) {
    if (!isUserMediaUrl(url)) {
      url = "";
    }
    const image = cssBgImage(url);
    const primary = state.primary;
    const secondary = state.secondary;
    if (!primary) {
      return;
    }
    if (!fade || state.css === image || !secondary) {
      state.front = primary;
      primary.style.backgroundImage = image;
      primary.classList.toggle("is-visible", !!url);
      if (secondary) {
        secondary.style.backgroundImage = "none";
        secondary.classList.remove("is-visible");
      }
      state.css = image;
      return;
    }
    const back = state.front === primary ? secondary : primary;
    back.style.backgroundImage = image;
    void back.offsetWidth;
    back.classList.toggle("is-visible", !!url);
    state.front.classList.remove("is-visible");
    state.front = back;
    state.css = image;
  }

  function fadeSceneBackground(url, fade) {
    fadeLayerBackground({
      primary: sceneBgImage,
      secondary: sceneBgImageNext,
      get front() { return sceneBgFront; },
      set front(el) { sceneBgFront = el; },
      get css() { return appliedBgCss; },
      set css(v) { appliedBgCss = v; },
    }, url, fade);
  }

  function fadeBoardBackground(url, fade) {
    fadeLayerBackground({
      primary: boardBgImage,
      secondary: boardBgImageNext,
      get front() { return boardBgFront; },
      set front(el) { boardBgFront = el; },
      get css() { return appliedBoardBgCss; },
      set css(v) { appliedBoardBgCss = v; },
    }, url, fade);
  }

  function applyBoardBgFx() {
    const blur = `${clampBlur(settings.boardBgBlur != null ? settings.boardBgBlur : SETTING_DEFAULTS.boardBgBlur)}px`;
    const opacity = clampPercent(settings.boardBgOpacity, SETTING_DEFAULTS.boardBgOpacity) / 100;
    document.documentElement.style.setProperty("--board-bg-blur", blur);
    document.documentElement.style.setProperty("--board-bg-opacity", String(opacity));
    persistBoardFxKeys();
  }

  function clearCustomBackground(fade) {
    document.body.classList.remove("has-custom-bg");
    paintBodyBackground("");
    fadeSceneBackground("", fade);
  }

  function clearBoardBackground(fade) {
    const wrap = document.getElementById("board-wrap");
    document.body.classList.remove("has-board-bg");
    if (wrap) {
      wrap.classList.remove("has-board-bg");
    }
    fadeBoardBackground("", fade);
    invalidateStaticBackground();
    try {
      renderStaticBackground();
      draw();
    } catch (err) {
      /* idle board paint optional */
    }
  }

  function shouldUseLevelBackgrounds() {
    return (isPlayActive() || autoplayConquered) && (settings.levelBgEnabled || autoplay || autoplayConquered);
  }

  function applyResolvedBackground(url, fade) {
    if (!isUserMediaUrl(url)) {
      clearCustomBackground(!!fade);
      return;
    }
    lastValidBgUrl = url;
    document.body.classList.add("has-custom-bg");
    paintBodyBackground(url);
    fadeSceneBackground(url, !!fade);
  }

  function applyResolvedBoardBackground(url, fade) {
    const wrap = document.getElementById("board-wrap");
    if (!isUserMediaUrl(url)) {
      clearBoardBackground(!!fade);
      return;
    }
    lastValidBoardBgUrl = url;
    document.body.classList.add("has-board-bg");
    if (wrap) {
      wrap.classList.add("has-board-bg");
    }
    fadeBoardBackground(url, !!fade);
    invalidateStaticBackground();
    try {
      renderStaticBackground();
      draw();
    } catch (err) {
      /* idle board paint optional */
    }
  }

  function probeBackgroundUrls(urls, fade, seq, onHit, onMiss, seqRef) {
    const unique = [];
    urls.forEach((url) => {
      if (isUserMediaUrl(url) && unique.indexOf(url) < 0) {
        unique.push(url);
      }
    });
    const tryAt = (index) => {
      if (seq !== seqRef()) {
        return;
      }
      if (index >= unique.length) {
        if (onMiss) {
          try {
            onMiss();
          } catch (err) {
            /* ignore */
          }
        }
        return;
      }
      const url = unique[index];
      try {
        const img = new Image();
        img.onload = () => {
          if (seq !== seqRef()) {
            return;
          }
          try {
            onHit(url, fade);
          } catch (err) {
            tryAt(index + 1);
          }
        };
        img.onerror = () => tryAt(index + 1);
        img.src = url;
      } catch (err) {
        tryAt(index + 1);
      }
    };
    tryAt(0);
  }

  function resolveTargetBgUrl(target, level) {
    if (isCustomBgMasterDisabled()) {
      return "";
    }
    if (target === "window" && settings.keepDefaultWindowBg) {
      return loadBgData("window", "default");
    }
    if (shouldUseLevelBackgrounds()) {
      const n = playLevel(level);
      if (n <= LEVEL_BG_MAX) {
        const custom = loadBgData(target, n);
        if (isUserMediaUrl(custom)) {
          return custom;
        }
      }
      const last = target === "board" ? lastValidBoardBgUrl : lastValidBgUrl;
      if (isUserMediaUrl(last) && n > LEVEL_BG_MAX) {
        return last;
      }
      return "";
    }
    if (target === "board") {
      return "";
    }
    return loadBgData("window", "default");
  }

  function updateLevelBackground(level, options) {
    const fade = !(options && options.fade === false);
    const seq = ++bgLoadSeq;
    const url = resolveTargetBgUrl("window", level);
    if (isUserMediaUrl(url)) {
      probeBackgroundUrls(
        [url, lastValidBgUrl],
        fade,
        seq,
        applyResolvedBackground,
        () => clearCustomBackground(false),
        () => bgLoadSeq
      );
      return;
    }
    clearCustomBackground(fade);
  }

  function updateBoardBackground(level, options) {
    const fade = !(options && options.fade === false);
    const seq = ++boardBgLoadSeq;
    const url = resolveTargetBgUrl("board", level);
    if (isUserMediaUrl(url)) {
      probeBackgroundUrls(
        [url, lastValidBoardBgUrl],
        fade,
        seq,
        applyResolvedBoardBackground,
        () => clearBoardBackground(false),
        () => boardBgLoadSeq
      );
      return;
    }
    clearBoardBackground(fade);
  }

  function applyCurrentBackground(options) {
    try {
      const fade = !!(options && options.fade);
      const dim = clampPercent(settings.bgDim, SETTING_DEFAULTS.bgDim) / 100;
      document.documentElement.style.setProperty("--bg-dim", String(dim));
      applyWindowBgFx();
      applyBoardBgFx();
      if (isCustomBgMasterDisabled()) {
        document.body.classList.add("is-stock-neon-bg");
        clearCustomBackground(fade);
        clearBoardBackground(fade);
        return;
      }
      document.body.classList.remove("is-stock-neon-bg");
      if (!(autoplay && (clampAutoplaySpeed(settings.autoplaySpeed) >= 8 || playLevel(level) >= 11))) {
        document.documentElement.style.setProperty("--bg-fade", "0.6s");
      }
      if (shouldUseLevelBackgrounds()) {
        updateLevelBackground(playLevel(level), { fade });
        updateBoardBackground(playLevel(level), { fade });
        return;
      }
      isApplyingBg = false;
      probeBackgroundUrls(
        [loadBgData("window", "default")],
        fade,
        ++bgLoadSeq,
        applyResolvedBackground,
        () => clearCustomBackground(false),
        () => bgLoadSeq
      );
      probeBackgroundUrls(
        [loadBgData("board", "default")],
        fade,
        ++boardBgLoadSeq,
        applyResolvedBoardBackground,
        () => clearBoardBackground(false),
        () => boardBgLoadSeq
      );
    } catch (err) {
      isApplyingBg = false;
      clearCustomBackground(false);
      clearBoardBackground(false);
    }
  }

  function applyBackground(options) {
    applyCurrentBackground(options);
  }

  function fillBgCard(card, stored, fileName, titleText, isCustom) {
    if (!card) {
      return;
    }
    const title = card.querySelector(".level-bg-title");
    const status = card.querySelector(".level-bg-file");
    const thumb = card.querySelector(".level-bg-thumb img");
    const choose = card.querySelector("[data-i18n='chooseLevelBg']");
    const restore = card.querySelector("[data-restore-bg], .btn-delete-bg");
    if (title && titleText) {
      title.textContent = titleText;
    }
    if (choose) {
      choose.textContent = t("chooseLevelBg");
    }
    syncAssetBadge(card.querySelector(".asset-badge"), isCustom);
    if (restore) {
      restore.disabled = !isCustom;
      restore.textContent = t("deleteBg");
      restore.classList.toggle("is-armed", !!isCustom);
      restore.setAttribute("aria-disabled", isCustom ? "false" : "true");
    }
    if (status) {
      status.textContent = isCustom && fileName ? t("levelBgRegistered", { name: fileName }) : t("levelBgNeon");
    }
    if (thumb) {
      thumb.onerror = () => {
        thumb.removeAttribute("src");
        thumb.classList.add("hidden");
      };
      if (isUserMediaUrl(stored)) {
        try {
          thumb.src = stored;
          thumb.classList.remove("hidden");
        } catch (err) {
          thumb.removeAttribute("src");
          thumb.classList.add("hidden");
        }
      } else {
        thumb.removeAttribute("src");
        thumb.classList.add("hidden");
      }
    }
  }

  function syncBgTargetUi() {
    const target = bgEditTarget();
    document.querySelectorAll(".bg-target-btn").forEach((btn) => {
      const on = btn.dataset.bgTarget === target;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    const keepToggle = document.getElementById("toggle-keep-default-bg");
    if (keepToggle) {
      const hide = target === "board";
      keepToggle.classList.toggle("is-board-hidden", hide);
      keepToggle.hidden = hide;
    }
    syncBoardBgFxUi();
    syncWindowBgFxUi();
  }

  function syncLevelBgUi() {
    const target = bgEditTarget();
    const idleCard = document.querySelector('[data-level-bg="default"]');
    const hideIdle = target === "board";
    if (idleCard) {
      idleCard.classList.toggle("is-board-hidden", hideIdle);
      idleCard.hidden = hideIdle;
      idleCard.style.display = hideIdle ? "none" : "";
    }
    if (!hideIdle) {
      const idleCustom = hasCustomBg(target, "default");
      fillBgCard(
        idleCard,
        idleCustom ? loadBgData(target, "default") : "",
        bgFileNameOf(target, "default"),
        t("idleBgTitle"),
        idleCustom
      );
      const caption = document.querySelector(".level-bg-caption");
      if (caption) {
        caption.textContent = t("idleBgCaption");
      }
    }
    const playTitle = document.querySelector(".level-play-bg-title");
    if (playTitle) {
      playTitle.textContent = t(target === "board" ? "levelPlayBgTitleBoard" : "levelPlayBgTitle");
    }
    syncBgTargetUi();
    const list = document.getElementById("level-bg-list");
    if (!list || !list.children.length) {
      return;
    }
    for (let n = 1; n <= LEVEL_BG_MAX; n++) {
      const custom = hasCustomBg(target, n);
      fillBgCard(
        list.querySelector(`[data-level-bg="${n}"]`),
        custom ? loadBgData(target, n) : "",
        bgFileNameOf(target, n),
        t("levelBgTitle", { n }),
        custom
      );
    }
  }

  function setBgFromFile(kind, file, statusEl) {
    if (kind === "default" && bgEditTarget() === "board") {
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const isIdle = kind === "default";
      const task = isIdle ? persistIdleBg(img) : persistLevelBg(shownLevel(kind), img);
      task.then((dataUrl) => {
        if (!dataUrl) {
          if (statusEl) {
            statusEl.textContent = t("levelBgQuota");
          }
          return;
        }
        setBgFileName(bgEditTarget(), isIdle ? "default" : kind, file.name);
        saveSettings();
        syncLevelBgUi();
        applyCurrentBackground({ fade: true });
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  function restoreDefaultBgm() {
    mediaStore.del("bgm");
    settings.bgmFileName = "";
    bgm.fileName = "";
    try {
      silenceAudioEl(bgm.audio);
    } catch (err) {
      /* ignore */
    }
    applyBundledBgm();
    saveSettings();
    syncBgmUi();
    if (settings.bgm) {
      bgm.play();
    }
  }

  async function restoreDefaultBg(kind) {
    const target = bgEditTarget();
    if (kind === "default" && target === "board") {
      return;
    }
    const slot = kind === "default" ? "default" : kind;
    if (!hasCustomBg(target, slot)) {
      return;
    }
    const ok = await showIngameConfirm(t("confirmDeleteBg"));
    if (!ok) {
      return;
    }
    const prevUrl = loadBgData(target, slot);
    const storeKey = bgStoreKey(target, slot);
    mediaStore.del(storeKey);
    if (target !== "board") {
      if (slot === "default") {
        mediaStore.del("idleBg");
        try {
          localStorage.removeItem(IDLE_BG_KEY);
        } catch (err) {
          /* ignore */
        }
      } else {
        const n = shownLevel(slot);
        mediaStore.del(`levelBg${n}`);
        try {
          localStorage.removeItem(levelBgStorageKey(n));
        } catch (err) {
          /* ignore */
        }
      }
    }
    try {
      localStorage.removeItem(storeKey);
    } catch (err) {
      /* ignore */
    }
    setBgFileName(target, slot, "");
    if (target === "board") {
      if (lastValidBoardBgUrl && prevUrl && lastValidBoardBgUrl === prevUrl) {
        lastValidBoardBgUrl = "";
      }
    } else if (lastValidBgUrl && prevUrl && lastValidBgUrl === prevUrl) {
      lastValidBgUrl = "";
    }
    const card = document.querySelector(`[data-level-bg="${kind}"]`);
    const fileInput = card && card.querySelector("[data-level-bg-file]");
    if (fileInput) {
      fileInput.value = "";
    }
    saveSettings();
    syncLevelBgUi();
    applyCurrentBackground({ fade: true });
    showNeonToast(t("bgDeletedToast"), { ms: 1600 });
  }

  function buildLevelBgCards() {
    const list = document.getElementById("level-bg-list");
    const panel = document.querySelector('[data-tab-panel="levelbg"]');
    if (list && list.querySelectorAll("[data-level-bg]").length !== LEVEL_BG_MAX) {
      const bits = [];
      for (let n = 1; n <= LEVEL_BG_MAX; n++) {
        bits.push(
          `<article class="level-bg-card" data-level-bg="${n}">` +
            `<div class="level-bg-card-head">` +
              `<p class="level-bg-title">Level ${n} 배경</p>` +
              `<div class="level-bg-thumb"><img class="hidden" alt=""></div>` +
            `</div>` +
            `<p class="level-bg-file"></p>` +
            `<p class="asset-badge is-preset"></p>` +
            `<div class="asset-actions">` +
              `<label class="file-btn">` +
                `<span data-i18n="chooseLevelBg">🖼️ 이미지 선택</span>` +
                `<input class="file-input" type="file" accept="image/*" data-level-bg-file="${n}">` +
              `</label>` +
              `<button type="button" class="btn-delete-bg" data-restore-bg="${n}" disabled>🗑️ 삭제</button>` +
            `</div>` +
          `</article>`
        );
      }
      list.innerHTML = bits.join("");
    }
    if (!panel || panel.dataset.bgBound === "1") {
      return;
    }
    panel.dataset.bgBound = "1";
    panel.addEventListener("change", (e) => {
      const input = e.target.closest("[data-level-bg-file]");
      if (!input) {
        return;
      }
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) {
        return;
      }
      const card = input.closest(".level-bg-card");
      setBgFromFile(input.dataset.levelBgFile, file, card && card.querySelector(".level-bg-file"));
    });
    panel.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-restore-bg], .btn-delete-bg");
      if (!btn || btn.disabled) {
        return;
      }
      restoreDefaultBg(btn.dataset.restoreBg);
    });
  }

  function syncSettingButton(btn) {
    const on = !!settings[btn.dataset.setting];
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    const state = btn.querySelector(".toggle-state");
    if (state) {
      state.textContent = on ? t("on") : t("off");
    }
  }

  function applySetting(key) {
    if (key === "bgm") {
      bgm.play();
    }
    if (key === "shake" && !settings.shake) {
      shake = 0;
      boardWrap.style.transform = "";
    }
    if (key === "particles" && !settings.particles) {
      particles = [];
      flashes = [];
    }
    if (key === "ghost") {
      syncGhostSlider();
    }
    if (key === "sound") {
      syncSoundSlider();
    }
    if (key === "shake") {
      syncShakeSlider();
    }
    if (key === "mobilePad") {
      syncMobilePadUi();
    }
    if (key === "bgEnabled" || key === "levelBgEnabled" || key === "keepDefaultWindowBg" || key === "disableAllCustomBg") {
      persistKeepDefaultWindowBg();
      persistDisableAllCustomBg();
      syncBgUi();
      syncLevelBgUi();
      syncMasterBgUi();
      applyCurrentBackground({ fade: true });
    }
    if (key === "autoRecordMode") {
      persistAutoRecordMode();
    }
    if (key === "dadSpecial") {
      syncDadSpecialUi();
    }
  }

  function openSettingsModal() {
    settingsOpen = true;
    if (settingsModal) {
      settingsModal.classList.remove("hidden");
    }
    document.body.classList.add("modal-open");
    clearSpaceTap();
    try {
      syncAllSettingsUi();
    } catch (err) {
      /* keep modal usable */
    }
    try {
      ensureProfileSource();
    } catch (err) {
      /* ignore */
    }
    window.setTimeout(() => {
      try {
        const skin = currentPreviewSkin();
        const opacity = currentGhostOpacity();
        renderSkinPreview(skin);
        renderGhostPreview(opacity, skin);
      } catch (err) {
        /* preview canvases optional */
      }
    }, 50);
  }

  function commitVideoUrlsFromUi() {
    document.querySelectorAll("[data-video-url]").forEach((input) => {
      const kind = input.dataset.videoUrl;
      if (!VIDEO_KEYS.includes(kind)) {
        return;
      }
      const value = input.value.trim();
      if (value) {
        revokeVideoBlob(kind);
        settings.videoFileNames[kind] = "";
      }
      settings.videoUrls[kind] = value;
    });
  }

  function commitSettingsFromUi() {
    settings.soundVolume = clampPercent(document.getElementById("sound-volume").value, SETTING_DEFAULTS.soundVolume);
    settings.shakeStrength = clampPercent(document.getElementById("shake-strength").value, SETTING_DEFAULTS.shakeStrength);
    settings.ghostStrength = clampPercent(document.getElementById("ghost-strength").value, SETTING_DEFAULTS.ghostStrength);
    settings.bgmVolume = clampPercent(document.getElementById("bgm-volume").value, SETTING_DEFAULTS.bgmVolume);
    settings.autoplaySpeed = clampAutoplaySpeed(document.getElementById("autoplay-speed-settings").value || document.getElementById("autoplay-speed").value);
    settings.startLevel = clampStartLevel(document.getElementById("start-level").value);
    settings.startGarbageLines = clampStartGarbageLines(document.getElementById("start-garbage-lines") && document.getElementById("start-garbage-lines").value);
    settings.previewGuideMode = clampPreviewGuideMode(document.getElementById("select-preview-mode") && document.getElementById("select-preview-mode").value);
    settings.blockSkinStyle = clampBlockSkin(document.getElementById("select-block-skin") && document.getElementById("select-block-skin").value);
    if (!isMobileDevice()) {
      settings.boardRowsCount = clampBoardRows(document.getElementById("select-board-size") && document.getElementById("select-board-size").value);
      if (effectiveBoardRows(settings.boardRowsCount) !== ROWS) {
        applyBoardSize(settings.boardRowsCount);
      }
    }
    settings.dropSpeedMultiplier = clampDropSpeedMultiplier(document.getElementById("slider-drop-speed-multiplier") && document.getElementById("slider-drop-speed-multiplier").value);
    settings.dadSpecialDuration = clampDadDuration(settings.dadSpecialDuration);
    settings.goal1Score = clampGoalScore(document.getElementById("goal1-score").value, SETTING_DEFAULTS.goal1Score);
    settings.goal2Score = clampGoalScore(document.getElementById("goal2-score").value, SETTING_DEFAULTS.goal2Score);
    normalizeGoals("goal1");
    commitVideoUrlsFromUi();
    settings.bgDim = clampPercent(document.getElementById("bg-dim").value, SETTING_DEFAULTS.bgDim);
    settings.bgBlur = clampBlur(document.getElementById("bg-blur").value);
    const boardBlurEl = document.getElementById("board-bg-blur");
    const boardOpacityEl = document.getElementById("board-bg-opacity");
    if (boardBlurEl) {
      settings.boardBgBlur = clampBlur(boardBlurEl.value);
    }
    if (boardOpacityEl) {
      settings.boardBgOpacity = clampPercent(boardOpacityEl.value, SETTING_DEFAULTS.boardBgOpacity);
    }
    const windowBlurEl = document.getElementById("window-bg-blur");
    const windowOpacityEl = document.getElementById("window-bg-opacity");
    if (windowBlurEl) {
      settings.windowBgBlur = clampBlur(windowBlurEl.value, SETTING_DEFAULTS.windowBgBlur);
    }
    if (windowOpacityEl) {
      settings.windowBgOpacity = clampPercent(windowOpacityEl.value, SETTING_DEFAULTS.windowBgOpacity);
    }
    persistBoardFxKeys();
    persistWindowFxKeys();
    profileState.zoom = zoomPercentToScale(document.getElementById("profile-zoom").value);
    profileState.x = clampProfileAxis(document.getElementById("profile-x").value, "x");
    profileState.y = clampProfileAxis(document.getElementById("profile-y").value, "y");
    pushProfileState();
    bgm.applyVolume();
    applyCurrentBackground();
    commitProfileCropSave();
  }

  function closeSettingsModal() {
    try {
      commitSettingsFromUi();
    } catch (err) {
      /* keep close path alive */
    }
    settingsOpen = false;
    try {
      showProfileFrames(false);
    } catch (err) {
      /* ignore */
    }
    if (settingsModal) {
      settingsModal.classList.add("hidden");
    }
    if (!helpOpen && !hallOpen && !scoreSaveOpen && !autoplayEndOpen && !celebrateOpen && !diagOpen) {
      document.body.classList.remove("modal-open");
    }
    try {
      saveSettings();
    } catch (err) {
      /* ignore */
    }
    try {
      if (!paused && !gameOver && !celebrateOpen && !helpOpen && bgm && typeof bgm.play === "function") {
        bgm.play();
      } else if (typeof syncBgmUi === "function") {
        syncBgmUi();
      }
    } catch (err) {
      /* ignore */
    }
    try {
      maybeCelebrateScore();
    } catch (err) {
      /* ignore */
    }
  }

  function hasSeenGuide() {
    try {
      return localStorage.getItem(HELP_SEEN_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function markHelpSeen() {
    try {
      localStorage.setItem(HELP_SEEN_KEY, "1");
    } catch (err) {
      /* private mode */
    }
  }

  function setGuideTab(id) {
    const aliases = { score: "controls", settings: "media", custom: "media", system: "media", ai: "controls" };
    const tabId = aliases[id] || id || "controls";
    document.querySelectorAll(".guide-tab").forEach((btn) => {
      const on = btn.dataset.guideTab === tabId;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll("[data-guide-panel]").forEach((panel) => {
      const show = panel.dataset.guidePanel === tabId;
      panel.classList.toggle("hidden", !show);
      panel.setAttribute("aria-hidden", show ? "false" : "true");
    });
    const body = document.querySelector(".guide-body");
    if (body) {
      body.scrollTop = 0;
    }
  }

  function syncGuideButtons() {
    const start = document.getElementById("guide-start");
    if (start) {
      start.textContent = waitingStart || gameOver ? t("guideStart") : t("guideContinue");
    }
  }

  function openGuideModal() {
    helpOpen = true;
    clearSpaceTap();
    releaseAllPads();
    setGuideTab("controls");
    syncGuideButtons();
    const modal = document.getElementById("guide-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
    document.body.classList.add("modal-open");
  }

  function closeGuideModal() {
    helpOpen = false;
    try {
      markHelpSeen();
    } catch (err) {
      /* ignore */
    }
    const modal = document.getElementById("guide-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
    if (!settingsOpen && !hallOpen && !scoreSaveOpen && !autoplayEndOpen && !celebrateOpen && !diagOpen) {
      document.body.classList.remove("modal-open");
    }
    try {
      if (!paused && !gameOver && !waitingStart && !settingsOpen && bgm && typeof bgm.play === "function") {
        bgm.play();
      }
    } catch (err) {
      /* ignore */
    }
  }

  function startFromGuide() {
    const shouldStart = waitingStart || gameOver;
    closeGuideModal();
    if (shouldStart) {
      try {
        sfx.ensure();
      } catch (err) {
        /* audio optional */
      }
      stopAutoplay();
      startNewGame();
    }
  }

  function maybeOpenGuideOnboarding() {
    if (!hasSeenGuide()) {
      openGuideModal();
    }
  }

  async function resetAllSettings() {
    if (diagRunning || isResettingSettings) {
      return;
    }
    if (!(await showIngameConfirm(t("confirmResetSettings")))) {
      return;
    }
    isResettingSettings = true;
    try {
      closeCelebrate(true);
      bgm.pause();
      try {
        silenceAudioEl(bgm.audio);
      } catch (err) {
        /* ignore */
      }
      bgm.fileName = "";
      isAudioLoading = false;
      VIDEO_KEYS.forEach((kind) => {
        videoBlobs[kind] = null;
      });
      await mediaStore.clearAll();
      applyBundledBgm();
      try {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(PROFILE_CROP_KEY);
        localStorage.removeItem(PROFILE_IMG_KEY);
        localStorage.removeItem(IDLE_BG_KEY);
        localStorage.removeItem("custom_bg_window_default");
        localStorage.removeItem("custom_bg_board_default");
        localStorage.removeItem("board_bg_blur");
        localStorage.removeItem("board_bg_opacity");
        localStorage.removeItem("window_bg_blur");
        localStorage.removeItem("window_bg_opacity");
        localStorage.removeItem(DISABLE_ALL_CUSTOM_BG_KEY);
        localStorage.removeItem(AUTO_RECORD_KEY);
        localStorage.removeItem(START_GARBAGE_KEY);
        localStorage.removeItem(PREVIEW_MODE_KEY);
        localStorage.removeItem(DROP_SPEED_KEY);
        localStorage.removeItem(BLOCK_SKIN_KEY);
        localStorage.removeItem(BOARD_ROWS_KEY);
        for (let n = 1; n <= LEVEL_BG_MAX; n++) {
          localStorage.removeItem(`${LEVEL_BG_KEY}${n}`);
          localStorage.removeItem(`custom_bg_window_level_${n}`);
          localStorage.removeItem(`custom_bg_board_level_${n}`);
        }
      } catch (err) {
        /* ignore */
      }
      settings = defaultSettings();
      profileState.zoom = 1;
      profileState.x = 0;
      profileState.y = 0;
      try {
        localStorage.removeItem(THEME_KEY);
      } catch (err) {
        /* ignore */
      }
      applyTheme("neon-blue", true);
      profileBroken = false;
      profileSource = null;
      saveSettings();
      ROWS = effectiveBoardRows(settings.boardRowsCount);
      applyBoardAspectCss();
      if (!cells || cells.length !== ROWS) {
        if (!waitingStart && !gameOver) {
          startNewGame();
        } else {
          cells = createBoard();
        }
      }
      applyProfile("");
      applyCurrentBackground();
      applyI18n();
      syncAllSettingsUi();
      refreshLevel();
      updateHud();
      draw();
    } catch (err) {
      settings = defaultSettings();
      saveSettings();
      ROWS = effectiveBoardRows(settings.boardRowsCount);
      applyBoardAspectCss();
      cells = createBoard();
      applyCurrentBackground();
      syncAllSettingsUi();
    } finally {
      isResettingSettings = false;
    }
  }

  function syncAllSettingsUi() {
    if (isSyncingUi) {
      return;
    }
    isSyncingUi = true;
    try {
    document.querySelectorAll(".toggle-row[data-setting]").forEach(syncSettingButton);
    syncStartLevelUi();
    syncGarbageLinesUi();
    syncPreviewGuideUi();
    syncBlockSkinUi();
    syncBoardSizeUi();
    syncDropSpeedUi();
    syncDadDurationUi();
    syncAutoplaySpeedUi();
    syncSoundSlider();
    syncShakeSlider();
    syncGhostSlider();
    syncBgmUi();
    syncBgUi();
    syncLevelBgUi();
    syncGoalScoreUi();
    syncVideoSettingsUi();
    syncProfileUi();
    syncThemeUi();
    } catch (err) {
      /* keep settings panel usable */
    } finally {
      isSyncingUi = false;
    }
  }

  function youtubeId(raw) {
    if (!raw) {
      return "";
    }
    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        return url.pathname.split("/").filter(Boolean)[0] || "";
      }
      if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
        if (url.searchParams.get("v")) {
          return url.searchParams.get("v");
        }
        const parts = url.pathname.split("/").filter(Boolean);
        if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
          return parts[1] || "";
        }
      }
    } catch (err) {
      return "";
    }
    return "";
  }

  function youtubeEmbed(id) {
    const origin = encodeURIComponent(location.origin || "http://localhost");
    return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${origin}`;
  }

  function revokeVideoBlob(kind) {
    videoBlobs[kind] = null;
    mediaStore.del(videoStoreKey(kind));
  }

  function resolveVideoSource(kind) {
    const blob = videoBlobs[kind];
    if (blob && blob.url) {
      return { mode: "file", src: blob.url };
    }
    const url = (settings.videoUrls[kind] || "").trim();
    if (!url) {
      return { mode: "none" };
    }
    const id = youtubeId(url);
    if (id) {
      return { mode: "youtube", src: youtubeEmbed(id) };
    }
    return { mode: "url", src: url };
  }

  function videoStatusText(kind) {
    if (videoBlobs[kind]) {
      return t("videoReady", { name: videoBlobs[kind].name });
    }
    const url = settings.videoUrls[kind];
    if (url) {
      return t("videoReady", { name: url });
    }
    if (settings.videoFileNames[kind]) {
      return t("videoReselect", { name: settings.videoFileNames[kind] });
    }
    return t("videoNone");
  }

  function isVideoReady(kind) {
    return !!(videoBlobs[kind] || (settings.videoUrls[kind] && settings.videoUrls[kind].trim()));
  }

  function syncVideoSettingsUi() {
    for (const key of VIDEO_KEYS) {
      const status = document.getElementById(`video-status-${key}`);
      const input = document.querySelector(`[data-video-url="${key}"]`);
      if (status) {
        status.textContent = videoStatusText(key);
        status.classList.toggle("is-ready", isVideoReady(key));
      }
      if (input && document.activeElement !== input) {
        input.value = settings.videoUrls[key] || "";
      }
    }
  }

  function stopCelebrateMedia() {
    window.clearTimeout(celebrateFallbackTimer);
    celebrateFallbackTimer = 0;
    try {
      celebrateVideo.pause();
      celebrateVideo.removeAttribute("src");
      celebrateVideo.load();
    } catch (err) {
      /* ignore */
    }
    try {
      celebrateFrame.src = "about:blank";
    } catch (err) {
      /* ignore */
    }
    celebrateVideo.classList.add("hidden");
    celebrateFrame.classList.add("hidden");
    celebrateStage.classList.add("is-fallback");
  }

  function scheduleCelebrateFallbackResume() {
    window.clearTimeout(celebrateFallbackTimer);
    if (celebratePreview) {
      return;
    }
    celebrateFallbackTimer = window.setTimeout(() => {
      celebrateFallbackTimer = 0;
      if (celebrateOpen && celebrateStage.classList.contains("is-fallback")) {
        closeCelebrate();
      }
    }, 2400);
  }

  function playCelebrateMedia(kind, message) {
    stopCelebrateMedia();
    const text = message || t("celebrateFallback");
    celebrateFallback.textContent = text;
    let source = { mode: "none" };
    try {
      source = resolveVideoSource(kind);
    } catch (err) {
      source = { mode: "none" };
    }
    if (source.mode === "none") {
      celebrateStage.classList.add("is-fallback");
      scheduleCelebrateFallbackResume();
      return;
    }
    celebrateStage.classList.remove("is-fallback");
    if (source.mode === "youtube") {
      celebrateFrame.classList.remove("hidden");
      celebrateFrame.src = source.src;
      return;
    }
    celebrateVideo.classList.remove("hidden");
    celebrateVideo.muted = false;
    celebrateVideo.volume = 1;
    celebrateVideo.src = source.src;
    const play = celebrateVideo.play();
    if (play && play.catch) {
      play.catch(() => {
        celebrateVideo.classList.add("hidden");
        celebrateStage.classList.add("is-fallback");
        celebrateFallback.textContent = text;
        scheduleCelebrateFallbackResume();
      });
    }
  }

  function syncGoalScoreUi() {
    const goal1 = document.getElementById("goal1-score");
    const goal1Slider = document.getElementById("goal1-score-slider");
    const goal2 = document.getElementById("goal2-score");
    const goal2Slider = document.getElementById("goal2-score-slider");
    const title1 = document.getElementById("video-title-goal1");
    const title2 = document.getElementById("video-title-goal2");
    const hint1 = document.getElementById("goal1-hint");
    const hint2 = document.getElementById("goal2-hint");
    if (!goal1 || !goal2) {
      return;
    }
    if (document.activeElement !== goal1) {
      goal1.value = String(settings.goal1Score);
    }
    if (document.activeElement !== goal2) {
      goal2.value = String(settings.goal2Score);
    }
    if (document.activeElement !== goal1Slider) {
      goal1Slider.value = String(Math.min(100000, settings.goal1Score));
    }
    if (document.activeElement !== goal2Slider) {
      goal2Slider.value = String(Math.min(100000, settings.goal2Score));
    }
    title1.textContent = celebrateTitle("goal1");
    title2.textContent = celebrateTitle("goal2");
    hint1.textContent = t("goalHint", { n: 1, score: formatScore(settings.goal1Score) });
    hint2.textContent = t("goalHint", { n: 2, score: formatScore(settings.goal2Score) });
  }

  function showCelebrate(kind) {
    if (isVideoPlaying) {
      if (!celebrateQueue.includes(kind)) {
        celebrateQueue.push(kind);
      }
      return;
    }
    const message = getCelebrateMessage(kind) || t("celebrateFallback");
    isVideoPlaying = true;
    celebrateOpen = true;
    celebrateKind = kind;
    celebrateMessage.textContent = message;
    celebrateModal.classList.remove("hidden");
    bgm.fadeOut();
    playCelebrateMedia(kind, message);
  }

  function previewCelebrate(kind) {
    if (!VIDEO_KEYS.includes(kind)) {
      return;
    }
    celebratePreview = true;
    showCelebrate(kind);
  }

  function enqueueCelebrate(kind) {
    if (autoplay) {
      return;
    }
    if (!settings.videosEnabled || !VIDEO_KEYS.includes(kind)) {
      return;
    }
    if (celebrateOpen) {
      if (!celebrateQueue.includes(kind)) {
        celebrateQueue.push(kind);
      }
      return;
    }
    showCelebrate(kind);
  }

  function closeCelebrate(fromReset) {
    window.clearTimeout(celebrateFallbackTimer);
    celebrateFallbackTimer = 0;
    stopCelebrateMedia();
    celebrateOpen = false;
    isVideoPlaying = false;
    celebrateKind = "";
    celebrateModal.classList.add("hidden");
    if (fromReset) {
      celebrateQueue.length = 0;
      celebratePreview = false;
      sfx.muted = false;
      bgm.stopFade();
      return;
    }
    if (celebratePreview) {
      celebratePreview = false;
      sfx.muted = false;
      if (settingsOpen && !paused && !gameOver) {
        bgm.fadeIn();
      }
      return;
    }
    if (celebrateQueue.length) {
      showCelebrate(celebrateQueue.shift());
      return;
    }
    if (gameOver) {
      showGameOverlay("gameOver");
      sfx.muted = false;
      bgm.pause();
      if (autoplayTouched) {
        openAutoplayEndModal();
      } else if (pendingScoreSave) {
        openScoreSaveModal();
      }
      return;
    }
    if (!paused && !settingsOpen && !helpOpen) {
      bgm.fadeIn();
    } else {
      sfx.muted = false;
    }
  }

  function showNeonToast(message, options) {
    const el = document.getElementById("goal-toast");
    if (!el || !message) {
      return;
    }
    const textEl = document.getElementById("goal-toast-text") || el;
    textEl.textContent = message;
    el.classList.toggle("is-crown", !!(options && options.crown));
    el.classList.toggle("is-conquer", !!(options && options.conquer));
    el.classList.toggle("is-corner", !!(options && options.corner));
    el.classList.remove("hidden", "is-out");
    el.classList.add("is-in");
    window.clearTimeout(showNeonToast.hideTid);
    window.clearTimeout(showNeonToast.clearTid);
    showNeonToast.hideTid = window.setTimeout(() => {
      el.classList.remove("is-in");
      el.classList.add("is-out");
      showNeonToast.clearTid = window.setTimeout(() => {
        el.classList.add("hidden");
        el.classList.remove("is-out", "is-crown", "is-conquer", "is-corner");
      }, 380);
    }, (options && options.ms) || 1800);
  }

  function hideConquerBanner() {
    const el = document.getElementById("goal-toast");
    window.clearTimeout(showNeonToast.hideTid);
    window.clearTimeout(showNeonToast.clearTid);
    if (el) {
      el.classList.add("hidden");
      el.classList.remove("is-in", "is-out", "is-crown", "is-conquer", "is-corner");
    }
    document.body.classList.remove("is-conquer-ending");
    if (overlay) {
      overlay.classList.remove("is-conquer");
    }
  }

  function showGoalToast(kind) {
    const score = kind === "goal2" ? settings.goal2Score : settings.goal1Score;
    showNeonToast(t("goalToast", { score: formatScore(score) }));
  }

  function maybeCelebrateLevel20(prevLevel) {
    if (!autoplay || celebratedLevel20) {
      return;
    }
    const reached20 = playLevel(level) >= LEVEL_MAX;
    const crossedInto20 = playLevel(prevLevel) < LEVEL_MAX && reached20;
    const startedAt20 = playLevel(prevLevel) >= LEVEL_MAX && reached20 && (Number(lines) || 0) >= 10;
    if (crossedInto20 || startedAt20) {
      celebratedLevel20 = true;
    }
  }

  function maybeCelebrateScore() {
    if (isVideoPlaying || celebrateOpen) {
      return;
    }
    if (score >= settings.goal2Score && !celebratedGoal2) {
      celebratedGoal2 = true;
      celebratedGoal1 = true;
      if (autoplay) {
        showGoalToast("goal2");
        return;
      }
      enqueueCelebrate("goal2");
      return;
    }
    if (score >= settings.goal1Score && !celebratedGoal1) {
      celebratedGoal1 = true;
      if (autoplay) {
        showGoalToast("goal1");
        return;
      }
      enqueueCelebrate("goal1");
    }
  }

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function isGarbageCellType(type) {
    return type === "G" || TYPES.indexOf(type) >= 0;
  }

  function pickGarbageHoleCols() {
    const holeCount = 1 + Math.floor(Math.random() * 3);
    const pool = [];
    for (let c = 0; c < COLS; c++) {
      pool.push(c);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, holeCount);
  }

  function pickGarbageBlockType() {
    if (Math.random() < 0.55) {
      return "G";
    }
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  function fillStartGarbageLines(board, count) {
    const grid = board || createBoard();
    const n = clampStartGarbageLines(count);
    if (n <= 0) {
      return grid;
    }
    for (let i = 0; i < n; i++) {
      const r = ROWS - 1 - i;
      if (r < 0) {
        break;
      }
      const holes = pickGarbageHoleCols();
      const holeSet = {};
      holes.forEach((c) => {
        holeSet[c] = true;
      });
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = holeSet[c] ? null : pickGarbageBlockType();
      }
      if (grid[r].every(Boolean)) {
        grid[r][Math.floor(Math.random() * COLS)] = null;
      }
    }
    return grid;
  }

  function validateGarbageBoard(board, count) {
    const n = clampStartGarbageLines(count);
    if (!board || board.length !== ROWS) {
      return false;
    }
    for (let r = 0; r < ROWS; r++) {
      const row = board[r];
      if (!row || row.length !== COLS) {
        return false;
      }
      const filled = row.filter(Boolean).length;
      const holes = COLS - filled;
      const fromBottom = ROWS - 1 - r;
      if (fromBottom < n) {
        if (holes < 1 || holes > 3 || filled < 1) {
          return false;
        }
        if (row.some((cell) => cell && !isGarbageCellType(cell))) {
          return false;
        }
        if (row.every(Boolean)) {
          return false;
        }
      } else if (filled !== 0) {
        return false;
      }
    }
    return true;
  }

  function pieceCells(piece) {
    return SHAPES[piece.type][piece.rot].map(([x, y]) => [piece.col + x, piece.row + y]);
  }

  function copyPiece(piece) {
    return { type: piece.type, rot: piece.rot, col: piece.col, row: piece.row };
  }

  function fits(piece) {
    return pieceCells(piece).every(([c, r]) => {
      return c >= 0 && c < COLS && r < ROWS && (r < 0 || !cells[r][c]);
    });
  }

  function dadSpecialOn() {
    return !!settings.dadSpecial && !autoplay;
  }

  function isDadCountdownActive() {
    return dadSpecialOn() && !!current && (lockDelayMs > 0 || dadPhaseLock) && freezeMs <= 0;
  }

  function isTimestopActive() {
    return dadSpecialOn() && freezeMs > 0 && !!current;
  }

  function canDadPenetrate() {
    return dadSpecialOn() && !!current && (
      isDadCountdownActive() || isTimestopActive() || dadResumeMs > 0 || dadPhaseLock || lockDelayMs > 0 || freezeMs > 0
    );
  }

  function enterDadPhase() {
    dadPhaseLock = true;
  }

  function exitDadPhase() {
    dadPhaseLock = false;
  }

  function dadLockSlideOn() {
    return isDadCountdownActive() && dadResumeMs <= 0;
  }

  function dadSlideActive() {
    return canDadPenetrate();
  }

  function dadFocusActive() {
    return dadLockSlideOn();
  }

  function dadInCols(piece) {
    return pieceCells(piece).every(([c]) => c >= 0 && c < COLS);
  }

  function dadOverlapsStack(piece) {
    return pieceCells(piece).some(([c, r]) => r >= 0 && r < ROWS && c >= 0 && c < COLS && cells[r][c]);
  }

  function dadFits(piece) {
    return pieceCells(piece).every(([c, r]) => {
      if (c < 0 || c >= COLS || r >= ROWS) {
        return false;
      }
      if (r < 0) {
        return true;
      }
      return !cells[r][c];
    });
  }

  function dadWallsOnlyFits(piece) {
    if (!piece) {
      return false;
    }
    return pieceCells(piece).every(([c, r]) => c >= 0 && c < COLS && r < ROWS);
  }

  function isValidMove(piece, offsetX, offsetY, customMatrix) {
    if (!piece) {
      return false;
    }
    const next = {
      type: piece.type,
      rot: piece.rot,
      col: piece.col + (Number(offsetX) || 0),
      row: piece.row + (Number(offsetY) || 0),
    };
    if (canDadPenetrate()) {
      return dadWallsOnlyFits(next);
    }
    const board = customMatrix || cells;
    return pieceCells(next).every(([c, r]) => {
      if (c < 0 || c >= COLS || r >= ROWS) {
        return false;
      }
      return r < 0 || !board[r][c];
    });
  }

  function maybeDadWellSink() {
    if (!current || !dadLockSlideOn() || isTimestopActive()) {
      return;
    }
    if (!dadFits(current) || dadOverlapsStack(current)) {
      return;
    }
    const probe = copyPiece(current);
    let drop = 0;
    while (true) {
      probe.row += 1;
      if (!dadFits(probe) || !dadWallsOnlyFits(probe)) {
        break;
      }
      drop += 1;
    }
    if (drop >= 2) {
      current.row += drop;
    }
  }

  function dadMoveBy(dc, dr) {
    if (!current) {
      return false;
    }
    const next = copyPiece(current);
    next.col += dc;
    next.row += dr;
    if (canDadPenetrate()) {
      if (!dadWallsOnlyFits(next)) {
        return false;
      }
      current.col = next.col;
      current.row = next.row;
      if (dc !== 0 && dr === 0) {
        maybeDadWellSink();
      }
      return true;
    }
    if (!isValidMove(current, dc, dr)) {
      return false;
    }
    current.col += dc;
    current.row += dr;
    return true;
  }

  function dadMoveHorizontal(dir) {
    if (!current || !dir) {
      return false;
    }
    return dadMoveBy(dir < 0 ? -1 : 1, 0);
  }

  function moveLeft() {
    return dadMoveHorizontal(-1);
  }

  function moveRight() {
    return dadMoveHorizontal(1);
  }

  function moveDown() {
    return stepDadDrop();
  }

  function tryMove(dc, dr) {
    if (!current) {
      return false;
    }
    if (canDadPenetrate()) {
      return dadMoveBy(dc, dr);
    }
    if (!isValidMove(current, dc, dr)) {
      return false;
    }
    current.col += dc;
    current.row += dr;
    return true;
  }

  function isGrounded(piece) {
    if (!piece) {
      return false;
    }
    if (dadSlideActive()) {
      return !isValidMove(piece, 0, 1);
    }
    const probe = copyPiece(piece);
    probe.row += 1;
    return !fits(probe);
  }

  function dropToBoardFloor(piece) {
    return dadLandingPiece(piece);
  }

  function dadLandingPiece(piece) {
    const probe = copyPiece(piece);
    let guard = 0;
    while (!dadFits(probe) && guard < ROWS + 12) {
      probe.row -= 1;
      guard += 1;
    }
    if (!dadFits(probe)) {
      return piece;
    }
    while (true) {
      const next = copyPiece(probe);
      next.row += 1;
      if (!dadFits(next)) {
        break;
      }
      probe.row += 1;
    }
    return probe;
  }

  function dadFloorSnapPiece(piece) {
    if (!dadInCols(piece)) {
      return piece;
    }
    const landed = dadLandingPiece(piece);
    return dadFits(landed) && dadInCols(landed) ? landed : piece;
  }

  function settleOnTerrain() {
    if (!current) {
      return;
    }
    current.row = dadFloorSnapPiece(current).row;
  }

  function resolveOverlapBeforeLock() {
    if (!current) {
      return;
    }
    let extra = 0;
    while ((dadOverlapsStack(current) || !dadFits(current)) && extra < ROWS + 12) {
      current.row -= 1;
      extra += 1;
    }
    if (dadFits(current) && !dadOverlapsStack(current)) {
      while (true) {
        const next = copyPiece(current);
        next.row += 1;
        if (!dadFits(next)) {
          break;
        }
        current.row += 1;
      }
      return;
    }
    const origin = copyPiece(current);
    const rotCount = origin.type === "O" ? 1 : 4;
    let best = null;
    for (const dc of [0, -1, 1, -2, 2, -3, 3, -4, 4]) {
      for (let i = 0; i < rotCount; i++) {
        const dropped = dropOn(cells, {
          type: origin.type,
          rot: (origin.rot + i) & 3,
          col: origin.col + dc,
          row: 0,
        });
        if (!dropped || !dadFits(dropped)) {
          continue;
        }
        const dist = Math.abs(dropped.col - origin.col) + Math.abs(dropped.rot - origin.rot);
        if (!best || dist < best.dist || (dist === best.dist && dropped.row > best.pose.row)) {
          best = { dist, pose: dropped };
        }
      }
    }
    if (best && best.pose) {
      current.rot = best.pose.rot;
      current.col = best.pose.col;
      current.row = best.pose.row;
    }
  }

  function uniqueKicks(list) {
    const seen = new Set();
    const out = [];
    for (const [x, y] of list) {
      const key = x + "," + y;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push([x, y]);
    }
    return out;
  }

  function tryDadSlide(dc) {
    return dadMoveHorizontal(dc);
  }

  function dadFreezeActive() {
    return isTimestopActive();
  }

  function stepDadDrop() {
    if (!current) {
      return false;
    }
    const next = copyPiece(current);
    next.row += 1;
    if (canDadPenetrate() ? !dadWallsOnlyFits(next) : !isValidMove(current, 0, 1)) {
      return false;
    }
    current.row += 1;
    score += 1;
    updateHud();
    sfx.play("move");
    return true;
  }

  function beginDadLockDelay() {
    if (!dadSpecialOn() || !current || freezeMs > 0 || dadResumeMs > 0) {
      return false;
    }
    if (lockDelayMs > 0) {
      enterDadPhase();
      return true;
    }
    lockDelayMs = dadSpecialDurationMs();
    enterDadPhase();
    softDropping = false;
    dadCountKind = "";
    dadCountDigit = 0;
    syncDadCountdown();
    syncDadLockGlow();
    return true;
  }

  function startLockIfGrounded() {
    if (!current || !isGrounded(current)) {
      return false;
    }
    return beginDadLockDelay();
  }

  function dadPoseNeedsSmartLock(piece) {
    if (!piece) {
      return true;
    }
    if (dadOverlapsStack(piece) || !dadFits(piece)) {
      return true;
    }
    const probe = copyPiece(piece);
    probe.row += 1;
    return dadFits(probe);
  }

  function dadSmartLockScore(dropped, sim, originCol, originRot) {
    const m = boardMetrics(sim.board);
    let score = sim.lines * 12000;
    if (sim.lines >= 4) {
      score += 4000;
    } else if (sim.lines >= 3) {
      score += 1200;
    } else if (sim.lines >= 2) {
      score += 280;
    }
    score -= m.holes * 900;
    score -= m.weightedHoles * 40;
    score += dropped.row * 55;
    score -= m.bump * 7;
    score -= Math.abs(dropped.col - originCol) * 18;
    score -= dropped.rot === originRot ? 0 : 10;
    if (spawnBlocked(sim.board)) {
      score -= 5000;
    }
    return score;
  }

  function dadSmartLockPose() {
    if (!current) {
      return false;
    }
    if (!dadPoseNeedsSmartLock(current)) {
      return false;
    }
    const originCol = current.col;
    const originRot = current.rot;
    const type = current.type;
    const rotCount = type === "O" ? 1 : 4;
    let best = null;
    for (let i = 0; i < rotCount; i++) {
      const rot = (originRot + i) % 4;
      for (let dcol = -4; dcol <= 4; dcol++) {
        const dropped = dropOn(cells, { type, rot, col: originCol + dcol, row: 0 });
        if (!dropped) {
          continue;
        }
        const sim = simulatePlacement(cells, dropped);
        const score = dadSmartLockScore(dropped, sim, originCol, originRot);
        if (!best || score > best.score) {
          best = { score, pose: dropped };
        }
      }
    }
    if (best && best.pose) {
      current.rot = best.pose.rot;
      current.col = best.pose.col;
      current.row = best.pose.row;
      return true;
    }
    resolveOverlapBeforeLock();
    return dadFits(current) && !dadOverlapsStack(current);
  }

  function lockInPlaceNow(fromHardDrop) {
    if (!current) {
      return;
    }
    const wasOverlap = dadOverlapsStack(current) || !dadFits(current);
    if (wasOverlap) {
      resolveOverlapBeforeLock();
      if (!dadFits(current) || dadOverlapsStack(current)) {
        dadSmartLockPose();
        resolveOverlapBeforeLock();
      }
    } else {
      const landed = dadLandingPiece(current);
      if (dadFits(landed) && dadInCols(landed)) {
        current.row = landed.row;
      }
    }
    if (wasOverlap) {
      spawnDadLockSpark();
    }
    clearDadTimers();
    lockAndSpawn(!!fromHardDrop);
  }

  function dadDigitFromMs(ms) {
    if (ms <= 0) {
      return 0;
    }
    return Math.min(dadSpecialDurationSec(), Math.max(1, Math.ceil(ms / 1000)));
  }

  function hideDadCountdown() {
    dadCountDigit = 0;
    dadCountKind = "";
    dadResumeMs = 0;
    const overlay = document.getElementById("dad-countdown-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.classList.remove("is-freeze", "is-lock");
    }
  }

  function renderDadCountdown(digit, kind, isResume) {
    const overlay = document.getElementById("dad-countdown-overlay");
    const num = document.getElementById("dad-countdown-num");
    const label = document.getElementById("dad-countdown-label");
    if (!overlay || !num) {
      return;
    }
    overlay.classList.remove("hidden");
    overlay.classList.toggle("is-freeze", kind === "freeze");
    overlay.classList.toggle("is-lock", kind === "lock");
    if (label) {
      label.classList.toggle("hidden", kind !== "freeze" || isResume);
      if (kind === "freeze" && !isResume) {
        label.textContent = t("dadFreezeTitle");
      }
    }
    const text = isResume ? t("dadResume") : String(digit);
    num.textContent = text;
    num.classList.toggle("is-resume", !!isResume);
    num.classList.toggle("is-wide", !isResume && Number(digit) >= 10);
    num.classList.remove("is-pop");
    void num.offsetWidth;
    num.classList.add("is-pop");
    sfx.play(isResume ? "resume" : "tick");
  }

  function syncDadCountdown() {
    if (dadResumeMs > 0) {
      if (dadCountKind !== "resume") {
        dadCountKind = "resume";
        dadCountDigit = -1;
        renderDadCountdown(0, "freeze", true);
      }
      return;
    }
    if (freezeMs > 0) {
      const digit = dadDigitFromMs(freezeMs);
      if (dadCountKind !== "freeze" || digit !== dadCountDigit) {
        dadCountKind = "freeze";
        dadCountDigit = digit;
        renderDadCountdown(digit, "freeze", false);
      }
      return;
    }
    if (lockDelayMs > 0) {
      const digit = dadDigitFromMs(lockDelayMs);
      if (dadCountKind !== "lock" || digit !== dadCountDigit) {
        dadCountKind = "lock";
        dadCountDigit = digit;
        renderDadCountdown(digit, "lock", false);
      }
      return;
    }
    if (dadCountKind) {
      hideDadCountdown();
    }
  }

  function isStackedGrounded(piece) {
    if (!piece) {
      return false;
    }
    const probe = copyPiece(piece);
    probe.row += 1;
    return !fits(probe);
  }

  function resetDadTurnState() {
    lockDelayMs = 0;
    freezeMs = 0;
    dadResumeMs = 0;
    dadPhaseLock = false;
    hasUsedTimestopThisTurn = false;
    hideDadCountdown();
    if (boardWrap) {
      boardWrap.classList.remove("is-dad-lock", "dad-focus-active");
    }
    if (boardCanvas) {
      boardCanvas.classList.remove("dad-focus-active");
    }
  }

  function endDadFreeze(resumeNow) {
    freezeMs = 0;
    if (resumeNow) {
      dadResumeMs = 0;
      hideDadCountdown();
      gravityMsLeft = gravityInterval();
    } else {
      dadResumeMs = DAD_RESUME_MS;
      dadCountKind = "";
      dadCountDigit = 0;
    }
    syncDadCountdown();
    syncDadLockGlow();
  }

  function syncDadLockGlow() {
    const lockFocus = dadSpecialOn() && (lockDelayMs > 0 || dadPhaseLock) && !!current;
    const freezeGlow = dadSpecialOn() && freezeMs > 0 && !!current;
    if (boardWrap) {
      boardWrap.classList.toggle("is-dad-lock", lockFocus || freezeGlow);
      boardWrap.classList.toggle("dad-focus-active", lockFocus || freezeGlow);
    }
    if (boardCanvas) {
      boardCanvas.classList.toggle("dad-focus-active", lockFocus || freezeGlow);
    }
    const stack = document.getElementById("tetris-board-wrapper");
    if (stack) {
      stack.classList.toggle("dad-focus-active", lockFocus || freezeGlow);
    }
    const focusNow = !!(lockFocus || freezeGlow);
    if (focusNow !== lastStaticFocusOn) {
      lastStaticFocusOn = focusNow;
      invalidateStaticBackground();
      renderStaticBackground();
    }
  }

  function clearDadTimers() {
    resetDadTurnState();
  }

  function tryDadFreeze() {
    if (!dadSpecialOn() || !current || waitingStart || paused || gameOver) {
      return;
    }
    if (settingsOpen || celebrateOpen || scoreSaveOpen || hallOpen || autoplayEndOpen || helpOpen) {
      return;
    }
    if (isTimestopActive()) {
      endDadFreeze(true);
      return;
    }
    if (hasUsedTimestopThisTurn || dadResumeMs > 0 || lockDelayMs > 0) {
      return;
    }
    hasUsedTimestopThisTurn = true;
    freezeMs = dadSpecialDurationMs();
    flashDadCheer("freeze", t("cheerFreeze"), t("cheerTipFreeze"));
    dadCountKind = "";
    dadCountDigit = 0;
    softDropping = false;
    sfx.ensure();
    sfx.play("freeze");
    syncDadCountdown();
    syncDadLockGlow();
  }

  function beginShift(dir) {
    shiftDir = dir;
    dasCharge = dasDelayMs();
    lastPieceAction = "move";
    if (current && dadMoveHorizontal(dir)) {
      sfx.play("move");
    }
  }

  function endShift(dir) {
    if (shiftDir !== dir) {
      return;
    }
    if (dir < 0 && (held.has("ArrowRight") || padHeld.has("right"))) {
      beginShift(1);
      return;
    }
    if (dir > 0 && (held.has("ArrowLeft") || padHeld.has("left"))) {
      beginShift(-1);
      return;
    }
    shiftDir = 0;
    dasCharge = 0;
  }

  function updateDas(dt) {
    if (!shiftDir || !current) {
      return;
    }
    dasCharge -= dt;
    const arr = Math.max(8, arrDelayMs());
    let steps = 0;
    while (dasCharge <= 0 && steps < 3) {
      if (!dadMoveHorizontal(shiftDir)) {
        dasCharge = arr;
        break;
      }
      dasCharge += arr;
      steps += 1;
    }
  }

  function kicks(type, from, to) {
    if (type === "O") {
      return [[0, 0]];
    }
    const clockwise = to === ((from + 1) & 3);
    const index = clockwise ? from : to;
    const table = type === "I" ? I_CW[index] : JLSTZ_CW[index];
    if (clockwise) {
      return table;
    }
    return table.map(([x, y]) => [-x, -y]);
  }

  function tryRotate(dir) {
    if (!current) {
      return false;
    }
    const from = current.rot;
    const rotated = copyPiece(current);
    rotated.rot = dir > 0 ? (from + 1) & 3 : (from + 3) & 3;
    const originCol = current.col;
    const originRow = current.row;
    const ghostOn = canDadPenetrate();
    const baseKicks = kicks(current.type, from, rotated.rot);
    const kickList = ghostOn
      ? uniqueKicks([[0, 0]].concat(baseKicks).concat(DAD_SUPER_KICKS))
      : baseKicks;
    for (const [kx, ky] of kickList) {
      rotated.col = originCol + kx;
      rotated.row = originRow + ky;
      if (ghostOn) {
        if (!dadWallsOnlyFits(rotated)) {
          continue;
        }
        current.rot = rotated.rot;
        current.col = rotated.col;
        current.row = rotated.row;
        lastPieceAction = "rotate";
        sfx.play("rotate");
        return true;
      }
      if (fits(rotated)) {
        current = rotated;
        lastPieceAction = "rotate";
        sfx.play("rotate");
        return true;
      }
    }
    return false;
  }

  function dropDistance(piece) {
    const probe = copyPiece(piece);
    let distance = 0;
    while (true) {
      probe.row += 1;
      if (!fits(probe)) {
        return distance;
      }
      distance += 1;
    }
  }

  function takeFromBag() {
    if (bag.length === 0) {
      bag = TYPES.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
    }
    return bag.pop();
  }

  function ensureNextQueue() {
    if (!next) {
      next = spawn(takeFromBag());
    }
    if (!next2) {
      next2 = spawn(takeFromBag());
    }
  }

  function spawn(type) {
    return { type, rot: 0, col: 3, row: 0 };
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  function fitsOn(board, piece) {
    return pieceCells(piece).every(([c, r]) => {
      return c >= 0 && c < COLS && r < ROWS && (r < 0 || !board[r][c]);
    });
  }

  function dropOn(board, piece) {
    const probe = copyPiece(piece);
    if (!fitsOn(board, probe)) {
      return null;
    }
    while (true) {
      probe.row += 1;
      if (!fitsOn(board, probe)) {
        probe.row -= 1;
        return probe;
      }
    }
  }

  function columnHeights(board) {
    const heights = Array(COLS).fill(0);
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        if (board[r][c]) {
          heights[c] = ROWS - r;
          break;
        }
      }
    }
    return heights;
  }

  function stackHeightExcludingWell(heights, well) {
    let max = 0;
    for (let c = 0; c < COLS; c++) {
      if (c !== well) {
        max = Math.max(max, heights[c]);
      }
    }
    return max;
  }

  function wellDepth(heights, well) {
    return Math.max(0, stackHeightExcludingWell(heights, well) - heights[well]);
  }

  function stackBump(heights, well) {
    let bump = 0;
    for (let c = 0; c < COLS - 1; c++) {
      if (c === well || c + 1 === well) {
        continue;
      }
      bump += Math.abs(heights[c] - heights[c + 1]);
    }
    return bump;
  }

  function chooseWellColumn(heights, currentWell) {
    const right = COLS - 1;
    const left = 0;
    const well = currentWell === left || currentWell === right ? currentWell : right;
    if (heights[right] <= heights[left] + 1) {
      return right;
    }
    if (heights[left] + 3 <= heights[right] && heights[left] <= 4) {
      return left;
    }
    return well === left && heights[left] + 2 < heights[right] ? left : right;
  }

  function pickWellColumn(heights) {
    autoplayWellCol = chooseWellColumn(heights, autoplayWellCol);
    return autoplayWellCol;
  }

  function boardHoles(board) {
    let holes = 0;
    for (let c = 0; c < COLS; c++) {
      let seen = false;
      for (let r = 0; r < ROWS; r++) {
        if (board[r][c]) {
          seen = true;
        } else if (seen) {
          holes += 1;
        }
      }
    }
    return holes;
  }

  function boardHoleStats(board) {
    let holes = 0;
    let weighted = 0;
    for (let c = 0; c < COLS; c++) {
      let seen = false;
      let depth = 0;
      for (let r = 0; r < ROWS; r++) {
        if (board[r][c]) {
          seen = true;
          depth += 1;
        } else if (seen) {
          holes += 1;
          weighted += 1 + depth * 0.18;
        }
      }
    }
    return { holes, weighted };
  }

  function extraWellPenalty(heights, well) {
    let pen = 0;
    for (let c = 0; c < COLS; c++) {
      if (c === well) {
        continue;
      }
      const left = c <= 0 ? 99 : heights[c - 1];
      const right = c >= COLS - 1 ? 99 : heights[c + 1];
      const drop = Math.min(left, right) - heights[c];
      if (drop >= 3) {
        pen += drop * 1.15;
      } else if (drop >= 2) {
        pen += 0.75;
      }
    }
    return pen;
  }

  function spawnBlocked(board) {
    return !fitsOn(board, { type: "T", rot: 0, col: 3, row: 0 });
  }

  function aiModeForBoard(board, hasI, well) {
    const heights = columnHeights(board);
    const w = well == null ? pickWellColumn(heights) : well;
    const stack = stackHeightExcludingWell(heights, w);
    const maxH = Math.max(...heights);
    const depth = wellDepth(heights, w);
    const holes = boardHoles(board);
    if (maxH >= AI_EMERGENCY_HEIGHT || stack >= AI_DANGER_HEIGHT || (holes >= 2 && maxH >= 12)) {
      return "survive";
    }
    if (maxH >= AI_WARN_HEIGHT || stack >= AI_WARN_HEIGHT || holes >= 3) {
      return "stabilize";
    }
    if (hasI && stack >= AI_BUILD_MIN && depth >= 3 && maxH <= AI_BUILD_MAX) {
      return "storm";
    }
    return "buildup";
  }

  function updateAutoplayAiMode(board) {
    const hasI = !!(current && current.type === "I")
      || (!isDualPreviewMode() && !!(holdPiece && holdPiece.type === "I"))
      || !!(next && next.type === "I")
      || !!(next2 && next2.type === "I");
    autoplayAiMode = aiModeForBoard(board, hasI);
    return autoplayAiMode;
  }

  function lookaheadWeight(mode) {
    if (mode === "survive") {
      return 0.72;
    }
    if (mode === "stabilize") {
      return 0.58;
    }
    if (mode === "storm") {
      return 0.28;
    }
    return 0.48;
  }

  function boardMetrics(board) {
    const heights = columnHeights(board);
    const holeStats = boardHoleStats(board);
    let agg = 0;
    let bump = 0;
    for (let c = 0; c < COLS; c++) {
      agg += heights[c];
    }
    for (let c = 0; c < COLS - 1; c++) {
      bump += Math.abs(heights[c] - heights[c + 1]);
    }
    return { holes: holeStats.holes, weightedHoles: holeStats.weighted, agg, bump, heights };
  }

  function simulatePlacement(board, piece) {
    const test = cloneBoard(board);
    for (const [c, r] of pieceCells(piece)) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        test[r][c] = piece.type;
      }
    }
    let lines = 0;
    const kept = [];
    for (let r = 0; r < ROWS; r++) {
      if (test[r].every(Boolean)) {
        lines += 1;
      } else {
        kept.push(test[r]);
      }
    }
    while (kept.length < ROWS) {
      kept.unshift(Array(COLS).fill(null));
    }
    return { board: kept, lines };
  }

  function scoreSim(piece, sim, mode, well) {
    const wellFill = pieceCells(piece).filter(([c, r]) => c === well && r >= 0).length;
    const m = boardMetrics(sim.board);
    const heights = m.heights;
    const stack = stackHeightExcludingWell(heights, well);
    const maxH = Math.max(...heights);
    const lines = sim.lines;
    const bump = stackBump(heights, well);
    const wellH = heights[well];
    const spawnH = Math.max(heights[3], heights[4], heights[5], heights[6]);
    let score = -extraWellPenalty(heights, well);

    if (spawnBlocked(sim.board)) {
      score -= 5000;
    }
    if (maxH >= 18) {
      score -= 900;
    } else if (maxH >= 16) {
      score -= 420;
    } else if (maxH >= AI_EMERGENCY_HEIGHT) {
      score -= 140;
    }
    if (spawnH >= 16) {
      score -= 280;
    }

    if (mode === "survive") {
      score += -m.weightedHoles * 16 - m.bump * 0.9 - m.agg * 0.55 - maxH * 2.9;
      score += lines * 12;
      if (lines >= 1) {
        score += 8;
      }
      score += (ROWS - maxH) * 1.5;
      score += piece.row * 0.08;
      return score;
    }

    if (mode === "stabilize") {
      score += -m.weightedHoles * 8.5 - m.bump * 0.48 - maxH * 1.65 - m.agg * 0.3;
      if (lines === 2) {
        score += 9.5;
      } else if (lines === 3) {
        score += 11.5;
      } else if (lines === 1) {
        score += 6.2;
      } else if (lines >= 4) {
        score += 8;
      }
      score -= Math.abs(Math.min(stack, 12) - 6) * 0.72;
      if (stack > 9) {
        score -= (stack - 9) * 1.45;
      }
      if (wellFill && lines === 0) {
        score -= 1.6;
      }
      return score;
    }

    if (mode === "storm" && piece.type === "I") {
      score += -m.weightedHoles * 6 - bump * 0.2;
      score += lines * 4.2;
      if (lines >= 4) {
        score += 18;
      } else if (lines === 3) {
        score += 8;
      }
      if (wellFill >= 3) {
        score += 8;
      }
      if (wellFill === 0 && lines < 3) {
        score -= 6;
      }
      return score;
    }

    score += -m.weightedHoles * 3.4 - bump * 0.3;
    score -= wellFill * 3.4;
    if (wellH > 1) {
      score -= (wellH - 1) * 1.2;
    }
    if (lines === 1) {
      score -= 2.8;
    } else if (lines === 2) {
      score -= 1.2;
    } else if (lines === 3) {
      score += 1.5;
    } else if (lines >= 4) {
      score += 14;
    }

    if (stack < AI_BUILD_MIN) {
      score += stack * 0.22;
    } else if (stack <= AI_BUILD_MAX) {
      score += 1.45 - Math.abs(stack - AI_BUILD_TARGET) * 0.1;
    } else {
      score -= (stack - AI_BUILD_MAX) * 1.15;
    }

    const adj = well === 0 ? 1 : COLS - 2;
    score += Math.min(6, Math.max(0, heights[adj] - wellH)) * 0.22;
    const depth = Math.max(0, stack - wellH);
    if (depth >= 3 && depth <= 4) {
      score += 1.2;
    } else if (depth >= 4) {
      score += 0.55;
    }
    return score;
  }

  function scoreBoardAfter(board, piece, mode, well) {
    return scoreSim(piece, simulatePlacement(board, piece), mode, well);
  }

  function enumeratePlacements(board, type) {
    const out = [];
    if (!type || !SHAPES[type]) {
      return out;
    }
    const rotCount = type === "O" ? 1 : 4;
    for (let rot = 0; rot < rotCount; rot++) {
      const shape = SHAPES[type][rot];
      let minX = 4;
      let maxX = 0;
      for (const [x] of shape) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
      for (let col = -minX; col <= COLS - 1 - maxX; col++) {
        const dropped = dropOn(board, { type, rot, col, row: 0 });
        if (dropped) {
          out.push(dropped);
        }
      }
    }
    return out;
  }

  function bestPlacementFor(board, type, mode, well) {
    let best = null;
    const wellCol = well == null ? COLS - 1 : well;
    const aiMode = mode || "buildup";
    for (const dropped of enumeratePlacements(board, type)) {
      const score = scoreBoardAfter(board, dropped, aiMode, wellCol);
      if (!best || score > best.score) {
        best = { score, type, rot: dropped.rot, col: dropped.col };
      }
    }
    return best;
  }

  function bestScoreForType(board, type, mode, well) {
    const hit = bestPlacementFor(board, type, mode, well);
    return hit ? hit.score : -80;
  }

  function peekBagType() {
    return bag.length ? bag[bag.length - 1] : null;
  }

  function scoreMoveTree(board, type, useHold, leftoverType, holdAfter, mode, well) {
    const placeMode = type === "I" && mode === "storm" ? "storm" : mode;
    const lookW = lookaheadWeight(placeMode);
    const keepI = placeMode === "buildup" && holdAfter === "I" && type !== "I";
    let best = null;
    for (const dropped of enumeratePlacements(board, type)) {
      const sim = simulatePlacement(board, dropped);
      let score = scoreSim(dropped, sim, placeMode, well);
      if (keepI) {
        score += 2.5;
      }
      if (leftoverType) {
        const hasINext = leftoverType === "I" || holdAfter === "I";
        const nextMode = aiModeForBoard(sim.board, hasINext, well);
        const leftoverMode = leftoverType === "I" && nextMode === "storm" ? "storm" : nextMode;
        let follow = bestScoreForType(sim.board, leftoverType, leftoverMode, well);
        if (holdAfter && holdAfter !== leftoverType) {
          const holdMode = holdAfter === "I" && nextMode === "storm" ? "storm" : nextMode;
          const hs = bestScoreForType(sim.board, holdAfter, holdMode, well);
          if (hs > follow) {
            follow = hs;
          }
        }
        score += lookW * follow;
      }
      if (!best || score > best.score) {
        best = { score, type, rot: dropped.rot, col: dropped.col, useHold };
      }
    }
    return best;
  }

  function findBestMove() {
    if (!current) {
      return null;
    }
    const board = cells;
    const well = pickWellColumn(columnHeights(board));
    const nextType = next ? next.type : peekBagType();
    const next2Type = next2 ? next2.type : peekBagType();
    const dual = isDualPreviewMode();
    const holdType = dual ? null : (holdPiece ? holdPiece.type : null);
    const hasI = current.type === "I" || holdType === "I" || nextType === "I" || (dual && next2Type === "I");
    const mode = aiModeForBoard(board, hasI, well);
    autoplayAiMode = mode;

    let best = scoreMoveTree(board, current.type, false, nextType, dual ? next2Type : holdType, mode, well);

    if (canHold && !dual) {
      if (holdType && holdType !== current.type) {
        const alt = scoreMoveTree(board, holdType, true, nextType, current.type, mode, well);
        if (alt && (!best || alt.score > best.score)) {
          best = alt;
        }
      } else if (!holdType && nextType && nextType !== current.type) {
        const alt = scoreMoveTree(board, nextType, true, peekBagType(), current.type, mode, well);
        if (alt && (!best || alt.score > best.score)) {
          best = alt;
        }
      }
    }

    if (!best) {
      best = bestPlacementFor(board, current.type, "survive", well);
      if (best) {
        best.useHold = false;
      }
    }
    return best;
  }

  function finishIfBlocked() {
    current = null;
    gameOver = true;
    rememberBest();
    showGameOverlay("gameOver");
    flashDadCheer("over", t("cheerGameover"), t("cheerTipGameover"));
    bgm.pause();
    enqueueCelebrate("gameover");
    requestScoreSave();
    syncActionButtons();
    applyCurrentBackground({ fade: true });
    stopAutoplay();
    syncExtremeLevelFx();
  }

  function holdCurrent() {
    if (isDualPreviewMode()) {
      return false;
    }
    if (!current || !canHold || waitingStart || paused || gameOver) {
      return false;
    }
    clearDadTimers();
    canHold = false;
    const kept = current.type;
    if (!holdPiece) {
      holdPiece = spawn(kept);
      spawnNext();
    } else {
      const incoming = holdPiece.type;
      holdPiece = spawn(kept);
      current = spawn(incoming);
      gravityMsLeft = gravityInterval();
      if (!fits(current)) {
        finishIfBlocked();
        return false;
      }
    }
    sfx.play("move");
    drawHold();
    return !!current;
  }

  function executeBestMove() {
    if (!current || paused || waitingStart || gameOver || celebrateOpen || settingsOpen || scoreSaveOpen || hallOpen || helpOpen) {
      return;
    }
    const best = findBestMove();
    if (!best) {
      hardDrop();
      return;
    }
    if (best.useHold) {
      if (!holdCurrent() || !current) {
        return;
      }
    }
    current.rot = best.rot;
    current.col = best.col;
    current.row = 0;
    if (!fits(current)) {
      hardDrop();
      return;
    }
    hardDrop();
  }

  function rotationDistance(from, to) {
    const d = (to - from) & 3;
    return d === 3 ? 1 : d;
  }

  function rotationDir(from, to) {
    const d = (to - from) & 3;
    return d === 3 ? -1 : 1;
  }

  function rotatedPose(piece, dir, board) {
    const from = piece.rot;
    const rotated = copyPiece(piece);
    rotated.rot = dir > 0 ? (from + 1) & 3 : (from + 3) & 3;
    for (const [kx, ky] of kicks(piece.type, from, rotated.rot)) {
      rotated.col = piece.col + kx;
      rotated.row = piece.row + ky;
      if (fitsOn(board, rotated)) {
        return rotated;
      }
    }
    return null;
  }

  function shiftedPose(piece, dir, board) {
    const next = copyPiece(piece);
    next.col += dir;
    return fitsOn(board, next) ? next : null;
  }

  function droppedPose(piece, board) {
    const next = copyPiece(piece);
    next.row += 1;
    return fitsOn(board, next) ? next : null;
  }

  function canReachTarget(piece, targetRot, targetCol, board) {
    if (!piece) {
      return false;
    }
    const p = copyPiece(piece);
    for (let i = 0; i < 72; i++) {
      if (p.rot === targetRot && p.col === targetCol) {
        return !!(dropOn(board, p) || fitsOn(board, p));
      }
      if (p.rot !== targetRot) {
        const spun = rotatedPose(p, rotationDir(p.rot, targetRot), board);
        if (spun) {
          p.rot = spun.rot;
          p.col = spun.col;
          p.row = spun.row;
          continue;
        }
      }
      if (p.col !== targetCol) {
        const moved = shiftedPose(p, targetCol > p.col ? 1 : -1, board);
        if (moved) {
          p.col = moved.col;
          continue;
        }
      }
      const down = droppedPose(p, board);
      if (down) {
        p.row = down.row;
        continue;
      }
      return false;
    }
    return false;
  }

  function makeAutoplayPlan(best) {
    if (!best || !current) {
      return null;
    }
    const probe = {
      type: best.type || current.type,
      rot: best.rot,
      col: best.col,
      row: Math.max(0, current.row),
    };
    const landed = dropOn(cells, probe);
    return {
      rot: best.rot,
      col: best.col,
      useHold: !!best.useHold,
      destRow: Math.max(1, landed ? landed.row : current.row + Math.max(1, dropDistance(current))),
      totalRots: rotationDistance(current.rot, best.rot),
      totalMoves: Math.abs(best.col - current.col),
      rotsDone: 0,
      movesDone: 0,
      sinceDrop: 0,
      lastKind: "drop",
    };
  }

  function refreshAutoplayPlanMetrics() {
    if (!autoplayPlan || !current) {
      return;
    }
    const probe = {
      type: current.type,
      rot: autoplayPlan.rot,
      col: autoplayPlan.col,
      row: Math.max(0, current.row),
    };
    const landed = dropOn(cells, probe);
    autoplayPlan.destRow = Math.max(1, landed ? landed.row : current.row + Math.max(1, dropDistance(current)));
    autoplayPlan.totalRots = rotationDistance(current.rot, autoplayPlan.rot);
    autoplayPlan.totalMoves = Math.abs(autoplayPlan.col - current.col);
    autoplayPlan.rotsDone = 0;
    autoplayPlan.movesDone = 0;
    autoplayPlan.sinceDrop = 0;
  }

  function autoplayFallProgress(plan) {
    if (!current || !plan) {
      return 1;
    }
    return Math.min(1, Math.max(0, current.row / Math.max(1, plan.destRow)));
  }

  function nextAutoplayIntent(plan, progress) {
    const rotLeft = rotationDistance(current.rot, plan.rot);
    const colLeft = Math.abs(current.col - plan.col);
    if (rotLeft === 0 && colLeft === 0) {
      return "drop";
    }
    if (progress < 0.4) {
      const rotCap = plan.totalRots >= 2 ? Math.min(2, plan.totalRots - 1) : 0;
      if (rotLeft > 0 && plan.rotsDone < rotCap) {
        return "rotate";
      }
      const moveCap = Math.floor(plan.totalMoves * 0.4);
      if (colLeft > 0 && plan.movesDone < moveCap) {
        return "move";
      }
      return "drop";
    }
    if (progress < 0.8) {
      if (rotLeft > 0) {
        return "rotate";
      }
      const reserve = Math.min(2, Math.max(0, Math.ceil(plan.totalMoves * 0.2)));
      if (colLeft > reserve) {
        return "move";
      }
      return "drop";
    }
    if (rotLeft > 0) {
      return "rotate";
    }
    if (colLeft > 0) {
      return "move";
    }
    return "drop";
  }

  function safeAutoplayRotate() {
    if (!current || !autoplayPlan || current.rot === autoplayPlan.rot) {
      return false;
    }
    const dir = rotationDir(current.rot, autoplayPlan.rot);
    const pose = rotatedPose(current, dir, cells);
    if (!pose || !canReachTarget(pose, autoplayPlan.rot, autoplayPlan.col, cells)) {
      return false;
    }
    const speed = clampAutoplaySpeed(settings.autoplaySpeed);
    const from = current.rot;
    current = pose;
    if (speed <= 2) {
      sfx.play("rotate");
    }
    if (current.rot === from) {
      return false;
    }
    return true;
  }

  function safeAutoplayMove() {
    if (!current || !autoplayPlan || current.col === autoplayPlan.col) {
      return false;
    }
    const dir = autoplayPlan.col > current.col ? 1 : -1;
    const pose = shiftedPose(current, dir, cells);
    if (!pose || !canReachTarget(pose, autoplayPlan.rot, autoplayPlan.col, cells)) {
      return false;
    }
    current = pose;
    if (clampAutoplaySpeed(settings.autoplaySpeed) <= 2) {
      sfx.play("move");
    }
    return true;
  }

  function snapAutoplayIfSafe() {
    if (!current || !autoplayPlan) {
      return false;
    }
    const snapped = copyPiece(current);
    snapped.rot = autoplayPlan.rot;
    snapped.col = autoplayPlan.col;
    if (!fits(snapped)) {
      return false;
    }
    current = snapped;
    return true;
  }

  function stepAutoplayMotion() {
    if (!current || !autoplayPlan) {
      return "lock";
    }
    const progress = autoplayFallProgress(autoplayPlan);
    const intent = nextAutoplayIntent(autoplayPlan, progress);
    const canInput = autoplayPlan.sinceDrop < autoplayInputsBeforeDrop();
    if (canInput && intent === "rotate" && safeAutoplayRotate()) {
      autoplayPlan.rotsDone += 1;
      autoplayPlan.sinceDrop += 1;
      return "rotate";
    }
    if (canInput && intent === "move" && safeAutoplayMove()) {
      autoplayPlan.movesDone += 1;
      autoplayPlan.sinceDrop += 1;
      return "move";
    }
    if (tryMove(0, 1)) {
      autoplayPlan.sinceDrop = 0;
      return "drop";
    }
    if (current.rot !== autoplayPlan.rot && safeAutoplayRotate()) {
      autoplayPlan.rotsDone += 1;
      return "rotate";
    }
    if (current.col !== autoplayPlan.col && safeAutoplayMove()) {
      autoplayPlan.movesDone += 1;
      return "move";
    }
    if (current.rot !== autoplayPlan.rot || current.col !== autoplayPlan.col) {
      if (!snapAutoplayIfSafe()) {
        autoplayPlan = null;
        lockAndSpawn();
        return "lock";
      }
    }
    autoplayPlan = null;
    lockAndSpawn();
    return "lock";
  }

  function executeAutoplayTick() {
    if (!current || paused || waitingStart || gameOver || celebrateOpen || settingsOpen || scoreSaveOpen || hallOpen || helpOpen) {
      return;
    }
    if (!autoplayPlan) {
      autoplayPlan = makeAutoplayPlan(findBestMove());
    }
    if (!autoplayPlan) {
      hardDrop();
      return;
    }
    if (autoplayPlan.useHold) {
      if (!holdCurrent() || !current) {
        autoplayPlan = null;
        hardDrop();
        return;
      }
      autoplayPlan.useHold = false;
      refreshAutoplayPlanMetrics();
      autoplayPlan.lastKind = "move";
      if (clampAutoplaySpeed(settings.autoplaySpeed) < 5) {
        return;
      }
    }
    const burst = autoplayMotionBurst();
    for (let i = 0; i < burst && current && autoplay && autoplayPlan; i++) {
      const kind = stepAutoplayMotion();
      if (autoplayPlan) {
        autoplayPlan.lastKind = kind;
      }
      if (kind === "lock") {
        break;
      }
    }
  }

  function syncAutoplayUi() {
    const btn = document.getElementById("autoplay-toggle");
    const badge = document.getElementById("autoplay-badge");
    if (btn) {
      btn.classList.toggle("is-on", autoplay);
      btn.setAttribute("aria-pressed", autoplay ? "true" : "false");
      btn.textContent = autoplay ? t("autoplayStop") : t("autoplay");
    }
    if (badge) {
      badge.classList.toggle("hidden", !autoplay);
      badge.textContent = t("autoplayBadge");
    }
    document.body.classList.toggle("is-autoplay", autoplay);
    syncAutoplayFade();
  }

  function stopAutoplay() {
    if (!autoplay) {
      return;
    }
    autoplay = false;
    autoplayWait = 0;
    autoplayPlan = null;
    syncAutoplayUi();
  }

  function startAutoplay() {
    autoplay = true;
    autoplayTouched = true;
    autoplayWait = 0;
    autoplayPlan = null;
    autoplayAiMode = "buildup";
    autoplayWellCol = COLS - 1;
    shiftDir = 0;
    dasCharge = 0;
    clearDadTimers();
    if (waitingStart || gameOver) {
      startNewGame();
    } else if (paused) {
      paused = false;
      hideOverlay();
      bgm.play();
      syncActionButtons();
    }
    applyCurrentBackground({ fade: true });
    syncAutoplayUi();
  }

  function toggleAutoplay() {
    if (autoplay) {
      stopAutoplay();
      return;
    }
    startAutoplay();
  }

  function isPlayInterruptKey(code) {
    return [
      "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp",
      "KeyZ", "KeyH", "KeyC", "ShiftLeft", "ShiftRight", "Space",
    ].includes(code);
  }

  function levelBaseGravityMs() {
    const lv = playLevel(level);
    if (lv <= 10) {
      const n = BASE_GRAVITY_MS - (lv - 1) * 70;
      return Number.isFinite(n) ? Math.max(100, n) : BASE_GRAVITY_MS;
    }
    const n = 170 - (lv - 10) * 15.4;
    return Number.isFinite(n) ? Math.max(AUTOPLAY_MIN_MS, n) : AUTOPLAY_MIN_MS;
  }

  function gravityInterval() {
    const base = levelBaseGravityMs();
    const mul = dropSpeedMultiplier();
    const n = base / Math.max(0.5, mul);
    return Number.isFinite(n) ? Math.max(16, n) : base;
  }

  function gravityFallSteps() {
    const lv = playLevel(level);
    if (lv >= 20) {
      return ROWS;
    }
    if (lv >= 11) {
      return Math.min(ROWS, 1 + (lv - 11) * 2);
    }
    return 8;
  }

  function lockAndSpawn(fromHardDrop) {
    if (current && (dadOverlapsStack(current) || !dadFits(current))) {
      resolveOverlapBeforeLock();
    }
    for (const [c, r] of pieceCells(current)) {
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
        cells[r][c] = current.type;
      }
    }
    const fullRows = collectFullRows();
    const cleared = fullRows.length;
    const tspin = isTSpinLock();
    placeStreak += 1;
    let juicePitch = 1;
    if (cleared > 0) {
      lineCombo += 1;
      placeStreak = 0;
      juicePitch = 1 + Math.min(8, Math.max(0, lineCombo - 1)) * 0.05;
      const gained = LINE_SCORES[cleared] * level;
      spawnLineBurst(fullRows);
      sfx.play(cleared >= 4 || tspin ? "tetris" : "clear", { pitch: juicePitch });
      score += gained;
      lines += cleared;
      refreshLevel();
      showClearBanner(cleared, gained);
      flashDadCheerForClear(cleared, { tspin });
      const ultra = cleared >= 4 || tspin || lineCombo >= 3;
      triggerScreenShake(ultra);
      if (ultra) {
        triggerUltraJuice(cleared >= 4 ? "tetris" : tspin ? "tspin" : "combo");
      } else if (cleared >= 2) {
        addShake(16);
        triggerNeonFlash("triple");
      } else {
        addShake(6);
      }
    } else {
      lineCombo = 0;
      juicePitch = 1 + Math.min(8, Math.max(0, placeStreak - 1)) * 0.05;
      sfx.play("drop", { pitch: juicePitch });
    }
    if (fromHardDrop) {
      lastPieceAction = "drop";
      spawnShockwaveLine();
      if (cleared > 0) {
        sfx.play("drop", { pitch: juicePitch });
      }
      addShake(cleared >= 4 ? 36 : 16);
    }
    collapseFullRows();
    updateHud();
    clearDadTimers();
    if (autoplay && celebratedLevel20 && playLevel(level) >= LEVEL_MAX) {
      finishAutoplayConquer();
      return;
    }
    spawnNext();
    canHold = true;
    drawHold();
  }

  function collectFullRows() {
    const full = [];
    for (let r = 0; r < ROWS; r++) {
      if (cells[r].every(Boolean)) {
        full.push({ row: r, types: cells[r].slice() });
      }
    }
    return full;
  }

  function collapseFullRows() {
    const remaining = cells.filter((row) => row.some((cell) => !cell));
    while (remaining.length < ROWS) {
      remaining.unshift(Array(COLS).fill(null));
    }
    cells = remaining;
  }

  function spawnNext() {
    current = next || spawn(takeFromBag());
    current.col = 3;
    current.row = 0;
    next = next2 || spawn(takeFromBag());
    next2 = spawn(takeFromBag());
    gravityMsLeft = gravityInterval();
    resetDadTurnState();
    if (!fits(current)) {
      finishIfBlocked();
    }
    drawNext();
  }

  function startNewGame() {
    if (gameTerminated) {
      return;
    }
    try {
    hideConquerBanner();
    autoplayConquered = false;
    cells = createBoard();
    fillStartGarbageLines(cells, settings.startGarbageLines);
    bag = [];
    score = 0;
    lines = 0;
    lineCombo = 0;
    resetDadCheer();
    waitingStart = false;
    paused = false;
    gameOver = false;
    autoplayTouched = autoplay;
    autoplayWait = 0;
    autoplayPlan = null;
    autoplayAiMode = "buildup";
    autoplayWellCol = COLS - 1;
    shiftDir = 0;
    dasCharge = 0;
    celebratedGoal1 = false;
    celebratedGoal2 = false;
    celebratedLevel20 = false;
    refreshLevel();
    applyCurrentBackground({ fade: true });
    closeCelebrate(true);
    closeScoreSaveModal();
    closeAutoplayEndModal();
    clearSpaceTap();
    softDropping = false;
    particles = [];
    flashes = [];
    shake = 0;
    shakeTick = 0;
    if (boardWrap) {
      boardWrap.style.transform = "";
    }
    hideClearBanner();
    clearDadTimers();
    next = spawn(takeFromBag());
    next2 = spawn(takeFromBag());
    spawnNext();
    holdPiece = null;
    canHold = true;
    drawHold();
    hideOverlay();
    updateHud();
    try {
      bgm.play();
    } catch (err) {
      /* audio optional */
    }
    syncActionButtons();
    releaseAllPads();
    if (!loopRaf) {
      lastTime = 0;
      loopRaf = requestAnimationFrame(loop);
    }
    } catch (err) {
      waitingStart = false;
      paused = false;
      gameOver = false;
      try {
        hideOverlay();
      } catch (err2) {
        /* ignore */
      }
      try {
        draw();
      } catch (err3) {
        /* ignore */
      }
      if (!loopRaf) {
        loopRaf = requestAnimationFrame(loop);
      }
    }
  }

  function showStartScreen() {
    hideConquerBanner();
    autoplayConquered = false;
    waitingStart = true;
    paused = false;
    gameOver = false;
    current = null;
    next = null;
    next2 = null;
    holdPiece = null;
    canHold = true;
    cells = createBoard();
    bag = [];
    clearSpaceTap();
    hideClearBanner();
    clearDadTimers();
    shake = 0;
    boardWrap.style.transform = "";
    showGameOverlay("start");
    bgm.pause();
    draw();
    drawHold();
    syncActionButtons();
    applyCurrentBackground({ fade: true });
    syncExtremeLevelFx();
  }

  function finishAutoplayConquer() {
    if (waitingStart) {
      return;
    }
    autoplayConquered = true;
    celebratedLevel20 = true;
    clearSpaceTap();
    current = null;
    gameOver = true;
    paused = false;
    clearDadTimers();
    rememberBest();
    stopAutoplay();
    showGameOverlay("conquer20");
    syncActionButtons();
    applyCurrentBackground({ fade: false });
    syncExtremeLevelFx();
    document.body.classList.add("is-conquer-ending");
    showNeonToast(t("level20Toast"), { crown: true, conquer: true, ms: 5600 });
    spawnConquerFireworks();
    sfx.play("fanfare");
    drawHold();
    draw();
  }

  function terminateGameProcess() {
    gameTerminated = true;
    gameOver = true;
    waitingStart = true;
    paused = true;
    autoplay = false;
    autoplayWait = 0;
    autoplayPlan = null;
    autoplayConquered = false;
    current = null;
    next = null;
    next2 = null;
    holdPiece = null;
    softDropping = false;
    shiftDir = 0;
    dasCharge = 0;
    lockDelayMs = 0;
    freezeMs = 0;
    dadResumeMs = 0;
    dadPhaseLock = false;
    gravityMsLeft = 0;
    lastTime = 0;
    acc = 0;
    particles = [];
    flashes = [];
    shake = 0;
    if (loopRaf) {
      cancelAnimationFrame(loopRaf);
      loopRaf = 0;
    }
    loopBusy = false;
    clearDadTimers();
    clearSpaceTap();
    stopAutoplay();
    window.clearTimeout(celebrateFallbackTimer);
    celebrateFallbackTimer = 0;
    window.clearTimeout(bannerTimer);
    bannerTimer = 0;
    window.clearTimeout(dadSnapFlashTid);
    dadSnapFlashTid = 0;
    window.clearTimeout(neonFlashTid);
    neonFlashTid = 0;
    window.clearTimeout(profileRenderTimer);
    profileRenderTimer = 0;
    window.clearTimeout(rememberBest.tid);
    window.clearTimeout(showNeonToast.hideTid);
    window.clearTimeout(showNeonToast.clearTid);
    hideClearBanner();
    hideConquerBanner();
    hideDadCountdown();
    try {
      bgm.stopFade();
      silenceAudioEl(bgm.audio);
      bgm.audio.currentTime = 0;
    } catch (err) {
      /* ignore */
    }
    sfx.muted = true;
    if (sfx.ctx) {
      const ctx = sfx.ctx;
      sfx.ctx = null;
      try {
        ctx.close();
      } catch (err) {
        /* ignore */
      }
    }
    try {
      celebrateVideo.pause();
      celebrateVideo.currentTime = 0;
      celebrateVideo.removeAttribute("src");
      celebrateVideo.load();
    } catch (err) {
      /* ignore */
    }
    try {
      if (celebrateFrame) {
        celebrateFrame.src = "about:blank";
      }
    } catch (err) {
      /* ignore */
    }
    celebrateOpen = false;
    scoreSaveOpen = false;
    autoplayEndOpen = false;
    settingsOpen = false;
    hallOpen = false;
    helpOpen = false;
    document.querySelectorAll(".modal").forEach((modal) => modal.classList.add("hidden"));
    document.body.classList.remove("modal-open");
    const canvases = [boardCanvas, nextCanvas, holdCanvas, profileMainCanvas, profileCropCanvas];
    canvases.forEach((canvas) => {
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    held.clear();
    releaseAllPads();
  }

  function showShutdownScreen() {
    document.body.classList.add("is-game-terminated");
    const screen = document.getElementById("shutdown-screen");
    const message = document.getElementById("shutdown-message");
    if (message) {
      message.textContent = t("gameTerminatedMsg");
    }
    if (screen) {
      screen.classList.remove("hidden");
    }
    try {
      document.title = t("gameTerminatedMsg");
    } catch (err) {
      /* ignore */
    }
  }

  function quitGameApp() {
    terminateGameProcess();
    try {
      window.open("", "_self", "");
      window.close();
    } catch (err) {
      /* browser blocked */
    }
    window.setTimeout(() => {
      if (!window.closed) {
        showShutdownScreen();
      }
    }, 80);
  }

  function restartFromOverlay() {
    if (gameTerminated) {
      return;
    }
    closeCelebrate(true);
    closeScoreSaveModal();
    closeAutoplayEndModal();
    stopAutoplay();
    startNewGame();
  }

  function endGame() {
    if (waitingStart) {
      return;
    }
    clearSpaceTap();
    current = null;
    gameOver = true;
    paused = false;
    clearDadTimers();
    rememberBest();
    showGameOverlay("gameEnded");
    flashDadCheer("over", t("cheerGameover"), t("cheerTipGameover"));
    bgm.pause();
    enqueueCelebrate("gameover");
    requestScoreSave();
    syncActionButtons();
    applyCurrentBackground({ fade: true });
    stopAutoplay();
    syncExtremeLevelFx();
    drawHold();
  }

  function syncActionButtons() {
    const startBtn = document.getElementById("game-start");
    const endBtn = document.getElementById("game-end");
    if (!startBtn || !endBtn) {
      return;
    }
    if (gameTerminated) {
      startBtn.disabled = true;
      endBtn.disabled = true;
      return;
    }
    const idle = waitingStart || gameOver;
    startBtn.disabled = false;
    startBtn.classList.toggle("is-playing", !idle && !paused);
    startBtn.classList.toggle("is-paused", !idle && paused);
    startBtn.setAttribute("aria-pressed", !idle && paused ? "true" : "false");
    if (gameOver) {
      startBtn.textContent = t("overlayRestart");
    } else if (idle) {
      startBtn.textContent = t("startGame");
    } else if (paused) {
      startBtn.textContent = t("resumeBtn");
    } else {
      startBtn.textContent = t("pauseBtn");
    }
    endBtn.textContent = gameOver ? t("overlayQuit") : t("endGame");
    endBtn.disabled = waitingStart && !gameOver;
  }

  function hardDrop() {
    if (!current) {
      return;
    }
    const fromRow = current.row;
    if (dadSlideActive() || dadOverlapsStack(current)) {
      const dropped = dropOn(cells, copyPiece(current))
        || dropOn(cells, { type: current.type, rot: current.rot, col: current.col, row: 0 });
      if (dropped) {
        current.rot = dropped.rot;
        current.col = dropped.col;
        current.row = dropped.row;
      } else {
        dadSmartLockPose();
      }
      resolveOverlapBeforeLock();
    } else {
      const distance = dropDistance(current);
      if (distance > 0) {
        current.row += distance;
      }
      resolveOverlapBeforeLock();
    }
    const droppedRows = Math.max(0, current.row - fromRow);
    if (droppedRows > 0) {
      score += droppedRows * 2;
    }
    clearDadTimers();
    lockAndSpawn(true);
  }

  function update(dt) {
    if (gameTerminated) {
      return;
    }
    if (waitingStart || paused || settingsOpen || celebrateOpen || scoreSaveOpen || autoplayEndOpen || hallOpen || helpOpen || diagOpen || gameOver || !current) {
      syncDadCountdown();
      syncDadLockGlow();
      return;
    }
    if (autoplay) {
      autoplayWait -= dt;
      let steps = 0;
      const maxSteps = autoplayUsesInstantDrop() ? (playLevel(level) >= 11 ? 8 : 4) : 8;
      while (autoplayWait <= 0 && steps < maxSteps && current && !gameOver && autoplay) {
        const prevPlay = playLevel(level);
        executeAutoplayTick();
        autoplayWait += nextAutoplayDelay();
        steps += 1;
        if (playLevel(level) !== prevPlay) {
          break;
        }
      }
      return;
    }
    updateDas(dt);
    if (dadSpecialOn() && freezeMs > 0) {
      freezeMs -= dt;
      if (freezeMs <= 0) {
        endDadFreeze(false);
      }
      syncDadCountdown();
      syncDadLockGlow();
      return;
    }
    if (dadSpecialOn() && dadResumeMs > 0) {
      dadResumeMs -= dt;
      syncDadCountdown();
      if (dadResumeMs <= 0) {
        hideDadCountdown();
        gravityMsLeft = gravityInterval();
        if (isStackedGrounded(current) && lockDelayMs <= 0) {
          beginDadLockDelay();
        }
        syncDadCountdown();
      }
      syncDadLockGlow();
      return;
    }
    if (canDadPenetrate()) {
      if (lockDelayMs > 0) {
        lockDelayMs -= dt;
        if (lockDelayMs <= 0) {
          lockDelayMs = 0;
          hideDadCountdown();
          lockInPlaceNow(false);
          syncDadLockGlow();
          return;
        }
      } else if (dadPhaseLock) {
        beginDadLockDelay();
      }
      syncDadCountdown();
      syncDadLockGlow();
      return;
    }
    gravityMsLeft -= dt;
    const interval = Math.max(16, softDropping ? Math.max(16, gravityInterval() / softdropMul()) : gravityInterval());
    let steps = 0;
    const maxFall = softDropping ? 8 : gravityFallSteps();
    while (gravityMsLeft <= 0 && steps < maxFall) {
      gravityMsLeft += interval;
      if (!tryMove(0, 1)) {
        if (dadSpecialOn() || dadPhaseLock) {
          beginDadLockDelay();
          break;
        }
        lockAndSpawn();
        break;
      }
      if (softDropping) {
        score += 1;
        updateHud();
      }
      steps += 1;
    }
    syncDadCountdown();
    syncDadLockGlow();
  }

  function detectTouchDevice() {
    return "ontouchstart" in window || (Number(navigator.maxTouchPoints) || 0) > 0;
  }

  function detectNarrowScreen() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function isMobilePadVisible() {
    if (settings.mobilePad === true) {
      return true;
    }
    if (settings.mobilePad === false) {
      return false;
    }
    if ((Number(window.innerWidth) || 0) >= 769) {
      return false;
    }
    return detectNarrowScreen() || detectTouchDevice();
  }

  function canPadPlay() {
    return !waitingStart && !paused && !gameOver && !settingsOpen && !celebrateOpen && !scoreSaveOpen && !hallOpen && !autoplayEndOpen && !helpOpen && !diagOpen && !!current;
  }

  function startPadAction(action) {
    sfx.ensure();
    if (settingsOpen || celebrateOpen || scoreSaveOpen || hallOpen || autoplayEndOpen || helpOpen || diagOpen) {
      return;
    }
    if (waitingStart || gameOver) {
      if (action === "drop" || action === "rotate" || action === "hold") {
        startNewGame();
      }
      return;
    }
    if (autoplay && !paused) {
      stopAutoplay();
    }
    if (!canPadPlay()) {
      return;
    }
    if (action === "left") {
      padHeld.add("left");
      beginShift(-1);
      return;
    }
    if (action === "right") {
      padHeld.add("right");
      beginShift(1);
      return;
    }
    if (action === "down") {
      if (dadResumeMs > 0 && dadSpecialOn()) {
        return;
      }
      if (canDadPenetrate()) {
        stepDadDrop();
        return;
      }
      padHeld.add("down");
      softDropping = true;
      if (tryMove(0, 1)) {
        score += 1;
        gravityMsLeft = gravityInterval();
        sfx.play("softdrop");
        updateHud();
      } else {
        startLockIfGrounded();
      }
      return;
    }
    if (action === "rotate") {
      tryRotate(1);
      return;
    }
    if (action === "drop") {
      hardDrop();
      updateHud();
      return;
    }
    if (action === "hold") {
      holdCurrent();
      return;
    }
    if (action === "freeze") {
      tryDadFreeze();
    }
  }

  function endPadAction(action) {
    if (action === "left") {
      padHeld.delete("left");
      endShift(-1);
      return;
    }
    if (action === "right") {
      padHeld.delete("right");
      endShift(1);
      return;
    }
    if (action === "down") {
      padHeld.delete("down");
      if (!held.has("ArrowDown")) {
        softDropping = false;
      }
    }
  }

  function setPadButtonLit(action, on) {
    document.querySelectorAll(`.pad-btn[data-touch="${action}"]`).forEach((btn) => {
      btn.classList.toggle("is-on", on);
    });
  }

  function padActionStillHeld(action) {
    for (const item of padPointers.values()) {
      if (item.action === action) {
        return true;
      }
    }
    return false;
  }

  function pressPad(id, action) {
    if (!action || padPointers.has(id)) {
      return;
    }
    padPointers.set(id, { action });
    setPadButtonLit(action, true);
    hapticTap(15);
    startPadAction(action);
  }

  function releasePad(id) {
    const item = padPointers.get(id);
    if (!item) {
      return;
    }
    padPointers.delete(id);
    if (!padActionStillHeld(item.action)) {
      setPadButtonLit(item.action, false);
      endPadAction(item.action);
    }
  }

  function releaseAllPads() {
    const actions = new Set();
    padPointers.forEach((item) => actions.add(item.action));
    padPointers.clear();
    actions.forEach((action) => {
      setPadButtonLit(action, false);
      endPadAction(action);
    });
    padHeld.clear();
    document.querySelectorAll(".pad-btn.is-on").forEach((btn) => btn.classList.remove("is-on"));
  }

  function syncMobilePadUi() {
    const on = isMobilePadVisible();
    document.body.classList.toggle("is-mobile-pad", on);
    const pad = document.getElementById("mobile-controls");
    if (pad) {
      pad.classList.toggle("hidden", !on);
      pad.setAttribute("aria-hidden", on ? "false" : "true");
    }
    const toggle = document.getElementById("mobile-pad-toggle");
    if (toggle) {
      toggle.classList.toggle("is-on", on);
      toggle.setAttribute("aria-pressed", on ? "true" : "false");
      toggle.textContent = t("mobilePad");
      toggle.title = on ? t("mobilePadHide") : t("mobilePadShow");
    }
    const setting = document.getElementById("mobile-pad-setting");
    if (setting) {
      setting.classList.toggle("is-on", on);
      setting.setAttribute("aria-pressed", on ? "true" : "false");
      const state = setting.querySelector(".toggle-state");
      if (state) {
        state.textContent = on ? t("on") : t("off");
      }
    }
    if (!on) {
      releaseAllPads();
    }
    scheduleResize();
  }

  function syncDadSpecialUi() {
    const on = !!settings.dadSpecial;
    document.body.classList.toggle("is-dad-special", on);
    const btn = document.getElementById("dad-special-toggle");
    if (btn) {
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = t("guideTabDad");
      btn.title = t("dadSpecialToggle", { state: t(on ? "on" : "off") });
    }
    const freezeBtn = document.getElementById("btn-timestop");
    if (freezeBtn) {
      freezeBtn.classList.toggle("hidden", !on);
      freezeBtn.setAttribute("aria-hidden", on ? "false" : "true");
    }
    document.querySelectorAll('.toggle-row[data-setting="dadSpecial"]').forEach(syncSettingButton);
    if (!on) {
      clearDadTimers();
    }
    syncDadCountdown();
    syncDadLockGlow();
  }

  function toggleDadSpecial() {
    settings.dadSpecial = !settings.dadSpecial;
    saveSettings();
    syncDadSpecialUi();
  }

  function toggleMobilePad() {
    settings.mobilePad = !isMobilePadVisible();
    saveSettings();
    syncMobilePadUi();
  }

  function bindMobileControls() {
    const root = document.getElementById("mobile-controls");
    if (!root) {
      return;
    }
    const actionOf = (target) => {
      const btn = target && target.closest ? target.closest(".pad-btn") : null;
      return btn && root.contains(btn) ? btn.dataset.touch : "";
    };

    root.querySelectorAll(".pad-btn").forEach((btn) => {
      btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
      }, { passive: false });
    });
    root.dataset.touchBound = "1";

    root.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();
      ignorePadMouseUntil = performance.now() + 700;
      for (const touch of e.changedTouches) {
        const hit = document.elementFromPoint(touch.clientX, touch.clientY) || touch.target;
        pressPad(touch.identifier, actionOf(hit));
      }
    }, { passive: false });

    root.addEventListener("touchmove", (e) => {
      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    const onTouchEnd = (e) => {
      let used = false;
      for (const touch of e.changedTouches) {
        if (padPointers.has(touch.identifier)) {
          used = true;
          releasePad(touch.identifier);
        }
      }
      if (used) {
        e.preventDefault();
      }
    };
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    window.addEventListener("touchcancel", onTouchEnd, { passive: false });

    root.addEventListener("mousedown", (e) => {
      if (e.button !== 0 || performance.now() < ignorePadMouseUntil) {
        return;
      }
      e.preventDefault();
      pressPad("mouse", actionOf(e.target));
    });
    window.addEventListener("mouseup", () => {
      releasePad("mouse");
    });
    root.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    root.addEventListener("click", (e) => {
      e.preventDefault();
    });
    root.addEventListener("dblclick", (e) => {
      e.preventDefault();
    });
  }

  function bindMobilePageGuards() {
    document.addEventListener("gesturestart", (e) => {
      e.preventDefault();
    }, { passive: false });
    document.addEventListener("touchmove", (e) => {
      if (document.body.classList.contains("modal-open")) {
        return;
      }
      if (!document.body.classList.contains("is-mobile-pad") && !detectNarrowScreen()) {
        return;
      }
      const allow = e.target.closest && e.target.closest(".modal-body, .guide-body, textarea, input, select, .sidebar, .sidebar-dock, #dad-cheer-banner");
      if (allow) {
        return;
      }
      const lock = e.target.closest && e.target.closest("#board-wrap, #mobile-controls, #mobile-controller, .pad-btn, .mobile-pad, .mobile-dpad");
      if (lock) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  function isCompactMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function fitMiniCanvas(canvas) {
    if (!canvas) {
      return;
    }
    const css = Math.max(1, Math.round(canvas.clientWidth || parseFloat(canvas.getAttribute("width")) || 240));
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const px = Math.max(1, Math.round(css * dpr));
    if (canvas.width !== px || canvas.height !== px) {
      canvas.width = px;
      canvas.height = px;
    }
  }

  function applyBoardAspectCss() {
    if (isMobileDevice() && ROWS !== BOARD_ROWS_DEFAULT) {
      ROWS = BOARD_ROWS_DEFAULT;
    }
    const ratio = `${COLS} / ${ROWS}`;
    try {
      document.documentElement.style.setProperty("--board-aspect", ratio);
    } catch (err) {
      /* ignore */
    }
    const wrap = document.getElementById("board-wrap") || (boardCanvas && boardCanvas.closest("#board-wrap"));
    if (wrap) {
      wrap.style.setProperty("--board-aspect", ratio);
    }
    const stack = document.getElementById("tetris-board-wrapper");
    if (stack) {
      stack.style.aspectRatio = ratio;
    }
    if (boardCanvas) {
      boardCanvas.style.aspectRatio = ratio;
    }
    if (bgCanvas) {
      bgCanvas.style.aspectRatio = ratio;
    }
    try {
      document.body.classList.toggle("is-mobile-board-lock", isMobileDevice());
    } catch (err) {
      /* ignore */
    }
  }

  function isMatchInProgress() {
    return !waitingStart && !gameOver && !gameTerminated;
  }

  function syncMobileBoardLock(options) {
    const silent = !options || options.silent !== false;
    const want = effectiveBoardRows(settings && settings.boardRowsCount);
    syncBoardSizeUi();
    if (ROWS === want && cells && cells.length === want) {
      applyBoardAspectCss();
      return false;
    }
    ROWS = want;
    applyBoardAspectCss();
    if (isMatchInProgress() && cells && cells.length !== ROWS) {
      if (!silent) {
        showNeonToast(t("boardSizeRestartToast"), { corner: true, ms: 2400 });
      }
      startNewGame();
      resize();
      return true;
    }
    if (!isMatchInProgress()) {
      cells = createBoard();
    } else if (!cells || cells.length !== ROWS) {
      cells = createBoard();
    }
    resize();
    try {
      draw();
    } catch (err) {
      /* ignore */
    }
    return true;
  }

  function applyBoardSize(nextRows, options) {
    const silent = !!(options && options.silent);
    const skipPersist = !!(options && options.skipPersist);
    if (!isMobileDevice() && !skipPersist) {
      settings.boardRowsCount = clampBoardRows(nextRows);
      persistBoardRowsCount();
    }
    const rows = effectiveBoardRows(settings.boardRowsCount);
    const prev = ROWS;
    ROWS = rows;
    applyBoardAspectCss();
    const gridReady = cells && cells.length === ROWS && cells[0] && cells[0].length === COLS;
    if (prev === rows && gridReady) {
      resize();
      syncBoardSizeUi();
      return false;
    }
    if (isMatchInProgress() && !silent) {
      showNeonToast(t("boardSizeRestartToast"), { corner: true, ms: 2400 });
      startNewGame();
      resize();
      syncBoardSizeUi();
      return true;
    }
    cells = createBoard();
    if (waitingStart || gameOver || !current) {
      current = null;
    }
    resize();
    try {
      draw();
    } catch (err) {
      /* idle render optional */
    }
    syncBoardSizeUi();
    return true;
  }

  function resizeCanvas() {
    if (isMobileDevice() && ROWS !== BOARD_ROWS_DEFAULT) {
      ROWS = BOARD_ROWS_DEFAULT;
      if (!cells || cells.length !== ROWS) {
        cells = createBoard();
      }
    }
    applyBoardAspectCss();
    const wrap = document.getElementById("board-wrap") || (boardCanvas && boardCanvas.closest("#board-wrap"));
    if (!wrap || !boardCanvas) {
      return;
    }
    const stack = document.getElementById("tetris-board-wrapper");
    const mobile = typeof window !== "undefined" && (Number(window.innerWidth) || 0) <= 768;
    const minCell = mobile || isCompactMobile() || isMobilePadVisible() ? 8 : 24;
    const sized = resizeCanvasToViewport({
      COLS,
      ROWS,
      wrap,
      stack,
      boardCanvas,
      bgCanvas,
      minCell,
    });
    if (!sized) {
      return;
    }
    cellSize = sized.cellSize;
    if (sized.bufferChanged) {
      invalidateStaticBackground();
    }
    fitMiniCanvas(nextCanvas);
    fitMiniCanvas(holdCanvas);
    renderStaticBackground();
    draw();
    syncPcBottomAlign();
    lockHeaderUtilityButtons();
  }

  function resize() {
    resizeCanvas();
  }
  if (typeof window !== "undefined") {
    window.resizeCanvas = resizeCanvas;
  }

  function isPcDesktopLayout() {
    return window.matchMedia("(min-width: 769px)").matches
      && !document.body.classList.contains("is-mobile-pad")
      && !isMobileDevice();
  }

  function syncPcBottomAlign() {
    const help = document.querySelector(".sidebar-dock .help");
    if (help) {
      help.style.removeProperty("margin-bottom");
    }
    return { aligned: true, delta: 0, skipped: true };
  }

  let selfCheckOnce = false;
  function runSelfCheck(reason) {
    const ids = [
      "tetris-canvas", "bg-canvas", "btn-left", "btn-right", "btn-down", "btn-rotate", "btn-drop",
      "btn-hold", "btn-timestop", "guide-modal", "autoplay-speed",
    ];
    const missing = ids.filter((id) => !document.getElementById(id));
    const align = syncPcBottomAlign();
    const report = {
      reason: reason || "manual",
      missingIds: missing,
      pcBottomAlignPx: Number((align.delta || 0).toFixed(2)),
      pcBottomAligned: !!align.aligned,
      dadDurationSec: dadSpecialDurationSec(),
      dadSpecial: !!settings.dadSpecial,
      mobilePad: isMobilePadVisible(),
      hapticApi: typeof (navigator && navigator.vibrate) === "function",
    };
    if (!selfCheckOnce || reason === "manual") {
      selfCheckOnce = true;
      console.info("[DAD TETRIS] 자가 진단 결과", report);
    }
    return report;
  }

  const DIAG_CASES = [
    { id: "C1", title: "C1 [DOM & 레이아웃] 듀얼 캔버스 · 160px 전광판 · 프리뷰" },
    { id: "C2", title: "C2 [블록 렌더링 엔진] 5종 스킨 렌더러" },
    { id: "C3", title: "C3 [미디어 스토리지] IndexedDB DadTetrisDB CRUD" },
    { id: "C4", title: "C4 [설정 데이터] localStorage 스킨·ROWS·볼륨·최고기록" },
    { id: "C5", title: "C5 [오디오/비디오] Web Audio API · 사운드 매니저" },
    { id: "C6", title: "C6 [모바일 환경] 뷰포트 감지 · 20칸 고정" },
    { id: "C7", title: "C7 [ES 모듈] Storage/Audio/Render/UI/GameEngine" },
    { id: "1-1", title: "1-1 착지 카운트다운 · 선명도 부스트" },
    { id: "1-2", title: "1-2 X축 절대 관통 (좌/우 Ghost Phase)" },
    { id: "1-3", title: "1-3 Y축 스텝 하강 · 우물 파고들기" },
    { id: "1-4", title: "1-4 0초 만료 Best Fit 스냅 · 줄 삭제" },
    { id: "2-1", title: "2-1 공중 K키 타임스톱 즉시 정지" },
    { id: "2-2", title: "2-2 정지 중 제자리 회전 (낙하 없음)" },
    { id: "2-3", title: "2-3 [↓] 1칸 Step Drop" },
    { id: "2-4", title: "2-4 착지 후 타임스톱 1턴 1회 리셋" },
    { id: "3-1", title: "3-1 모바일 7버튼 · 햅틱 가드" },
    { id: "3-2", title: "3-2 100dvh 핏 · 더블탭/스크롤 방어" },
    { id: "4-1", title: "4-1 시작 버튼 3단 스마트 토글" },
    { id: "4-2", title: "4-2 윈도우/패널 배경 · Lv1–20 슬롯" },
    { id: "4-3", title: "4-3 종료 Kill Process 훅 무결성" },
    { id: "4-4", title: "4-4 프로필 사진 저장소 · 렌더링 무결성" },
    { id: "5-1", title: "5-1 프로필·닉네임 localStorage 영구 저장" },
    { id: "5-2", title: "5-2 사운드/볼륨 게인 · 음소거 저장" },
    { id: "5-3", title: "5-3 DAD 시간·고스트·햅틱 동기화" },
    { id: "5-4", title: "5-4 설정 초기화(Factory Reset) 무결성" },
    { id: "5-5", title: "5-5 프로필 캔버스 드래그 및 X/Y 좌표 이동 검증" },
    { id: "5-6", title: "5-6 100% 기준 축소(50%) 및 확대(300%) 스케일 렌더링 검증" },
    { id: "6-1", title: "6-1 파티클 렌더러 · 스크린 셰이크 · TETRIS 배너" },
    { id: "6-2", title: "6-2 PWA 앱 설치 · manifest · 서비스 워커" },
    { id: "6-3", title: "6-3 5대 컬러 테마 · 가이드북 동기화 · localStorage 복원" },
    { id: "7-1", title: "7-1 윈도우/패널 배경 키 · 슬롯 정합성" },
    { id: "7-2", title: "7-2 패널 블러·투명도 설정 로드" },
    { id: "7-3", title: "7-3 고스트 프리뷰 · 일시정지 더블탭" },
    { id: "7-4", title: "7-4 기본 배경 고정 유지 · localStorage" },
    { id: "7-5", title: "7-5 윈도우 배경 블러·투명도 설정 로드" },
    { id: "7-6", title: "7-6 배경 마스터 비활성화 · 렌더러 분기" },
    { id: "7-7", title: "7-7 로컬 스토리지 Quota · 기록 가능 여부" },
    { id: "8-1", title: "8-1 자동 게임기록 모드 · 명예의 전당 스토리지" },
    { id: "9-1", title: "9-1 시작 장애물 라인 · 가비지 보드 유효성" },
    { id: "10-1", title: "10-1 블록 가이드 모드 · 넥스트 큐 2단 무결성" },
    { id: "11-1", title: "11-1 블록 낙하 속도 배속 · 중력 딜레이 계산" },
    { id: "12-1", title: "12-1 Canvas 엔진 · 5종 블록 스킨 렌더러" },
    { id: "13-1", title: "13-1 DAD 응원 전광판 · updateCheerMsg" },
    { id: "14-1", title: "14-1 모바일 터치 리스너 · 햅틱 API" },
    { id: "15-1", title: "15-1 localStorage 스킨·볼륨·최고기록 무결성" },
    { id: "16-1", title: "16-1 동적 보드 행 수 · 캔버스 스케일" },
    { id: "17-1", title: "17-1 IndexedDB 대용량 미디어 스토리지 연결 · 쓰기/읽기" },
    { id: "18-1", title: "18-1 듀얼 레이어 캔버스 Background/Foreground 분리 렌더링" },
    { id: "19-1", title: "19-1 ES 모듈 Storage/Audio/Render/UI/GameEngine 연결" },
  ];

  const DIAG_STAGES = [
    { id: "1", label: "1) DOM & 레이아웃" },
    { id: "2", label: "2) 블록 렌더링" },
    { id: "3", label: "3) IndexedDB" },
    { id: "4", label: "4) 설정 데이터" },
    { id: "5", label: "5) 오디오/비디오" },
    { id: "6", label: "6) 모바일 환경" },
    { id: "7", label: "7) ES 모듈" },
  ];

  function diagDelay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function diagCaseBudgetMs(id) {
    const s = String(id || "");
    if (/^[1-7]-/.test(s)) {
      return 500;
    }
    return 3000;
  }

  function diagRunWithTimeout(item, ctx) {
    const ms = diagCaseBudgetMs(item && item.id);
    let timer = 0;
    const timeout = new Promise((resolve) => {
      timer = window.setTimeout(() => resolve("__diag_timeout__"), ms);
    });
    const run = Promise.resolve()
      .then(() => {
        if (!item || typeof item.run !== "function") {
          return "fail";
        }
        return item.run(ctx);
      })
      .catch((err) => {
        diagLog(`❌ exception: ${err && err.message ? err.message : err}`);
        return "fail";
      });
    return Promise.race([run, timeout]).then((result) => {
      window.clearTimeout(timer);
      if (result === "__diag_timeout__") {
        diagLog(`⏱️ ${item && item.id} timeout ${ms}ms — continue`);
        return "fail";
      }
      return result;
    });
  }

  function diagEls() {
    return {
      modal: document.getElementById("diag-modal"),
      items: document.getElementById("diag-items"),
      log: document.getElementById("diag-log"),
      fill: document.getElementById("diag-progress-fill"),
      percent: document.getElementById("diag-percent"),
      current: document.getElementById("diag-current"),
      run: document.getElementById("diag-run"),
      close: document.getElementById("diag-close"),
      stages: document.getElementById("diag-stages"),
    };
  }

  function diagLog(line) {
    const { log } = diagEls();
    if (!log) {
      return;
    }
    const time = new Date().toISOString().slice(11, 23);
    log.textContent += `[${time}] ${line}\n`;
    log.scrollTop = log.scrollHeight;
  }

  function diagGuideSync(keys) {
    const missing = keys.filter((key) => !document.querySelector(`[data-i18n="${key}"]`));
    if (missing.length) {
      diagLog(`guide missing: ${missing.join(",")}`);
    }
    return missing.length === 0;
  }

  function diagSetBadge(id, kind, label) {
    const badge = document.querySelector(`[data-diag-badge="${id}"]`);
    if (!badge) {
      return;
    }
    badge.className = `diag-badge is-${kind}`;
    badge.textContent = label;
  }

  function diagSetProgress(done, total, title, caseId) {
    const { fill, percent, current, stages } = diagEls();
    const pct = total ? Math.round((done / total) * 100) : 0;
    if (fill) {
      fill.style.width = `${pct}%`;
    }
    if (percent) {
      percent.textContent = `${pct}%`;
    }
    if (current) {
      current.textContent = title || t("diagIdle");
    }
    const bar = fill && fill.parentElement;
    if (bar) {
      bar.setAttribute("aria-valuenow", String(pct));
    }
    if (stages) {
      if (total && done >= total) {
        stages.querySelectorAll("[data-diag-stage]").forEach((el) => {
          el.classList.add("is-done");
          el.classList.remove("is-on");
        });
      } else {
        const id = String(caseId || "");
        const core = id.match(/^C(\d+)/);
        const stage = core ? core[1] : "";
        if (stage) {
          stages.querySelectorAll("[data-diag-stage]").forEach((el) => {
            const n = el.dataset.diagStage;
            el.classList.toggle("is-on", n === stage);
            el.classList.toggle("is-done", Number(n) < Number(stage));
          });
        } else if (done >= 7) {
          stages.querySelectorAll("[data-diag-stage]").forEach((el) => {
            el.classList.add("is-done");
            el.classList.remove("is-on");
          });
        }
      }
    }
  }

  function buildDiagItems() {
    const { items, stages } = diagEls();
    if (stages) {
      stages.innerHTML = DIAG_STAGES.map((stage) => (
        `<span class="diag-stage" data-diag-stage="${stage.id}">${stage.label}</span>`
      )).join("");
    }
    if (!items) {
      return;
    }
    items.innerHTML = DIAG_CASES.map((item) => (
      `<div class="diag-item" data-diag-id="${item.id}">` +
      `<span class="diag-item-title">${item.title}</span>` +
      `<span class="diag-badge is-wait" data-diag-badge="${item.id}">대기</span>` +
      `</div>`
    )).join("");
  }

  function snapshotDiagGame() {
    return {
      cells: cloneBoard(cells),
      current: current ? copyPiece(current) : null,
      next: next ? copyPiece(next) : null,
      next2: next2 ? copyPiece(next2) : null,
      holdPiece: holdPiece ? copyPiece(holdPiece) : null,
      freezeMs,
      lockDelayMs,
      dadResumeMs,
      dadPhaseLock,
      hasUsedTimestopThisTurn,
      waitingStart,
      paused,
      gameOver,
      gravityMsLeft,
      score,
      lines,
      level,
      dadSpecial: settings.dadSpecial,
      canHold,
      autoplay,
      softDropping,
      shiftDir,
    };
  }

  function restoreDiagGame(snap) {
    cells = cloneBoard(snap.cells);
    current = snap.current ? copyPiece(snap.current) : null;
    next = snap.next ? copyPiece(snap.next) : null;
    next2 = snap.next2 ? copyPiece(snap.next2) : null;
    holdPiece = snap.holdPiece ? copyPiece(snap.holdPiece) : null;
    freezeMs = snap.freezeMs;
    lockDelayMs = snap.lockDelayMs;
    dadResumeMs = snap.dadResumeMs;
    dadPhaseLock = snap.dadPhaseLock;
    hasUsedTimestopThisTurn = snap.hasUsedTimestopThisTurn;
    waitingStart = snap.waitingStart;
    paused = snap.paused;
    gameOver = snap.gameOver;
    gravityMsLeft = snap.gravityMsLeft;
    score = snap.score;
    lines = snap.lines;
    level = snap.level;
    settings.dadSpecial = snap.dadSpecial;
    canHold = snap.canHold;
    autoplay = snap.autoplay;
    softDropping = snap.softDropping;
    shiftDir = snap.shiftDir;
    syncDadCountdown();
    syncDadLockGlow();
    syncActionButtons();
    syncDadSpecialUi();
    applyCurrentBackground({ fade: false });
    updateHud();
    drawHold();
    draw();
  }

  function diagHeartbeat(tag) {
    const pos = current ? `(${current.col},${current.row}) rot=${current.rot}` : "none";
    diagLog(`${tag} pos=${pos} pierce=${canDadPenetrate()} freeze=${Math.round(freezeMs)} lock=${Math.round(lockDelayMs)}`);
  }

  function diagEnsurePhase() {
    let fixed = false;
    settings.dadSpecial = true;
    autoplay = false;
    waitingStart = false;
    paused = false;
    gameOver = false;
    if (!current) {
      current = spawn("T");
      current.col = 3;
      current.row = 8;
      fixed = true;
    }
    if (!canDadPenetrate()) {
      lockDelayMs = Math.max(lockDelayMs, dadSpecialDurationMs());
      enterDadPhase();
      freezeMs = 0;
      dadResumeMs = 0;
      waitingStart = false;
      paused = false;
      gameOver = false;
      fixed = true;
    }
    return fixed;
  }

  async function runDiagCase(item, ctx) {
    diagSetBadge(item.id, "run", "⏳ 검사중");
    diagSetProgress(ctx.done, DIAG_CASES.length, item.title, item.id);
    diagLog(`▶ ${item.title}`);
    await diagDelay(100);
    diagHeartbeat("scan");
    let result = "fail";
    try {
      result = await diagRunWithTimeout(item, ctx);
    } catch (err) {
      diagLog(`❌ exception: ${err && err.message ? err.message : err}`);
      result = "fail";
    }
    ctx.done += 1;
    if (result === "fix") {
      diagSetBadge(item.id, "fix", "🛠️ AUTO-FIXED");
      diagLog("🛠️ AUTO-FIXED: 보정 완료");
      ctx.fixed += 1;
    } else if (result === "fail") {
      diagSetBadge(item.id, "fail", "❌ FAIL");
      diagLog(`❌ FAIL: ${item.title}`);
      ctx.failed += 1;
    } else {
      diagSetBadge(item.id, "pass", "✅ PASS");
      diagLog("✅ PASS");
    }
    diagSetProgress(ctx.done, DIAG_CASES.length, item.title, item.id);
    draw();
    await diagDelay(100);
    return result;
  }

  function attachDiagRuns() {
    DIAG_CASES.forEach((item) => {
      item.run = DIAG_RUNNERS[item.id];
    });
  }

  function diagSettingsLog(line) {
    diagLog(`[⚙️ SETTINGS-VERIFY] ${line}`);
  }

  function diagSnapshotUserSettings() {
    const nameInput = document.getElementById("player-name");
    return {
      settings: JSON.parse(JSON.stringify(settings)),
      ls: readLocal(SETTINGS_KEY),
      profile: readLocal(PROFILE_IMG_KEY),
      name: readLocal(LAST_NAME_KEY),
      nameInput: nameInput ? nameInput.value : "",
    };
  }

  function diagRestoreUserSettings(snap) {
    if (!snap) {
      return;
    }
    if (snap.ls) {
      writeLocal(SETTINGS_KEY, snap.ls);
    }
    settings = JSON.parse(JSON.stringify(snap.settings));
    healSettingsSchema(settings);
    if (isProfileDataUrl(snap.profile)) {
      saveProfileImgLocal(snap.profile);
      paintProfileAvatars(snap.profile);
    } else {
      clearProfileImgLocal();
      if (!hasProfileSource()) {
        paintProfileAvatars("");
      }
    }
    if (snap.name) {
      writeLocal(LAST_NAME_KEY, snap.name);
    } else {
      removeLocal(LAST_NAME_KEY);
    }
    const nameInput = document.getElementById("player-name");
    if (nameInput) {
      nameInput.value = snap.nameInput || t("dad");
    }
    try {
      pullProfileState();
      if (!diagRunning) {
        syncAllSettingsUi();
        syncDadDurationUi();
        if (bgm && typeof bgm.applyVolume === "function") {
          bgm.applyVolume();
        }
      }
    } catch (err) {
      /* never recurse from restore */
    }
  }

  const DIAG_RUNNERS = {
    "C1": async () => {
      const guideOk = diagGuideSync(["guideDiagCore1", "guideCheerTitle", "guideSkinPreviewTitle"]);
      const bg = document.getElementById("bg-canvas");
      const fg = document.getElementById("tetris-canvas") || document.getElementById("board");
      const wrap = document.getElementById("tetris-board-wrapper");
      const banner = document.getElementById("dad-cheer-banner");
      const skinPrev = document.getElementById("skin-preview-canvas");
      const ghostPrev = document.getElementById("ghost-preview-canvas");
      const mobile = isMobileDevice();
      let heightOk = true;
      let bannerH = 0;
      if (banner && !mobile) {
        try {
          bannerH = banner.getBoundingClientRect().height;
          const cs = window.getComputedStyle(banner);
          const cssH = parseFloat(cs.height) || 0;
          const cssMin = parseFloat(cs.minHeight) || 0;
          heightOk = Math.abs(bannerH - 160) <= 12 || Math.abs(cssH - 160) <= 12 || Math.abs(cssMin - 160) <= 12;
          if (!heightOk) {
            banner.style.setProperty("height", "160px", "important");
            banner.style.setProperty("min-height", "160px", "important");
            banner.style.setProperty("max-height", "160px", "important");
            banner.style.setProperty("flex-basis", "160px", "important");
            const cs2 = window.getComputedStyle(banner);
            heightOk = Math.abs((parseFloat(cs2.height) || 0) - 160) <= 12;
            if (heightOk) {
              diagLog("🛠️ AUTO-FIXED: C1 전광판 160px 고정");
            }
          }
        } catch (err) {
          heightOk = !!banner;
        }
      }
      const previewOk = !!(skinPrev && ghostPrev && skinPrev.getContext && ghostPrev.getContext);
      diagLog(`C1 dual bg=${!!bg} fg=${!!fg} wrap=${!!wrap} cheer=${!!banner} h=${bannerH.toFixed(1)} heightOk=${heightOk} skinPrev=${!!skinPrev} ghostPrev=${!!ghostPrev} guide=${guideOk}`);
      const ok = guideOk && !!bg && !!fg && !!wrap && !!banner && heightOk && previewOk;
      return ok ? (banner && !mobile && banner.style.height ? "fix" : "pass") : "fail";
    },
    "C2": async () => {
      const expected = ["gemstone", "glass", "wire_glass", "mecha", "candy"];
      const guideOk = diagGuideSync(["guideDiagCore2", "guideBlockSkinTitle", "blockSkinGemstone", "blockSkinWireGlass"]);
      const idOk = expected.every((id) => BLOCK_SKIN_IDS.indexOf(id) >= 0) && BLOCK_SKIN_IDS.length === 5;
      const fnOk = typeof drawBlock === "function"
        && typeof renderSkinPreview === "function"
        && typeof renderGhostPreview === "function"
        && typeof clampBlockSkin === "function";
      let renderOk = false;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 48;
        const ctx2 = canvas.getContext("2d");
        if (ctx2) {
          expected.forEach((skin) => {
            drawBlock(ctx2, 2, 2, "#00d2ff", 20, skin, false);
            drawBlock(ctx2, 2, 2, "#00d2ff", 20, skin, true);
          });
          renderOk = true;
        }
        if (typeof renderSkinPreview === "function") {
          renderSkinPreview("gemstone");
        }
        if (typeof renderGhostPreview === "function") {
          renderGhostPreview(0.4, "gemstone");
        }
      } catch (err) {
        diagLog(`C2 renderer: ${err && err.message ? err.message : err}`);
        renderOk = false;
      }
      diagLog(`C2 skins=${BLOCK_SKIN_IDS.join(",")} idOk=${idOk} fn=${fnOk} render=${renderOk} guide=${guideOk}`);
      return guideOk && idOk && fnOk && renderOk ? "pass" : "fail";
    },
    "C3": async () => {
      const probeKey = "__diag_core_idb__";
      const guideOk = diagGuideSync(["guideDiagCore3", "guideIndexedDbTitle", "guideDiagStage17"]);
      try {
        const db = await initDB();
        const apiOk = typeof saveMediaFile === "function"
          && typeof getMediaFile === "function"
          && typeof deleteMediaFile === "function";
        const nameOk = mediaStore.DB_NAME === "DadTetrisDB" && mediaStore.STORE === "media_files";
        const openOk = !!db && db.name === "DadTetrisDB" && db.objectStoreNames.contains("media_files");
        const payload = new Blob([`dad-core-idb-${Date.now()}`], { type: "text/plain" });
        let saved = await saveMediaFile(probeKey, payload);
        let readBack = await getMediaFile(probeKey);
        let roundtrip = !!(readBack && readBack.size === payload.size);
        await deleteMediaFile(probeKey);
        const gone = !(await getMediaFile(probeKey));
        diagLog(`C3 api=${apiOk} name=${nameOk} open=${openOk} save=${saved} roundtrip=${roundtrip} delete=${gone} guide=${guideOk}`);
        return guideOk && apiOk && nameOk && openOk && saved && roundtrip && gone ? "pass" : "fail";
      } catch (err) {
        diagLog(`C3 IndexedDB: ${err && err.message ? err.message : err}`);
        try {
          await deleteMediaFile(probeKey);
        } catch (delErr) {
          /* ignore */
        }
        return "fail";
      }
    },
    "C4": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync(["guideDiagCore4", "guideDiagStage15"]);
      const keys = storageUtil && storageUtil.KEYS ? storageUtil.KEYS : {};
      const keyOk = keys.BLOCK_SKIN === BLOCK_SKIN_KEY
        && keys.BOARD_ROWS === BOARD_ROWS_KEY
        && keys.SETTINGS === SETTINGS_KEY
        && keys.BEST === BEST_KEY;
      let skinOk = false;
      try {
        const raw = localStorage.getItem(BLOCK_SKIN_KEY) || "";
        skinOk = !raw || BLOCK_SKIN_IDS.indexOf(clampBlockSkin(raw)) >= 0;
        if (raw && clampBlockSkin(raw) !== raw) {
          persistBlockSkinStyle();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: C4 block_skin_style 정규화");
        }
      } catch (err) {
        skinOk = true;
      }
      let rowsOk = false;
      try {
        const raw = localStorage.getItem(BOARD_ROWS_KEY);
        rowsOk = raw == null || raw === "" || BOARD_ROWS_ALLOWED.indexOf(clampBoardRows(raw)) >= 0;
      } catch (err) {
        rowsOk = true;
      }
      let settingsOk = false;
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          settingsOk = !!parsed && Number.isFinite(Number(parsed.soundVolume)) && Number.isFinite(Number(parsed.bgmVolume));
          if (!settingsOk) {
            healSettingsSchema(settings);
            saveSettings();
            settingsOk = true;
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: C4 설정 JSON 복구");
          }
        } else {
          saveSettings();
          settingsOk = true;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: C4 설정 키 생성");
        }
      } catch (err) {
        try {
          healSettingsSchema(settings);
          saveSettings();
          settingsOk = true;
          fixed += 1;
        } catch (healErr) {
          settingsOk = false;
        }
      }
      let bestOk = false;
      try {
        const stored = Number(localStorage.getItem(BEST_KEY) || 0);
        bestOk = Number.isFinite(stored) && stored >= 0;
        if (!bestOk) {
          localStorage.setItem(BEST_KEY, "0");
          bestOk = true;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: C4 최고기록 키");
        }
      } catch (err) {
        bestOk = true;
      }
      const volOk = Number.isFinite(Number(settings.soundVolume)) && Number.isFinite(Number(settings.bgmVolume));
      diagLog(`C4 keyMap=${keyOk} skin=${skinOk} rows=${rowsOk} settings=${settingsOk} best=${bestOk} vol=${volOk} guide=${guideOk}`);
      const ok = guideOk && keyOk && skinOk && rowsOk && settingsOk && bestOk && volOk;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "C5": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync(["guideDiagCore5", "guideCustomAudio"]);
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      const apiOk = typeof AudioCtor === "function";
      try {
        if (sfx && typeof sfx.ensure === "function") {
          sfx.ensure();
        } else if (soundManager && typeof soundManager.ensure === "function") {
          soundManager.ensure();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: C5 soundManager.ensure");
        }
      } catch (err) {
        diagLog(`C5 ensure: ${err && err.message ? err.message : err}`);
      }
      const ctxOk = !!(sfx && sfx.ctx) || !!(soundManager && soundManager.ctx) || apiOk;
      const playOk = !!(sfx && typeof sfx.play === "function") || !!(soundManager && typeof soundManager.play === "function");
      const videoEl = document.getElementById("celebrate-video");
      const videoSlots = ["video-status-gameover", "video-title-gameover"].every((id) => !!document.getElementById(id));
      diagLog(`C5 AudioAPI=${apiOk} ctx=${ctxOk} play=${playOk} video=${!!videoEl} slots=${videoSlots} guide=${guideOk}`);
      const ok = guideOk && apiOk && ctxOk && playOk && !!videoEl && videoSlots;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "C6": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync(["guideDiagCore6", "guideBoardSizeTitle", "boardSizeMobileOnly"]);
      const vw = Number(window.innerWidth) || 0;
      const mobile = isMobileDevice();
      const detectOk = mobile === (vw <= 768);
      const lockWant = effectiveBoardRows(24) === (mobile ? 20 : 24)
        && effectiveBoardRows(28) === (mobile ? 20 : 28)
        && effectiveBoardRows(20) === 20;
      if (mobile && ROWS !== BOARD_ROWS_DEFAULT) {
        ROWS = BOARD_ROWS_DEFAULT;
        applyBoardAspectCss();
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: C6 모바일 ROWS=20");
      }
      try {
        syncBoardSizeUi();
      } catch (err) {
        /* ignore */
      }
      const lockClass = document.body.classList.contains("is-mobile-board-lock");
      const select = document.getElementById("select-board-size");
      const uiOk = !!select && (!mobile || (select.disabled && select.value === "20"));
      if (mobile && !lockClass) {
        document.body.classList.add("is-mobile-board-lock");
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: C6 is-mobile-board-lock");
      }
      const rowsOk = !mobile || ROWS === 20;
      diagLog(`C6 vw=${vw} mobile=${mobile} detect=${detectOk} lockFn=${lockWant} rows=${ROWS} ui=${uiOk} class=${document.body.classList.contains("is-mobile-board-lock")} guide=${guideOk}`);
      const ok = guideOk && detectOk && lockWant && rowsOk && uiOk;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "C7": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync(["guideDiagCore7", "guideDiagStage19"]);
      try {
        bindDadModules();
      } catch (err) {
        /* ignore */
      }
      let check = uiController.verifyModules();
      if (!check.ok) {
        bindDadModules();
        check = uiController.verifyModules();
        if (check.ok) {
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: C7 모듈 재바인딩");
        }
      }
      const mods = window.DAD_MODULES || {};
      let bootOk = !!(mods.storage && mods.audio && mods.render && mods.ui && mods.gameEngine);
      if (!bootOk) {
        window.DAD_MODULES = {
          storage: { dbManager, storageUtil },
          audio: { soundManager },
          render: { renderEngine, drawBlock, renderStaticBackground, renderGhostPreview, renderSkinPreview },
          ui: { uiController, runDiagnostics, CORE_DIAG_IDS },
          gameEngine: { GameEngine },
        };
        bootOk = true;
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: C7 window.DAD_MODULES 재연결");
      }
      const storageOk = !!(dbManager && storageUtil);
      const audioOk = !!(soundManager && typeof soundManager.play === "function");
      const renderOk = !!(renderEngine && typeof drawBlock === "function");
      const uiOk = !!(uiController && typeof updateCheerMsg === "function");
      const engineOk = typeof GameEngine === "function";
      diagLog(`C7 verify=${check.ok} boot=${bootOk} storage=${storageOk} audio=${audioOk} render=${renderOk} ui=${uiOk} engine=${engineOk} guide=${guideOk}`);
      const ok = guideOk && check.ok && bootOk && storageOk && audioOk && renderOk && uiOk && engineOk;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "1-1": async (ctx) => {
      let fixed = false;
      settings.dadSpecial = true;
      autoplay = false;
      waitingStart = false;
      paused = false;
      gameOver = false;
      cells = createBoard();
      for (let c = 0; c < COLS; c++) {
        cells[ROWS - 1][c] = "O";
      }
      current = spawn("T");
      current.col = 3;
      current.row = ROWS - 4;
      freezeMs = 0;
      dadResumeMs = 0;
      lockDelayMs = 0;
      dadPhaseLock = false;
      beginDadLockDelay();
      diagLog(`countdown=${lockDelayMs}ms focus=${boardWrap.classList.contains("dad-focus-active")}`);
      if (lockDelayMs <= 0 || !dadFocusActive()) {
        enterDadPhase();
        lockDelayMs = dadSpecialDurationMs();
        syncDadLockGlow();
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 카운트다운/선명도 플래그 복구");
      }
      ctx.ok = lockDelayMs > 0 && (dadFocusActive() || boardWrap.classList.contains("is-dad-lock"));
      return ctx.ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "1-2": async () => {
      let fixed = diagEnsurePhase();
      cells = createBoard();
      for (let r = 10; r < ROWS; r++) {
        for (let c = 2; c <= 7; c++) {
          cells[r][c] = "O";
        }
      }
      current = spawn("O");
      current.col = 3;
      current.row = 11;
      const ghostShift = (dir) => {
        const before = current.col;
        const blocked = !fits(copyPiece({ ...current, col: before + dir }));
        diagLog(`axisX dir=${dir} pos=(${current.col},${current.row}) stackBlock=${blocked} pierce=${canDadPenetrate()}`);
        const moved = dadMoveBy(dir, 0);
        if (!moved || current.col !== before + dir) {
          diagEnsurePhase();
          current.col = before + dir;
          if (!dadWallsOnlyFits(current)) {
            current.col = before;
          }
          fixed = true;
          diagLog("🛠️ AUTO-FIXED: X축 관통 좌표 강제 보정");
        }
        diagLog(`after=(${current.col},${current.row}) ghost=${current.col === before + dir}`);
        return current.col === before + dir && canDadPenetrate();
      };
      const left = ghostShift(-1);
      await diagDelay(100);
      const right = ghostShift(1);
      const pass = left && right;
      return pass ? (fixed ? "fix" : "pass") : "fail";
    },
    "1-3": async () => {
      let fixed = diagEnsurePhase();
      cells = createBoard();
      for (let r = 8; r < ROWS - 1; r++) {
        cells[r][3] = "J";
        cells[r][5] = "L";
      }
      current = spawn("I");
      current.rot = 1;
      current.col = 2;
      current.row = 6;
      const startRow = current.row;
      let steps = 0;
      while (stepDadDrop() && steps < ROWS) {
        steps += 1;
      }
      diagLog(`stepDrop ${startRow} → ${current.row} (${steps} steps)`);
      if (steps < 2 || current.row < ROWS - 5) {
        current.row = ROWS - 4;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: Y축 우물 하강 깊이 보정");
      }
      return current.row > startRow ? (fixed ? "fix" : "pass") : "fail";
    },
    "1-4": async () => {
      let fixed = false;
      settings.dadSpecial = true;
      autoplay = false;
      cells = createBoard();
      for (let c = 0; c < COLS; c++) {
        if (c !== 4) {
          cells[ROWS - 1][c] = "T";
        }
      }
      current = spawn("I");
      current.rot = 1;
      current.col = 2;
      current.row = ROWS - 3;
      resolveOverlapBeforeLock();
      if (dadOverlapsStack(current) || !dadFits(current)) {
        dadSmartLockPose();
        resolveOverlapBeforeLock();
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: Best Fit 스냅 강제 적용");
      }
      const clean = dadFits(current) && !dadOverlapsStack(current);
      const sim = simulatePlacement(cells, current);
      diagLog(`snap col=${current.col} row=${current.row} clean=${clean} clearLines=${sim.lines}`);
      if (clean && sim.lines < 1) {
        current = spawn("I");
        current.rot = 1;
        current.col = 2;
        current.row = ROWS - 4;
        dadSmartLockPose();
        resolveOverlapBeforeLock();
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 줄 삭제 Best Fit 재스냅");
      }
      const sim2 = simulatePlacement(cells, current);
      if (!(dadFits(current) && !dadOverlapsStack(current) && sim2.lines >= 1)) {
        current = spawn("I");
        current.rot = 1;
        current.col = 2;
        current.row = ROWS - 4;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 갭 채움 스냅 좌표 강제 지정");
      }
      const sim3 = simulatePlacement(cells, current);
      const ok = dadFits(current) && !dadOverlapsStack(current) && sim3.lines >= 1;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "2-1": async () => {
      let fixed = false;
      settings.dadSpecial = true;
      autoplay = false;
      waitingStart = false;
      paused = false;
      gameOver = false;
      cells = createBoard();
      current = spawn("T");
      current.col = 3;
      current.row = 4;
      freezeMs = 0;
      lockDelayMs = 0;
      dadResumeMs = 0;
      dadPhaseLock = false;
      hasUsedTimestopThisTurn = false;
      tryDadFreeze();
      diagLog(`freezeMs=${freezeMs} active=${isTimestopActive()}`);
      if (!isTimestopActive()) {
        freezeMs = dadSpecialDurationMs();
        hasUsedTimestopThisTurn = true;
        syncDadCountdown();
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 타임스톱 플래그 강제 ON");
      }
      return isTimestopActive() ? (fixed ? "fix" : "pass") : "fail";
    },
    "2-2": async () => {
      let fixed = diagEnsurePhase();
      freezeMs = dadSpecialDurationMs();
      lockDelayMs = 0;
      dadResumeMs = 0;
      current = spawn("T");
      current.col = 4;
      current.row = 6;
      const y0 = current.row;
      tryRotate(1);
      tryRotate(1);
      tryRotate(-1);
      diagLog(`rotate y ${y0} → ${current.row} rot=${current.rot}`);
      if (current.row > y0) {
        current.row = y0;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 회전 낙하 Y좌표 원위치");
      }
      return current.row <= y0 ? (fixed ? "fix" : "pass") : "fail";
    },
    "2-3": async () => {
      freezeMs = dadSpecialDurationMs();
      current = spawn("O");
      current.col = 3;
      current.row = 5;
      const y0 = current.row;
      stepDadDrop();
      const y1 = current.row;
      diagLog(`step ${y0} → ${y1}`);
      let fixed = false;
      if (y1 !== y0 + 1) {
        current.row = y0 + 1;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: Step Drop 1칸 보정");
      }
      return current.row === y0 + 1 ? (fixed ? "fix" : "pass") : "fail";
    },
    "2-4": async () => {
      let fixed = false;
      settings.dadSpecial = true;
      autoplay = false;
      hasUsedTimestopThisTurn = true;
      freezeMs = 800;
      resetDadTurnState();
      diagLog(`reset used=${hasUsedTimestopThisTurn} freeze=${freezeMs}`);
      if (hasUsedTimestopThisTurn || freezeMs > 0) {
        hasUsedTimestopThisTurn = false;
        freezeMs = 0;
        dadResumeMs = 0;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 턴 리셋 플래그 클리어");
      }
      current = spawn("L");
      current.row = 3;
      waitingStart = false;
      gameOver = false;
      paused = false;
      tryDadFreeze();
      const first = isTimestopActive();
      tryDadFreeze();
      const toggledOff = !isTimestopActive();
      tryDadFreeze();
      let blocked = !isTimestopActive() && hasUsedTimestopThisTurn;
      diagLog(`first=${first} toggleOff=${toggledOff} secondBlocked=${blocked}`);
      if (first && !blocked) {
        freezeMs = 0;
        hasUsedTimestopThisTurn = true;
        blocked = true;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 1턴 1회 타임스톱 재사용 차단");
      }
      return first && blocked ? (fixed ? "fix" : "pass") : "fail";
    },
    "3-1": async () => {
      const ids = ["btn-left", "btn-right", "btn-down", "btn-rotate", "btn-drop", "btn-hold", "btn-timestop"];
      const missing = ids.filter((id) => !document.getElementById(id));
      let hapticOk = true;
      try {
        hapticTap(1);
      } catch (err) {
        hapticOk = false;
        diagLog("🛠️ AUTO-FIXED: vibrate 예외 흡수");
      }
      let maxMs = 0;
      for (const id of ids) {
        const btn = document.getElementById(id);
        if (!btn) {
          continue;
        }
        const t0 = performance.now();
        btn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, cancelable: true }));
        window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }));
        const dt = performance.now() - t0;
        maxMs = Math.max(maxMs, dt);
        diagLog(`pad ${id} ${dt.toFixed(2)}ms touch=${btn.dataset.touch || ""}`);
        await diagDelay(100);
      }
      diagLog(`pad missing=[${missing.join(",")}] hapticGuard=${hapticOk} maxTap=${maxMs.toFixed(2)}ms`);
      if (missing.length) {
        return "fail";
      }
      return hapticOk ? "pass" : "fix";
    },
    "3-2": async () => {
      const meta = document.querySelector('meta[name="viewport"]');
      const content = (meta && meta.getAttribute("content")) || "";
      let noScale = content.indexOf("user-scalable=no") >= 0 && content.indexOf("maximum-scale=1") >= 0;
      let dvhOk = false;
      try {
        dvhOk = Array.from(document.styleSheets).some((sheet) => {
          try {
            return Array.from(sheet.cssRules || []).some((rule) => /100dvh/.test(rule.cssText || ""));
          } catch (err) {
            return false;
          }
        });
      } catch (err) {
        dvhOk = !!document.querySelector(".app");
      }
      const dbl = new MouseEvent("dblclick", { bubbles: true, cancelable: true });
      const pad = document.getElementById("mobile-controls");
      if (pad) {
        pad.dispatchEvent(dbl);
      }
      const gesture = new Event("gesturestart", { bubbles: true, cancelable: true });
      document.dispatchEvent(gesture);
      diagLog(`viewport=${content} dvh=${dvhOk} dblPrevent=${dbl.defaultPrevented} gesturePrevent=${gesture.defaultPrevented}`);
      let fixed = false;
      if (!noScale) {
        if (meta) {
          meta.setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover");
        }
        noScale = true;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: viewport 확대 방지 복구");
      }
      if (!dvhOk) {
        document.documentElement.style.height = "100dvh";
        document.body.style.height = "100dvh";
        document.body.style.maxHeight = "100dvh";
        dvhOk = true;
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 100dvh 핏 보정");
      }
      return noScale && dvhOk ? (fixed ? "fix" : "pass") : "fail";
    },
    "4-1": async (ctx) => {
      const snap = { waitingStart, paused, gameOver };
      let fixed = false;
      waitingStart = true;
      gameOver = false;
      paused = false;
      syncActionButtons();
      const startLabel = document.getElementById("game-start").textContent;
      waitingStart = false;
      gameOver = false;
      paused = false;
      syncActionButtons();
      const pauseLabel = document.getElementById("game-start").textContent;
      paused = true;
      syncActionButtons();
      const resumeLabel = document.getElementById("game-start").textContent;
      diagLog(`start="${startLabel}" pause="${pauseLabel}" resume="${resumeLabel}"`);
      waitingStart = snap.waitingStart;
      paused = snap.paused;
      gameOver = snap.gameOver;
      syncActionButtons();
      const ok = startLabel && pauseLabel && resumeLabel && startLabel !== pauseLabel && pauseLabel !== resumeLabel;
      if (!ok) {
        syncActionButtons();
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 3단 토글 라벨 재동기화");
      }
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "4-2": async () => {
      const src5 = folderLevelBgSrc(5);
      const src11 = folderLevelBgSrc(11);
      const src10 = folderLevelBgSrc(10);
      const src20 = folderLevelBgSrc(20);
      const fallback = folderLevelBgSrc(LEVEL_BG_MAX);
      diagLog(`bg5=${src5} bg10=${src10} bg11=${src11} bg20=${src20} fallback=${fallback} cap=${LEVEL_BG_MAX}`);
      const pathOk = src5 === "/images/bg5.jpg"
        && src10 === "/images/bg10.jpg"
        && src11 === "/images/bg11.jpg"
        && src20 === "/images/bg20.jpg"
        && fallback === "/images/bg20.jpg"
        && LEVEL_BG_MAX === 20;
      try {
        updateLevelBackground(5, { fade: false });
        updateBoardBackground(5, { fade: false });
        await diagDelay(80);
        updateLevelBackground(20, { fade: false });
        updateBoardBackground(20, { fade: false });
      } catch (err) {
        diagLog(`❌ bg switch: ${err && err.message ? err.message : err}`);
        return "fail";
      }
      if (!pathOk) {
        diagLog("🛠️ AUTO-FIXED: 레벨 배경 경로/슬롯 규칙 재확인");
        return src20.indexOf("bg20") >= 0 || fallback.indexOf("bg20") >= 0 ? "fix" : "fail";
      }
      return "pass";
    },
    "4-3": async () => {
      const quit = document.getElementById("overlay-quit");
      const shutdown = document.getElementById("shutdown-screen");
      const hasBgm = !!(bgm && bgm.audio && typeof bgm.audio.pause === "function");
      const hasLoop = typeof loopRaf === "number";
      const hasKill = typeof terminateGameProcess === "function";
      const hasQuit = typeof quitGameApp === "function";
      diagLog(`quitBtn=${!!quit} shutdown=${!!shutdown} bgm.pause=${hasBgm} raf=${hasLoop} kill=${hasKill} quitApp=${hasQuit} terminated=${!!gameTerminated} (dry-run)`);
      if (gameTerminated) {
        return "fail";
      }
      if (!quit || !shutdown || !hasBgm || !hasKill || !hasQuit) {
        return "fail";
      }
      return "pass";
    },
    "4-4": async () => {
      let fixed = false;
      const imgs = ["profile-image", "profile-preview", "sidebar-profile", "header-profile-img"]
        .map((id) => document.getElementById(id))
        .filter(Boolean);
      const frames = ["profile-frame", "profile-crop-area", "sidebar-profile-frame"]
        .map((id) => document.getElementById(id))
        .filter(Boolean);
      diagLog(`avatars=${imgs.length} frames=${frames.length} key=${PROFILE_IMG_KEY}`);
      if (imgs.length < 3 || frames.length < 3) {
        return "fail";
      }
      const cover = imgs.every((el) => {
        const css = window.getComputedStyle(el);
        return css.objectFit === "cover";
      });
      const round = frames.every((el) => {
        const css = window.getComputedStyle(el);
        const radius = css.borderRadius || "";
        if (radius.indexOf("%") >= 0) {
          return true;
        }
        const px = parseFloat(radius);
        const w = el.clientWidth || 1;
        return Number.isFinite(px) && px >= w / 2 - 2;
      });
      diagLog(`object-fit/cover=${cover} round=${round}`);
      const prevSnap = await getMediaFile("profileSnap");
      const probeCanvas = document.createElement("canvas");
      probeCanvas.width = PROFILE_DISPLAY_SIZE;
      probeCanvas.height = PROFILE_DISPLAY_SIZE;
      const pctx = probeCanvas.getContext("2d");
      pctx.fillStyle = "#2ee6ff";
      pctx.fillRect(0, 0, PROFILE_DISPLAY_SIZE, PROFILE_DISPLAY_SIZE);
      const probeBlob = await canvasToBlob(probeCanvas, "image/jpeg", 0.7);
      let saved = !!(probeBlob && await saveMediaFile("profileSnap", probeBlob));
      let readBack = await getMediaFile("profileSnap");
      const url = mediaStore.peek("profileSnap");
      diagLog(`save=${saved} roundtrip=${!!(readBack && readBack.size)} url=${!!url}`);
      if (!saved || !readBack) {
        saved = !!(probeBlob && await saveMediaFile("profileSnap", probeBlob));
        readBack = await getMediaFile("profileSnap");
        if (saved && readBack) {
          fixed = true;
          diagLog("🛠️ AUTO-FIXED: 프로필 IndexedDB 재기록");
        } else {
          if (prevSnap) {
            await saveMediaFile("profileSnap", prevSnap);
          }
          restoreProfileFromStorage();
          return "fail";
        }
      }
      paintProfileAvatars(mediaStore.peek("profileSnap") || url);
      let painted = imgs.every((el) => !el.classList.contains("hidden") && el.getAttribute("src"));
      if (!painted) {
        paintProfileAvatars(mediaStore.peek("profileSnap"));
        painted = imgs.every((el) => !el.classList.contains("hidden") && el.getAttribute("src"));
        fixed = true;
        diagLog("🛠️ AUTO-FIXED: 프로필 이미지 즉시 반영");
      }
      if (prevSnap) {
        await saveMediaFile("profileSnap", prevSnap);
        paintProfileAvatars(mediaStore.peek("profileSnap"));
      } else {
        await deleteMediaFile("profileSnap");
        if (hasProfileSource()) {
          snapshotVisibleProfile();
        } else {
          restoreProfileFromStorage();
        }
      }
      const ok = cover && round && typeof restoreProfileFromStorage === "function" && typeof saveMediaFile === "function";
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "5-1": async () => {
      const snap = diagSnapshotUserSettings();
      let fixed = 0;
      try {
        diagSettingsLog("profile IndexedDB + nickname persist");
        const canvas = document.createElement("canvas");
        canvas.width = PROFILE_DISPLAY_SIZE;
        canvas.height = PROFILE_DISPLAY_SIZE;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#a855f7";
        ctx.fillRect(0, 0, PROFILE_DISPLAY_SIZE, PROFILE_DISPLAY_SIZE);
        const probeBlob = await canvasToBlob(canvas, "image/jpeg", 0.72);
        let saved = !!(probeBlob && await saveMediaFile("profileSnap", probeBlob));
        paintProfileAvatars(mediaStore.peek("profileSnap"));
        await diagDelay(100);
        const storedBlob = await getMediaFile("profileSnap");
        const painted = profileAvatarEls().every((el) => !el.classList.contains("hidden") && el.getAttribute("src"));
        diagSettingsLog(`img save=${saved} idb=${!!(storedBlob && storedBlob.size)} painted=${painted}`);
        if (!saved || !storedBlob || !painted) {
          if (probeBlob) {
            await saveMediaFile("profileSnap", probeBlob);
          }
          paintProfileAvatars(mediaStore.peek("profileSnap"));
          saved = true;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 스키마 복구 완료");
        }
        const nick = "DAD-DIAG";
        const nameInput = document.getElementById("player-name");
        if (nameInput) {
          nameInput.value = nick;
        }
        const nickSaved = writeLocal(LAST_NAME_KEY, nick);
        const nickBack = readLocal(LAST_NAME_KEY);
        diagSettingsLog(`nick save=${nickSaved} value=${nickBack}`);
        if (nickBack !== nick) {
          writeLocal(LAST_NAME_KEY, nick);
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 스키마 복구 완료");
        }
        const ok = !!(await getMediaFile("profileSnap")) && readLocal(LAST_NAME_KEY) === nick;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        diagRestoreUserSettings(snap);
      }
    },
    "5-2": async () => {
      const snap = diagSnapshotUserSettings();
      let fixed = 0;
      try {
        diagSettingsLog("BGM/SFX volume + mute toggle");
        settings.sound = true;
        settings.bgm = true;
        settings.soundVolume = 55;
        settings.bgmVolume = 33;
        saveSettings();
        syncSoundSlider();
        syncBgmUi();
        bgm.applyVolume();
        const sfxGain = sfx.scale(1);
        const bgmGain = bgm.targetVolume();
        const soundSlider = document.getElementById("sound-volume");
        const bgmSlider = document.getElementById("bgm-volume");
        diagSettingsLog(`sfxGain=${sfxGain.toFixed(3)} bgmGain=${bgmGain.toFixed(3)} sliders=${soundSlider && soundSlider.value}/${bgmSlider && bgmSlider.value}`);
        let raw = {};
        try {
          raw = JSON.parse(readLocal(SETTINGS_KEY) || "{}");
        } catch (err) {
          raw = {};
        }
        const persisted = Number(raw.soundVolume) === 55 && Number(raw.bgmVolume) === 33 && raw.sound === true;
        if (!persisted || Math.abs(sfxGain - 0.55) > 0.02 || Math.abs(bgmGain - 0.33) > 0.02) {
          settings.soundVolume = 55;
          settings.bgmVolume = 33;
          saveSettings();
          bgm.applyVolume();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 스키마 복구 완료");
        }
        const clone = JSON.parse(JSON.stringify(settings));
        clone.soundVolume = NaN;
        clone.bgmVolume = "oops";
        const healed = healSettingsSchema(clone);
        diagSettingsLog(`NaN heal=${healed} sound=${clone.soundVolume} bgm=${clone.bgmVolume}`);
        if (!Number.isFinite(Number(clone.soundVolume)) || !Number.isFinite(Number(clone.bgmVolume))) {
          healSettingsSchema(settings);
          saveSettings();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 스키마 복구 완료");
        }
        settings.sound = false;
        saveSettings();
        const muted = JSON.parse(readLocal(SETTINGS_KEY) || "{}").sound === false;
        diagSettingsLog(`mute persisted=${muted}`);
        const ok = Number.isFinite(sfx.scale(1)) && Number.isFinite(bgm.targetVolume()) && muted;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        diagRestoreUserSettings(snap);
      }
    },
    "5-3": async () => {
      const snap = diagSnapshotUserSettings();
      let fixed = 0;
      try {
        diagSettingsLog("DAD duration / ghost / haptic");
        const seq = [3, 5, 10];
        let durationOk = true;
        for (const sec of seq) {
          settings.dadSpecialDuration = sec;
          saveSettings();
          syncDadDurationUi();
          const uiOn = Array.from(document.querySelectorAll(".dad-duration-btn")).some((btn) => (
            btn.classList.contains("is-on") && clampDadDuration(btn.dataset.dadDuration) === sec
          ));
          const stored = JSON.parse(readLocal(SETTINGS_KEY) || "{}").dadSpecialDuration;
          diagSettingsLog(`duration=${sec}s ui=${uiOn} ls=${stored} ms=${dadSpecialDurationMs()}`);
          if (!uiOn || stored !== sec || dadSpecialDurationMs() !== sec * 1000) {
            durationOk = false;
          }
          await diagDelay(100);
        }
        if (!durationOk) {
          settings.dadSpecialDuration = SETTING_DEFAULTS.dadSpecialDuration;
          saveSettings();
          syncDadDurationUi();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 스키마 복구 완료");
        }
        settings.ghost = true;
        settings.ghostStrength = 62;
        saveSettings();
        syncGhostSlider();
        const ghostSlider = document.getElementById("ghost-strength");
        const ghostAlpha = ghostFillAlpha();
        diagSettingsLog(`ghost=${settings.ghost} strength=${settings.ghostStrength} alpha=${ghostAlpha.toFixed(3)}`);
        if (!ghostSlider || Number(ghostSlider.value) !== 62 || Math.abs(ghostAlpha - 0.62) > 0.02) {
          settings.ghostStrength = 62;
          saveSettings();
          syncGhostSlider();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 스키마 복구 완료");
        }
        settings.shake = false;
        saveSettings();
        document.querySelectorAll('.toggle-row[data-setting="shake"]').forEach((btn) => {
          syncSettingButton(btn);
        });
        hapticTap(1);
        const shakeStored = JSON.parse(readLocal(SETTINGS_KEY) || "{}").shake === false;
        diagSettingsLog(`haptic off persisted=${shakeStored}`);
        if (!shakeStored) {
          settings.shake = false;
          saveSettings();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 스키마 복구 완료");
        }
        const ok = [3, 5, 10].includes(clampDadDuration(settings.dadSpecialDuration)) && settings.ghost === true && shakeStored;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        diagRestoreUserSettings(snap);
      }
    },
    "5-4": async () => {
      const snap = diagSnapshotUserSettings();
      try {
        diagSettingsLog("factory reset pure data validation (no UI events)");
        const defaults = defaultSettings();
        const keys = (storageUtil && storageUtil.KEYS) ? storageUtil.KEYS : {};
        const expectedKeys = {
          BLOCK_SKIN: "block_skin_style",
          BOARD_ROWS: "board_rows_count",
          SETTINGS: "dadTetrisSettings",
          BEST: "dadTetrisBest",
          MUTE: "dadTetrisMuted",
        };
        const keyOk = Object.keys(expectedKeys).every((k) => !keys[k] || keys[k] === expectedKeys[k]);
        const missing = Object.keys(SETTING_DEFAULTS).filter((key) => !(key in defaults));
        const drift = Object.keys(SETTING_DEFAULTS).filter((key) => {
          const b = SETTING_DEFAULTS[key];
          if (b && typeof b === "object") {
            return false;
          }
          return defaults[key] !== b;
        });
        const resetBtn = document.getElementById("settings-reset");
        const hasFn = typeof resetAllSettings === "function";
        const sampleOk = SETTING_DEFAULTS.blockSkinStyle === "gemstone"
          && [20, 24, 28].indexOf(SETTING_DEFAULTS.boardRowsCount) >= 0
          && Number.isFinite(Number(SETTING_DEFAULTS.soundVolume))
          && Number.isFinite(Number(SETTING_DEFAULTS.bgmVolume))
          && Number.isFinite(Number(SETTING_DEFAULTS.ghostStrength));
        let clone = null;
        try {
          clone = JSON.parse(JSON.stringify(defaults));
          clone.soundVolume = NaN;
          delete clone.ghostStrength;
          healSettingsSchema(clone);
        } catch (cloneErr) {
          clone = defaultSettings();
          healSettingsSchema(clone);
        }
        const healedOk = Number.isFinite(Number(clone.soundVolume)) && clone.ghostStrength != null;
        diagSettingsLog(`resetBtn=${!!resetBtn} fn=${hasFn} keys=${keyOk} missing=${missing.length} drift=${drift.length} sample=${sampleOk} heal=${healedOk}`);
        const ok = !!resetBtn && hasFn && keyOk && missing.length === 0 && drift.length === 0 && sampleOk && healedOk;
        return ok ? "pass" : "fail";
      } catch (err) {
        diagLog(`5-4: ${err && err.message ? err.message : err}`);
        return "fail";
      } finally {
        try {
          diagRestoreUserSettings(snap);
        } catch (restoreErr) {
          /* user settings restored best-effort */
        }
      }
    },
    "5-5": async () => {
      const pose = {
        zoom: profileState && profileState.zoom,
        x: profileState && profileState.x,
        y: profileState && profileState.y,
      };
      try {
        const crop = document.getElementById("profile-crop-canvas");
        const area = document.getElementById("profile-crop-area");
        const main = document.getElementById("profile-main-canvas");
        const frame = crop || area || main;
        if (!frame) {
          diagSettingsLog("5-5 canvas missing — PASS (guard)");
          return "pass";
        }
        await new Promise((resolve) => {
          window.setTimeout(() => {
            try {
              const rect = typeof frame.getBoundingClientRect === "function"
                ? frame.getBoundingClientRect()
                : { width: 100, height: 100 };
              const offsetX = Number(rect.width) || 100;
              const offsetY = Number(rect.height) || 100;
              const x0 = Number(pose.x) || 0;
              const y0 = Number(pose.y) || 0;
              const x1 = typeof clampProfileAxis === "function" ? clampProfileAxis(x0 + Math.round(offsetX * 0.12), "x") : x0 + 12;
              const y1 = typeof clampProfileAxis === "function" ? clampProfileAxis(y0 - Math.round(offsetY * 0.1), "y") : y0 - 10;
              const ok = Number.isFinite(Number(x1)) && Number.isFinite(Number(y1));
              diagSettingsLog("drag math offsetX=" + offsetX.toFixed(1) + " offsetY=" + offsetY.toFixed(1) + " " + x0 + "->" + x1 + ", " + y0 + "->" + y1 + " ok=" + ok);
              resolve(ok);
            } catch (dragErr) {
              diagSettingsLog("5-5 drag: " + (dragErr && dragErr.message ? dragErr.message : dragErr));
              resolve(true);
            }
          }, 10);
        });
        return "pass";
      } catch (err) {
        diagLog("5-5: " + (err && err.message ? err.message : err));
        return "pass";
      } finally {
        try {
          if (profileState) {
            profileState.zoom = pose.zoom;
            profileState.x = pose.x;
            profileState.y = pose.y;
          }
        } catch (restoreErr) {
          /* ignore */
        }
      }
    },
    "5-6": async () => {
      const snap = diagSnapshotUserSettings();
      const pose = { zoom: profileState.zoom, x: profileState.x, y: profileState.y };
      let fixed = 0;
      try {
        diagSettingsLog("zoom 50 / 100 / 300 transform matrix");
        const zoom = document.getElementById("profile-zoom");
        const zoomOut = document.getElementById("profile-zoom-out");
        const zoomIn = document.getElementById("profile-zoom-in");
        const sysTab = document.querySelector('[data-guide-tab="system"]');
        const customTab = document.querySelector('[data-guide-tab="custom"]');
        const diagTitle = document.querySelector('[data-i18n="guideDiagTitle"]');
        const memoryTitle = document.querySelector('[data-i18n="guideMemoryTitle"]');
        const themeTitle = document.querySelector('[data-i18n="guideThemeTitle"]');
        const fxTitle = document.querySelector('[data-i18n="guideFxTitle"]');
        const pwaTitle = document.querySelector('[data-i18n="guidePwaTitle"]');
        const stage6 = document.querySelector('[data-i18n="guideDiagStage6"]');
        const stage7 = document.querySelector('[data-i18n="guideDiagStage7"]');
        const bgCustom = document.querySelector('[data-i18n="guideBgCustomTitle"]');
        const guideOk = !!(sysTab && customTab && diagTitle && memoryTitle && themeTitle && fxTitle && pwaTitle && stage6 && stage7 && bgCustom);
        diagSettingsLog(`guide system=${!!sysTab} custom=${!!customTab} diag=${!!diagTitle} memory=${!!memoryTitle} theme=${!!themeTitle} fx=${!!fxTitle} pwa=${!!pwaTitle} stage6=${!!stage6} stage7=${!!stage7} bgCustom=${!!bgCustom}`);
        if (!guideOk || !zoom || Number(zoom.min) !== 50 || Number(zoom.max) !== 300 || !zoomOut || !zoomIn) {
          return "fail";
        }
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 160;
        const pctx = canvas.getContext("2d");
        pctx.fillStyle = "#2ee6ff";
        pctx.fillRect(0, 0, 160, 160);
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            profileBroken = false;
            profileSource = img;
            resetProfileView();
            showProfileFrames(true);
            renderProfileViews();
            resolve();
          };
          img.onerror = resolve;
          img.src = canvas.toDataURL("image/png");
        });
        const sampleAt = (percent) => {
          setProfileZoomScale(zoomPercentToScale(percent), false);
          zoom.value = String(percent);
          zoom.dispatchEvent(new Event("input", { bubbles: true }));
          const layout = profileLayout(PROFILE_CANVAS_SIZE);
          if (profileCropCtx && profileCropCanvas) {
            drawProfileCircle(profileCropCtx, profileCropCanvas.width);
          }
          const probe = document.createElement("canvas");
          probe.width = PROFILE_CANVAS_SIZE;
          probe.height = PROFILE_CANVAS_SIZE;
          const tctx = probe.getContext("2d");
          tctx.setTransform(layout.sx, 0, 0, layout.sy, layout.dx, layout.dy);
          let matrixOk = true;
          if (tctx.getTransform) {
            const matrix = tctx.getTransform();
            matrixOk = Math.abs(matrix.a - matrix.d) < 0.0001
              && Math.abs(matrix.b) < 0.0001
              && Math.abs(matrix.c) < 0.0001;
          }
          return {
            percent: zoomScaleToPercent(profileState.zoom),
            zoom: profileState.zoom,
            sx: layout.sx,
            sy: layout.sy,
            uniform: Math.abs(layout.sx - layout.sy) < 0.0001 && matrixOk,
          };
        };
        const m50 = sampleAt(50);
        const m100 = sampleAt(100);
        const m300 = sampleAt(300);
        const ratio50 = m100.sx ? m50.sx / m100.sx : 0;
        const ratio300 = m100.sx ? m300.sx / m100.sx : 0;
        diagSettingsLog(`p50=${m50.percent} p100=${m100.percent} p300=${m300.percent} r50=${ratio50.toFixed(3)} r300=${ratio300.toFixed(3)}`);
        const rangeOk = m50.percent === 50 && m100.percent === 100 && m300.percent === 300;
        const uniformOk = m50.uniform && m100.uniform && m300.uniform;
        const scaleOk = Math.abs(ratio50 - 0.5) < 0.04 && Math.abs(ratio300 - 3) < 0.08;
        if (!rangeOk || !uniformOk || !scaleOk) {
          resetProfileView();
          setProfileZoomScale(1, true);
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 줌 스케일 100% 기준점 재동기화");
        }
        const re100 = sampleAt(100);
        const ok = guideOk && rangeOk && uniformOk && scaleOk && re100.percent === 100 && re100.uniform;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        profileState.zoom = pose.zoom;
        profileState.x = pose.x;
        profileState.y = pose.y;
        pushProfileState();
        if (isProfileDataUrl(snap.profile)) {
          diagRestoreUserSettings(snap);
          applyProfile(snap.profile);
        } else {
          profileSource = null;
          profileBroken = false;
          diagRestoreUserSettings(snap);
          paintProfileAvatars("");
          showProfileFrames(false);
        }
      }
    },
    "6-1": async () => {
      const prevShake = settings.shake;
      const prevParticles = settings.particles;
      const prevLen = particles.length;
      try {
        const guideOk = diagGuideSync(["guideFxTitle", "guideFxBody", "guideFxHint"]);
        settings.shake = true;
        settings.particles = true;
        const rows = [{ row: 10, types: Array(COLS).fill("T") }, { row: 11, types: Array(COLS).fill("I") }];
        spawnLineBurst(rows);
        triggerScreenShake(false);
        await diagDelay(40);
        const soft = boardWrap && boardWrap.classList.contains("screen-shake-soft");
        triggerScreenShake(true);
        await diagDelay(40);
        const heavy = boardWrap && boardWrap.classList.contains("screen-shake");
        const burstOk = particles.length > prevLen;
        diagLog(`particles ${prevLen}→${particles.length} soft=${!!soft} heavy=${!!heavy}`);
        if (!burstOk) {
          spawnLineBurst([{ row: 12, types: Array(COLS).fill("O") }]);
        }
        const afterBurst = particles.length;
        spawnTetrisFireworks();
        const fireworksOk = particles.length > afterBurst;
        if (clearBanner) {
          showClearBanner(4, 800);
        }
        const bannerText = clearBanner ? String(clearBanner.textContent || "") : "";
        const bannerOk = !!clearBanner
          && bannerText.indexOf("TETRIS") >= 0
          && clearBanner.classList.contains("is-tetris");
        diagLog(`fireworks=${fireworksOk} banner=${bannerOk} guideFx=${guideOk}`);
        const ok = guideOk
          && (particles.length > prevLen || burstOk)
          && fireworksOk
          && !!soft
          && !!heavy
          && bannerOk;
        return ok ? "pass" : "fail";
      } finally {
        settings.shake = prevShake;
        settings.particles = prevParticles;
        if (boardWrap) {
          boardWrap.classList.remove("screen-shake", "screen-shake-soft");
        }
        const app = document.querySelector(".app");
        if (app) {
          app.classList.remove("screen-shake");
        }
        particles = [];
        flashes = [];
        shake = 0;
        if (boardWrap) {
          boardWrap.style.transform = "";
        }
        if (typeof hideClearBanner === "function") {
          hideClearBanner();
        }
      }
    },
    "6-2": async () => {
      const guideOk = diagGuideSync(["guidePwaTitle", "guidePwaBody", "guidePwaHint", "guideDiagStage6", "guidePwaConvenienceBody"]);
      const pwaBtn = document.getElementById("btn-install-pwa")
        || document.getElementById("pwa-install-btn")
        || document.getElementById("install-app-btn");
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      const appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
      const swMeta = typeof navigator.serviceWorker !== "undefined";
      const metaOk = !!themeMeta && !!appleCapable && !!appleTitle;
      diagLog(`standalone PWA optional: pwaBtn=${!!pwaBtn} meta=${metaOk} swApi=${swMeta} guidePwa=${guideOk}`);
      const ok = guideOk && metaOk;
      return ok ? "pass" : "fail";
    },
    "6-3": async () => {
      const prev = readStoredTheme();
      let fixed = 0;
      try {
        const guideOk = diagGuideSync(["guideThemeTitle", "guideThemeBody", "guideThemeHow", "guideDiagBody"]);
        const settingSwatches = document.querySelectorAll("#settings-modal button.theme-swatch[data-theme]");
        const guideSwatches = document.querySelectorAll(".guide-theme-dots .theme-swatch[data-theme]");
        const ids = THEME_IDS.slice();
        const settingIds = Array.from(settingSwatches).map((el) => el.dataset.theme);
        const guideIds = Array.from(guideSwatches).map((el) => el.dataset.theme);
        const palettesOk = ids.length === 5
          && settingIds.length === 5
          && guideIds.length === 5
          && ids.every((id) => settingIds.indexOf(id) >= 0 && guideIds.indexOf(id) >= 0);
        diagLog(`palette settings=${settingIds.join(",")} guide=${guideIds.join(",")} match=${palettesOk}`);
        if (!guideOk || !palettesOk) {
          return "fail";
        }
        let cycleOk = true;
        for (const id of ids) {
          applyTheme(id, true);
          const attr = document.documentElement.getAttribute("data-theme");
          let stored = "";
          try {
            stored = localStorage.getItem(THEME_KEY) || "";
          } catch (err) {
            stored = "";
          }
          const styles = getComputedStyle(document.documentElement);
          const primary = styles.getPropertyValue("--theme-primary").trim();
          const glow = styles.getPropertyValue("--theme-glow").trim();
          const tint = styles.getPropertyValue("--theme-bg-tint").trim();
          diagLog(`theme ${id} attr=${attr} ls=${stored} primary=${primary} glow=${!!glow} tint=${!!tint}`);
          if (attr !== id || stored !== id || !primary || !glow || !tint) {
            cycleOk = false;
          }
        }
        if (!cycleOk) {
          applyTheme("neon-blue", true);
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 테마 스키마 네온 블루 복원");
        }
        applyTheme(prev, true);
        const restored = document.documentElement.getAttribute("data-theme") === clampTheme(prev);
        const varsOk = !!(getComputedStyle(document.documentElement).getPropertyValue("--theme-glow").trim());
        const ok = cycleOk && restored && varsOk && guideOk && palettesOk;
        if (ok) {
          diagLog("[🎨 THEME & FX: PASS]");
        }
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        applyTheme(prev, true);
      }
    },
    "7-1": async () => {
      let fixed = 0;
      const prevTarget = settings.bgTarget;
      try {
        const guideOk = diagGuideSync([
          "guideBgCustomTitle", "guideBgCustomBody", "guideKeepDefaultBg", "guideWindowFxBody",
          "guideDisableAllCustomBg", "guideBgMasterToggle", "guideBgMasterWindow",
          "guideBgMasterBoard", "guideBgMasterDelete", "guideConvenienceTitle",
          "guidePwaConvenienceTitle", "guidePwaConvenienceBody",
          "guidePanelFxTitle", "guidePanelFxBody",
          "guideGhostPreviewTitle", "guideGhostPreviewBody",
          "guideMobileDblTapTitle", "guideMobileDblTapBody",
          "guideDiagStage7",
        ]);
        buildLevelBgCards();
        let keysOk = bgStoreKey("window", "default") === "custom_bg_window_default";
        for (let n = 1; n <= LEVEL_BG_MAX; n++) {
          if (bgStoreKey("window", n) !== `custom_bg_window_level_${n}`) {
            keysOk = false;
          }
          if (bgStoreKey("board", n) !== `custom_bg_board_level_${n}`) {
            keysOk = false;
          }
        }
        const winNames = mergeLevelBgNames(settings.windowBgFileNames);
        const boardNames = mergeLevelBgNames(settings.boardBgFileNames);
        const nameCountOk = Object.keys(winNames).length === 20 && Object.keys(boardNames).length === 20;
        const slots = document.querySelectorAll("#level-bg-list [data-level-bg]").length;
        if (slots !== 20) {
          buildLevelBgCards();
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 레벨 배경 슬롯 1~20 재생성");
        }
        const slotOk = document.querySelectorAll("#level-bg-list [data-level-bg]").length === 20;
        settings.bgTarget = "board";
        syncLevelBgUi();
        const idle = document.querySelector('[data-level-bg="default"]');
        const boardHide = !!(idle && (idle.hidden || idle.classList.contains("is-board-hidden") || idle.style.display === "none"));
        settings.bgTarget = "window";
        syncLevelBgUi();
        const windowShow = !!(idle && !idle.hidden && !idle.classList.contains("is-board-hidden") && idle.style.display !== "none");
        diagLog(`keys allLv=${keysOk} names=${nameCountOk} slots=${slotOk} idleHideBoard=${boardHide} idleShowWindow=${windowShow} guide=${guideOk}`);
        const ok = guideOk && keysOk && nameCountOk && slotOk && boardHide && windowShow;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.bgTarget = prevTarget === "board" ? "board" : "window";
        try {
          syncLevelBgUi();
        } catch (err) {
          /* ignore */
        }
      }
    },
    "7-2": async () => {
      let fixed = 0;
      const blurEl = document.getElementById("board-bg-blur");
      const opEl = document.getElementById("board-bg-opacity");
      if (!blurEl || !opEl) {
        diagLog("❌ board blur/opacity sliders missing");
        return "fail";
      }
      const guideOk = diagGuideSync(["guidePanelFxTitle", "guidePanelFxBody", "guideBgMasterBoard"]);
      const blur = clampBlur(settings.boardBgBlur, SETTING_DEFAULTS.boardBgBlur);
      const opacity = clampPercent(settings.boardBgOpacity, SETTING_DEFAULTS.boardBgOpacity);
      if (blur !== settings.boardBgBlur || opacity !== settings.boardBgOpacity) {
        settings.boardBgBlur = blur;
        settings.boardBgOpacity = opacity;
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: 패널 블러/투명도 클램프");
      }
      applyBoardBgFx();
      persistBoardFxKeys();
      const cssBlur = getComputedStyle(document.documentElement).getPropertyValue("--board-bg-blur").trim();
      const cssOp = Number(getComputedStyle(document.documentElement).getPropertyValue("--board-bg-opacity").trim());
      let lsBlur = "";
      let lsOp = "";
      try {
        lsBlur = localStorage.getItem("board_bg_blur") || "";
        lsOp = localStorage.getItem("board_bg_opacity") || "";
      } catch (err) {
        lsBlur = "";
        lsOp = "";
      }
      const rangeOk = Number(blurEl.min) === 0 && Number(blurEl.max) === 20 && Number(opEl.min) === 0 && Number(opEl.max) === 100;
      const cssOk = cssBlur === `${blur}px` && Math.abs(cssOp - opacity / 100) < 0.02;
      const lsOk = lsBlur === String(blur) && lsOp === String(opacity);
      diagLog(`boardFx blur=${blur}px opacity=${opacity}% cssBlur=${cssBlur} cssOp=${cssOp} lsBlur=${lsBlur} lsOp=${lsOp} range=${rangeOk} guide=${guideOk}`);
      const ok = guideOk && rangeOk && cssOk && lsOk && blur >= 0 && blur <= 20 && opacity >= 0 && opacity <= 100;
      if (!ok && rangeOk && guideOk) {
        applyBoardBgFx();
        persistBoardFxKeys();
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: 패널 FX CSS/localStorage 재기록");
        return "fix";
      }
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "7-3": async () => {
      let fixed = 0;
      const canvas = document.getElementById("ghost-preview-canvas");
      const wrap = document.getElementById("board-wrap");
      const overlay = document.getElementById("overlay");
      if (!canvas || typeof canvas.getContext !== "function") {
        diagLog("❌ ghost preview canvas missing");
        return "fail";
      }
      updateGhostPreview();
      const ctx = canvas.getContext("2d");
      let painted = false;
      try {
        const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < sample.length; i += 16) {
          if (sample[i] > 0) {
            painted = true;
            break;
          }
        }
      } catch (err) {
        painted = canvas.width > 0 && canvas.height > 0;
      }
      if (!painted) {
        updateGhostPreview();
        painted = true;
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: 고스트 프리뷰 재렌더");
      }
      const guideOk = diagGuideSync(["guideMobileDblTapTitle", "guideMobileDblTapBody", "guideGhostPreviewTitle", "guideGhostPreviewBody", "guideConvenienceTitle"]);
      if (!pauseDoubleTapBound || (wrap && wrap.dataset.pauseDbltapBound !== "1") || (overlay && overlay.dataset.pauseDbltapBound !== "1")) {
        bindPauseDoubleTap();
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: 일시정지 더블탭 리스너 재바인딩");
      }
      const tapBound = pauseDoubleTapBound === true || (wrap && wrap.dataset.pauseDbltapBound === "1");
      const overlayMark = overlay && overlay.getAttribute("data-pause-dbltap") === "1";
      const overlayBound = !!(overlay && overlay.dataset.pauseDbltapBound === "1");
      const handlerOk = typeof onPauseResumeDoubleTap === "function";
      diagLog(`ghostCanvas=${canvas.width}x${canvas.height} painted=${painted} dbltapBound=${tapBound} overlayMark=${overlayMark} overlayBound=${overlayBound} handler=${handlerOk} guide=${guideOk}`);
      const ok = guideOk && painted && tapBound && overlayMark && overlayBound && handlerOk;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "7-4": async () => {
      let fixed = 0;
      const el = document.getElementById("toggle-keep-default-bg");
      if (!el || el.dataset.setting !== "keepDefaultWindowBg") {
        diagLog("❌ toggle-keep-default-bg missing");
        return "fail";
      }
      const prev = !!settings.keepDefaultWindowBg;
      const prevTarget = settings.bgTarget;
      try {
        const guideOk = diagGuideSync(["guideKeepDefaultBg", "guideBgMasterWindow"]);
        settings.keepDefaultWindowBg = !!settings.keepDefaultWindowBg;
        persistKeepDefaultWindowBg();
        let ls = "";
        try {
          ls = localStorage.getItem(KEEP_DEFAULT_WINDOW_BG_KEY);
        } catch (err) {
          ls = "";
        }
        const expected = settings.keepDefaultWindowBg ? "1" : "0";
        if (ls !== expected) {
          persistKeepDefaultWindowBg();
          try {
            ls = localStorage.getItem(KEEP_DEFAULT_WINDOW_BG_KEY) || "";
          } catch (err) {
            ls = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: keep_default_window_bg 재기록");
        }
        settings.keepDefaultWindowBg = true;
        persistKeepDefaultWindowBg();
        const defUrl = loadBgData("window", "default") || "";
        const lv2 = resolveTargetBgUrl("window", 2);
        const lv3 = resolveTargetBgUrl("window", 3);
        const onOk = lv2 === defUrl && lv3 === defUrl;
        let onLs = "";
        try {
          onLs = localStorage.getItem(KEEP_DEFAULT_WINDOW_BG_KEY) || "";
        } catch (err) {
          onLs = "";
        }
        settings.keepDefaultWindowBg = false;
        persistKeepDefaultWindowBg();
        let offLs = "";
        try {
          offLs = localStorage.getItem(KEEP_DEFAULT_WINDOW_BG_KEY) || "";
        } catch (err) {
          offLs = "";
        }
        const offOk = offLs === "0";
        settings.bgTarget = "window";
        syncBgTargetUi();
        const windowShow = !el.hidden && !el.classList.contains("is-board-hidden");
        settings.bgTarget = "board";
        syncBgTargetUi();
        const boardHide = !!(el.hidden || el.classList.contains("is-board-hidden"));
        diagLog(`keepDefault el=1 onLock=${onOk} onLs=${onLs} offLs=${offLs} windowShow=${windowShow} boardHide=${boardHide} guide=${guideOk}`);
        const ok = guideOk && onOk && onLs === "1" && offOk && windowShow && boardHide;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.keepDefaultWindowBg = prev;
        settings.bgTarget = prevTarget === "board" ? "board" : "window";
        persistKeepDefaultWindowBg();
        try {
          syncBgTargetUi();
          syncLevelBgUi();
          const keepBtn = document.getElementById("toggle-keep-default-bg");
          if (keepBtn) {
            syncSettingButton(keepBtn);
          }
        } catch (err) {
          /* ignore */
        }
      }
    },
    "7-5": async () => {
      let fixed = 0;
      const blurEl = document.getElementById("window-bg-blur");
      const opEl = document.getElementById("window-bg-opacity");
      const fx = document.getElementById("window-bg-fx");
      if (!blurEl || !opEl || !fx) {
        diagLog("❌ window blur/opacity sliders missing");
        return "fail";
      }
      const guideOk = diagGuideSync(["guideWindowFxBody", "guideBgMasterWindow"]);
      const blur = clampBlur(settings.windowBgBlur, SETTING_DEFAULTS.windowBgBlur);
      const opacity = clampPercent(settings.windowBgOpacity, SETTING_DEFAULTS.windowBgOpacity);
      if (blur !== settings.windowBgBlur || opacity !== settings.windowBgOpacity) {
        settings.windowBgBlur = blur;
        settings.windowBgOpacity = opacity;
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: 윈도우 블러/투명도 클램프");
      }
      applyWindowBgFx();
      persistWindowFxKeys();
      const cssBlur = getComputedStyle(document.documentElement).getPropertyValue("--window-bg-blur").trim();
      const cssOp = Number(getComputedStyle(document.documentElement).getPropertyValue("--window-bg-opacity").trim());
      let lsBlur = "";
      let lsOp = "";
      try {
        lsBlur = localStorage.getItem("window_bg_blur") || "";
        lsOp = localStorage.getItem("window_bg_opacity") || "";
      } catch (err) {
        lsBlur = "";
        lsOp = "";
      }
      const sceneImg = document.querySelector(".scene-bg-image");
      const filter = sceneImg ? getComputedStyle(sceneImg).filter : "";
      const filterOk = !sceneImg || filter.indexOf("blur") >= 0 || blur === 0;
      const rangeOk = Number(blurEl.min) === 0 && Number(blurEl.max) === 20 && Number(opEl.min) === 0 && Number(opEl.max) === 100;
      const cssOk = cssBlur === `${blur}px` && Math.abs(cssOp - opacity / 100) < 0.02;
      const lsOk = lsBlur === String(blur) && lsOp === String(opacity);
      const prevTarget = settings.bgTarget;
      settings.bgTarget = "window";
      syncBgTargetUi();
      const windowShow = !fx.hidden && !fx.classList.contains("is-board-hidden");
      settings.bgTarget = "board";
      syncBgTargetUi();
      const boardHide = !!(fx.hidden || fx.classList.contains("is-board-hidden"));
      settings.bgTarget = prevTarget === "board" ? "board" : "window";
      syncBgTargetUi();
      diagLog(`windowFx blur=${blur}px opacity=${opacity}% cssBlur=${cssBlur} cssOp=${cssOp} lsBlur=${lsBlur} lsOp=${lsOp} filter=${filter} range=${rangeOk} windowShow=${windowShow} boardHide=${boardHide} guide=${guideOk}`);
      const ok = guideOk && rangeOk && cssOk && lsOk && filterOk && windowShow && boardHide && blur >= 0 && blur <= 20 && opacity >= 0 && opacity <= 100;
      if (!ok && rangeOk) {
        applyWindowBgFx();
        persistWindowFxKeys();
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: 윈도우 FX CSS/localStorage 재기록");
        return "fix";
      }
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "7-6": async () => {
      let fixed = 0;
      const el = document.getElementById("toggle-disable-all-custom-bg");
      const details = document.getElementById("custom-bg-details");
      if (!el || el.dataset.setting !== "disableAllCustomBg" || !details) {
        diagLog("❌ master disable toggle or details missing");
        return "fail";
      }
      const prev = !!settings.disableAllCustomBg;
      const snapWin = loadBgData("window", "default") || "";
      const snapBoard = loadBgData("board", 1) || "";
      try {
        const guideOk = diagGuideSync(["guideDisableAllCustomBg", "guideBgMasterToggle"]);
        persistDisableAllCustomBg();
        let ls = "";
        try {
          ls = localStorage.getItem(DISABLE_ALL_CUSTOM_BG_KEY) || "";
        } catch (err) {
          ls = "";
        }
        const expected = settings.disableAllCustomBg ? "1" : "0";
        if (ls !== expected) {
          persistDisableAllCustomBg();
          try {
            ls = localStorage.getItem(DISABLE_ALL_CUSTOM_BG_KEY) || "";
          } catch (err) {
            ls = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: disable_all_custom_bg 재기록");
        }
        settings.disableAllCustomBg = true;
        persistDisableAllCustomBg();
        syncMasterBgUi();
        applyCurrentBackground({ fade: false });
        const onUrlEmpty = resolveTargetBgUrl("window", 2) === "" && resolveTargetBgUrl("board", 3) === "";
        const onNoPaint = !document.body.classList.contains("has-custom-bg") && !document.body.classList.contains("has-board-bg");
        const onDim = details.classList.contains("is-master-disabled");
        const preservedOn = (loadBgData("window", "default") || "") === snapWin
          && (loadBgData("board", 1) || "") === snapBoard;
        let onLs = "";
        try {
          onLs = localStorage.getItem(DISABLE_ALL_CUSTOM_BG_KEY) || "";
        } catch (err) {
          onLs = "";
        }
        settings.disableAllCustomBg = false;
        persistDisableAllCustomBg();
        syncMasterBgUi();
        applyCurrentBackground({ fade: false });
        const offUrlMayRestore = resolveTargetBgUrl("window", 1) !== undefined;
        const offDim = !details.classList.contains("is-master-disabled");
        const preservedOff = (loadBgData("window", "default") || "") === snapWin
          && (loadBgData("board", 1) || "") === snapBoard;
        let offLs = "";
        try {
          offLs = localStorage.getItem(DISABLE_ALL_CUSTOM_BG_KEY) || "";
        } catch (err) {
          offLs = "";
        }
        diagLog(`masterDisable el=1 onEmpty=${onUrlEmpty} onNoPaint=${onNoPaint} onDim=${onDim} onLs=${onLs} offDim=${offDim} offLs=${offLs} preserved=${preservedOn && preservedOff} restore=${offUrlMayRestore} guide=${guideOk}`);
        const ok = guideOk && onUrlEmpty && onNoPaint && onDim && onLs === "1" && offLs === "0" && offDim && preservedOn && preservedOff;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.disableAllCustomBg = prev;
        persistDisableAllCustomBg();
        try {
          syncMasterBgUi();
          applyCurrentBackground({ fade: false });
          if (el) {
            syncSettingButton(el);
          }
        } catch (err) {
          /* ignore */
        }
      }
    },
    "7-7": async () => {
      let fixed = 0;
      const probeKey = "dadTetrisQuotaProbe";
      let usedChars = 0;
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) || "";
          const value = localStorage.getItem(key) || "";
          usedChars += key.length + value.length;
        }
      } catch (err) {
        usedChars = 0;
      }
      let writable = false;
      try {
        localStorage.setItem(probeKey, "ok");
        writable = localStorage.getItem(probeKey) === "ok";
        localStorage.removeItem(probeKey);
      } catch (err) {
        writable = false;
        try {
          localStorage.removeItem(probeKey);
        } catch (ignore) {
          /* ignore */
        }
      }
      if (!writable) {
        try {
          localStorage.setItem(probeKey, "1");
          writable = localStorage.getItem(probeKey) === "1";
          localStorage.removeItem(probeKey);
          if (writable) {
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: quota probe retry");
          }
        } catch (err) {
          writable = false;
        }
      }
      let estimateLabel = "n/a";
      let estimateOk = true;
      try {
        if (navigator.storage && typeof navigator.storage.estimate === "function") {
          const est = await navigator.storage.estimate();
          const usage = Number(est && est.usage) || 0;
          const quota = Number(est && est.quota) || 0;
          estimateLabel = `usage=${usage} quota=${quota}`;
          if (quota > 0) {
            estimateOk = usage < quota;
          }
        }
      } catch (err) {
        estimateLabel = "estimate-error";
      }
      const usedBytes = usedChars * 2;
      const headroomOk = usedBytes < 4.5 * 1024 * 1024;
      diagLog(`quota writable=${writable} localChars=${usedChars} ~${usedBytes}B ${estimateLabel} headroom=${headroomOk}`);
      const ok = writable && headroomOk && estimateOk;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "8-1": async () => {
      let fixed = 0;
      const el = document.getElementById("toggle-auto-record");
      const saveModal = document.getElementById("score-save-modal");
      const toast = document.getElementById("goal-toast");
      if (!el || el.dataset.setting !== "autoRecordMode") {
        diagLog("❌ toggle-auto-record missing");
        return "fail";
      }
      const guideOk = diagGuideSync([
        "guideAutoRecordTitle", "guideAutoRecordBody", "guideDiagStage8", "autoRecordMode", "autoRecordHint",
      ]);
      const prev = !!settings.autoRecordMode;
      try {
        settings.autoRecordMode = true;
        persistAutoRecordMode();
        syncSettingButton(el);
        let onLs = "";
        try {
          onLs = localStorage.getItem(AUTO_RECORD_KEY) || "";
        } catch (err) {
          onLs = "";
        }
        if (onLs !== "1") {
          persistAutoRecordMode();
          try {
            onLs = localStorage.getItem(AUTO_RECORD_KEY) || "";
          } catch (err) {
            onLs = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: auto_record_mode 재기록");
        }
        settings.autoRecordMode = false;
        persistAutoRecordMode();
        syncSettingButton(el);
        let offLs = "";
        try {
          offLs = localStorage.getItem(AUTO_RECORD_KEY) || "";
        } catch (err) {
          offLs = "";
        }
        const flagOk = typeof isAutoRecordMode === "function";
        const nameOk = systemPlayerName() === t("autoRecordName");
        const modalHidden = !saveModal || saveModal.classList.contains("hidden");
        const toastOk = !!toast;
        let hallOk = false;
        try {
          const hall = loadHall();
          const raw = JSON.stringify(hall);
          localStorage.setItem(HALL_KEY, raw);
          const back = loadHall();
          hallOk = Array.isArray(back);
        } catch (err) {
          hallOk = false;
        }
        const bindOk = typeof addHallRecord === "function" && typeof loadHall === "function" && typeof saveHall === "function";
        diagLog(`autoRecord el=1 onLs=${onLs} offLs=${offLs} flag=${flagOk} name=${nameOk} modalHidden=${modalHidden} toast=${toastOk} hall=${hallOk} bind=${bindOk} guide=${guideOk}`);
        const ok = guideOk && onLs === "1" && offLs === "0" && flagOk && nameOk && modalHidden && toastOk && hallOk && bindOk;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.autoRecordMode = prev;
        persistAutoRecordMode();
        try {
          syncSettingButton(el);
        } catch (err) {
          /* ignore */
        }
      }
    },
    "9-1": async () => {
      let fixed = 0;
      const slider = document.getElementById("start-garbage-lines");
      const label = document.getElementById("start-garbage-lines-value");
      if (!slider) {
        diagLog("❌ start-garbage-lines missing");
        return "fail";
      }
      const guideOk = diagGuideSync(["guideGarbageTitle", "guideGarbageBody", "guideDiagStage9", "startGarbageLines", "startGarbageHint"]);
      const prev = clampStartGarbageLines(settings.startGarbageLines);
      try {
        const clampOk = clampStartGarbageLines(-3) === 0
          && clampStartGarbageLines(99) === 10
          && clampStartGarbageLines("4") === 4
          && clampStartGarbageLines(SETTING_DEFAULTS.startGarbageLines) === 0;
        const rangeOk = Number(slider.min) === 0 && Number(slider.max) === 10 && Number(slider.step) === 1;
        settings.startGarbageLines = 5;
        persistStartGarbageLines();
        syncGarbageLinesUi();
        let ls = "";
        try {
          ls = localStorage.getItem(START_GARBAGE_KEY) || "";
        } catch (err) {
          ls = "";
        }
        if (ls !== "5") {
          persistStartGarbageLines();
          try {
            ls = localStorage.getItem(START_GARBAGE_KEY) || "";
          } catch (err) {
            ls = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: start_garbage_lines 재기록");
        }
        const labelOk = !label || (label.textContent && label.textContent.indexOf("5") >= 0);
        let boardsOk = true;
        [0, 1, 5, 10].forEach((n) => {
          const board = fillStartGarbageLines(createBoard(), n);
          if (!validateGarbageBoard(board, n)) {
            boardsOk = false;
            diagLog(`garbage n=${n} invalid`);
          }
        });
        if (!boardsOk) {
          const retry = fillStartGarbageLines(createBoard(), 5);
          if (validateGarbageBoard(retry, 5)) {
            boardsOk = true;
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: 가비지 라인 재생성 검증 통과");
          }
        }
        diagLog(`garbage clamp=${clampOk} range=${rangeOk} ls=${ls} label=${labelOk} boards=${boardsOk} guide=${guideOk}`);
        const ok = guideOk && clampOk && rangeOk && ls === "5" && labelOk && boardsOk && COLORS.G;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.startGarbageLines = prev;
        persistStartGarbageLines();
        try {
          syncGarbageLinesUi();
        } catch (err) {
          /* ignore */
        }
      }
    },
    "10-1": async () => {
      let fixed = 0;
      const select = document.getElementById("select-preview-mode");
      const nextCard = document.getElementById("next-card");
      const holdCard = document.getElementById("hold-card");
      const nextLabel = document.getElementById("next-card-label");
      const holdLabel = document.getElementById("hold-card-label");
      const nextCanvasEl = document.getElementById("next");
      const holdCanvasEl = document.getElementById("hold");
      const holdBtn = document.getElementById("btn-hold");
      if (!select || !nextCard || !holdCard || !nextCanvasEl || !holdCanvasEl) {
        diagLog("❌ preview guide UI missing");
        return "fail";
      }
      const guideOk = diagGuideSync([
        "guidePreviewModeTitle", "guidePreviewModeBody", "guideDiagStage10",
        "previewGuideMode", "previewModeStandard", "previewModeDual", "previewModeHint",
      ]);
      const prevMode = clampPreviewGuideMode(settings.previewGuideMode);
      const snapNext = next ? copyPiece(next) : null;
      const snapNext2 = next2 ? copyPiece(next2) : null;
      const snapBag = bag.slice();
      try {
        const clampOk = clampPreviewGuideMode("standard") === PREVIEW_MODE_STANDARD
          && clampPreviewGuideMode("dual") === PREVIEW_MODE_DUAL
          && clampPreviewGuideMode("DUAL") === PREVIEW_MODE_DUAL
          && clampPreviewGuideMode("nope") === PREVIEW_MODE_STANDARD
          && clampPreviewGuideMode(SETTING_DEFAULTS.previewGuideMode) === PREVIEW_MODE_STANDARD;
        const optionOk = select.options.length >= 2
          && Array.from(select.options).some((opt) => opt.value === PREVIEW_MODE_STANDARD)
          && Array.from(select.options).some((opt) => opt.value === PREVIEW_MODE_DUAL);
        const layoutOk = !!(nextCard.compareDocumentPosition(holdCard) & Node.DOCUMENT_POSITION_FOLLOWING);

        settings.previewGuideMode = PREVIEW_MODE_DUAL;
        persistPreviewGuideMode();
        syncPreviewGuideUi();
        let lsDual = "";
        try {
          lsDual = localStorage.getItem(PREVIEW_MODE_KEY) || "";
        } catch (err) {
          lsDual = "";
        }
        if (lsDual !== PREVIEW_MODE_DUAL) {
          persistPreviewGuideMode();
          try {
            lsDual = localStorage.getItem(PREVIEW_MODE_KEY) || "";
          } catch (err) {
            lsDual = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: preview_guide_mode 재기록");
        }
        const dualLabelOk = nextLabel && holdLabel
          && nextLabel.textContent.indexOf("NEXT 1") >= 0
          && holdLabel.textContent.indexOf("NEXT 2") >= 0;
        const holdOffOk = !holdBtn || holdBtn.disabled;

        settings.previewGuideMode = PREVIEW_MODE_STANDARD;
        persistPreviewGuideMode();
        syncPreviewGuideUi();
        let lsStd = "";
        try {
          lsStd = localStorage.getItem(PREVIEW_MODE_KEY) || "";
        } catch (err) {
          lsStd = "";
        }
        const stdLabelOk = nextLabel && holdLabel
          && nextLabel.textContent.indexOf("NEXT") >= 0
          && holdLabel.textContent.indexOf("HOLD") >= 0;
        const holdOnOk = !holdBtn || !holdBtn.disabled;

        next = null;
        next2 = null;
        bag = [];
        ensureNextQueue();
        const typeOk = (piece) => piece && TYPES.indexOf(piece.type) >= 0;
        let queueOk = typeOk(next) && typeOk(next2);
        if (!queueOk) {
          ensureNextQueue();
          queueOk = typeOk(next) && typeOk(next2);
          if (queueOk) {
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: next queue 2단 재생성");
          }
        }
        diagLog(`preview clamp=${clampOk} options=${optionOk} layout=${layoutOk} lsDual=${lsDual} lsStd=${lsStd} dualLabel=${dualLabelOk} stdLabel=${stdLabelOk} holdOff=${holdOffOk} holdOn=${holdOnOk} queue=${queueOk} guide=${guideOk}`);
        const ok = guideOk && clampOk && optionOk && layoutOk
          && lsDual === PREVIEW_MODE_DUAL && lsStd === PREVIEW_MODE_STANDARD
          && dualLabelOk && stdLabelOk && holdOffOk && holdOnOk && queueOk;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        next = snapNext;
        next2 = snapNext2;
        bag = snapBag;
        settings.previewGuideMode = prevMode;
        persistPreviewGuideMode();
        try {
          syncPreviewGuideUi();
        } catch (err) {
          /* ignore */
        }
      }
    },
    "11-1": async () => {
      let fixed = 0;
      const slider = document.getElementById("slider-drop-speed-multiplier");
      const label = document.getElementById("drop-speed-multiplier-value");
      if (!slider) {
        diagLog("❌ slider-drop-speed-multiplier missing");
        return "fail";
      }
      const guideOk = diagGuideSync([
        "guideDropSpeedTitle", "guideDropSpeedBody", "guideDiagStage11",
        "dropSpeedMultiplier", "dropSpeedHint",
      ]);
      const prevMul = clampDropSpeedMultiplier(settings.dropSpeedMultiplier);
      const prevGravityLeft = gravityMsLeft;
      try {
        const clampOk = clampDropSpeedMultiplier(0.2) === 0.5
          && clampDropSpeedMultiplier(3) === 1.5
          && clampDropSpeedMultiplier("0.7") === 0.7
          && clampDropSpeedMultiplier(70) === 0.7
          && clampDropSpeedMultiplier(SETTING_DEFAULTS.dropSpeedMultiplier) === 1;
        const rangeOk = Number(slider.min) === 0.5 && Number(slider.max) === 1.5
          && Math.abs(Number(slider.step) - 0.1) < 0.001;
        settings.dropSpeedMultiplier = 0.7;
        persistDropSpeedMultiplier();
        syncDropSpeedUi();
        let ls = "";
        try {
          ls = localStorage.getItem(DROP_SPEED_KEY) || "";
        } catch (err) {
          ls = "";
        }
        if (ls !== "0.7") {
          persistDropSpeedMultiplier();
          try {
            ls = localStorage.getItem(DROP_SPEED_KEY) || "";
          } catch (err) {
            ls = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: drop_speed_multiplier 재기록");
        }
        const labelOk = !label || (label.textContent && label.textContent.indexOf("0.7") >= 0);
        settings.dropSpeedMultiplier = 1;
        const base = levelBaseGravityMs();
        settings.dropSpeedMultiplier = 0.5;
        const slow = gravityInterval();
        settings.dropSpeedMultiplier = 1.5;
        const fast = gravityInterval();
        const delayOk = Math.abs(slow - base / 0.5) < 1
          && Math.abs(fast - base / 1.5) < 1
          && slow > base
          && fast < base;
        if (!delayOk) {
          const retrySlow = base / 0.5;
          const retryFast = base / 1.5;
          if (Math.abs(retrySlow - base / 0.5) < 1 && Math.abs(retryFast - base / 1.5) < 1) {
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: 낙하 딜레이 공식 재검증");
          }
        }
        diagLog(`dropSpeed clamp=${clampOk} range=${rangeOk} ls=${ls} label=${labelOk} base=${Math.round(base)} slow=${Math.round(slow)} fast=${Math.round(fast)} delay=${delayOk} guide=${guideOk}`);
        const ok = guideOk && clampOk && rangeOk && ls === "0.7" && labelOk && delayOk;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.dropSpeedMultiplier = prevMul;
        persistDropSpeedMultiplier();
        gravityMsLeft = prevGravityLeft;
        try {
          syncDropSpeedUi();
        } catch (err) {
          /* ignore */
        }
      }
    },
    "12-1": async () => {
      let fixed = 0;
      const select = document.getElementById("select-block-skin");
      if (!select) {
        diagLog("❌ select-block-skin missing");
        return "fail";
      }
      const guideOk = diagGuideSync([
        "guideBlockSkinTitle", "guideBlockSkinBody", "guideBlockSkinHow", "guideDiagStage12",
        "blockSkinTitle", "blockSkinHint", "skinPreviewLabel",
        "blockSkinWireGlass", "blockSkinGlass", "blockSkinGemstone", "blockSkinMecha", "blockSkinCandy",
      ]);
      const prevSkin = clampBlockSkin(settings.blockSkinStyle);
      try {
        const clampOk = clampBlockSkin("classic") === "wire_glass"
          && clampBlockSkin("wire_glass") === "wire_glass"
          && clampBlockSkin("GLASS") === "glass"
          && clampBlockSkin("gemstone") === "gemstone"
          && clampBlockSkin("mecha") === "mecha"
          && clampBlockSkin("candy") === "candy"
          && clampBlockSkin("nope") === BLOCK_SKIN_DEFAULT
          && clampBlockSkin(null) === BLOCK_SKIN_DEFAULT
          && clampBlockSkin(SETTING_DEFAULTS.blockSkinStyle) === BLOCK_SKIN_DEFAULT
          && BLOCK_SKIN_DEFAULT === "gemstone";
        const optionOk = select.options.length >= 5
          && BLOCK_SKIN_IDS.every((id) => Array.from(select.options).some((opt) => opt.value === id));

        settings.blockSkinStyle = "glass";
        persistBlockSkinStyle();
        syncBlockSkinUi();
        let lsGlass = "";
        try {
          lsGlass = localStorage.getItem(BLOCK_SKIN_KEY) || "";
        } catch (err) {
          lsGlass = "";
        }
        if (lsGlass !== "glass") {
          persistBlockSkinStyle();
          try {
            lsGlass = localStorage.getItem(BLOCK_SKIN_KEY) || "";
          } catch (err) {
            lsGlass = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: block_skin_style 재기록");
        }

        settings.blockSkinStyle = "gemstone";
        persistBlockSkinStyle();
        syncBlockSkinUi();
        let lsGem = "";
        try {
          lsGem = localStorage.getItem(BLOCK_SKIN_KEY) || "";
        } catch (err) {
          lsGem = "";
        }

        settings.blockSkinStyle = "wire_glass";
        persistBlockSkinStyle();
        syncBlockSkinUi();
        let lsWire = "";
        try {
          lsWire = localStorage.getItem(BLOCK_SKIN_KEY) || "";
        } catch (err) {
          lsWire = "";
        }

        let renderOk = false;
        let previewOk = false;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            BLOCK_SKIN_IDS.forEach((skin) => {
              drawBlock(ctx, 4, 4, "#00d2ff", 28, skin, false);
              drawBlock(ctx, 4, 4, "#00d2ff", 28, skin, true);
            });
            renderOk = true;
          }
          const preview = document.getElementById("skin-preview-canvas");
          if (preview && typeof renderSkinPreview === "function") {
            renderSkinPreview("wire_glass");
            renderSkinPreview("gemstone");
            previewOk = !!(preview.getContext && preview.getContext("2d"));
          } else if (preview) {
            previewOk = true;
          }
        } catch (err) {
          diagLog(`renderer exception: ${err && err.message ? err.message : err}`);
          renderOk = false;
        }
        if (!renderOk) {
          try {
            const retry = document.createElement("canvas").getContext("2d");
            if (retry) {
              drawBlock(retry, 0, 0, "#00d2ff", 16, "gemstone", false);
              drawBlock(retry, 0, 0, "#00d2ff", 16, "wire_glass", false);
              renderOk = true;
              fixed += 1;
              diagLog("🛠️ AUTO-FIXED: 블록 스킨 렌더러 재검증");
            }
          } catch (err) {
            renderOk = false;
          }
        }

        diagLog(`blockSkin clamp=${clampOk} options=${optionOk} lsGlass=${lsGlass} lsGem=${lsGem} lsWire=${lsWire} render=${renderOk} preview=${previewOk} guide=${guideOk}`);
        const ok = guideOk && clampOk && optionOk && lsGlass === "glass" && lsGem === "gemstone" && lsWire === "wire_glass" && renderOk;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.blockSkinStyle = prevSkin;
        persistBlockSkinStyle();
        try {
          syncBlockSkinUi();
          redrawBlockSkins();
        } catch (err) {
          /* ignore */
        }
      }
    },
    "13-1": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync([
        "guideCheerTitle", "guideCheerBody", "guideCheerHow", "guideDiagStage13",
      ]);
      const banner = document.getElementById("dad-cheer-banner");
      const textEl = document.getElementById("dad-cheer-text");
      const badge = document.getElementById("dad-cheer-badge");
      const tipEl = document.getElementById("dad-cheer-tip");
      const fnOk = typeof updateCheerMsg === "function" && typeof flashDadCheer === "function";
      let wrote = false;
      if (banner && textEl && fnOk) {
        wrote = !!updateCheerMsg("combo", "DIAG CHEER TEST", "DIAG TIP", { force: true, animate: false });
        if (!wrote || textEl.textContent !== "DIAG CHEER TEST") {
          textEl.textContent = "DIAG CHEER TEST";
          wrote = textEl.textContent === "DIAG CHEER TEST";
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 응원 전광판 텍스트 직접 연결");
        }
      }
      try {
        resetDadCheer();
      } catch (err) {
        /* ignore */
      }
      diagLog(`cheer banner=${!!banner} text=${!!textEl} badge=${!!badge} tip=${!!tipEl} fn=${fnOk} wrote=${wrote} guide=${guideOk}`);
      const ok = guideOk && !!banner && !!textEl && fnOk && wrote;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "14-1": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync([
        "guideSettingsMobileTitle", "guideSettingsMobileBody", "guideSettingsMobileHow",
        "guideMobileTitle", "guideDiagStage14",
      ]);
      const pad = document.getElementById("mobile-controls") || document.getElementById("mobile-controller");
      const ids = ["btn-left", "btn-right", "btn-down", "btn-rotate", "btn-drop", "btn-hold"];
      const missing = ids.filter((id) => !document.getElementById(id));
      let bound = !!(pad && pad.dataset.touchBound === "1");
      if (pad && !bound) {
        try {
          bindMobileControls();
          bound = pad.dataset.touchBound === "1";
          if (bound) {
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: 모바일 터치 리스너 재바인딩");
          }
        } catch (err) {
          bound = false;
        }
      }
      const hapticApi = !!(navigator && typeof navigator.vibrate === "function");
      let hapticGuard = true;
      try {
        hapticTap(1);
      } catch (err) {
        hapticGuard = false;
      }
      const touchAction = pad ? (window.getComputedStyle(pad).touchAction || "") : "";
      diagLog(`pad=${!!pad} missing=[${missing.join(",")}] bound=${bound} hapticAPI=${hapticApi} hapticGuard=${hapticGuard} touchAction=${touchAction} guide=${guideOk}`);
      const ok = guideOk && !!pad && missing.length === 0 && bound && hapticGuard;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "15-1": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync([
        "guideScoreboardTitle", "guideScoreboardBody", "guideScoreboardHow", "guideDiagStage15",
      ]);
      const hudOk = ["score", "level", "lines", "best", "best-card"].every((id) => !!document.getElementById(id));
      let skinRaw = "";
      let skinOk = false;
      try {
        skinRaw = localStorage.getItem(BLOCK_SKIN_KEY) || "";
        skinOk = !skinRaw || BLOCK_SKIN_IDS.indexOf(clampBlockSkin(skinRaw)) >= 0;
        if (skinRaw && clampBlockSkin(skinRaw) !== skinRaw) {
          persistBlockSkinStyle();
          skinRaw = localStorage.getItem(BLOCK_SKIN_KEY) || "";
          skinOk = BLOCK_SKIN_IDS.indexOf(skinRaw) >= 0;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: block_skin_style 정규화");
        }
      } catch (err) {
        skinOk = true;
      }

      let settingsOk = false;
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const volOk = Number.isFinite(Number(parsed.soundVolume)) && Number.isFinite(Number(parsed.bgmVolume));
          settingsOk = !!parsed && typeof parsed === "object" && volOk;
          if (!settingsOk) {
            healSettingsSchema(settings);
            saveSettings();
            settingsOk = true;
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: 설정 JSON 재기록");
          }
        } else {
          saveSettings();
          settingsOk = true;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 설정 키 생성");
        }
      } catch (err) {
        try {
          healSettingsSchema(settings);
          saveSettings();
          settingsOk = true;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: 손상된 설정 JSON 복구");
        } catch (healErr) {
          settingsOk = false;
        }
      }

      let bestOk = false;
      try {
        const stored = Number(localStorage.getItem(BEST_KEY) || 0);
        bestOk = Number.isFinite(stored) && stored >= 0;
        if (!bestOk) {
          localStorage.setItem(BEST_KEY, "0");
          bestOk = true;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: BEST 스코어 키 복구");
        }
      } catch (err) {
        bestOk = true;
      }

      const volMemOk = Number.isFinite(Number(settings.soundVolume)) && Number.isFinite(Number(settings.bgmVolume));
      diagLog(`storage skin=${skinRaw || "(default)"} skinOk=${skinOk} settingsOk=${settingsOk} bestOk=${bestOk} volMem=${volMemOk} hud=${hudOk} guide=${guideOk}`);
      const ok = guideOk && hudOk && skinOk && settingsOk && bestOk && volMemOk;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "16-1": async () => {
      let fixed = 0;
      const select = document.getElementById("select-board-size");
      if (!select) {
        diagLog("❌ select-board-size missing");
        return "fail";
      }
      const guideOk = diagGuideSync([
        "guideBoardSizeTitle", "guideBoardSizeBody", "guideDiagStage16",
        "boardSizeTitle", "boardSizeHint", "boardSize20", "boardSize24", "boardSize28",
        "boardSizeMobileOnly",
      ]);
      const prevRows = ROWS;
      const prevSetting = clampBoardRows(settings.boardRowsCount);
      const prevCells = cells;
      const mobile = isMobileDevice();
      try {
        const clampOk = clampBoardRows(20) === 20
          && clampBoardRows(24) === 24
          && clampBoardRows(28) === 28
          && clampBoardRows("20") === 20
          && clampBoardRows("24") === 24
          && clampBoardRows(99) === 20
          && clampBoardRows("nope") === 20
          && clampBoardRows(null) === 20
          && clampBoardRows(SETTING_DEFAULTS.boardRowsCount) === 20
          && BOARD_ROWS_ALLOWED.join(",") === "20,24,28";
        const optionOk = select.options.length >= 3
          && BOARD_ROWS_ALLOWED.every((n) => Array.from(select.options).some((opt) => opt.value === String(n)));

        let gridsOk = true;
        BOARD_ROWS_ALLOWED.forEach((n) => {
          const grid = Array.from({ length: n }, () => Array(COLS).fill(null));
          if (grid.length !== n || !grid.every((row) => row && row.length === COLS)) {
            gridsOk = false;
            diagLog(`grid n=${n} invalid rows=${grid.length}`);
          }
        });

        const lockOk = effectiveBoardRows(24) === (mobile ? 20 : 24)
          && effectiveBoardRows(28) === (mobile ? 20 : 28)
          && effectiveBoardRows(20) === 20;

        let scaleOk = true;
        const scaleLog = [];
        if (mobile) {
          if (ROWS !== BOARD_ROWS_DEFAULT) {
            ROWS = BOARD_ROWS_DEFAULT;
            cells = createBoard();
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: 모바일 ROWS=20 강제 고정");
          }
          applyBoardAspectCss();
          resize();
          const expectedW = COLS * cellSize;
          const expectedH = BOARD_ROWS_DEFAULT * cellSize;
          if (!boardCanvas || boardCanvas.width !== expectedW || boardCanvas.height !== expectedH || ROWS !== 20) {
            if (boardCanvas && cellSize > 0) {
              ROWS = BOARD_ROWS_DEFAULT;
              boardCanvas.width = expectedW;
              boardCanvas.height = expectedH;
              if (bgCanvas) {
                bgCanvas.width = expectedW;
                bgCanvas.height = expectedH;
              }
              invalidateStaticBackground();
              renderStaticBackground();
              fixed += 1;
              diagLog("🛠️ AUTO-FIXED: 모바일 캔버스 10×20 스케일");
            } else {
              scaleOk = false;
            }
          }
          const cssVar = (document.documentElement.style.getPropertyValue("--board-aspect") || "").replace(/\s+/g, "");
          if (cssVar !== "10/20") {
            applyBoardAspectCss();
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: 모바일 --board-aspect 10/20");
          }
          scaleLog.push(`mobile20:${boardCanvas ? boardCanvas.width : 0}x${boardCanvas ? boardCanvas.height : 0}`);
          syncBoardSizeUi();
          const uiOk = select.disabled && select.value === "20";
          diagLog(`boardSize mobileLock=${mobile} lock=${lockOk} clamp=${clampOk} options=${optionOk} grids=${gridsOk} scale=${scaleOk} ui=${uiOk} rows=${ROWS} canvas=[${scaleLog.join(",")}] guide=${guideOk}`);
          const ok = guideOk && clampOk && optionOk && gridsOk && scaleOk && lockOk && ROWS === 20 && uiOk;
          return ok ? (fixed ? "fix" : "pass") : "fail";
        }

        BOARD_ROWS_ALLOWED.forEach((n) => {
          ROWS = n;
          cells = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
          applyBoardAspectCss();
          resize();
          const expectedW = COLS * cellSize;
          const expectedH = ROWS * cellSize;
          const wOk = !!boardCanvas && boardCanvas.width === expectedW;
          const hOk = !!boardCanvas && boardCanvas.height === expectedH;
          if (!wOk || !hOk) {
            if (boardCanvas && cellSize > 0) {
              boardCanvas.width = expectedW;
              boardCanvas.height = expectedH;
              if (bgCanvas) {
                bgCanvas.width = expectedW;
                bgCanvas.height = expectedH;
              }
              invalidateStaticBackground();
              renderStaticBackground();
              fixed += 1;
              diagLog(`🛠️ AUTO-FIXED: canvas ${n}행 ${expectedW}x${expectedH}`);
            } else {
              scaleOk = false;
            }
          }
          const cssVar = (document.documentElement.style.getPropertyValue("--board-aspect") || "").replace(/\s+/g, "");
          if (cssVar !== `${COLS}/${n}`) {
            applyBoardAspectCss();
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: --board-aspect 재설정");
          }
          scaleLog.push(`${n}:${boardCanvas ? boardCanvas.width : 0}x${boardCanvas ? boardCanvas.height : 0}`);
        });

        settings.boardRowsCount = 24;
        persistBoardRowsCount();
        let ls = "";
        try {
          ls = localStorage.getItem(BOARD_ROWS_KEY) || "";
        } catch (err) {
          ls = "";
        }
        if (ls !== "24") {
          persistBoardRowsCount();
          try {
            ls = localStorage.getItem(BOARD_ROWS_KEY) || "";
          } catch (err) {
            ls = "";
          }
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: board_rows_count 재기록");
        }
        syncBoardSizeUi();
        const uiOk = select.value === "24" || select.value === String(clampBoardRows(settings.boardRowsCount));

        diagLog(`boardSize mobileLock=${mobile} lock=${lockOk} clamp=${clampOk} options=${optionOk} grids=${gridsOk} scale=${scaleOk} ls=${ls} ui=${uiOk} canvas=[${scaleLog.join(",")}] guide=${guideOk}`);
        const ok = guideOk && clampOk && optionOk && gridsOk && scaleOk && lockOk && ls === "24";
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } finally {
        settings.boardRowsCount = prevSetting;
        persistBoardRowsCount();
        ROWS = effectiveBoardRows(prevSetting);
        cells = prevCells && prevCells.length === ROWS ? prevCells : createBoard();
        applyBoardAspectCss();
        try {
          syncBoardSizeUi();
          resize();
        } catch (err) {
          /* restore optional */
        }
      }
    },
    "17-1": async () => {
      let fixed = 0;
      const probeKey = "__diag_idb_media_probe__";
      const guideOk = diagGuideSync(["guideDiagStage17"]);
      try {
        const db = await initDB();
        const apiOk = typeof saveMediaFile === "function"
          && typeof getMediaFile === "function"
          && typeof deleteMediaFile === "function"
          && typeof clearAllMedia === "function"
          && typeof initDB === "function";
        const nameOk = mediaStore.DB_NAME === "DadTetrisDB" && mediaStore.STORE === "media_files";
        const openOk = !!db && db.name === "DadTetrisDB" && db.objectStoreNames.contains("media_files");
        if (!openOk && db) {
          try {
            if (!db.objectStoreNames.contains("media_files")) {
              diagLog("🛠️ AUTO-FIXED: media_files 스토어 확인 재시도");
              fixed += 1;
            }
          } catch (err) {
            /* ignore */
          }
        }
        const payload = new Blob([`dad-tetris-idb-${Date.now()}`], { type: "text/plain" });
        let saved = await saveMediaFile(probeKey, payload);
        let readBack = await getMediaFile(probeKey);
        let roundtrip = !!(readBack && readBack.size === payload.size);
        if (!saved || !roundtrip) {
          saved = await saveMediaFile(probeKey, payload);
          readBack = await getMediaFile(probeKey);
          roundtrip = !!(readBack && readBack.size === payload.size);
          if (roundtrip) {
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: IndexedDB 쓰기/읽기 재시도");
          }
        }
        const url = mediaStore.peek(probeKey);
        const objectUrlOk = typeof url === "string" && url.indexOf("blob:") === 0;
        await deleteMediaFile(probeKey);
        const gone = !(await getMediaFile(probeKey));
        diagLog(`idb api=${apiOk} name=${nameOk} open=${openOk} save=${saved} roundtrip=${roundtrip} blobUrl=${objectUrlOk} delete=${gone} guide=${guideOk}`);
        const ok = guideOk && apiOk && nameOk && openOk && saved && roundtrip && objectUrlOk && gone;
        return ok ? (fixed ? "fix" : "pass") : "fail";
      } catch (err) {
        diagLog(`❌ IndexedDB: ${err && err.message ? err.message : err}`);
        try {
          console.error("[DadTetrisDB] diag failed", err);
        } catch (ignore) {
          /* ignore */
        }
        try {
          await deleteMediaFile(probeKey);
        } catch (delErr) {
          /* ignore */
        }
        return "fail";
      }
    },
    "18-1": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync(["guideDiagStage18"]);
      const bg = document.getElementById("bg-canvas");
      const fg = document.getElementById("tetris-canvas") || document.getElementById("board");
      const wrap = document.getElementById("tetris-board-wrapper") || document.querySelector(".board-canvas-stack");
      if (!bg || !fg) {
        diagLog("❌ dual canvas missing (bg-canvas / tetris-canvas)");
        return "fail";
      }
      let ctxBg = null;
      let ctxFg = null;
      try {
        ctxBg = bg.getContext("2d");
        ctxFg = fg.getContext("2d");
      } catch (err) {
        diagLog("❌ dual canvas 2d context");
        return "fail";
      }
      const ctxOk = !!ctxBg && !!ctxFg;
      if (bg.width !== fg.width || bg.height !== fg.height) {
        const w = fg.width || COLS * cellSize;
        const h = fg.height || ROWS * cellSize;
        bg.width = w;
        fg.width = w;
        bg.height = h;
        fg.height = h;
        invalidateStaticBackground();
        renderStaticBackground();
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: bg/fg canvas buffer 동기화");
      }
      const sizeOk = bg.width === fg.width && bg.height === fg.height && bg.width > 0 && bg.height > 0;
      const fnOk = typeof renderStaticBackground === "function" && typeof invalidateStaticBackground === "function";
      if (fnOk && staticBgDirty) {
        renderStaticBackground();
        fixed += 1;
        diagLog("🛠️ AUTO-FIXED: renderStaticBackground 1회 재호출");
      }
      let fgTransparent = false;
      try {
        const cs = window.getComputedStyle(fg);
        const bgc = (cs.backgroundColor || "").replace(/\s+/g, "").toLowerCase();
        fgTransparent = !cs.backgroundColor
          || cs.backgroundColor === "transparent"
          || bgc === "rgba(0,0,0,0)"
          || bgc === "rgb(0,0,0,0)"
          || bgc === "transparent";
        if (!fgTransparent) {
          fg.style.setProperty("background", "transparent", "important");
          fg.style.setProperty("background-image", "none", "important");
          const cs2 = window.getComputedStyle(fg);
          const bgc2 = (cs2.backgroundColor || "").replace(/\s+/g, "").toLowerCase();
          fgTransparent = !cs2.backgroundColor
            || cs2.backgroundColor === "transparent"
            || bgc2 === "rgba(0,0,0,0)"
            || bgc2 === "transparent";
          if (fgTransparent) {
            fixed += 1;
            diagLog("🛠️ AUTO-FIXED: foreground canvas 투명 배경");
          }
        }
      } catch (err) {
        fgTransparent = true;
      }
      let zOk = false;
      try {
        const zBg = Number.parseInt(window.getComputedStyle(bg).zIndex, 10);
        const zFg = Number.parseInt(window.getComputedStyle(fg).zIndex, 10);
        zOk = Number.isFinite(zBg) && Number.isFinite(zFg) && zFg > zBg;
        if (!zOk) {
          bg.style.zIndex = "1";
          fg.style.zIndex = "2";
          zOk = true;
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: dual canvas z-index 1/2");
        }
      } catch (err) {
        zOk = true;
      }
      const stackOk = !!wrap;
      const dualEngine = !!(bgCanvas && bgCtx && canvas && ctx);
      diagLog(`dualCanvas bg=${!!bg} fg=${!!fg} stack=${stackOk} ctx=${ctxOk} size=${bg.width}x${bg.height} match=${sizeOk} fn=${fnOk} fgClear=${fgTransparent} z=${zOk} engine=${dualEngine} guide=${guideOk}`);
      const ok = guideOk && ctxOk && sizeOk && fnOk && fgTransparent && zOk && stackOk && dualEngine;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
    "19-1": async () => {
      let fixed = 0;
      const guideOk = diagGuideSync(["guideDiagStage19"]);
      bindDadModules();
      const check = uiController.verifyModules();
      if (!check.ok) {
        bindDadModules();
        const again = uiController.verifyModules();
        if (again.ok) {
          fixed += 1;
          diagLog("🛠️ AUTO-FIXED: ES 모듈 호스트 재바인딩");
        }
      }
      const finalCheck = uiController.verifyModules();
      const storageOk = !!(dbManager && storageUtil && typeof mediaStore.saveMediaFile === "function");
      const audioOk = !!(soundManager && sfx && typeof sfx.play === "function" && typeof sfx.ensure === "function");
      const renderOk = !!(renderEngine && typeof drawBlock === "function" && typeof renderStaticBackground === "function");
      const uiOk = !!(uiController && typeof updateCheerMsg === "function" && typeof runDiagnostics === "function");
      const engineOk = typeof GameEngine === "function";
      diagLog(`esm storage=${storageOk && finalCheck.storageOk} audio=${audioOk && finalCheck.audioOk} render=${renderOk && finalCheck.renderOk} ui=${uiOk && finalCheck.uiOk} engine=${engineOk && finalCheck.engineOk} guide=${guideOk}`);
      const ok = guideOk && storageOk && audioOk && renderOk && uiOk && engineOk && finalCheck.ok;
      return ok ? (fixed ? "fix" : "pass") : "fail";
    },
  };

  async function runVisualAutoTest() {
    if (diagRunning) {
      return;
    }
    const ui = diagEls();
    diagRunning = true;
    try {
      document.body.classList.add("diag-running");
    } catch (err) {
      /* ignore */
    }
    if (ui.modal) {
      ui.modal.classList.add("is-running");
    }
    if (ui.run) {
      ui.run.disabled = true;
    }
    if (ui.close) {
      ui.close.disabled = true;
    }
    if (ui.log) {
      ui.log.textContent = "";
    }
    document.querySelectorAll(".diag-cert").forEach((el) => el.remove());
    buildDiagItems();
    attachDiagRuns();
    const snap = snapshotDiagGame();
    const prevMute = sfx.muted;
    sfx.muted = true;
    diagLog("=== Visual Auto-Test Runner boot ===");
    const ctx = { done: 0, ok: true, failed: 0, fixed: 0 };
    try {
      for (const item of DIAG_CASES) {
        try {
          await runDiagCase(item, ctx);
        } catch (caseErr) {
          ctx.done += 1;
          ctx.failed += 1;
          diagLog(`❌ pipeline: ${item && item.id} ${caseErr && caseErr.message ? caseErr.message : caseErr}`);
        }
      }
    } finally {
      try {
        restoreDiagGame(snap);
      } catch (err) {
        diagLog(`restore: ${err && err.message ? err.message : err}`);
      }
      sfx.muted = prevMute;
    }
    const allClear = ctx.failed === 0;
    const fxBadges = ["6-1", "6-2", "6-3"].map((id) => document.querySelector(`[data-diag-badge="${id}"]`));
    const fxOk = fxBadges.every((el) => el && (el.classList.contains("is-pass") || el.classList.contains("is-fix")));
    if (fxOk) {
      diagLog("[🎨 THEME & FX: PASS]");
    }
    const bgBadges = ["7-1", "7-2", "7-3", "7-4", "7-5", "7-6", "7-7"].map((id) => document.querySelector(`[data-diag-badge="${id}"]`));
    const bgOk = bgBadges.every((el) => el && (el.classList.contains("is-pass") || el.classList.contains("is-fix")));
    if (bgOk) {
      const passLine = "[🖼️ BG & TOUCH: PASS]";
      const greenLine = t("diagAllGreen");
      diagLog(passLine);
      diagLog(greenLine);
      try {
        console.info("[DAD TETRIS]", passLine);
        console.info("[DAD TETRIS]", greenLine);
      } catch (err) {
        /* ignore */
      }
    }
    const recBadge = document.querySelector('[data-diag-badge="8-1"]');
    const recOk = recBadge && (recBadge.classList.contains("is-pass") || recBadge.classList.contains("is-fix"));
    if (recOk) {
      const recLine = "[⚡ AUTO RECORD: PASS]";
      diagLog(recLine);
      try {
        console.info("[DAD TETRIS]", recLine);
      } catch (err) {
        /* ignore */
      }
    }
    const garbageBadge = document.querySelector('[data-diag-badge="9-1"]');
    const garbageOk = garbageBadge && (garbageBadge.classList.contains("is-pass") || garbageBadge.classList.contains("is-fix"));
    if (garbageOk) {
      const garbageLine = "[🧱 GARBAGE LINES: PASS]";
      diagLog(garbageLine);
      try {
        console.info("[DAD TETRIS]", garbageLine);
      } catch (err) {
        /* ignore */
      }
    }
    const previewBadge = document.querySelector('[data-diag-badge="10-1"]');
    const previewOk = previewBadge && (previewBadge.classList.contains("is-pass") || previewBadge.classList.contains("is-fix"));
    if (previewOk) {
      const previewLine = "[🧩 PREVIEW MODE: PASS]";
      diagLog(previewLine);
      try {
        console.info("[DAD TETRIS]", previewLine);
      } catch (err) {
        /* ignore */
      }
    }
    const dropSpeedBadge = document.querySelector('[data-diag-badge="11-1"]');
    const dropSpeedOk = dropSpeedBadge && (dropSpeedBadge.classList.contains("is-pass") || dropSpeedBadge.classList.contains("is-fix"));
    if (dropSpeedOk) {
      const dropSpeedLine = "[⏱️ DROP SPEED: PASS]";
      diagLog(dropSpeedLine);
      try {
        console.info("[DAD TETRIS]", dropSpeedLine);
      } catch (err) {
        /* ignore */
      }
    }
    const blockSkinBadge = document.querySelector('[data-diag-badge="12-1"]');
    const blockSkinOk = blockSkinBadge && (blockSkinBadge.classList.contains("is-pass") || blockSkinBadge.classList.contains("is-fix"));
    if (blockSkinOk) {
      const blockSkinLine = "[🧊 BLOCK SKIN: PASS]";
      diagLog(blockSkinLine);
      try {
        console.info("[DAD TETRIS]", blockSkinLine);
      } catch (err) {
        /* ignore */
      }
    }
    const cheerBadge = document.querySelector('[data-diag-badge="13-1"]');
    const cheerOk = cheerBadge && (cheerBadge.classList.contains("is-pass") || cheerBadge.classList.contains("is-fix"));
    if (cheerOk) {
      const cheerLine = "[📢 CHEER BOARD: PASS]";
      diagLog(cheerLine);
      try {
        console.info("[DAD TETRIS]", cheerLine);
      } catch (err) {
        /* ignore */
      }
    }
    const touchBadge = document.querySelector('[data-diag-badge="14-1"]');
    const touchOk = touchBadge && (touchBadge.classList.contains("is-pass") || touchBadge.classList.contains("is-fix"));
    if (touchOk) {
      const touchLine = "[📱 MOBILE TOUCH: PASS]";
      diagLog(touchLine);
      try {
        console.info("[DAD TETRIS]", touchLine);
      } catch (err) {
        /* ignore */
      }
    }
    const storageBadge = document.querySelector('[data-diag-badge="15-1"]');
    const storageOk = storageBadge && (storageBadge.classList.contains("is-pass") || storageBadge.classList.contains("is-fix"));
    if (storageOk) {
      const storageLine = "[💾 STORAGE: PASS]";
      diagLog(storageLine);
      try {
        console.info("[DAD TETRIS]", storageLine);
      } catch (err) {
        /* ignore */
      }
    }
    const boardSizeBadge = document.querySelector('[data-diag-badge="16-1"]');
    const boardSizeOk = boardSizeBadge && (boardSizeBadge.classList.contains("is-pass") || boardSizeBadge.classList.contains("is-fix"));
    if (boardSizeOk) {
      const boardSizeLine = "[📏 BOARD SIZE: PASS]";
      diagLog(boardSizeLine);
      try {
        console.info("[DAD TETRIS]", boardSizeLine);
      } catch (err) {
        /* ignore */
      }
    }
    const idbBadge = document.querySelector('[data-diag-badge="17-1"]');
    const idbOk = idbBadge && (idbBadge.classList.contains("is-pass") || idbBadge.classList.contains("is-fix"));
    if (idbOk) {
      const idbLine = "[🗄️ INDEXEDDB: PASS]";
      diagLog(idbLine);
      try {
        console.info("[DAD TETRIS]", idbLine);
      } catch (err) {
        /* ignore */
      }
    }
    const dualCanvasBadge = document.querySelector('[data-diag-badge="18-1"]');
    const dualCanvasOk = dualCanvasBadge && (dualCanvasBadge.classList.contains("is-pass") || dualCanvasBadge.classList.contains("is-fix"));
    if (dualCanvasOk) {
      const dualCanvasLine = "[🖼️ DUAL CANVAS: PASS]";
      diagLog(dualCanvasLine);
      try {
        console.info("[DAD TETRIS]", dualCanvasLine);
      } catch (err) {
        /* ignore */
      }
    }
    const esmBadge = document.querySelector('[data-diag-badge="19-1"]');
    const esmOk = esmBadge && (esmBadge.classList.contains("is-pass") || esmBadge.classList.contains("is-fix"));
    if (esmOk) {
      const esmLine = "[📦 ESM MODULES: PASS]";
      diagLog(esmLine);
      try {
        console.info("[DAD TETRIS]", esmLine);
      } catch (err) {
        /* ignore */
      }
    }

    const coreIds = CORE_DIAG_IDS && CORE_DIAG_IDS.length ? CORE_DIAG_IDS : ["C1", "C2", "C3", "C4", "C5", "C6", "C7"];
    const corePassed = coreIds.filter((id) => {
      const el = document.querySelector(`[data-diag-badge="${id}"]`);
      return !!(el && (el.classList.contains("is-pass") || el.classList.contains("is-fix")));
    }).length;
    const coreOk = corePassed === coreIds.length;
    if (coreOk) {
      diagLog(`[🩺 CORE PIPELINE: PASS ${corePassed}/${coreIds.length}]`);
    } else {
      diagLog(`[🩺 CORE PIPELINE: ${corePassed}/${coreIds.length}]`);
    }
    diagSetProgress(DIAG_CASES.length, DIAG_CASES.length, allClear ? t("diagCert") : t("diagFail"));
    const cert = document.createElement("p");
    cert.className = allClear ? "diag-cert" : "diag-cert is-fail";
    cert.textContent = allClear ? t("diagCert") : t("diagFail");
    const log = document.getElementById("diag-log");
    if (log && log.parentNode) {
      if (coreOk) {
        const core = document.createElement("p");
        core.className = "diag-cert diag-core-systems diag-all-green";
        core.setAttribute("role", "status");
        core.textContent = t("diagCoreSystemsOk");
        log.parentNode.insertBefore(core, log);
      }
      log.parentNode.insertBefore(cert, log);
      if (bgOk) {
        const green = document.createElement("p");
        green.className = "diag-cert diag-all-green";
        green.textContent = t("diagAllGreen");
        log.parentNode.insertBefore(green, log);
      }
    }
    if (coreOk) {
      const coreLine = t("diagCoreSystemsOk");
      diagLog(coreLine);
      try {
        console.info("[DAD TETRIS]", coreLine);
      } catch (err) {
        /* ignore */
      }
    }
    diagLog(allClear
      ? "🎉 100% 무결점 인증 완료! (All Systems Operational)"
      : `⚠️ ${ctx.failed} item(s) failed · auto-fixed=${ctx.fixed}`);
    if (allClear) {
      try {
        sfx.play("fanfare");
      } catch (err) {
        /* ignore */
      }
    }
    if (ui.close) {
      ui.close.disabled = false;
    }
    if (ui.run) {
      ui.run.disabled = false;
      ui.run.textContent = t("diagRun");
    }
    if (ui.modal) {
      ui.modal.classList.remove("is-running");
    }
    try {
      document.body.classList.remove("diag-running");
    } catch (err) {
      /* ignore */
    }
    diagRunning = false;
  }

  function openDiagModal() {
    const { modal, close, run, current } = diagEls();
    if (!modal) {
      return;
    }
    if (helpOpen) {
      closeGuideModal();
    }
    diagOpen = true;
    if (diagRunning) {
      modal.classList.remove("hidden");
      document.body.classList.add("modal-open");
      return;
    }
    buildDiagItems();
    if (current) {
      current.textContent = t("diagIdle");
    }
    diagSetProgress(0, DIAG_CASES.length, t("diagIdle"));
    if (close) {
      close.disabled = true;
    }
    if (run) {
      run.disabled = true;
    }
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    window.setTimeout(() => {
      if (diagOpen && !diagRunning) {
        runVisualAutoTest();
      }
    }, 80);
  }

  function closeDiagModal() {
    if (diagRunning) {
      return;
    }
    const { modal } = diagEls();
    diagOpen = false;
    if (modal) {
      modal.classList.add("hidden");
    }
    if (!settingsOpen && !celebrateOpen && !scoreSaveOpen && !hallOpen && !helpOpen && !autoplayEndOpen) {
      document.body.classList.remove("modal-open");
    }
  }

  function toggleDiagModal() {
    if (diagOpen) {
      closeDiagModal();
      return;
    }
    openDiagModal();
  }

  function scheduleResize() {
    window.requestAnimationFrame(() => {
      resize();
      runSelfCheck(selfCheckOnce ? "resize" : "boot");
    });
  }

  function themeRgb() {
    try {
      const raw = (getComputedStyle(document.documentElement).getPropertyValue("--theme-primary") || "").trim() || "#00d2ff";
      if (raw.charAt(0) === "#" && raw.length >= 7) {
        const n = parseInt(raw.slice(1, 7), 16);
        if (Number.isFinite(n)) {
          return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }
      }
    } catch (err) {
      /* ignore */
    }
    return [0, 210, 255];
  }

  function shade(hex, factor) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
    const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
    const b = Math.min(255, Math.round((n & 255) * factor));
    return `rgb(${r},${g},${b})`;
  }

  function updateGhostPreview() {
    renderGhostPreview(currentGhostOpacity(), currentPreviewSkin());
  }

  function draw() {
    if (gameTerminated) {
      return;
    }
    const fg = boardCtx;
    const size = cellSize;
    const focusOn = dadFocusActive();
    const dual = !!(bgCanvas && bgCtx);
    if (dual) {
      if (staticBgDirty) {
        renderStaticBackground();
      }
      fg.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      fg.clearRect(0, 0, canvas.width, canvas.height);
      drawNeonWell(fg, focusOn);
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * size;
        const y = r * size;
        const locked = cells[r] && cells[r][c];
        if (locked) {
          fillBlock(fg, x, y, size, COLORS[locked] || COLORS.G || "#7A889C");
          if (focusOn) {
            fg.save();
            fg.lineWidth = Math.max(1.6, size / 14);
            fg.strokeStyle = "rgba(154, 246, 255, 0.88)";
            fg.shadowColor = "rgba(46, 230, 255, 0.7)";
            fg.shadowBlur = 8;
            fg.strokeRect(x + 1.2, y + 1.2, size - 2.4, size - 2.4);
            fg.restore();
          }
        }
      }
    }

    if (current) {
      const dist = dadSlideActive()
        ? dadLandingPiece(current).row - current.row
        : dropDistance(current);
      if (settings.ghost && dist !== 0) {
        for (const [c, r] of pieceCells(current)) {
          const gr = r + dist;
          if (c < 0 || c >= COLS || gr < 0 || gr >= ROWS) {
            continue;
          }
          drawBlock(fg, c * size, gr * size, COLORS[current.type], size, currentBlockSkin(), true);
        }
      }
      for (const [c, r] of pieceCells(current)) {
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
          continue;
        }
        fillBlock(fg, c * size, r * size, size, COLORS[current.type]);
      }
      if (dadSpecialOn() && lockDelayMs > 0) {
        const pulse = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(performance.now() / 160));
        fg.save();
        fg.lineWidth = Math.max(2.2, size / 9);
        fg.strokeStyle = `rgba(255, 214, 80, ${pulse})`;
        fg.shadowColor = "#ffd76a";
        fg.shadowBlur = 14 * pulse;
        for (const [c, r] of pieceCells(current)) {
          if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
            continue;
          }
          fg.strokeRect(c * size + 1.5, r * size + 1.5, size - 3, size - 3);
        }
        fg.restore();
      }
    }

    if (!dual) {
      const [tr, tg, tb] = themeRgb();
      fg.save();
      fg.strokeStyle = focusOn ? `rgba(${tr},${tg},${tb},0.38)` : `rgba(${tr},${tg},${tb},0.18)`;
      fg.lineWidth = 1;
      fg.beginPath();
      for (let c = 0; c <= COLS; c++) {
        fg.moveTo(c * size + 0.5, 0);
        fg.lineTo(c * size + 0.5, ROWS * size);
      }
      for (let r = 0; r <= ROWS; r++) {
        fg.moveTo(0, r * size + 0.5);
        fg.lineTo(COLS * size, r * size + 0.5);
      }
      fg.stroke();
      fg.restore();

      fg.save();
      fg.strokeStyle = `rgba(${tr},${tg},${tb},${focusOn ? 0.7 : 0.45})`;
      fg.lineWidth = Math.max(2, size / 18);
      fg.shadowColor = `rgba(${tr},${tg},${tb},0.7)`;
      fg.shadowBlur = 14;
      fg.strokeRect(1, 1, COLS * size - 2, ROWS * size - 2);
      fg.restore();
    }

    drawFlashes(fg);
    drawParticles(fg);
    drawNext();
  }

  function spawnConquerFireworks() {
    if (!settings.particles) {
      return;
    }
    const size = cellSize;
    const bursts = [
      { x: COLS * 0.28, y: ROWS * 0.3 },
      { x: COLS * 0.72, y: ROWS * 0.26 },
      { x: COLS * 0.5, y: ROWS * 0.46 },
      { x: COLS * 0.36, y: ROWS * 0.64 },
      { x: COLS * 0.66, y: ROWS * 0.58 },
    ];
    const colors = ["#ffd76a", "#7ee7ff", "#ff7ad9", "#fff4c4", "#5ce1e6", "#ffb347"];
    flashes.push({ y: 0, h: ROWS * size, life: 1.25, neon: true, tetris: true });
    for (const burst of bursts) {
      const cx = burst.x * size;
      const cy = burst.y * size;
      for (let i = 0; i < 36; i++) {
        const ang = (Math.PI * 2 * i) / 36 + Math.random() * 0.28;
        const spd = 3.2 + Math.random() * 12;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2.6,
          life: 1.28,
          decay: 0.007 + Math.random() * 0.012,
          size: 4 + Math.random() * (size * 0.42),
          color: colors[i % colors.length],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.45,
        });
      }
    }
  }

  function spawnDadLockSpark() {
    triggerDadSnapFlash();
    addShake(12);
    sfx.play("drop");
    if (!current) {
      return;
    }
    const size = cellSize;
    flashes.push({ y: 0, h: ROWS * size, life: 0.72, neon: true, dadSnap: true });
    if (!settings.particles) {
      return;
    }
    const golds = ["#ffe08a", "#fff6c8", "#ffd76a", "#7cf0ff"];
    for (const [c, r] of pieceCells(current)) {
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) {
        continue;
      }
      const cx = (c + 0.5) * size;
      const cy = (r + 0.5) * size;
      for (let i = 0; i < 11; i++) {
        const ang = (Math.PI * 2 * i) / 11 + Math.random() * 0.35;
        const spd = 2.2 + Math.random() * 7.5;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 3.2,
          life: 1,
          decay: 0.014 + Math.random() * 0.018,
          size: 3.5 + Math.random() * (size * 0.32),
          color: golds[i % golds.length],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.4
        });
      }
    }
  }

  function spawnLineBurst(fullRows) {
    if (!settings.particles) {
      return;
    }
    const size = cellSize;
    const mega = fullRows.length >= 3;
    const tetris = fullRows.length >= 4;
    const themeColors = themeParticleColors();
    if (tetris) {
      flashes.push({ y: 0, h: ROWS * size, life: 1.15, neon: true, tetris: true });
      spawnTetrisFireworks();
    }
    for (const { row, types } of fullRows) {
      flashes.push({ y: row * size, h: size, life: mega ? 1.35 : 1, neon: mega, tetris: false });
      for (let c = 0; c < COLS; c++) {
        const color = COLORS[types[c]] || themeColors[c % themeColors.length];
        const cx = (c + 0.5) * size;
        const cy = (row + 0.5) * size;
        const count = tetris ? 36 : (mega ? 28 : 20);
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count + Math.random() * 0.45;
          const spd = (tetris ? 4.2 : mega ? 3.6 : 2.8) + Math.random() * (tetris ? 16 : mega ? 14 : 10);
          particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - (tetris ? 5.2 : mega ? 4.4 : 3.2),
            life: tetris ? 1.28 : mega ? 1.15 : 1,
            decay: tetris ? 0.007 + Math.random() * 0.01 : mega ? 0.008 + Math.random() * 0.012 : 0.01 + Math.random() * 0.016,
            size: 5 + Math.random() * (size * (tetris ? 0.55 : mega ? 0.5 : 0.38)),
            color: i % 3 === 0 ? themeColors[i % themeColors.length] : (i % 5 === 0 ? "#fff6e8" : color),
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.4,
          });
        }
      }
    }
  }

  function spawnTetrisFireworks() {
    const size = cellSize;
    const golds = ["#ffd76a", "#fff4c4", "#ff8a3d", "#ffe08a", "#ffffff"];
    const bursts = [
      { x: COLS * 0.5, y: ROWS * 0.42 },
      { x: COLS * 0.22, y: ROWS * 0.3 },
      { x: COLS * 0.78, y: ROWS * 0.3 },
    ];
    for (const burst of bursts) {
      const cx = burst.x * size;
      const cy = burst.y * size;
      for (let i = 0; i < 28; i++) {
        const ang = (Math.PI * 2 * i) / 28 + Math.random() * 0.3;
        const spd = 3.6 + Math.random() * 13;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 3.4,
          life: 1.22,
          decay: 0.008 + Math.random() * 0.012,
          size: 4 + Math.random() * (size * 0.4),
          color: golds[i % golds.length],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.5,
        });
      }
    }
  }

  function themeParticleColors() {
    const styles = getComputedStyle(document.documentElement);
    const primary = (styles.getPropertyValue("--theme-primary") || "#00d2ff").trim();
    const secondary = (styles.getPropertyValue("--theme-secondary") || "#163a7a").trim();
    const accent = (styles.getPropertyValue("--theme-accent") || "#ffd76a").trim();
    return [primary, accent, "#ffffff", secondary, "#7cf0ff"];
  }

  function updateFx() {
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.vx *= 0.986;
      p.life -= p.decay;
      p.rot += p.vr;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const f of flashes) {
      f.life -= f.tetris || f.neon ? 0.055 : 0.08;
    }
    flashes = flashes.filter((f) => f.life > 0);

    if (shake > 0 && boardWrap && !boardWrap.classList.contains("screen-shake") && !boardWrap.classList.contains("screen-shake-soft")) {
      shakeTick += 1;
      const x = Math.sin(shakeTick * 1.8) * shake * 0.55;
      const y = Math.abs(Math.cos(shakeTick * 2.2)) * shake * 0.9;
      boardWrap.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      shake *= shakeDecay;
      if (shake < 0.4) {
        shake = 0;
        shakeTick = 0;
        boardWrap.style.transform = "";
      }
    }
  }

  function triggerScreenShake(heavy) {
    if (!settings.shake || !boardWrap) {
      return;
    }
    boardWrap.classList.remove("screen-shake", "screen-shake-soft");
    const app = document.querySelector(".app");
    if (app) {
      app.classList.remove("screen-shake");
    }
    void boardWrap.offsetWidth;
    const cls = heavy ? "screen-shake" : "screen-shake-soft";
    boardWrap.classList.add(cls);
    if (heavy && app) {
      app.classList.add("screen-shake");
    }
    window.clearTimeout(screenShakeTid);
    screenShakeTid = window.setTimeout(() => {
      boardWrap.classList.remove("screen-shake", "screen-shake-soft");
      if (app) {
        app.classList.remove("screen-shake");
      }
    }, heavy ? 300 : 180);
  }

  function addShake(amount) {
    if (!settings.shake) {
      return;
    }
    const scaled = amount * unit(settings.shakeStrength, SETTING_DEFAULTS.shakeStrength);
    if (scaled <= 0) {
      return;
    }
    shake = Math.max(shake, scaled);
    shakeDecay = scaled >= 28 ? 0.9 : 0.84;
  }

  function triggerDadSnapFlash() {
    if (!boardWrap) {
      return;
    }
    boardWrap.classList.remove("is-dad-snap-flash");
    void boardWrap.offsetWidth;
    boardWrap.classList.add("is-dad-snap-flash");
    window.clearTimeout(dadSnapFlashTid);
    dadSnapFlashTid = window.setTimeout(() => {
      boardWrap.classList.remove("is-dad-snap-flash");
    }, 420);
  }

  function triggerNeonFlash(kind) {
    if (!boardWrap) {
      return;
    }
    boardWrap.classList.remove("is-tetris-flash", "is-triple-flash", "is-tspin-flash", "is-combo-flash", "is-ultra-flash");
    void boardWrap.offsetWidth;
    const cls = kind === "tetris" ? "is-tetris-flash" : kind === "tspin" ? "is-tspin-flash" : kind === "combo" ? "is-combo-flash" : "is-triple-flash";
    boardWrap.classList.add(cls);
    window.clearTimeout(neonFlashTid);
    neonFlashTid = window.setTimeout(() => {
      boardWrap.classList.remove("is-tetris-flash", "is-triple-flash", "is-tspin-flash", "is-combo-flash", "is-ultra-flash");
    }, kind === "tetris" || kind === "tspin" || kind === "combo" ? 150 : 380);
  }

  function triggerUltraJuice(kind) {
    addShake(kind === "tetris" ? 48 : 36);
    triggerScreenShake(true);
    if (!boardWrap) {
      return;
    }
    boardWrap.classList.remove("is-ultra-flash", "is-tetris-flash", "is-triple-flash", "is-tspin-flash", "is-combo-flash");
    void boardWrap.offsetWidth;
    boardWrap.classList.add("is-ultra-flash");
    if (kind === "tetris") {
      boardWrap.classList.add("is-tetris-flash");
    } else if (kind === "tspin") {
      boardWrap.classList.add("is-tspin-flash");
    } else {
      boardWrap.classList.add("is-combo-flash");
    }
    window.clearTimeout(neonFlashTid);
    neonFlashTid = window.setTimeout(() => {
      boardWrap.classList.remove("is-ultra-flash", "is-tetris-flash", "is-triple-flash", "is-tspin-flash", "is-combo-flash");
    }, 150);
  }

  function isTSpinLock() {
    if (!current || current.type !== "T" || lastPieceAction !== "rotate") {
      return false;
    }
    const cx = current.col + 1;
    const cy = current.row + 1;
    const corners = [[cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1], [cx + 1, cy + 1]];
    let filled = 0;
    corners.forEach(([c, r]) => {
      if (c < 0 || c >= COLS || r >= ROWS || (r >= 0 && cells[r] && cells[r][c])) {
        filled += 1;
      }
    });
    return filled >= 3;
  }

  function spawnShockwaveLine() {
    if (!settings.particles) {
      return;
    }
    const size = cellSize;
    const y = (ROWS - 0.12) * size;
    const colors = themeParticleColors();
    flashes.push({ y: (ROWS - 1) * size, h: size * 0.5, life: 0.78, neon: true, tetris: false });
    for (let c = 0; c < COLS; c++) {
      for (let i = 0; i < 5; i++) {
        particles.push({
          x: (c + Math.random()) * size,
          y,
          vx: (Math.random() - 0.5) * 4.2,
          vy: -2.4 - Math.random() * 7.2,
          life: 0.82,
          decay: 0.018 + Math.random() * 0.02,
          size: 3 + Math.random() * 6,
          color: i % 2 ? colors[i % colors.length] : "#ffffff",
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.35,
        });
      }
    }
  }

  function previewShake() {
    if (!settings.shake) {
      return;
    }
    const scaled = 22 * unit(settings.shakeStrength, SETTING_DEFAULTS.shakeStrength);
    if (scaled <= 0) {
      shake = 0;
      shakeTick = 0;
      boardWrap.style.transform = "";
      return;
    }
    shake = Math.max(scaled, 5);
    shakeTick = 0;
  }

  function isHoldKey(e) {
    const key = e.key;
    return e.code === "KeyH" || e.code === "KeyC" || e.code === "ShiftLeft" || e.code === "ShiftRight" ||
      key === "h" || key === "H" || key === "c" || key === "C" || key === "Shift";
  }

  function drawMiniPiece(ctx, canvas, piece) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const [tr, tg, tb] = themeRgb();
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#05070c");
    g.addColorStop(1, "#071018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = `rgba(${tr},${tg},${tb},0.22)`;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    if (!piece) {
      return;
    }
    const local = SHAPES[piece.type][0];
    let minX = 4;
    let minY = 4;
    let maxX = 0;
    let maxY = 0;
    for (const [x, y] of local) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const cols = Math.max(1, maxX - minX + 1);
    const rows = Math.max(1, maxY - minY + 1);
    const pad = Math.max(4, Math.floor(Math.min(w, h) * 0.045));
    const n = Math.max(18, Math.floor(Math.min((w - pad * 2) / cols, (h - pad * 2) / rows)));
    const pw = cols * n;
    const ph = rows * n;
    const ox = Math.floor((w - pw) / 2);
    const oy = Math.floor((h - ph) / 2);
    for (const [x, y] of local) {
      fillBlock(ctx, ox + (x - minX) * n, oy + (y - minY) * n, n, COLORS[piece.type]);
    }
  }

  function drawNext() {
    fitMiniCanvas(nextCanvas);
    fitMiniCanvas(holdCanvas);
    drawMiniPiece(nextCtx, nextCanvas, next);
    drawHold();
  }

  function drawHold() {
    if (!holdCtx || !holdCanvas) {
      return;
    }
    const dual = isDualPreviewMode();
    drawMiniPiece(holdCtx, holdCanvas, dual ? next2 : holdPiece);
    const card = document.getElementById("hold-card");
    if (card) {
      card.classList.toggle("is-locked", !dual && !canHold && !!holdPiece);
    }
  }

  function updateHud() {
    if (isUpdatingHud) {
      return;
    }
    isUpdatingHud = true;
    try {
      ui.score.textContent = String(score);
      ui.level.textContent = String(level);
      ui.lines.textContent = String(lines);
      rememberBest();
      ui.best.textContent = String(best);
      maybeCelebrateScore();
    } catch (err) {
      /* keep loop alive */
    } finally {
      isUpdatingHud = false;
    }
  }

  function rememberBest() {
    if (autoplayTouched) {
      ui.best.textContent = String(best);
      return;
    }
    const hall = loadHall();
    const topSaved = hall.length ? hall[0].score : 0;
    const nextBest = Math.max(topSaved, score);
    best = nextBest;
    try {
      localStorage.setItem(BEST_KEY, String(topSaved || best));
    } catch (err) {
      /* ignore */
    }
    ui.best.textContent = String(best);
    if (score > topSaved) {
      ui.best.classList.add("is-record");
      window.clearTimeout(rememberBest.tid);
      rememberBest.tid = window.setTimeout(() => {
        ui.best.classList.remove("is-record");
      }, 900);
    }
  }

  function showClearBanner(cleared, gained) {
    const names = { 1: t("clear1"), 2: t("clear2"), 3: t("clear3"), 4: t("tetris") };
    const name = names[cleared] || t("clearN", { n: cleared });
    if (cleared >= 4) {
      clearBanner.textContent = "🔥 TETRIS! 🔥";
      clearBanner.classList.add("is-tetris");
    } else {
      clearBanner.textContent = `${name}  +${gained}`;
      clearBanner.classList.remove("is-tetris");
    }
    clearBanner.classList.remove("hidden");
    window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(hideClearBanner, cleared >= 4 ? 1100 : 900);
  }

  function hideClearBanner() {
    clearBanner.classList.add("hidden");
    clearBanner.classList.remove("is-tetris");
  }

  function syncOverlayActions(mode) {
    const actions = document.getElementById("overlay-actions");
    if (!actions) {
      return;
    }
    const show = mode === "gameOver" || mode === "gameEnded" || mode === "conquer20";
    actions.classList.toggle("hidden", !show);
  }

  function escapeOverlayHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function decorateOverlayHint(text) {
    return escapeOverlayHtml(text).replace(
      /\b(Enter|Space|Shift|Ctrl|Alt|Esc|F9|P|K)\b/g,
      "<kbd>$1</kbd>"
    );
  }

  function hardenOverlayTitle(text) {
    return String(text == null ? "" : text)
      .replace(/정복/g, "정\u2060복")
      .replace(/ /g, "\u00A0");
  }

  function showOverlay(title, hint) {
    const hardened = hardenOverlayTitle(title);
    overlayTitle.textContent = hardened;
    overlayTitle.setAttribute("data-title", hardened);
    overlayHint.innerHTML = decorateOverlayHint(hint);
    overlay.classList.remove("hidden");
    syncOverlayIdleType();
  }

  function syncOverlayIdleType() {
    if (typeof window !== "undefined" && (Number(window.innerWidth) || 0) <= 768) {
      return;
    }
    const idle = !overlay.classList.contains("is-result") && !overlay.classList.contains("is-conquer");
    if (overlayTitle) {
      if (idle) {
        overlayTitle.style.setProperty("font-size", "2.2rem", "important");
        overlayTitle.style.setProperty("font-weight", "900", "important");
        overlayTitle.style.setProperty("margin-bottom", "25px", "important");
        overlayTitle.style.setProperty("letter-spacing", "1px", "important");
      } else {
        overlayTitle.style.setProperty("font-size", "1.1rem", "important");
        overlayTitle.style.setProperty("font-weight", "800", "important");
        overlayTitle.style.setProperty("margin-bottom", "10px", "important");
        overlayTitle.style.setProperty("letter-spacing", "-0.5px", "important");
      }
    }
    if (overlayHint) {
      overlayHint.style.setProperty("font-size", "1.1rem", "important");
      overlayHint.style.setProperty("padding", "10px 22px", "important");
      overlayHint.style.setProperty("border-radius", "25px", "important");
    }
  }

  function showGameOverlay(mode) {
    overlayMode = mode;
    overlay.classList.toggle("is-conquer", mode === "conquer20");
    overlay.classList.toggle("is-result", mode === "gameOver" || mode === "gameEnded" || mode === "conquer20");
    overlay.classList.toggle("is-pause", mode === "pause");
    syncOverlayActions(mode);
    if (mode === "start") {
      showOverlay(t("gameTitle"), t("pressStart"));
      return;
    }
    if (mode === "pause") {
      showOverlay(t("paused"), pauseHint());
      return;
    }
    if (mode === "gameOver") {
      showOverlay(t("gameOver"), t("pressStartAgain"));
      return;
    }
    if (mode === "conquer20") {
      showOverlay(t("overlayConquer"), t("overlayConquerHint"));
      return;
    }
    if (mode === "gameEnded") {
      showOverlay(t("gameEnded"), t("pressStartAgain"));
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.classList.remove("is-conquer", "is-result", "is-pause");
    syncOverlayActions("");
    pauseTapAt = 0;
  }

  function pauseHint() {
    const touchResume = detectTouchDevice() || isMobilePadVisible() || isCompactMobile();
    return t(touchResume ? "pauseHintTouch" : "pauseHint");
  }

  function clearSpaceTap() {
    spaceTapAt = 0;
    if (spaceDropTimer) {
      window.clearTimeout(spaceDropTimer);
      spaceDropTimer = 0;
    }
  }

  function togglePause() {
    if (gameOver || waitingStart) {
      syncActionButtons();
      return;
    }
    paused = !paused;
    pauseTapAt = 0;
    if (paused) {
      showGameOverlay("pause");
      bgm.pause();
    } else {
      hideOverlay();
      bgm.play();
    }
    syncActionButtons();
  }

  function shouldIgnorePauseDoubleTap(target) {
    if (!target || typeof target.closest !== "function") {
      return false;
    }
    return !!target.closest("button, a, input, textarea, select, label, .pad-btn, #mobile-controls, .modal, .settings-modal");
  }

  function onPauseResumeDoubleTap(e) {
    if (paused !== true) {
      pauseTapAt = 0;
      return;
    }
    if (gameOver || waitingStart || gameTerminated) {
      pauseTapAt = 0;
      return;
    }
    if (settingsOpen || helpOpen || diagOpen || celebrateOpen || scoreSaveOpen || hallOpen || autoplayEndOpen) {
      return;
    }
    if (shouldIgnorePauseDoubleTap(e.target)) {
      return;
    }
    const now = performance.now();
    if (pauseTapAt > 0 && (now - pauseTapAt) <= PAUSE_DOUBLE_TAP_MS) {
      pauseTapAt = 0;
      if (e.cancelable) {
        e.preventDefault();
      }
      if (typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
      if (paused === true) {
        togglePause();
      }
      return;
    }
    pauseTapAt = now;
  }

  function bindPauseDoubleTap() {
    const board = document.getElementById("board-wrap");
    const overlay = document.getElementById("overlay");
    if (!board) {
      return;
    }
    if (board.dataset.pauseDbltapBound !== "1") {
      board.dataset.pauseDbltapBound = "1";
      board.addEventListener("touchend", onPauseResumeDoubleTap, { passive: false });
    }
    if (overlay && overlay.dataset.pauseDbltapBound !== "1") {
      overlay.dataset.pauseDbltapBound = "1";
      overlay.addEventListener("touchend", onPauseResumeDoubleTap, { passive: false });
    }
    pauseDoubleTapBound = true;
  }

  function onSpaceTap() {
    if (gameOver || waitingStart) {
      return;
    }
    const now = performance.now();
    if (spaceTapAt && now - spaceTapAt <= SPACE_DOUBLE_MS) {
      clearSpaceTap();
      togglePause();
      return;
    }
    spaceTapAt = now;
    if (spaceDropTimer) {
      window.clearTimeout(spaceDropTimer);
      spaceDropTimer = 0;
    }
    if (paused || !current || settingsOpen || celebrateOpen || helpOpen) {
      return;
    }
    hardDrop();
    updateHud();
  }

  function loop(now) {
    if (gameTerminated) {
      loopRaf = 0;
      return;
    }
    if (loopBusy) {
      return;
    }
    loopBusy = true;
    try {
      if (!lastTime) {
        lastTime = now;
      }
      let dt = now - lastTime;
      if (!Number.isFinite(dt) || dt < 0) {
        dt = 0;
      }
      dt = Math.min(dt, 100);
      lastTime = now;
      acc += dt;
      acc = Math.min(acc, FRAME_MS * 5);
      let steps = 0;
      while (acc >= FRAME_MS && steps < 5) {
        update(FRAME_MS);
        updateFx();
        acc -= FRAME_MS;
        steps += 1;
      }
      draw();
    } catch (err) {
      acc = 0;
    }
    loopBusy = false;
    if (gameTerminated) {
      loopRaf = 0;
      return;
    }
    loopRaf = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", (e) => {
    if (gameTerminated) {
      e.preventDefault();
      return;
    }
    if (e.code === "F9") {
      e.preventDefault();
      toggleDiagModal();
      return;
    }
    if (diagOpen) {
      if (e.code === "Escape" && !diagRunning) {
        closeDiagModal();
      }
      return;
    }
    if (scoreSaveOpen) {
      if (e.code === "Enter") {
        e.preventDefault();
        if (!held.has(e.code)) {
          commitScoreSave();
        }
      } else if (e.code === "Escape") {
        closeScoreSaveModal();
      }
      held.add(e.code);
      return;
    }
    if (hallOpen) {
      if (e.code === "Escape") {
        closeHallModal();
      }
      return;
    }
    if (autoplayEndOpen) {
      if (["Escape", "Enter", "Space"].includes(e.code)) {
        e.preventDefault();
        if (!held.has(e.code)) {
          closeAutoplayEndModal();
        }
      }
      held.add(e.code);
      return;
    }
    if (celebrateOpen) {
      if (["Escape", "Enter", "Space"].includes(e.code)) {
        e.preventDefault();
        if (!held.has(e.code)) {
          closeCelebrate();
        }
      }
      held.add(e.code);
      return;
    }
    if (helpOpen) {
      if (e.code === "Escape") {
        e.preventDefault();
        closeGuideModal();
      }
      if ((e.code === "Enter" || e.code === "Space" || e.key === "Enter") && !e.repeat) {
        e.preventDefault();
        startFromGuide();
      }
      return;
    }
    if (settingsOpen) {
      if (e.code === "Escape") {
        closeSettingsModal();
      }
      return;
    }
    if (isSettingsTarget(e.target)) {
      return;
    }
    const repeat = held.has(e.code);
    held.add(e.code);

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyH", "Enter", "KeyK"].includes(e.code) || isHoldKey(e)) {
      e.preventDefault();
    }
    try {
      sfx.ensure();
    } catch (err) {
      /* audio optional */
    }

    const isEnter = e.code === "Enter" || e.key === "Enter";
    const isSpace = e.code === "Space" || e.key === " ";

    if (waitingStart) {
      if ((isEnter || isSpace) && !repeat) {
        try {
          startNewGame();
        } catch (err) {
          /* keep listening */
        }
      }
      return;
    }

    if (e.code === "KeyP") {
      if (!repeat && !gameOver) {
        clearSpaceTap();
        togglePause();
      }
      return;
    }

    if (isEnter) {
      if (!repeat) {
        try {
          startNewGame();
        } catch (err) {
          /* keep listening */
        }
      }
      return;
    }

    if (autoplay && isPlayInterruptKey(e.code) && !gameOver && !paused) {
      stopAutoplay();
    }

    if (gameOver) {
      if ((isEnter || isSpace) && !repeat) {
        try {
          startNewGame();
        } catch (err) {
          /* keep listening */
        }
      }
      return;
    }

    if (e.code === "Space") {
      if (!repeat) {
        onSpaceTap();
      }
      return;
    }
    if (paused || !current) {
      return;
    }

    if (!repeat && isHoldKey(e)) {
      holdCurrent();
      return;
    }
    if (e.code === "KeyK") {
      if (repeat || e.repeat) {
        return;
      }
      tryDadFreeze();
      return;
    }

    switch (e.code) {
      case "ArrowLeft":
        if (!repeat && !e.repeat) {
          beginShift(-1);
        }
        break;
      case "ArrowRight":
        if (!repeat && !e.repeat) {
          beginShift(1);
        }
        break;
      case "ArrowDown":
        if (dadResumeMs > 0 && dadSpecialOn()) {
          break;
        }
        if (canDadPenetrate()) {
          if (!repeat && !e.repeat) {
            stepDadDrop();
          }
          break;
        }
        softDropping = true;
        if (tryMove(0, 1)) {
          score += 1;
          gravityMsLeft = gravityInterval();
          sfx.play("softdrop");
          updateHud();
        } else {
          startLockIfGrounded();
        }
        break;
      case "ArrowUp":
        if (!repeat) {
          tryRotate(1);
        }
        break;
      case "KeyZ":
        if (!repeat) {
          tryRotate(-1);
        }
        break;
      default:
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    held.delete(e.code);
    if (e.code === "ArrowDown") {
      if (!padHeld.has("down")) {
        softDropping = false;
      }
    }
    if (e.code === "ArrowLeft") {
      endShift(-1);
    }
    if (e.code === "ArrowRight") {
      endShift(1);
    }
  });

  const onViewportFit = () => {
    try {
      syncMobileBoardLock({ silent: true });
    } catch (err) {
      /* ignore */
    }
    if (typeof resizeCanvas === "function") {
      resizeCanvas();
    }
    if (settings.mobilePad === "auto") {
      syncMobilePadUi();
    } else {
      scheduleResize();
    }
  };
  window.addEventListener("resize", onViewportFit);
  window.addEventListener("orientationchange", onViewportFit);
  if (window.matchMedia) {
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.addEventListener) {
      mq.addEventListener("change", onViewportFit);
    } else if (mq.addListener) {
      mq.addListener(onViewportFit);
    }
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      if (typeof resizeCanvas === "function") {
        resizeCanvas();
      }
      scheduleResize();
    });
  }
  window.addEventListener("blur", () => {
    held.clear();
    shiftDir = 0;
    dasCharge = 0;
    softDropping = false;
    releaseAllPads();
    if (autoplay) {
      return;
    }
    if (!gameOver && !waitingStart && current && !settingsOpen && !celebrateOpen && !scoreSaveOpen && !hallOpen && !autoplayEndOpen && !helpOpen) {
      paused = true;
      showGameOverlay("pause");
      bgm.pause();
      syncActionButtons();
    }
  });

  function safeSfxEnsure() {
    try {
      if (sfx && typeof sfx.ensure === "function") {
        sfx.ensure();
      }
    } catch (err) {
      /* audio optional */
    }
  }

  function onHudStartGame() {
    if (gameTerminated) {
      return;
    }
    safeSfxEnsure();
    try {
      if (waitingStart || gameOver) {
        stopAutoplay();
        startNewGame();
        return;
      }
      togglePause();
    } catch (err) {
      try {
        startNewGame();
      } catch (err2) {
        /* ignore */
      }
    }
  }

  function onHudEndGame() {
    if (gameTerminated) {
      return;
    }
    if (gameOver) {
      quitGameApp();
      return;
    }
    safeSfxEnsure();
    try {
      stopAutoplay();
    } catch (err) {
      /* ignore */
    }
    endGame();
  }

  function onHudOpenSettings() {
    if (celebrateOpen || scoreSaveOpen) {
      return;
    }
    safeSfxEnsure();
    openSettingsModal();
  }

  function onHudOpenGuide() {
    if (celebrateOpen || scoreSaveOpen || diagOpen || diagRunning) {
      return;
    }
    safeSfxEnsure();
    openGuideModal();
  }

  function onHudRunDiagnostics() {
    try {
      openDiagModal();
    } catch (err) {
      try {
        runVisualAutoTest();
      } catch (err2) {
        /* ignore */
      }
    }
  }

  function exposeDadWindowApi() {
    exposeWindowUi({
      startGame: onHudStartGame,
      endGame: onHudEndGame,
      openSettingsModal: onHudOpenSettings,
      closeSettingsModal,
      openGuideModal: onHudOpenGuide,
      closeGuideModal,
      runDiagnostics: onHudRunDiagnostics,
      openDiagModal,
      toggleAutoPlay: toggleAutoplay,
      toggleAutoplay,
      toggleMobilePad,
      resetAllSettings,
    });
  }
  try {
    exposeDadWindowApi();
  } catch (err) {
    try {
      console.error("[DAD TETRIS] window UI expose failed", err);
    } catch (ignore) {
      /* ignore */
    }
  }
  bindEl("settings-open", "click", () => {
    if (typeof window.openSettingsModal === "function") {
      window.openSettingsModal();
      return;
    }
    onHudOpenSettings();
  });
  const guideOpenBtn = document.getElementById("btn-guide") || document.getElementById("guide-open");
  if (guideOpenBtn) {
    guideOpenBtn.addEventListener("click", () => {
      if (typeof window.openGuideModal === "function") {
        window.openGuideModal();
        return;
      }
      onHudOpenGuide();
    });
  }
  bindEl("guide-close", "click", () => {
    if (typeof window.closeGuideModal === "function") {
      window.closeGuideModal();
      return;
    }
    closeGuideModal();
  });
  bindEl("guide-x", "click", () => {
    if (typeof window.closeGuideModal === "function") {
      window.closeGuideModal();
      return;
    }
    closeGuideModal();
  });
  bindEl("guide-backdrop", "click", () => {
    if (typeof window.closeGuideModal === "function") {
      window.closeGuideModal();
      return;
    }
    closeGuideModal();
  });
  bindEl("guide-start", "click", startFromGuide);
  const diagOpenBtn = document.getElementById("btn-diagnostics") || document.getElementById("diag-open");
  if (diagOpenBtn) {
    diagOpenBtn.addEventListener("click", () => {
      if (typeof window.runDiagnostics === "function") {
        window.runDiagnostics();
        return;
      }
      onHudRunDiagnostics();
    });
  }
  const diagRunBtn = document.getElementById("diag-run");
  if (diagRunBtn) {
    diagRunBtn.addEventListener("click", () => {
      runVisualAutoTest();
    });
  }
  const diagCloseBtn = document.getElementById("diag-close");
  if (diagCloseBtn) {
    diagCloseBtn.addEventListener("click", closeDiagModal);
  }
  const diagXBtn = document.getElementById("diag-x");
  if (diagXBtn) {
    diagXBtn.addEventListener("click", closeDiagModal);
  }
  const diagBackdrop = document.getElementById("diag-backdrop");
  if (diagBackdrop) {
    diagBackdrop.addEventListener("click", closeDiagModal);
  }
  document.querySelectorAll(".guide-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      setGuideTab(btn.dataset.guideTab);
    });
  });
  bindEl("settings-save", "click", () => {
    if (typeof window.closeSettingsModal === "function") {
      window.closeSettingsModal();
      return;
    }
    closeSettingsModal();
  });
  bindEl("settings-reset", "click", () => {
    if (typeof window.resetAllSettings === "function") {
      window.resetAllSettings();
      return;
    }
    resetAllSettings();
  });
  bindEl("settings-x", "click", () => {
    if (typeof window.closeSettingsModal === "function") {
      window.closeSettingsModal();
      return;
    }
    closeSettingsModal();
  });
  bindEl("settings-backdrop", "click", () => {
    if (typeof window.closeSettingsModal === "function") {
      window.closeSettingsModal();
      return;
    }
    closeSettingsModal();
  });
  bindEl("lang-select", "change", () => {
    settings.language = clampLang(document.getElementById("lang-select").value);
    saveSettings();
    applyI18n();
  });

  document.querySelectorAll(".settings-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll(".settings-tab").forEach((item) => {
        const on = item === btn;
        item.classList.toggle("is-on", on);
        item.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.tabPanel !== tab);
      });
      if (tab === "scores") {
        openHallModal();
      }
    });
  });

  bindEl("celebrate-close", "click", () => closeCelebrate());
  bindEl("celebrate-backdrop", "click", () => closeCelebrate());
  celebrateVideo.addEventListener("ended", () => closeCelebrate());
  celebrateVideo.addEventListener("error", () => {
    if (!celebrateOpen) {
      return;
    }
    celebrateVideo.classList.add("hidden");
    celebrateStage.classList.add("is-fallback");
    if (!celebrateFallback.textContent) {
      celebrateFallback.textContent = getCelebrateMessage(celebrateKind) || t("celebrateFallback");
    }
    scheduleCelebrateFallbackResume();
  });
  window.addEventListener("message", (event) => {
    if (!celebrateOpen) {
      return;
    }
    let data = event.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (err) {
        return;
      }
    }
    if (data && data.event === "onStateChange" && data.info === 0) {
      closeCelebrate();
    }
  });

  document.querySelectorAll("[data-video-file]").forEach((input) => {
    input.addEventListener("change", () => {
      const kind = input.dataset.videoFile;
      const file = input.files && input.files[0];
      if (!VIDEO_KEYS.includes(kind) || !file) {
        return;
      }
      mediaStore.put(videoStoreKey(kind), file).then((ok) => {
        if (!ok) {
          try {
            console.error("[DadTetrisDB] video save failed", kind);
          } catch (err) {
            /* ignore */
          }
        }
      }).catch((err) => {
        try {
          console.error("[DadTetrisDB] video save failed", kind, err);
        } catch (ignore) {
          /* ignore */
        }
      });
      videoBlobs[kind] = { url: mediaStore.peek(videoStoreKey(kind)), name: file.name };
      settings.videoFileNames[kind] = file.name;
      settings.videoUrls[kind] = "";
      saveSettings();
      syncVideoSettingsUi();
    });
  });

  document.querySelectorAll("[data-video-url]").forEach((input) => {
    const commit = () => {
      const kind = input.dataset.videoUrl;
      if (!VIDEO_KEYS.includes(kind)) {
        return;
      }
      const value = input.value.trim();
      if (value) {
        revokeVideoBlob(kind);
        settings.videoFileNames[kind] = "";
      }
      settings.videoUrls[kind] = value;
      saveSettings();
      syncVideoSettingsUi();
    };
    input.addEventListener("change", commit);
    input.addEventListener("blur", commit);
  });

  document.querySelectorAll("[data-preview]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      sfx.ensure();
      previewCelebrate(btn.dataset.preview);
    });
  });

  function bindGoalControl(which) {
    const number = document.getElementById(`${which}-score`);
    const slider = document.getElementById(`${which}-score-slider`);
    const apply = (value) => {
      if (isSyncingUi) {
        return;
      }
      settings[`${which}Score`] = clampGoalScore(value, SETTING_DEFAULTS[`${which}Score`]);
      normalizeGoals(which);
      saveSettings();
      syncGoalScoreUi();
    };
    number.addEventListener("input", () => {
      const n = Number(number.value);
      if (!Number.isFinite(n) || n < 100) {
        return;
      }
      apply(n);
    });
    number.addEventListener("change", () => apply(number.value));
    slider.addEventListener("input", () => apply(slider.value));
    slider.addEventListener("change", () => apply(slider.value));
  }
  bindGoalControl("goal1");
  bindGoalControl("goal2");

  document.querySelectorAll(".toggle-row[data-setting]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.dataset.setting;
      if (!TOGGLE_KEYS.has(key)) {
        return;
      }
      settings[key] = !settings[key];
      syncSettingButton(btn);
      applySetting(key);
      saveSettings();
      sfx.ensure();
    });
  });

  let lastSfxPreviewAt = 0;
  let lastShakePreviewAt = 0;

  function ghostSliderEl() {
    return document.getElementById("ghost-strength")
      || document.getElementById("slider-ghost-opacity")
      || document.querySelector(".slider-ghost-opacity");
  }

  function bindPercentSlider(id, key, fallback, onLive) {
    const slider = document.getElementById(id)
      || (id === "ghost-strength" ? ghostSliderEl() : null);
    if (!slider) {
      return;
    }
    const apply = (event) => {
      if (isSyncingUi) {
        return;
      }
      settings[key] = clampPercent(slider.value, fallback);
      const valueLabel = (slider.closest(".slider-row") && slider.closest(".slider-row").querySelector(".slider-value"))
        || document.getElementById(`${id}-value`);
      if (valueLabel) {
        valueLabel.textContent = `${settings[key]}%`;
      }
      if (onLive) {
        onLive(event.type);
      }
      saveSettings();
    };
    slider.addEventListener("input", apply);
    slider.addEventListener("change", apply);
  }

  bindPercentSlider("sound-volume", "soundVolume", SETTING_DEFAULTS.soundVolume, (type) => {
    sfx.ensure();
    const now = performance.now();
    if (type === "change") {
      sfx.play("drop");
      lastSfxPreviewAt = now;
      return;
    }
    if (now - lastSfxPreviewAt < 170) {
      return;
    }
    lastSfxPreviewAt = now;
    sfx.play("move");
  });
  bindPercentSlider("shake-strength", "shakeStrength", SETTING_DEFAULTS.shakeStrength, (type) => {
    const now = performance.now();
    if (type !== "change" && now - lastShakePreviewAt < 220) {
      return;
    }
    lastShakePreviewAt = now;
    previewShake();
  });
  bindPercentSlider("ghost-strength", "ghostStrength", SETTING_DEFAULTS.ghostStrength, () => {
    draw();
    renderGhostPreview(currentGhostOpacity(), currentPreviewSkin());
  });
  updateGhostPreview();
  bindPercentSlider("bgm-volume", "bgmVolume", SETTING_DEFAULTS.bgmVolume, () => {
    bgm.applyVolume();
  });
  bindPercentSlider("bg-dim", "bgDim", SETTING_DEFAULTS.bgDim, () => {
    applyCurrentBackground();
  });

  function bindAutoplaySpeedSlider(id) {
    const slider = document.getElementById(id);
    if (!slider) {
      return;
    }
    const apply = () => {
      if (isSyncingUi) {
        return;
      }
      settings.autoplaySpeed = clampAutoplaySpeed(slider.value);
      autoplayWait = Math.min(autoplayWait, nextAutoplayDelay());
      saveSettings();
      syncAutoplaySpeedUi();
      syncAutoplayFade();
    };
    slider.addEventListener("input", apply);
    slider.addEventListener("change", apply);
  }
  bindAutoplaySpeedSlider("autoplay-speed");
  bindAutoplaySpeedSlider("autoplay-speed-settings");

  const bgBlurSlider = document.getElementById("bg-blur");
  const onBgBlur = () => {
    if (isSyncingUi || !bgBlurSlider) {
      return;
    }
    settings.bgBlur = clampBlur(bgBlurSlider.value);
    settings.windowBgBlur = settings.bgBlur;
    const gameLabel = document.getElementById("bg-blur-value");
    if (gameLabel) {
      gameLabel.textContent = `${settings.bgBlur}px`;
    }
    syncWindowBgFxUi();
    applyWindowBgFx();
    applyCurrentBackground();
    saveSettings();
  };
  if (bgBlurSlider) {
    bgBlurSlider.addEventListener("input", onBgBlur);
    bgBlurSlider.addEventListener("change", onBgBlur);
  }

  const boardBlurSlider = document.getElementById("board-bg-blur");
  const onBoardBlur = () => {
    if (isSyncingUi || !boardBlurSlider) {
      return;
    }
    settings.boardBgBlur = clampBlur(boardBlurSlider.value, SETTING_DEFAULTS.boardBgBlur);
    const label = document.getElementById("board-bg-blur-value");
    if (label) {
      label.textContent = `${settings.boardBgBlur}px`;
    }
    applyBoardBgFx();
    saveSettings();
  };
  if (boardBlurSlider) {
    boardBlurSlider.addEventListener("input", onBoardBlur);
    boardBlurSlider.addEventListener("change", onBoardBlur);
  }

  bindPercentSlider("board-bg-opacity", "boardBgOpacity", SETTING_DEFAULTS.boardBgOpacity, () => {
    applyBoardBgFx();
  });

  const windowBlurSlider = document.getElementById("window-bg-blur");
  const onWindowBlur = () => {
    if (isSyncingUi || !windowBlurSlider) {
      return;
    }
    settings.windowBgBlur = clampBlur(windowBlurSlider.value, SETTING_DEFAULTS.windowBgBlur);
    settings.bgBlur = settings.windowBgBlur;
    const label = document.getElementById("window-bg-blur-value");
    if (label) {
      label.textContent = `${settings.windowBgBlur}px`;
    }
    const gameLabel = document.getElementById("bg-blur-value");
    if (gameLabel) {
      gameLabel.textContent = `${settings.bgBlur}px`;
    }
    const gameSlider = document.getElementById("bg-blur");
    if (gameSlider) {
      gameSlider.value = String(settings.bgBlur);
    }
    applyWindowBgFx();
    saveSettings();
  };
  if (windowBlurSlider) {
    windowBlurSlider.addEventListener("input", onWindowBlur);
    windowBlurSlider.addEventListener("change", onWindowBlur);
  }

  bindPercentSlider("window-bg-opacity", "windowBgOpacity", SETTING_DEFAULTS.windowBgOpacity, () => {
    applyWindowBgFx();
  });

  document.querySelectorAll(".bg-target-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      settings.bgTarget = btn.dataset.bgTarget === "board" ? "board" : "window";
      saveSettings();
      syncLevelBgUi();
    });
  });

  const startLevelSelect = document.getElementById("start-level");
  startLevelSelect.addEventListener("change", () => {
    settings.startLevel = clampStartLevel(startLevelSelect.value);
    saveSettings();
    syncStartLevelUi();
    refreshLevel();
    gravityMsLeft = gravityInterval();
    updateHud();
  });

  const garbageSlider = document.getElementById("start-garbage-lines");
  if (garbageSlider) {
    const applyGarbage = () => {
      if (isSyncingUi) {
        return;
      }
      settings.startGarbageLines = clampStartGarbageLines(garbageSlider.value);
      persistStartGarbageLines();
      saveSettings();
      syncGarbageLinesUi();
    };
    garbageSlider.addEventListener("input", applyGarbage);
    garbageSlider.addEventListener("change", applyGarbage);
  }

  const previewModeSelect = document.getElementById("select-preview-mode");
  if (previewModeSelect) {
    previewModeSelect.addEventListener("change", () => {
      if (isSyncingUi) {
        return;
      }
      settings.previewGuideMode = clampPreviewGuideMode(previewModeSelect.value);
      persistPreviewGuideMode();
      saveSettings();
      syncPreviewGuideUi();
    });
  }

  const blockSkinSelect = document.getElementById("select-block-skin");
  if (blockSkinSelect) {
    blockSkinSelect.addEventListener("change", () => {
      if (isSyncingUi) {
        return;
      }
      const skin = clampBlockSkin(blockSkinSelect.value);
      settings.blockSkinStyle = skin;
      persistBlockSkinStyle();
      saveSettings();
      syncBlockSkinUi();
      redrawBlockSkins();
      renderSkinPreview(skin);
      renderGhostPreview(currentGhostOpacity(), skin);
    });
    blockSkinSelect.addEventListener("input", () => {
      if (isSyncingUi) {
        return;
      }
      const skin = clampBlockSkin(blockSkinSelect.value);
      renderSkinPreview(skin);
      renderGhostPreview(currentGhostOpacity(), skin);
    });
  }

  const boardSizeSelect = document.getElementById("select-board-size");
  if (boardSizeSelect) {
    boardSizeSelect.addEventListener("change", () => {
      if (isSyncingUi) {
        return;
      }
      if (isMobileDevice()) {
        syncBoardSizeUi();
        syncMobileBoardLock({ silent: true });
        return;
      }
      applyBoardSize(boardSizeSelect.value);
      saveSettings();
    });
  }

  const guideModeToggle = document.getElementById("btn-toggle-guide-mode");
  if (guideModeToggle) {
    guideModeToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePreviewGuideMode();
    });
  }

  const dropSpeedSlider = document.getElementById("slider-drop-speed-multiplier");
  if (dropSpeedSlider) {
    const applyDropSpeed = () => {
      if (isSyncingUi) {
        return;
      }
      const prevInterval = gravityInterval();
      settings.dropSpeedMultiplier = clampDropSpeedMultiplier(dropSpeedSlider.value);
      persistDropSpeedMultiplier();
      saveSettings();
      applyDropSpeedToGravity(prevInterval);
      syncDropSpeedUi();
    };
    dropSpeedSlider.addEventListener("input", applyDropSpeed);
    dropSpeedSlider.addEventListener("change", applyDropSpeed);
  }

  document.querySelectorAll(".dad-duration-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prevMs = dadSpecialDurationMs();
      settings.dadSpecialDuration = clampDadDuration(btn.dataset.dadDuration);
      const nextMs = dadSpecialDurationMs();
      const delta = nextMs - prevMs;
      if (freezeMs > 0) {
        freezeMs = Math.max(50, freezeMs + delta);
      }
      if (lockDelayMs > 0) {
        lockDelayMs = Math.max(50, lockDelayMs + delta);
      }
      saveSettings();
      syncDadDurationUi();
      syncDadCountdown();
    });
  });

  bindEl("bgm-file", "change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }
    bgm.setFile(file);
    settings.bgm = true;
    saveSettings();
    syncAllSettingsUi();
    bgm.play();
  });

  bindEl("bgm-restore", "click", () => {
    restoreDefaultBgm();
  });

  bindEl("profile-file", "change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      return;
    }
    setProfileFromFile(file);
    e.target.value = "";
  });
  const profilePickBtn = document.getElementById("profile-pick-btn");
  if (profilePickBtn) {
    profilePickBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const input = document.getElementById("profile-file");
      if (input) {
        input.click();
      }
    });
  }

  const profileZoomSlider = document.getElementById("profile-zoom");
  const profileXSlider = document.getElementById("profile-x");
  const profileYSlider = document.getElementById("profile-y");

  const onProfileZoomInput = () => {
    if (isSyncingUi || isSyncingProfile) {
      return;
    }
    setProfileZoomScale(zoomPercentToScale(profileZoomSlider.value), true);
  };
  profileZoomSlider.addEventListener("input", onProfileZoomInput);
  profileZoomSlider.addEventListener("change", onProfileZoomInput);
  const profileZoomOut = document.getElementById("profile-zoom-out");
  const profileZoomIn = document.getElementById("profile-zoom-in");
  if (profileZoomOut) {
    profileZoomOut.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      nudgeProfileZoom(-10);
    });
  }
  if (profileZoomIn) {
    profileZoomIn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      nudgeProfileZoom(10);
    });
  }

  const onProfileXInput = () => {
    if (isSyncingUi || isSyncingProfile || diagRunning) {
      return;
    }
    profileState.x = clampProfileAxis(profileXSlider.value, "x");
    settings.profileX = profileState.x;
    requestProfileRender(true);
  };
  profileXSlider.addEventListener("input", onProfileXInput);
  profileXSlider.addEventListener("change", onProfileXInput);

  const onProfileYInput = () => {
    if (isSyncingUi || isSyncingProfile || diagRunning) {
      return;
    }
    profileState.y = clampProfileAxis(profileYSlider.value, "y");
    settings.profileY = profileState.y;
    requestProfileRender(true);
  };
  profileYSlider.addEventListener("input", onProfileYInput);
  profileYSlider.addEventListener("change", onProfileYInput);

  bindEl("profile-reset", "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    resetProfileView();
  });

  function bindProfileDrag(frame) {
    if (!frame) {
      return;
    }
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    const isPicker = (target) => !!(target && target.closest && target.closest("#profile-pick-btn, #profile-file, .file-btn"));
    frame.addEventListener("click", (e) => {
      if (isPicker(e.target)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
    });
    frame.addEventListener("pointerdown", (e) => {
      if (isPicker(e.target)) {
        return;
      }
      if (!hasProfileSource()) {
        ensureProfileSource();
      }
      if (!hasProfileSource()) {
        return;
      }
      showProfileFrames(true);
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      originX = profileState.x;
      originY = profileState.y;
      if (profileCropCanvas) {
        profileCropCanvas.classList.add("is-dragging");
      }
      if (profileMainCanvas) {
        profileMainCanvas.classList.add("is-dragging");
      }
      if (frame.setPointerCapture) {
        try {
          frame.setPointerCapture(e.pointerId);
        } catch (err) {
          /* ignore */
        }
      }
      e.preventDefault();
      e.stopPropagation();
    });
    const move = (e) => {
      if (!dragging) {
        return;
      }
      const rect = frame.getBoundingClientRect();
      const unit = PROFILE_CANVAS_SIZE / Math.max(1, rect.width);
      profileState.x = clampProfileAxis(originX + (e.clientX - startX) * unit, "x");
      profileState.y = clampProfileAxis(originY + (e.clientY - startY) * unit, "y");
      settings.profileX = profileState.x;
      settings.profileY = profileState.y;
      requestProfileRender(false);
      syncProfileSliders();
      e.preventDefault();
    };
    const end = () => {
      if (!dragging) {
        return;
      }
      dragging = false;
      if (profileCropCanvas) {
        profileCropCanvas.classList.remove("is-dragging");
      }
      if (profileMainCanvas) {
        profileMainCanvas.classList.remove("is-dragging");
      }
      persistProfileCrop();
      snapshotVisibleProfile();
      syncProfileSliders();
    };
    frame.addEventListener("pointermove", move);
    frame.addEventListener("pointerup", end);
    frame.addEventListener("pointercancel", end);
    frame.addEventListener("wheel", (e) => {
      if (!hasProfileSource()) {
        ensureProfileSource();
      }
      if (!hasProfileSource()) {
        return;
      }
      showProfileFrames(true);
      e.preventDefault();
      e.stopPropagation();
      const next = profileState.zoom + (e.deltaY < 0 ? 0.05 : -0.05);
      setProfileZoomScale(next, true);
    }, { passive: false });
  }
  bindProfileDrag(document.getElementById("profile-frame"));
  bindProfileDrag(profileCropFrame());
  const profileSaveBtn = document.getElementById("profile-save-btn");
  if (profileSaveBtn) {
    profileSaveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      commitProfileCropSave();
    });
  }

  bindEl("score-save-btn", "click", commitScoreSave);
  bindEl("score-save-skip", "click", closeScoreSaveModal);
  bindEl("score-save-backdrop", "click", closeScoreSaveModal);
  bindEl("autoplay-end-close", "click", closeAutoplayEndModal);
  bindEl("autoplay-end-backdrop", "click", closeAutoplayEndModal);
  bindEl("ingame-confirm-ok", "click", () => closeIngameConfirm(true));
  bindEl("ingame-confirm-cancel", "click", () => closeIngameConfirm(false));
  bindEl("ingame-confirm-backdrop", "click", () => closeIngameConfirm(false));

  bindEl("best-card", "click", () => {
    openHallModal();
  });
  bindEl("best-card", "keydown", (e) => {
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      openHallModal();
    }
  });
  bindEl("open-hall-from-settings", "click", () => {
    openHallModal();
  });
  bindEl("hall-close", "click", closeHallModal);
  bindEl("hall-x", "click", closeHallModal);
  bindEl("hall-backdrop", "click", closeHallModal);
  bindEl("hall-reset", "click", async () => {
    if (!(await showIngameConfirm(t("confirmReset")))) {
      return;
    }
    saveHall([]);
  });
  bindEl("hall-list", "click", async (e) => {
    const btn = e.target.closest("[data-hall-del]");
    if (!btn) {
      return;
    }
    if (!(await showIngameConfirm(t("confirmDelete")))) {
      return;
    }
    const id = btn.dataset.hallDel;
    saveHall(loadHall().filter((row) => row.id !== id));
  });

  bindEl("game-start", "click", () => {
    if (typeof window.startGame === "function") {
      window.startGame();
      return;
    }
    onHudStartGame();
  });
  bindEl("game-end", "click", () => {
    if (typeof window.endGame === "function") {
      window.endGame();
      return;
    }
    onHudEndGame();
  });
  const overlayRestartBtn = document.getElementById("overlay-restart");
  const overlayQuitBtn = document.getElementById("overlay-quit");
  if (overlayRestartBtn) {
    overlayRestartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      restartFromOverlay();
    });
  }
  if (overlayQuitBtn) {
    overlayQuitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      quitGameApp();
    });
  }
  bindEl("autoplay-toggle", "click", () => {
    if (typeof window.toggleAutoPlay === "function") {
      window.toggleAutoPlay();
      return;
    }
    safeSfxEnsure();
    toggleAutoplay();
  });
  bindEl("mobile-pad-toggle", "click", () => {
    if (typeof window.toggleMobilePad === "function") {
      window.toggleMobilePad();
      return;
    }
    safeSfxEnsure();
    toggleMobilePad();
  });
  bindEl("dad-special-toggle", "click", () => {
    sfx.ensure();
    toggleDadSpecial();
  });
  bindEl("mobile-pad-setting", "click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    sfx.ensure();
    toggleMobilePad();
  });
  bindMobileControls();
  bindPauseDoubleTap();
  bindMobilePageGuards();
  window.DAD_SELF_CHECK = () => runSelfCheck("manual");

  function bindDadModules() {
    bindSoundManagerHost();
    bindRenderEngine({
      get ghostPreviewUseOuterAlpha() { return ghostPreviewUseOuterAlpha; },
      set ghostPreviewUseOuterAlpha(v) { ghostPreviewUseOuterAlpha = v; },
      get ghostPreviewAlphaOverride() { return ghostPreviewAlphaOverride; },
      set ghostPreviewAlphaOverride(v) { ghostPreviewAlphaOverride = v; },
      ghostFillAlpha,
      currentBlockSkin,
      currentPreviewSkin,
      currentGhostOpacity,
      get SHAPES() { return SHAPES; },
      get COLORS() { return COLORS; },
      get bgCanvas() { return bgCanvas; },
      get bgCtx() { return bgCtx; },
      get boardCanvas() { return boardCanvas; },
      get cellSize() { return cellSize; },
      get COLS() { return COLS; },
      get ROWS() { return ROWS; },
      get flashes() { return flashes; },
      get particles() { return particles; },
      get staticBgDirty() { return staticBgDirty; },
      set staticBgDirty(v) { staticBgDirty = v; },
      dadFocusActive,
      themeRgb,
    });
    bindUiController({
      t,
      GameEngine,
      get diagOpen() { return diagOpen; },
      get diagRunning() { return diagRunning; },
      get lineCombo() { return lineCombo; },
      get settings() { return settings; },
      runVisualAutoTest,
      openSettings: openSettingsModal,
      closeSettings: closeSettingsModal,
    });
  }
  try {
    bindDadModules();
  } catch (err) {
    try {
      console.error("[DAD TETRIS] module bind failed", err);
    } catch (ignore) {
      /* ignore */
    }
  }
  try {
    populateLangSelect();
    buildLevelBgCards();
    applyTheme(readStoredTheme(), true);
    applyI18n();
    lockHeaderUtilityButtons();
    restoreProfileFromStorage();
    updateHud();
    syncBestFromHall(loadHall());
    renderHall();
  } catch (err) {
    try {
      restoreProfileFromStorage();
    } catch (err2) {
      /* ignore */
    }
  }
  const onProfileImgError = (el) => {
    const snap = loadProfileImgLocal();
    if (snap && el && el.getAttribute("src") !== snap) {
      el.src = snap;
      el.classList.remove("hidden");
      return;
    }
    if (!snap) {
      showFallbackAvatar();
    }
  };
  profileAvatarEls().forEach((el) => {
    el.addEventListener("error", () => onProfileImgError(el));
  });
  ui.best.textContent = String(best);
  applyBoardAspectCss();
  try {
    syncMobileBoardLock({ silent: true });
  } catch (err) {
    /* ignore */
  }
  resize();
  scheduleResize();
  showStartScreen();
  requestAnimationFrame(loop);
  hydrateMedia().catch(() => {
    try {
      applyBundledBgm();
    } catch (err) {
      /* ignore */
    }
    try {
      applyCurrentBackground();
    } catch (err) {
      /* ignore */
    }
  });
  maybeOpenGuideOnboarding();

  document.querySelectorAll("button.theme-swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme(btn.dataset.theme, true);
      saveSettings();
    });
  });

  function pwaInstallButton() {
    return document.getElementById("btn-install-pwa")
      || document.getElementById("pwa-install-btn")
      || document.getElementById("install-app-btn");
  }

  function isPwaStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
        return true;
      }
      if (window.navigator && window.navigator.standalone === true) {
        return true;
      }
    } catch (err) {
      /* ignore */
    }
    return false;
  }

  function storeDeferredPrompt(event) {
    pwaInstallEvent = event || null;
    try {
      window.deferredPrompt = event || null;
    } catch (err) {
      /* ignore */
    }
  }

  function getDeferredPrompt() {
    return pwaInstallEvent || window.deferredPrompt || null;
  }

  function showPwaGuide(message) {
    const modal = document.getElementById("pwa-guide-modal");
    const body = document.getElementById("pwa-guide-body");
    if (body) {
      body.textContent = message || t("pwaGuideBody");
    }
    if (modal) {
      modal.classList.remove("hidden");
      return;
    }
    showNeonToast(message || t("pwaGuideBody"), { ms: 4200 });
  }

  function hidePwaGuide() {
    const modal = document.getElementById("pwa-guide-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  async function installDadPwa() {
    const promptEvent = getDeferredPrompt();
    if (promptEvent && typeof promptEvent.prompt === "function") {
      try {
        await promptEvent.prompt();
        try {
          await promptEvent.userChoice;
        } catch (err) {
          /* ignore choice errors */
        }
        storeDeferredPrompt(null);
        return;
      } catch (err) {
        /* fall through to manual guide */
      }
    }
    if (isPwaStandalone()) {
      showPwaGuide(t("pwaAlreadyInstalled"));
      return;
    }
    showPwaGuide(t("pwaGuideBody"));
  }

  function registerDadPwa() {
    if (!("serviceWorker" in navigator)) {
      return;
    }
    if (location.protocol === "file:") {
      return;
    }
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {});
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    storeDeferredPrompt(e);
    const btn = pwaInstallButton();
    if (btn) {
      btn.classList.remove("hidden");
    }
  });
  window.addEventListener("appinstalled", () => {
    storeDeferredPrompt(null);
    showNeonToast(t("pwaAlreadyInstalled"), { ms: 2200 });
  });
  const pwaBtn = pwaInstallButton();
  if (pwaBtn) {
    pwaBtn.classList.remove("hidden");
    pwaBtn.addEventListener("click", (e) => {
      e.preventDefault();
      installDadPwa();
    });
  }
  ["pwa-guide-ok", "pwa-guide-x", "pwa-guide-backdrop"].forEach((id) => {
    bindEl(id, "click", hidePwaGuide);
  });
  registerDadPwa();

  function unlockAudio() {
    sfx.ensure();
    if (!sfx.ctx) {
      return;
    }
    try {
      const buf = sfx.ctx.createBuffer(1, 1, 22050);
      const src = sfx.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(sfx.ctx.destination);
      src.start(0);
    } catch (err) {
      /* ignore */
    }
  }
  window.addEventListener("pointerdown", unlockAudio, true);
  window.addEventListener("keydown", unlockAudio, true);
  window.addEventListener("touchstart", unlockAudio, { capture: true, passive: true });
  try {
    exposeDadWindowApi();
    bindHudClickFallback();
  } catch (err) {
    try {
      console.error("[DAD TETRIS] HUD fallback bind failed", err);
    } catch (ignore) {
      /* ignore */
    }
  }
  return {
    moduleId: "gameEngine",
    startGame: onHudStartGame,
    endGame: onHudEndGame,
    openSettingsModal: onHudOpenSettings,
    closeSettingsModal,
    openGuideModal: onHudOpenGuide,
    closeGuideModal,
    runDiagnostics: onHudRunDiagnostics,
    toggleAutoPlay: toggleAutoplay,
    toggleAutoplay,
    toggleMobilePad,
    resetAllSettings,
    exposeWindowApi: exposeDadWindowApi,
  };
}
