---
name: java-tetris-developer
description: 50대 아버지를 위한 고퀄리티 자바 테트리스 개발 전용 커스텀 지침
---

# Java Tetris Development Instructions

## 개발 원칙
1. **객체지향 설계:** 가독성이 높고 단일 책임 원칙(SRP)을 준수하는 Java 코드를 작성한다.
2. **시니어 친화 UI:** 폰트는 크고 선명하게, 블록 대비는 명확하게 유지한다.
3. **타격감 우선:** 단순한 그리드 렌더링에 그치지 않고, 하드드롭이나 라인 삭제 시 애니메이션/파티클 효과 코드를 구조적으로 분리하여 구현한다.

## 코드 스타일
- Java 17 이상의 표준 문법 사용
- 변수 및 메서드는 CamelCase 사용
- Graphic2D 렌더링 시 Anti-aliasing(안티앨리어싱) 옵션을 활성화하여 부드러운 그래픽 제공