# Naily 타이포그래피 적용 보고서 (2026-09-29)

> 후속 글쓰기 화면 재구성은 [글쓰기 보고서](./writing-redesign.md)를 참조하세요. 아래 화면별 목록/개수는 당시 작업 기록이며, typography-style-audit.json의 글쓰기 항목은 최신 스타일로 갱신했습니다.

수정 전 실제 router 호출과 공통 카드 콜백을 추적했다. 홈/커뮤니티의 하단 탭 이동도 포함한다. 독립 큐레이터·매거진 상세는 없고 매거진은 게시글 상세를 사용한다. 게시글 작성자명에는 프로필 이동이 없다. 설정·신고 등 네이티브 Alert는 OS 글꼴을 사용하며 새 화면을 만들지 않는다.

| 시작 영역 | 이동 경로 | 화면 파일 | 점검한 요소 | 적용 여부 | 예외 |
|---|---|---|---|---|---|
| 홈 | 홈 | app/(tabs)/index.tsx | 헤더, 매거진, 샵, 아트, 광고, 인기글 | 적용 완료 · 코드 점검 | 공통 홈 섹션 사용 |
| 홈 | 검색 / 더보기 → 레거시 검색 → 검색 | app/search_result.tsx | 리다이렉트 | 해당 없음 | 텍스트 없음 |
| 공통 | 홈 검색 / 디자인 태그 → 검색 | app/search.tsx | 검색어, 추천, 최근 검색, 순위, 결과, 필터·정렬 시트, 빈 결과 | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 홈 아트 / 검색 → 디자인 상세 | app/design/[id].tsx | 제목, 설명, 태그, 가격, 통계, 관련 샵·디자인, 고정 CTA | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 디자인 상세 → 사진 모아보기 | app/design-gallery.tsx | 제목, 정렬, 작성자, 날짜, 하트, 뷰어, 게시글 버튼 | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 홈 매거진·인기글 / 피드 / 검색 / 갤러리 → 게시글 | app/post/[id].tsx | 제목, 작성자, 본문, 반응, 댓글·답글, 입력, 빈 상태 | 적용 완료 · 코드 점검 | 사용자 본문 서식 |
| 공통 | 홈 더보기 / 하단 탭 → 커뮤니티 | app/(tabs)/community.tsx | 피드, 카드, 팔로잉 안내, 오류, 완료 피드백 | 적용 완료 · 코드 점검 | 없음 |
| 커뮤니티 | 새 글 / 샵 새 글 → 작성·수정·미리보기 | app/write.tsx | 입력, 라벨, 카테고리, 태그, 미리보기, 편집기 | 적용 완료 · 코드 점검 | 수정은 파라미터 분기, 네이티브 Alert |
| 커뮤니티 | 작성 이미지 편집 → 꾸미기 | app/image-decorator.tsx | 헤더, 입력, 도구, 선택 상태, 도움말 | 적용 완료 · 코드 점검 | 사용자 이미지 장식 서식 |
| 공통 | 홈 샵 / 검색 / 디자인 추천 샵 / 예약 허브 → 샵 상세 | app/shop/[id].tsx | 제목, 주소, 영업 정보, 날짜, 혜택, 메뉴·가격, 리뷰, CTA | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 샵 상세 → 지도 | app/shop/[id]/map.tsx | 지도 라벨, 주소, 거리, 이동 정보, 버튼 | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 샵 상세 → 사진 | app/shop/[id]/gallery.tsx | 헤더, 사진 수, 뷰어 | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 샵 상세 → 샵 계정 → 디자인 상세 | app/shop/[id]/account.tsx | 상호, 핸들, 소개, 통계, 팔로우·메시지, 디자인 제목 | 적용 완료 · 코드 점검 | 일반 사용자 프로필 경로는 없음 |
| 공통 | 샵 상세 → 이달의 아트 | app/shop/[id]/monthly-art.tsx | 월 선택, 피커, 카드, 가격, 빈 상태 | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 이달의 아트 → 뷰어 | app/shop/[id]/monthly-art-viewer.tsx | 제목, 개수, 미디어 종류, 가격 | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 샵 상세 → 리뷰 전체 | app/shop/[id]/reviews.tsx | 평점, 리뷰 수, 작성자, 날짜, 본문 | 적용 완료 · 코드 점검 | 없음 |
| 추가 점검 | 대표 디자인 라우트: 현재 진입 콜백 없음 | app/shop/[id]/designs.tsx | 요약, 디자인 공통 카드 | 적용 완료 · 코드 점검 | 접근 가능한 독립 라우트라 함께 점검 |
| 공통 | 홈 광고 / 하단 탭 → 예약 허브 | app/(tabs)/reservation.tsx | 비주얼, CTA, 칩, 추천 샵, 내 예약, 데모 안내 | 적용 완료 · 코드 점검 | 없음 |
| 공통 | 샵·디자인 상세 / 이전 예약 링크 → 예약 폼 | app/booking.tsx | 선택 단계, 날짜·시간, 요약, 저장 상태, 안내 | 적용 완료 · 코드 점검 | 네이티브 Alert |
| 공통 | 예약 내역 / 하단 탭 → 마이페이지 | app/(tabs)/mypage.tsx | 프로필, 예약, 저장 디자인, 메뉴, 배너 | 적용 완료 · 코드 점검 | 설정 등은 Alert |
| 공통 | 마이페이지 → 샵 대시보드 | app/shop-dashboard.tsx | 등록 안내, 입력, 상태, 지표, 도구, 예약 카드 | 적용 완료 · 코드 점검 | 역할별 분기 |
| 커뮤니티·공통 | 샵 소유자 피드 링크 / 대시보드 → 샵 커뮤니티 | app/shop-community.tsx | 접근 안내, 카테고리, 카드, 작성 버튼 | 적용 완료 · 코드 점검 | 역할별 분기 |
| 공통 | 모든 라우트의 셸 | app/_layout.tsx, app/(tabs)/_layout.tsx | 탭/스택, BottomNav | 해당 없음 | 탭은 아이콘만 표시 |

공통 컴포넌트: ScreenHeader, PrimaryButton, EmptyState, TagChip, RoleBadge, ReservationCard, ReviewCard, BlogPostCard, CommunityResultCard, DesignResultCard, ShopResultCard, ShopCommunityCard, BlogEditor, EditorToolbar, PostBlockRenderer, DecoratedImage, CommunityRefreshFeedback, SearchTopArea, search/*, home/*.

## 최종 토큰

기존 시스템 폰트 패밀리를 유지한다. 일반 본문 400, 라벨 600, 제목·활성 상태 700을 사용한다. React Native의 논리 크기이며 기기의 접근성 확대 설정을 따른다.

| 토큰 | 크기 | 줄 높이 | 굵기 | 역할 |
|---|---:|---:|---:|---|
| display | 28 | 36 | 700 | 메인 비주얼 |
| titleLarge | 24 | 32 | 700 | 화면 대표 제목 |
| titleMedium | 20 | 28 | 700 | 섹션 제목 |
| titleSmall | 18 | 24 | 700 | 상세 소제목·내비게이션 |
| bodyLarge | 16 | 24 | 400 | 주요 상세 본문 |
| bodyMedium | 15 | 22 | 400 | 일반 본문·입력 |
| bodySmall | 14 | 20 | 400 | 보조 설명·카드 미리보기 |
| labelLarge | 14 | 20 | 600 | 버튼·탭·카드 이름·가격 |
| labelMedium | 13 | 18 | 600 | 칩·배지·작은 버튼 |
| caption | 12 | 16 | 400 | 날짜·거리·통계 |

## 실제 연결 범위

홈 직접 연결: 검색, search_result 리다이렉트, 디자인 상세, 샵 상세, 매거진/인기 게시글 상세, 예약 허브, 커뮤니티. 하단 탭은 마이페이지도 연결한다.

홈 상세에서 이어지는 연결: 디자인 → 디자인 갤러리 → 게시글; 디자인 태그 → 검색; 디자인/샵 → 예약 폼 → 마이페이지; 샵 → 지도·사진·계정·이달의 아트·리뷰; 계정 → 디자인; 이달의 아트 → 미디어 뷰어; 마이페이지 → 샵 대시보드 → 샵 커뮤니티.

커뮤니티 직접 연결: 게시글, 새 글, 역할 조건부 샵 커뮤니티. 작성 화면 → 이미지 꾸미기 → 작성 화면으로 복귀; 등록 → 게시글. 수정·미리보기는 작성 화면 내부 분기다. 게시글 댓글·답글·반응은 같은 화면에서 처리한다. 별도 작성자 프로필·팔로워 목록·큐레이터 상세·매거진 상세 라우트는 없다. 샵 커뮤니티 → 샵 대시보드 또는 샵 글쓰기 → 게시글. 나머지 공유 경로는 하단 탭을 통해 홈 연결 범위와 합쳐진다.

상단 표의 각 행은 실제 라우트별 코드 점검 결과다. 모든 행을 실기기에서 실행했다는 의미는 아니다. 제목·본문·라벨·메타·상태·입력·조건부 화면을 동일한 기준으로 점검했다.

## 공통 처리 및 화면별 스타일 상세

공통 Text 래퍼를 새로 만들지 않고 기존 StyleSheet에 의미별 토큰을 적용했다. ScreenHeader(제목), home/SectionHeader(섹션·더보기), PrimaryButton, TagChip, RoleBadge, EmptyState, 카드 7종, 검색 탭/입력/필터/정렬, 편집기/본문 렌더러, 새로고침 피드백에서 재사용한다. 카드의 이름·가격은 labelLarge, 설명은 bodySmall/bodyMedium, 날짜·통계는 caption으로 구분한다.

312개 크기/줄 높이/굵기 토큰 스타일과 9개 굵기 전용 스타일의 파일·스타일명·적용 토큰 전체 대응은 [스타일 감사 기록](./typography-style-audit.json)에 기록했다. 화면별 변경 텍스트 종류는 위 라우트 표의 ‘점검한 요소’ 열과 아래 파일별 토큰 목록을 함께 참조한다.

| 수정 화면/컴포넌트 | 적용 토큰 |
|---|---|
| [app/booking.tsx](../app/booking.tsx) | titleSmall, bodySmall, titleMedium, labelMedium, labelLarge, caption |
| [app/design-gallery.tsx](../app/design-gallery.tsx) | titleSmall, caption, labelLarge, labelMedium, bodyMedium |
| [app/image-decorator.tsx](../app/image-decorator.tsx) | titleSmall, labelLarge, caption, labelMedium, FONT_WEIGHT (기본 텍스트 크기 상속), bodyMedium, bodySmall |
| [app/search.tsx](../app/search.tsx) | titleMedium, caption, labelLarge, labelMedium, bodyMedium, titleSmall |
| [app/shop-community.tsx](../app/shop-community.tsx) | caption, titleLarge, bodySmall, titleMedium, labelLarge |
| [app/shop-dashboard.tsx](../app/shop-dashboard.tsx) | titleLarge, bodySmall, labelMedium, titleMedium, caption, labelLarge, titleSmall |
| [app/write.tsx](../app/write.tsx) | labelLarge, titleLarge, labelMedium, bodySmall, caption |
| [app/(tabs)/community.tsx](../app/(tabs)/community.tsx) | labelLarge, FONT_WEIGHT (기본 텍스트 크기 상속), bodySmall, titleSmall, labelMedium |
| [app/(tabs)/mypage.tsx](../app/(tabs)/mypage.tsx) | titleLarge, titleMedium, labelMedium, caption, titleSmall, bodySmall, labelLarge |
| [app/(tabs)/reservation.tsx](../app/(tabs)/reservation.tsx) | titleLarge, labelLarge, caption, display, bodySmall, titleMedium, labelMedium |
| [app/design/[id].tsx](../app/design/[id].tsx) | labelMedium, titleLarge, bodyLarge, caption, titleSmall, titleMedium, bodySmall |
| [app/post/[id].tsx](../app/post/[id].tsx) | titleSmall, caption, labelMedium, titleLarge, labelLarge, titleMedium, bodyMedium, bodySmall |
| [app/shop/[id].tsx](../app/shop/[id].tsx) | caption, titleLarge, labelMedium, bodySmall, FONT_WEIGHT (기본 텍스트 크기 상속), labelLarge, titleSmall, titleMedium, display |
| [app/shop/[id]/account.tsx](../app/shop/[id]/account.tsx) | titleLarge, caption, bodySmall, labelLarge, titleMedium |
| [app/shop/[id]/designs.tsx](../app/shop/[id]/designs.tsx) | bodySmall |
| [app/shop/[id]/gallery.tsx](../app/shop/[id]/gallery.tsx) | titleSmall, caption |
| [app/shop/[id]/map.tsx](../app/shop/[id]/map.tsx) | labelMedium, titleSmall, bodySmall, labelLarge, caption |
| [app/shop/[id]/monthly-art-viewer.tsx](../app/shop/[id]/monthly-art-viewer.tsx) | titleSmall, caption, labelMedium |
| [app/shop/[id]/monthly-art.tsx](../app/shop/[id]/monthly-art.tsx) | labelLarge, caption, titleSmall, bodySmall, bodyMedium, FONT_WEIGHT (기본 텍스트 크기 상속) |
| [app/shop/[id]/reviews.tsx](../app/shop/[id]/reviews.tsx) | display, caption |
| [components/BlogEditor.tsx](../components/BlogEditor.tsx) | bodySmall, labelMedium, labelLarge, bodyMedium, caption |
| [components/BlogPostCard.tsx](../components/BlogPostCard.tsx) | titleMedium, bodyMedium, labelLarge, labelMedium, caption, bodySmall |
| [components/CommunityRefreshFeedback.tsx](../components/CommunityRefreshFeedback.tsx) | labelMedium |
| [components/CommunityResultCard.tsx](../components/CommunityResultCard.tsx) | labelMedium, labelLarge, bodySmall, caption |
| [components/DesignResultCard.tsx](../components/DesignResultCard.tsx) | labelLarge, labelMedium, caption |
| [components/EditorToolbar.tsx](../components/EditorToolbar.tsx) | labelMedium |
| [components/EmptyState.tsx](../components/EmptyState.tsx) | titleSmall, bodySmall |
| [components/PostBlockRenderer.tsx](../components/PostBlockRenderer.tsx) | titleMedium, bodyLarge |
| [components/PrimaryButton.tsx](../components/PrimaryButton.tsx) | labelLarge |
| [components/ReservationCard.tsx](../components/ReservationCard.tsx) | labelLarge, labelMedium, bodySmall |
| [components/ReviewCard.tsx](../components/ReviewCard.tsx) | labelMedium, caption, bodyMedium |
| [components/RoleBadge.tsx](../components/RoleBadge.tsx) | labelMedium |
| [components/ScreenHeader.tsx](../components/ScreenHeader.tsx) | titleSmall |
| [components/SearchTopArea.tsx](../components/SearchTopArea.tsx) | bodySmall, bodyMedium |
| [components/ShopCommunityCard.tsx](../components/ShopCommunityCard.tsx) | labelMedium, caption, labelLarge, bodySmall |
| [components/ShopResultCard.tsx](../components/ShopResultCard.tsx) | labelLarge, labelMedium, bodySmall, caption, FONT_WEIGHT (기본 텍스트 크기 상속) |
| [components/TagChip.tsx](../components/TagChip.tsx) | labelMedium |
| [components/home/HomeAdBanner.tsx](../components/home/HomeAdBanner.tsx) | caption, titleLarge, bodySmall, labelLarge |
| [components/home/HomeImage.tsx](../components/home/HomeImage.tsx) | labelMedium |
| [components/home/HomeStickyHeader.tsx](../components/home/HomeStickyHeader.tsx) | bodySmall, bodyMedium, labelMedium |
| [components/home/MagazineSection.tsx](../components/home/MagazineSection.tsx) | labelMedium, titleLarge, bodySmall, caption |
| [components/home/MonthlyArtSection.tsx](../components/home/MonthlyArtSection.tsx) | labelLarge, caption |
| [components/home/NearbyShopsSection.tsx](../components/home/NearbyShopsSection.tsx) | caption, labelMedium, labelLarge |
| [components/home/PopularCommunitySection.tsx](../components/home/PopularCommunitySection.tsx) | labelMedium, caption, labelLarge, bodySmall |
| [components/home/SectionHeader.tsx](../components/home/SectionHeader.tsx) | titleMedium, bodySmall, labelLarge |
| [components/search/SearchCategoryTabs.tsx](../components/search/SearchCategoryTabs.tsx) | labelLarge, FONT_WEIGHT (기본 텍스트 크기 상속) |
| [components/search/SearchFilterSheet.tsx](../components/search/SearchFilterSheet.tsx) | titleSmall, labelLarge, labelMedium, FONT_WEIGHT (기본 텍스트 크기 상속) |
| [components/search/SearchInput.tsx](../components/search/SearchInput.tsx) | bodyMedium |
| [components/search/SearchSortSheet.tsx](../components/search/SearchSortSheet.tsx) | titleSmall, bodyMedium, FONT_WEIGHT (기본 텍스트 크기 상속) |

추가 수정 파일: [constants/typography.ts](../constants/typography.ts), [tests/community-refresh.test.cjs](../tests/community-refresh.test.cjs) (굵기 토큰 mock 갱신), [tests/typography.test.cjs](../tests/typography.test.cjs). 문서 산출물: 이 보고서, typography-style-audit.json, typography-changed-files.json, typography-audit-before.txt. 앱/컴포넌트 49개와 위 3개 코드 파일이 이번 타이포그래피 작업 범위다. Git에 이미 있던 app.json, package.json/lock, 서비스·훅·모델 등 선행 변경은 이번 변경 목록에 포함하지 않는다.

## 하드코딩 예외

아래는 일반 읽기용 문구가 아닌 기존 로고·문자 아이콘이다. 원래 비율과 색상을 유지하기 위해 남겼다. 위치는 현재 파일의 스타일 선언 기준이다. 굵기만 선언된 활성 상태는 공통 FONT_WEIGHT를 사용한다.

| 파일·위치 | 스타일 | 크기 / 줄 높이 / 굵기 | 이유 |
|---|---|---|---|
| [app/booking.tsx:107](../app/booking.tsx) | successIcon | 18 / 38 / '900' | 문자 아이콘/기호 |
| [app/shop-community.tsx:58](../app/shop-community.tsx) | lockText | 28 / 상속 / '900' | 문자 아이콘/기호 |
| [app/shop-community.tsx:74](../app/shop-community.tsx) | fabText | 29 / 상속 / 상속 | 문자 아이콘/기호 |
| [app/shop-dashboard.tsx:86](../app/shop-dashboard.tsx) | guideIcon | 28 / 70 / 상속 | 문자 아이콘/기호 |
| [app/shop-dashboard.tsx:108](../app/shop-dashboard.tsx) | toolIconText | 14 / 상속 / '900' | 문자 아이콘/기호 |
| [app/shop-dashboard.tsx:118](../app/shop-dashboard.tsx) | communityArrow | 28 / 상속 / 상속 | 문자 아이콘/기호 |
| [app/(tabs)/mypage.tsx:76](../app/(tabs)/mypage.tsx) | settings | 20 / 상속 / 상속 | 문자 아이콘/기호 |
| [app/(tabs)/mypage.tsx:87](../app/(tabs)/mypage.tsx) | shopBannerArrow | 29 / 상속 / 상속 | 문자 아이콘/기호 |
| [app/(tabs)/mypage.tsx:93](../app/(tabs)/mypage.tsx) | menuIcon | 17 / 상속 / 상속 | 문자 아이콘/기호 |
| [components/EmptyState.tsx:17](../components/EmptyState.tsx) | icon | 42 / 상속 / 상속 | 문자 아이콘/기호 |
| [components/ScreenHeader.tsx:22](../components/ScreenHeader.tsx) | backText | 34 / 37 / '300' | 문자 아이콘/기호 |
| [components/SearchTopArea.tsx:61](../components/SearchTopArea.tsx) | brand | 30 / 상속 / '900' | 브랜드 로고 |
| [components/SearchTopArea.tsx:64](../components/SearchTopArea.tsx) | bellText | 22 / 상속 / '700' | 문자 아이콘/기호 |
| [components/SearchTopArea.tsx:66](../components/SearchTopArea.tsx) | icon | 24 / 상속 / 상속 | 문자 아이콘/기호 |
| [components/home/HomeStickyHeader.tsx:75](../components/home/HomeStickyHeader.tsx) | wordmark | 25 / 29 / '900' | 브랜드 로고 |
| [components/home/HomeStickyHeader.tsx:99](../components/home/HomeStickyHeader.tsx) | notificationIcon | 20 / 상속 / '800' | 문자 아이콘/기호 |
| [components/home/SectionHeader.tsx:50](../components/home/SectionHeader.tsx) | chevron | 18 / 상속 / 상속 | 문자 아이콘/기호 |

사용자 작성 콘텐츠의 추가 예외:

| 파일·위치 | 값 | 이유 |
|---|---|---|
| [components/BlogEditor.tsx:96](../components/BlogEditor.tsx) | 제목 18/20/24, 본문 14/16/18; 기본 20/15 | 사용자가 선택하는 저장 콘텐츠 서식 유지 |
| [app/write.tsx:28](../app/write.tsx) | 기본 제목 20, 본문 15 | 기존 작성 초깃값 유지 |
| [app/image-decorator.tsx:28](../app/image-decorator.tsx) | 선택 18/24/30/38, 기본 16/30, 굵기 800/500 | 이미지 안의 사용자 장식 데이터 |
| [components/DecoratedImage.tsx:201](../components/DecoratedImage.tsx) | (선택 크기 또는 24) × 이미지 배율, 줄 높이 ×1.24, 저장 굵기 또는700 | 이미지와 함께 축소되는 그래픽; 일반 UI 12 제한에서 제외 |
| [constants/typography.ts:20](../constants/typography.ts) | 최소12, 지정 크기의 줄 높이 ceil(크기×1.5), 기본15/22·20/28 | 작성 본문과 미리보기/상세가 동일한 서식을 사용 |

일반 UI 최소 크기는 **12**다. 이미지 속 사용자 장식 글자는 이미지 배율에 따라 12보다 작게 렌더링될 수 있다. 이미지 자체의 텍스트와 네이티브 Alert/외부 아이콘 폰트는 UI 토큰 적용 대상이 아니다. 새로운 폰트, 패키지, allowFontScaling 제한은 추가하지 않았다.

## 레이아웃 보정

- 홈 헤더·검색 필드·공통 헤더를 고정 높이에서 최소 높이로 바꿔 글자 확대 시 확장되도록 했다. 검색 입력과 카테고리 탭에도 같은 원칙을 적용했다.
- 공통 헤더 우측 40 고정 폭을 최소 폭/최대 비율로 바꿔 320px에서 ‘미리보기’가 한 글자만 다음 줄로 떨어지는 문제를 보정했다.
- 피드 작성자 행·팔로우 버튼, 댓글 입력, 샵 계정 버튼, 지도 CTA는 최소 높이/패딩으로 여유를 확보했다.
- 예약 카드·리뷰 헤더·검색 샵 메타·홈 섹션 헤더·인기글 작성자·주변 샵 메타·디자인 카드 메타에 줄바꿈/축소 여지를 추가했다.
- 공통 버튼은 세로 패딩과 가운데 정렬, 카드 작성자·샵 이름은 flexShrink/minWidth 조정으로 긴 이름을 수용한다. 기존 numberOfLines, 콘텐츠 하단 inset, SafeArea, 스크롤·탐색 동작은 유지했다.

## 검증 결과

- 설치 버전: Expo 57.0.19, React Native 0.86.3, React 19.2.3. 패키지/폰트 추가·변경 없음.
- `npm run typecheck`: 통과.
- `node --test tests/*.test.cjs`: **21/21 통과**. 기존 새로고침·반응·예약·뒤로가기 회귀 테스트 18개와 타이포그래피 계약·감사·작성 콘텐츠 서식 테스트 3개다. 네이티브 렌더러 테스트는 아니다.
- 린트: 기존 lint 스크립트·설정이 없어 실행하지 않았다. ‘린트 통과’로 간주하지 않는다.
- 작업 직전 앱/컴포넌트 스냅샷과 TypeScript AST로 색상 속성 및 on*/href 속성을 비교: 변경 없음. Text/TextInput에 style 속성이 없는 항목 없음. 이것만으로 모든 기능의 실기기 정상 동작을 증명하지는 않는다.
- 일반 UI에 남은 직접 fontSize/lineHeight는 위 17개 로고/기호 스타일로 한정된다. 작성 콘텐츠 데이터와 이미지 장식은 별도 예외다.

| 웹 뷰포트 | 실행 확인 화면 | 확인 결과 |
|---|---|---|
| 375×812 | 홈, 커뮤니티 피드 | 제목·카드·작성자·메타·탭 렌더링 확인 |
| 320×740 | 검색 첫 화면·디자인 검색 결과·정렬 시트 | 카드 2열·탭·가격·시트 텍스트 확인, 검색 첫 화면 문서 가로 폭 320 확인 |
| 320×740 | 작성 | 미리보기 버튼 줄바꿈 발견 → 폭 보정 후 한 줄 표시 재확인; 입력·도구·도움말 확인 |
| 320×740 | 게시글 상세 | 긴 한글 제목·본문 줄바꿈, 하단 댓글 입력 확인 |
| 320×740 | 디자인·샵 상세 | 제목·태그·메타·하단 CTA 확인 |
| 320×740 | 예약 허브·예약 폼 | 비주얼 문구·CTA·단계·샵 정보·날짜 확인 |

프로젝트에 명시된 최소 지원 너비는 확인되지 않아 320을 좁은 화면 검증 기준으로 사용했다. 위 웹 확인은 초기 화면/주요 영역의 수동 검증이며 모든 스크롤 위치·조건 분기·글자 확대를 시각 검증한 것은 아니다. 나머지 하위 라우트와 오류/빈 상태는 코드 감사로 점검했다.

기존 웹 경고가 남아 있다: MonthlyArtSection의 카드와 ThumbnailHeartButton 중첩 button 관련 HTML/hydration 경고, shadow 스타일·pointerEvents의 deprecated 경고, useNativeDriver 웹 대체 실행 경고. 타이포그래피 범위 밖의 기존 구조이므로 변경하지 않았다. 따라서 런타임 경고가 0개라는 결론은 내리지 않는다.

## 실기기 추가 확인

iOS/Android 실기기 또는 에뮬레이터는 이번 환경에서 실행하지 못했다. 아래 항목은 네이티브 검증이 필요하다.

- 홈·커뮤니티·검색: 시스템 글자 크기 기본/큰 설정에서 400/600/700 굵기, 한국어/영어/숫자의 줄 높이와 베이스라인, 긴 작성자·샵 이름.
- 작성·미리보기·게시글 상세·댓글: TextInput의 iOS/Android 기본 내부 패딩, 키보드 등장 시 댓글 입력/고정 버튼 가림, 저장한 사용자 서식의 일치.
- 이미지 꾸미기·갤러리·이달의 아트/월 피커: 이미지 축소 텍스트, 전체화면 뷰어, 선택 라벨, 긴 날짜와 큰 글씨.
- 검색 필터/정렬 시트, 샵 지도·계정·리뷰, 예약 폼·마이페이지·샵 대시보드: 큰 글씨와 작은 기기에서 하단 SafeArea/탭 영역, 긴 상태·예약 날짜/가격.
- 커뮤니티 새로고침 완료 피드백과 빈/오류 상태: 글자 확대와 네이티브 refresh indicator가 겹치지 않는지. 기존 RefreshControl 및 요청/햅틱 로직은 이번 작업에서 변경하지 않았다.
