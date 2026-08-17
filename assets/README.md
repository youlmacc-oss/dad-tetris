# 기본 번들 에셋

같은 파일 이름으로 교체하면 게임에 바로 반영됩니다. 지금 들어 있는 파일은 404 방지용 플레이스홀더입니다.

```
assets/
├── audio/
│   └── bgm_default.mp3
└── images/
    ├── default_bg.jpg
    ├── level_1.jpg
    ├── ...
    └── level_10.jpg
```

## 교체 방법

| 파일 | 권장 |
|------|------|
| `images/default_bg.jpg` | 대기/종료 화면 배경, 1920×1080 JPEG |
| `images/level_1.jpg` ~ `level_10.jpg` | 레벨별 배경, 1920×1080 JPEG |
| `audio/bgm_default.mp3` | 기본 BGM, MP3 |

사용자 설정에서 올린 사진·음악이 있으면 그게 우선입니다. 번들 파일이 없거나 깨져 있으면 다크 그리드 테마로 조용히 넘어갑니다.
