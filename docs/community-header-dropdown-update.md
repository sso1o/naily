# 헤더·폰트/크기 드롭다운 정리

현재 WriteScreen 헤더, BlogEditor의 고정 툴바, RichWritingInput의 선택 영역·서식 메시지, PostBlockForm의 장소 입력 구조를 확인하고 수정했습니다. 편집 문서와 저장 데이터 구조는 유지했습니다.

## 등록 버튼

| 항목 | 이전 | 변경 |
| --- | --- | --- |
| 보이는 높이 | 44dp | 32dp |
| 터치 높이 | 44dp | 44dp 유지 |
| 최소 보이는 폭 | 56dp | 44dp |
| 수평 padding | 14dp | 10dp |
| 수직 배치 | marginVertical 6dp | 바깥 터치 영역에서 중앙 정렬, 내부 paddingVertical 6dp |
| radius | 10dp | 6dp |
| 텍스트 | labelLarge 14px / 600 | labelMedium 13px / 600 |
| 배경·글씨 | primary / 흰색 | 유지 |

등록 Pressable과 시각적 배경 View를 분리하여 작은 배경을 누르기 쉽게 만들었습니다. disabled opacity와 저장 중 표시를 유지합니다. 미리보기는 배경 없는 13px 텍스트 액션이며 등록과 4dp 간격을 둡니다. 미리보기 화면의 ‘편집’ 액션도 동일한 작은 헤더 버튼 크기를 사용합니다.

## 폰트·크기 선택

두 selector는 텍스트와 10px chevron으로 구성합니다. 기본 폰트 표시는 ‘기본서체’이며 선택한 폰트가 명조·고정폭이면 해당 이름을 표시합니다. 큰 배경·border는 없습니다.

폰트와 크기 선택은 WritingSheet에서 제거하고 새 WritingDropdown으로 통일했습니다. 버튼의 measureInWindow 좌표를 얻고, 투명 Modal 내부에 작은 메뉴를 절대 배치합니다. 모달 표면의 원점을 별도로 측정하여 SafeArea·window 좌표 차이를 보정하고, 화면 경계를 벗어나지 않도록 위치와 최대 높이를 제한합니다. 메뉴 배경 외에는 화면을 어둡게 덮지 않습니다.

- 폰트 메뉴 폭 156dp, 크기 메뉴 폭 96dp.
- 세로 리스트 항목 최소 높이 40dp, 13px 텍스트.
- 메뉴 radius 8dp, 얇은 border, 연한 그림자.
- 현재 값은 primary 색상과 체크 표시, 접근성 radio checked 상태로 표시.
- 폰트: 시스템 기본 / serif 명조 / monospace 고정폭.
- 크기: 기존 Typography와 편집 옵션의 12 / 14 / 15 / 16 / 18 / 20 / 24 유지.
- 메뉴 밖 터치·뒤로가기로 닫힘. 단일 picker state로 한 메뉴만 열림.
- 선택 시 기존 fontFamily·size formatting command에 연결하여 적용 후 닫힘. iOS에서는 Modal dismiss 후 명령을 실행하여 입력기 focus 복원을 유지.
- 색상·배경색 palette는 기존 WritingSheet를 유지합니다. 폰트와 크기는 모두 dropdown이며 두 기능 사이의 UX는 같습니다.

## 장소 placeholder

장소명·주소 입력은 이전에 placeholderTextColor를 지정하지 않아 플랫폼 기본값을 사용했습니다. 두 필드에 COLORS.subText(#777777)를 명시했습니다. 입력 글자색은 #111111을 유지하여 안내 문구와 실제 입력을 구분합니다. 같은 질문 입력 컴포넌트의 투표 질문도 이 명시적 placeholder 색상을 사용합니다.

## 변경 파일

- app/write.tsx: 작은 등록 배경과 충분한 터치 영역, 헤더 텍스트·간격.
- components/EditorToolbar.tsx: selector 표시, anchor 측정과 단일 picker·명령 연결.
- components/WritingDropdown.tsx: 새 anchored menu, 세로 리스트, 현재 값, 외부 터치 닫기.
- components/PostBlockForm.tsx: 장소 관련 placeholder 색상.
- tests/writing.test.cjs: dropdown·선택·취소·iOS dismiss 명령 검증, 새 컴포넌트 mock.
- docs/typography-style-audit.json: 등록 텍스트의 labelMedium 매핑 갱신.
- docs/community-header-dropdown-update.md 및 community-size-dropdown-preview.png, community-font-dropdown-preview.png, community-place-placeholder-preview.png: 보고서와 검증 화면.

추가 dependency는 없습니다.

## 검증

- npm run typecheck 통과.
- node --test tests/*.test.cjs: 67개 통과, 실패 0개.
- Expo Android·iOS·웹 export 통과.
- 웹 375×812: selector 근처 메뉴, 체크 표시, 18px·명조 실제 선택 영역 적용, 미리보기·등록·상세·재편집 및 메뉴 선택값 복원 확인.
- 메뉴 외부 클릭으로 닫힘 확인. 기존 서식 선택 영역과 저장 경로 유지.
- 장소 placeholder computed color rgb(119,119,119), opacity 1 확인.
- 웹 320×640: 문서 폭 320px 유지, 크기 메뉴 left 65.9 / right 161.9 / top 140.5 / bottom 428.5px로 화면 안에 표시. 헤더 등록 터치 영역 44px, 시각 배경 32px 확인.
- 콘솔 error 없음. 기존 사진 편집·블록·본문 높이·태그·중복 등록 방지 테스트 통과.
- iOS dismiss 명령 순서는 자동 테스트로 확인했습니다. Android/iOS 실기기와 시뮬레이터는 연결되어 있지 않아 실제 키보드·Modal·선택 메뉴 동작은 미검증입니다. 플랫폼 export 통과는 실기기 검증을 의미하지 않습니다.
