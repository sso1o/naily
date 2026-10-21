# 커뮤니티 상단 구조·2단 툴바 수정

## 화면 구조

`WriteScreen` 헤더 → `BlogEditor` 고정 툴바 → 문서 ScrollView(게시판·제목·본문·태그) 순서입니다. 툴바는 ScrollView 밖에 있어 긴 본문을 내려도 navigation header 바로 아래에 유지됩니다. 높이는 두 줄 88dp이며 각 버튼은 최소 44dp 터치 영역입니다. 두 줄은 각각 가로 스크롤을 지원하고 피커는 별도 모달로 표시하므로 세 번째 툴바 줄이 생기지 않습니다.

- 첫 줄: 사진 / 동영상 / 구분선 / 장소 / 투표. 기존 Ionicons와 짧은 라벨 사용.
- 둘째 줄: 폰트 / 크기 / B / I / U / 글자색 / 배경색.
- 정렬·태그·스티커·링크 등은 툴바에 없습니다. 기존 글의 정렬 데이터와 별도 Story 사진 편집기는 유지했습니다.

헤더는 뒤로가기 / 글쓰기 / 미리보기 / 등록입니다. 미리보기는 배경 없는 텍스트 보조 액션입니다. 등록은 `COLORS.primary` 배경, 흰색 600 텍스트, 수평 여백 14dp, 모서리 10dp, 최소 높이 44dp이며 제목이 비거나 저장 중이면 opacity 0.35로 표시됩니다. 수정 화면에서는 같은 버튼이 ‘완료’로 표시됩니다. 본인 게시글 상세의 ‘수정’ 버튼으로 재편집에 진입할 수 있습니다.

## 서식 구현과 저장

기존 contenteditable 입력기를 확장했습니다. 웹은 iframe, 네이티브는 WebView를 사용하며 저장된 DOM Range를 복원한 뒤 실제 편집 명령을 실행합니다. 선택 영역이 있으면 그 영역만, 선택 없이 커서만 있으면 이후 입력에 적용됩니다. 한글 조합 중에는 명령을 대기시키고 조합 종료 후 실행합니다.

| 툴 | 명령 | 데이터 |
| --- | --- | --- |
| 폰트 | fontName | fontFamily: system / serif / monospace |
| 크기 | fontSize 후 px 정규화 | fontSize: 12 / 14 / 15 / 16 / 18 / 20 / 24 |
| B / I / U | bold / italic / underline | bold / italic / underline |
| 글자색 | foreColor | color |
| 배경색 | hiliteColor | backgroundColor |

선택·커서 상태는 입력기 메시지로 툴바에 전달합니다. B/I/U 활성 상태, 폰트, 크기, 색상 표시가 반영됩니다. 중첩된 HTML 요소의 밑줄·배경색도 조상 스타일을 확인하여 보존합니다. 폰트는 별도 다운로드 없이 플랫폼에서 제공하는 시스템 기본·serif·monospace만 노출합니다. iOS 상세 렌더링은 serif를 Times New Roman, monospace를 Courier로 매핑합니다.

본문은 `content`와 `runs: PostTextRun[]`에 저장됩니다. 각 run은 `text`, `fontSize`, `bold`, `italic`, `underline`, `fontFamily`, `color`, `backgroundColor`, 기존 `align`을 가집니다. 원시 HTML을 저장하지 않으며 편집 재진입 때 이 데이터로 이스케이프된 HTML을 복원합니다. 미리보기·상세는 공유 `PostBlockRenderer`가 동일한 run 속성을 렌더링합니다.

## 새 콘텐츠 블록

| 종류 | 데이터 | 동작 |
| --- | --- | --- |
| 동영상 | type: video, video: { uri, aspectRatio } | videos 전용 선택기, 기존 expo-video의 VideoView와 nativeControls, 순서·삭제 메뉴 |
| 구분선 | type: divider | 커서 위치에서 본문을 나누어 삽입, 공유 렌더러, 순서·삭제 |
| 장소 | type: place, place: { name, address } | 장소명 필수·주소 선택, 입력 모달, 편집·순서·삭제 |
| 투표 | type: poll, poll: { question, options: [{ id, text, votes? }], votedOptionId? } | 질문과 비어 있지 않은 선택지 최소 2개, 선택지 추가·삭제, 편집·순서·삭제, 상세에서 세션당 한 번 투표 |

`insertPostBlock`은 현재 커서 앞뒤의 styled runs를 분리하고 중간에 블록을 넣습니다. 여러 줄의 개행을 포함한 커서 offset을 계산하며 기존 사진·다음 블록을 유지합니다. 새 입력기 준비 전의 focus 명령은 로딩 후 실행하여 삽입 뒤 본문으로 돌아갑니다. iOS 모달의 서식 명령과 블록 저장은 모달 dismiss 후 실행합니다.

사진은 선택 → 기존 Story 편집 → 완료 → 본문 삽입 순서입니다. 취소하면 미완성 사진은 들어가지 않습니다. 완료 시 최신 문서를 기준으로 원래 커서 위치에 삽입합니다. 기존 사진의 장식·drawing·photo transform·undo/redo 구현은 변경하지 않았습니다.

현재 프로젝트의 package.json과 app/services/data에는 Supabase 클라이언트·schema·Storage 연동이 없습니다. `savePostDraft`의 기존 mockData 세션 저장을 확장하여 모든 블록을 저장하고 재편집 때 video/place/poll 옵션까지 복제합니다. 동영상 URI는 선택기의 로컬 URI이며 원격 업로드나 앱 재시작 후 영구 보존은 제공하지 않습니다. 투표도 동일한 로컬 레코드에서 실제 선택만 집계하며 다중 사용자 서버 투표가 아닙니다. 투표 내용 수정 시 응답은 초기화됩니다. 별도 동영상 썸네일 추출은 추가하지 않았습니다.

## 이번 변경 파일

- app/write.tsx: 헤더·사진 삽입 위치·미리보기 읽기 전용 투표.
- app/post/[id].tsx: 본인 게시글 재편집 진입.
- components/BlogEditor.tsx: 상단 고정 배치·삽입·영상 선택·블록 관리.
- components/EditorToolbar.tsx: 제한된 두 줄·서식 피커.
- components/RichWritingInput.tsx: 명령·서식 상태·초기 focus 대기.
- services/richWriting.ts: 서식 HTML·중첩 스타일·개행 포함 커서 offset.
- services/postBlocks.ts: 커서에서 run 분리·블록 삽입.
- components/PostBlockForm.tsx: 장소·투표 입력과 검증.
- components/PostExtraBlock.tsx: 영상·장소·투표 공유 표시 및 세션 투표.
- components/PostBlockRenderer.tsx: 확장 서식·블록 렌더링.
- services/postDraft.ts: 확장 블록의 재편집 복제.
- types/models.ts: run 속성과 video/place/poll 타입.
- tests/writing.test.cjs, tests/rich-writing.test.cjs, tests/document-editing.test.cjs: 새 구조·데이터·동작·회귀 검증.
- docs/community-toolbar-preview.png, docs/community-toolbar-long-preview.png: 브라우저 확인 화면.

이번 작업에서 새 dependency는 추가하지 않았습니다. 기존 expo-video, expo-image-picker, WebView, Ionicons를 재사용했습니다.

## 검증 결과와 범위

- `npm run typecheck`: 통과.
- `node --test tests/*.test.cjs`: 66개 통과, 실패 0개.
- `npx expo export --platform all --output-dir .tmp/editor-toolbar-export`: Android·iOS·웹 번들 통과.
- `git diff --check`: 공백 오류 없음.
- 375px 웹 화면: 선택 영역 B/I/U·18px·serif·글자색·배경색 적용 후 미리보기·등록·상세·재편집에서 유지 확인. 중첩 밑줄 손실을 발견하고 수정 후 재검증했습니다.
- 커서 이후 굵은 입력, 둘째 줄 중간 구분선 삽입 및 앞뒤 본문 보존 확인.
- 장소 입력, 투표 선택지 추가·삭제, 미리보기·저장·재편집, 상세 투표 1회 반영 확인.
- 320px 화면: 문서 가로 overflow 없음, 미리보기·완료 텍스트 버튼이 화면 안에 유지됨.
- 80줄 본문: 마지막 입력기 높이 1804px로 증가, 마지막 줄 뒤 태그 입력 가능, 툴바 사진 버튼 top 57px 유지, 콘솔 error 없음.
- 기존 사진 선택 취소·편집 완료·drawing·변형·undo/redo·혼합 블록 순서·태그·자동 높이·중복 등록 방지 테스트 통과.
- 영상 선택·취소·분리된 저장 스키마·nativeControls 연결은 자동 테스트로 확인했습니다. 실제 영상 파일의 브라우저/기기 재생은 이번 환경에서 실행하지 못했습니다.
- Android/iOS 실기기 또는 시뮬레이터는 연결되어 있지 않아 키보드·IME·WebView 선택 메뉴·권한·영상 코덱·모달 dismiss의 실제 실행은 미검증입니다. 플랫폼 번들 생성 통과를 실기기 동작 검증으로 해석하지 않습니다.
