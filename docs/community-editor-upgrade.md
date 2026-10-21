# 커뮤니티 글쓰기·수정 에디터 추가 개선

2026-10-04. 현재 코드의 작성 화면, RichWritingInput, 사진 꾸미기, 저장 서비스와 상세 렌더러를 확인하고 수정했다. 기존 블록 문서 구조를 유지하면서 문자 위치 드롭, 사진 너비, 실제 한글 명조 폰트와 공통 색상 선택기를 연결했다.

## 문서 구조와 호환성

기존 문서는 `PostBlock[]`이며 text/heading의 `content`, 선택적인 `PostTextRun[]`, image의 `imageUrl`/`decoratedImage`, divider/video/place/poll을 함께 저장한다. 사진 장식의 좌표·회전·크기와 원본 사진의 `photoTransform`도 기존 필드에 유지된다. 작성 입력은 웹 iframe, Android/iOS WebView의 contenteditable이며 미리보기·상세는 React Native `PostBlockRenderer`를 사용한다.

변경 후에도 같은 배열을 저장한다. image 블록에 본문 표시 너비 `widthRatio?: number`만 추가했다. 블록 ID와 URI, 장식 및 원본 변형 데이터는 사진 이동·크기 변경 시 유지된다. text run의 `fontFamily: system | serif | monospace`, 크기, B/I/U, 글자색, 배경색, 문단 정렬 필드는 유지한다.

```json
[
  { "id": "text-head", "type": "text", "content": "첫 문장.", "runs": [{ "text": "첫 문장.", "fontFamily": "serif", "color": "#2467B5" }] },
  { "id": "photo", "type": "image", "imageUrl": "기존 URI", "widthRatio": 0.55 },
  { "id": "text-tail", "type": "text", "content": "다음 문장." }
]
```

너비가 없는 기존 사진은 100%로 표시한다. 비정상 수치는 기본값으로, 범위 밖 수치는 35~100%로 보정한다. 기존 일반 텍스트·URI 사진·장식 사진·고정폭 run을 읽을 수 있다. 명조의 저장 enum은 `serif` 그대로이므로 기존 명조 run도 새 한글 폰트로 복원된다. 별도 DB migration은 필요 없다. 저장은 기존 로컬 데모 세션 서비스 그대로이며 서버 영속 저장을 추가하지 않았다.

## 사진 드래그와 문자 위치 드롭

사진 전체를 300ms 누르면 이동이 시작된다. 그 전에 8px 이상 움직이면 본문 스크롤로 처리하고, 두 손가락 입력은 사진 크기 조절에 양보한다. 기존 이동 핸들과 위/아래 이동 메뉴도 유지한다.

드래그 좌표는 화면 좌표에서 viewport 위치, 본문 스크롤 offset, 블록 시작 위치, 문서 좌우 padding을 반영해 텍스트 입력 내부 좌표로 변환한다. 입력 프레임에는 x와 y를 함께 전달한다. `caretPositionFromPoint`와 `caretRangeFromPoint` fallback으로 DOM 문자 위치를 찾고, 앞부분의 텍스트와 문단 개행을 직렬화하여 UTF-16 offset을 계산한다. 선택 범위를 움직이지 않고 위치만 읽는다. 해당 API와 fallback은 [MDN의 문자 위치 예제](https://developer.mozilla.org/en-US/docs/Web/API/Document/caretPositionFromPoint)에 설명되어 있다.

텍스트 내부에는 실제 문자 위치에 2px 커서 표시를, 블록 경계에는 얇은 가로 삽입선을 표시한다. 손을 놓으면 최종 위치 조회 결과를 받아 사진을 제거·재삽입하고 대상 text run을 offset 앞/뒤로 나눈다. 문자와 각 구간의 서식은 유지한다. 반복 이동 때는 새 split ID를 사용하여 ID 충돌과 오래된 WebView 내용 재사용을 방지한다.

스크롤 가장자리 자동 스크롤, 중복 release 방지, 두 손가락 전환·취소·화면 이탈·앱 background·Android back 취소를 처리한다. 늦게 도착한 조회 결과도 취소된 드래그에 반영하지 않는다. 문자 위치 API가 실패하거나 응답하지 않는 경우에는 기존 블록 경계 이동으로 fallback한다.

## 사진 크기

사진을 선택하면 우하단 크기 핸들과 작게(35%) / 중간(55%) / 크게(75%) / 최대 너비(100%)를 제공한다. 두 손가락 거리 비율 또는 핸들의 가로 이동을 본문 너비로 환산하여 폭을 바꾼다. 세로 크기는 원본 aspectRatio에 따라 함께 변한다.

제스처 중에는 표시만 바꾸고 release에 한 번 저장한다. 취소·앱 background에서는 시작 상태를 유지한다. 저장 필드는 image 블록의 `widthRatio`이며 사진 꾸미기의 원본 확대/회전 `photoTransform`과 독립적이다. 동일한 보정 함수를 작성·미리보기·상세에 사용하며 수정 화면도 저장된 비율을 읽는다.

## 서식 상태와 배경색 제거

입력, 커서·선택 범위 변경 및 focus에서 현재 run과 서식 상태를 전달한다. 툴바는 글자색과 배경색을 각각 표시하고 색상 값을 접근성 정보에도 제공한다. 색상 비교에는 HEX/rgb/투명 값 정규화를 적용한다.

기존의 `queryCommandValue('hiliteColor')`만으로는 저장된 span의 강조 배경을 읽지 못했고, `hiliteColor('transparent')`도 상위 강조 span을 지우지 못했다. 실제 커서와 상위 요소의 배경을 읽도록 수정했다. 배경 변경은 선택 run을 나누고 해당 구간의 배경 필드만 갱신하여 다시 설치한다. 글자색·폰트·B/I/U·정렬과 나머지 문자는 유지한다.

커서만 있을 때는 현재 서식을 가진 입력 span을 만든다. 입력용 임시 문자는 문서 직렬화에서 제외하고 실제 입력/IME 완료 때 제거한다. 따라서 ‘배경색 없음’ 이후 입력도 투명 배경으로 이어진다. 명령 실행 직전에 실제 선택 범위를 다시 확보하고 focus 후 복원한다. 웹 색상 메뉴는 지연된 focus 복원을 피하도록 즉시 닫고, iOS 서식 명령은 기존처럼 modal dismiss 이후 적용한다.

## 공통 팔레트와 스포이드

`ColorPicker`를 본문 글자색·배경색, 사진 꾸미기 텍스트 색·배경, 도형 배경, 그리기 펜 색에 공유한다. 기본 10색, 배경색 없음, 연속적인 채도/명도 영역과 색조 영역, 현재/선택 색, HEX 입력, 명시적 적용을 제공한다. 스펙트럼은 터치/드래그 좌표로 HSV를 계산한다.

사진 스포이드는 현재 문서 사진 또는 사진 꾸미기의 원본 사진을 선택기에 표시한다. Expo ImageManipulator로 긴 변을 최대 512px로 리샘플링하고 JPEG를 디코딩한 실제 RGBA 픽셀을 읽는다. 스크롤 뒤에도 표시 영역을 다시 측정하여 터치 위치를 픽셀 좌표로 변환한다. 긴 변과 디코드 메모리를 제한했다. 리샘플링·JPEG 변환에 따른 미세한 색 차이는 생길 수 있다. 이미지 처리 API는 [Expo ImageManipulator 문서](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)를 참고했다.

| 환경 | 사진 스포이드 | 화면 스포이드와 fallback |
| --- | --- | --- |
| Android / iOS | 앱이 읽을 수 있는 현재/선택 사진을 표시하고 픽셀 색을 추출 | 다른 앱 화면 전체를 읽는 기능은 제공하지 않는다. 다른 사진·HEX 입력을 제공한다. |
| Web | 현재/선택 사진의 픽셀을 읽음 | 실행 환경에 `EyeDropper`가 있을 때만 화면 스포이드를 표시하고 사용자 클릭으로 실행한다. |
| 권한 거절·이미지 읽기 실패·CORS | 실패 사유와 안내 표시 | 다른 사진 선택·HEX·팔레트는 계속 사용할 수 있다. |

화면 스포이드 취소는 선택색을 유지한다. 지원 여부와 사용자 동작 조건은 [EyeDropper.open 문서](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper/open)에 따른다. 사진 선택은 중복 실행을 막고 화면이 닫힌 후 결과는 적용하지 않는다. 사진 꾸미기의 스포이드는 장식 레이어가 합성된 화면 대신 원본 사진을 표시해 선택하게 한다.

## 실제 한글 폰트

기존에는 일반 CSS/native `serif`를 지정했지만 한글 명조 font asset을 로드하지 않았다. 플랫폼 기본 serif에 한글 글리프가 없으면 한글은 기본 sans 계열로 fallback하므로 선택 UI와 실제 글꼴이 달라질 수 있었다.

나눔명조 regular/bold TTF를 번들에 포함하고 루트의 Expo Font에 `NailySerifRegular`/`NailySerifBold`로 등록했다. 작성 입력에도 `@font-face`의 `NailySerif`를 등록한다. 웹은 번들 asset URI를, native WebView는 다운로드된 asset의 base64를 사용한다. CSS 준비 결과는 캐시하며 입력 프레임에서 두 굵기의 로드 결과도 확인한다. [Expo Fonts 안내](https://docs.expo.dev/develop/user-interface/fonts/)의 font asset 로드 방식을 사용한다.

선택·이후 입력은 실제 `NailySerif`에 적용한다. 직렬화는 기존 `serif` enum으로 되돌리고, 미리보기·상세는 등록된 나눔명조 family를 사용한다. 새 메뉴에는 기본서체와 로드 가능한 나눔명조를 제공한다. 한글 차이를 보장할 별도 asset이 없는 고정폭 선택지는 새 메뉴에서 제거하고 기존 고정폭 문서 렌더링은 유지했다.

## 헤더와 공통 버튼

글쓰기 제목은 전체 헤더의 절대 위치 중앙 레이어에 둔다. 오른쪽 action 영역을 측정해 좌우에 같은 여백을 확보하므로 왼쪽 back/오른쪽 버튼 너비가 달라도 중심이 움직이지 않는다. 한 줄 표시와 자동 크기 조정을 사용한다. 320px 화면에서 제목 중심 x=160px를 측정했다.

기존 `PrimaryButton`을 확장했고 별도 중복 버튼은 만들지 않았다. small 크기, secondary variant, 접근성 label, busy 상태를 추가했다. `RADIUS.sm=10`, `SPACING.sm/xs`, `TYPOGRAPHY.labelMedium/labelLarge`를 공유한다. 작은 버튼은 보이는 높이 32px와 터치 높이 44px를 구분한다. primary는 테마색/흰 600 텍스트, secondary는 투명 배경/부드러운 테두리를 사용한다.

등록·수정 완료, 미리보기 편집, 상세 게시글 수정, 사진 편집·꾸미기 완료·텍스트 적용, 장소/투표 편집·완료, 색상 적용에 연결했다. 기존 공통 버튼의 기본 모서리도 같은 10px 토큰을 사용한다.

## 변경 파일

이번 추가 개선의 구현 파일은 다음과 같다. 이전 작업 및 다른 화면의 기존 수정은 유지했다.

- `app/write.tsx`, `app/image-decorator.tsx`, `app/post/[id].tsx`, `app/_layout.tsx`
- `components/BlogEditor.tsx`, `RichWritingInput.tsx`, `PostBlockRenderer.tsx`, `EditorToolbar.tsx`, `PrimaryButton.tsx`, `PostBlockForm.tsx`, `WritingSheet.tsx`
- 새 `components/ResizablePostImage.tsx`, `components/ColorPicker.tsx`
- `hooks/usePhotoReorder.ts`, `services/documentEditing.ts`, `services/postBlocks.ts`, `services/richWriting.ts`
- 새 `services/editorFonts.ts`, `services/colorPicking.ts`, `services/imagePixels.ts`
- `types/models.ts`, `app.json`, `package.json`, `package-lock.json`
- `tests/document-editing.test.cjs`, `tests/writing.test.cjs`, 새 `tests/editor-upgrade.test.cjs`

추가 dependency: SDK에 맞는 expo-image-manipulator / expo-file-system / expo-asset, @expo-google-fonts/nanum-myeongjo, jpeg-js, base64-js. expo-asset plugin을 등록했다.

## 검증 결과와 범위

- `npm run typecheck`: 통과.
- `node --test tests/*.test.cjs`: 73개 통과. 문자 위치 분할, 반복 이동 ID·서식·사진 메타데이터 보존, 비동기 드롭 취소, 폭 clamp·release 저장·취소, RGBA 추출, 배경 구간 제거/이후 입력 및 기존 자동 높이·저장·사진 꾸미기 history 회귀를 포함한다.
- `npx expo export --platform all --output-dir .tmp/editor-upgrade-export`: Android / iOS / Web 번들 생성 통과.
- 브라우저 320px: 글쓰기 제목 중심 160px, 헤더 겹침 없음.
- 브라우저 375px 및 실제 작성 흐름: 한글 명조 로드, 선택·이후 입력, 글자색/배경색 독립 적용, 배경 제거, 커서 이동 상태 표시, 스펙트럼 색 `#804040`, 본문·사진 꾸미기 사진 스포이드 색 `#995C77` 확인.
- 사진 중간 크기 55%가 미리보기·상세·수정에서 유지됨을 실제 DOM 너비 비율로 확인했다. 등록 후 수정 재진입에서 명조·글자색·배경색 run 복원도 확인했다.
- Android/iOS는 번들 생성과 mock 기반 responder·상태·문서 회귀 검증까지 수행했다. 실기기·에뮬레이터에서 터치 long press, 두 손가락 pinch, 네이티브 사진 권한 및 한글 IME를 직접 실행하지 않았으므로 실기기 통과로 보고하지 않는다. 브라우저에서 long-press 드래그 자체를 자동 실행한 결과도 포함하지 않는다.

스크린샷: [에디터 375px](community-editor-upgrade-preview.png), [헤더 320px](community-editor-320-preview.png), [공통 색상·사진 스포이드](community-color-picker-preview.png).
