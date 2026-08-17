# \[PRD] 아버지를 위한 명품 자바 테트리스 (Tetris for Dad)

## 1\. 개요 및 목적

* **대상:** 50대 아버지
* **목적:** 직관적이고 편안하면서도 시각적/청각적 손맛(타격감)이 뛰어난 고퀄리티 클래식 테트리스 게임
* **기술 스택:** Java (JDK 17+), Java Swing / JavaFX (GUI), Sound API

## 2\. 주요 UX \& 기능 요건

1. **시니어 친화적 UI/UX**

   * 가독성 높은 선명한 블록 및 큰 폰트 (점수, NEXT 블록, Level)
   * 눈이 편안한 모던 다크 테마 기반 / 네오 브루탈리즘 감성
   * 일시정지(Pause) 및 게임 속도(난이도) 선택 옵션
2. **고퀄리티 손맛 \& 효과**

   * **Ghost Piece (착지 위치 가이드):** 블록 착지 지점을 반투명하게 표시
   * **줄 삭제 이펙트:** 라인 삭제 시 파티클/지우기 연출 및 화면 진동(Screen Shake)
   * **사운드:** 이동, 회전, 하드드롭, 라인 삭제, BGM 온/오프 기능
3. **데이터 관리**

   * Local File / Preferences를 활용한 역대 최고 점수(High Score) 저장
4. **세계 주요 10개국 언어 지원 (다국어 i18n)**

   * 지원 언어: ko (한국어), en (English), zh (中文), es (Español), ar (العربية), hi (हिन्दी), bn (বাংলা), pt (Português), ru (Русский), ja (日本語)
   * 웹 사전: `i18n.js` — 사이드바(score/level/lines/best/next/controls), 대기 화면(gameTitle/pressStart), 환경설정(탭·볼륨·언어·시작 레벨), 명예의 전당·모달(rank/name/date/saveRecord/gameOverMsg/enterName)
   * 환경설정 팝업 상단의 🌐 언어 선택 드롭다운으로 즉시 전환 (새로고침 없음, `data-i18n` + JS 동적 문구)
   * 선택한 언어는 LocalStorage (`dadTetrisSettings.language`)에 저장되어 다음 방문에도 유지
   * 아랍어(ar)도 화면 구조는 왼쪽→오른쪽을 유지하고, 글자만 아랍어로 표시해 레이아웃이 뒤집히지 않게 한다

## 3\. 자바 클래스 구조 설계

* `TetrisMain`: 앱 실행 및 창 설정
* `GamePanel`: 게임 루프(Game Loop), Canvas 렌더링, 키 이벤트 처리
* `Board`: 10x20 그리드 상태 관리 및 줄 삭제 로직
* `Tetromino`: 7가지 블록 모양, 색상, 회전 및 이동 로직
* `SoundManager`: BGM 및 SFX 사운드 재생 관리
* `EffectManager`: 파티클 연출 및 화면 진동 효과

