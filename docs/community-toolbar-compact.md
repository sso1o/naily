# 툴바 시각 정리

기능과 상단 고정 구조를 유지하며 EditorToolbar의 표시만 수정했습니다. 등록 버튼은 기존 primary 배경을 유지합니다.

| 항목 | 이전 | 변경 |
| --- | --- | --- |
| 각 줄 높이 | 44dp | 40dp |
| 두 줄 높이 | 88dp + 구분선 | 80dp + 구분선 |
| 웹 실제 높이 | 89px | 81px |
| 터치 영역 | 최소 44dp | 최소 40dp |
| 수평 padding | 8dp | 6dp |
| 수직 padding | 없음 | 없음; 줄 높이로 정렬 |
| 활성 배경 | 전체 버튼 영역, lightPink | B/I/U의 26×26dp 내부 표시 영역, primary 8% |
| 활성 radius | 8dp | 작은 내부 표시만 6dp |
| 서식 글자 | 14px | labelMedium 13px |
| 사진 등 라벨 | 12px | caption 12px |
| 아이콘 | 18px | 18px |

첫 줄은 아이콘 + 작은 라벨을 가로 배치했습니다. 두 번째 줄은 배경 없는 폰트·크기 selector와 작은 B/I/U를 사용합니다. 기본 버튼 배경은 투명하며 버튼별 border·shadow·radius는 없습니다. 활성 상태는 primary 텍스트와 작은 연한 배경으로 표시합니다. 누를 때 opacity 0.55로 피드백을 제공합니다. 색상 표시는 12×2dp indicator이며 배경색 버튼은 marker 형태의 ▰를 사용합니다.

줄 사이와 툴바 하단에만 `StyleSheet.hairlineWidth` 구분선을 사용했습니다. 버튼 간 gap은 8dp입니다. 각 줄의 horizontal ScrollView와 숨긴 scrollbar를 유지합니다. 별도 색상 피커의 색상 샘플은 선택을 위한 swatch를 유지했습니다.

변경 파일:

- components/EditorToolbar.tsx
- docs/community-toolbar-compact.md
- docs/community-toolbar-compact-preview.png

검증:

- npm run typecheck 통과.
- 기존 자동 테스트 66개 모두 통과. 새로운 시각 변경 전용 테스트는 추가하지 않았습니다.
- 웹 375×812: 두 줄 표시, B/I/U 실제 서식 적용, 커서의 활성 표시가 primary 8% 배경으로 반영됨, 등록 배경 유지.
- 웹 320×812: 문서 폭 320px 유지, 첫 줄 콘텐츠 351px·두 번째 줄 348px는 해당 줄 안에서 가로 스크롤하며 화면 전체는 넘치지 않음.
- 콘솔 error 없음.
- Android/iOS는 공유 React Native 스타일을 사용하지만 이번 시각 변경에 대한 실기기 실행은 미검증입니다.
