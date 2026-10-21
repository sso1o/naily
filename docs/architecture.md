# 구조와 데이터 흐름

Expo Router 화면은 services의 검색·예약·글 저장 함수를 호출합니다. data/mockData.ts는 첫 실행에 샘플 자료를 제공하며, services/storage.ts가 저장된 스냅샷을 읽어 같은 배열에 복원합니다. commitData는 화면과 서비스가 수정한 데이터를 하나의 버전 있는 스냅샷으로 저장합니다. Web은 localStorage, Native는 expo-file-system의 앱 문서 디렉터리를 사용합니다. 서버 API나 비밀 키는 없습니다.

예약 흐름: 디자인 상세 또는 샵 상세 → booking → validateBooking → saveDemoReservation → 내역 → changeReservationStatus. 디자인-샵 매칭, 미래 날짜, 허용 시간, 같은 샵/사용자 시간 중복을 검사합니다. 취소·완료는 종료 상태이며 재승인할 수 없습니다.

글 흐름: write → 편집기/사진 꾸미기 → prepareMedia → savePostDraft → 커뮤니티/상세. 글 목록은 같은 객체를 참조하고, postInteractions는 useSyncExternalStore로 반응을 전파합니다. 사진 편집은 별도 초안을 왕복하며 완료 시 적용하고 취소 시 원본을 보존합니다.

관리 흐름: 샵 대시보드 미리보기 → shop-manage 또는 inquiries → 동일 기기 자료 수정 → 해당 샵 상세/문의함에서 반영. 실제 인증 경계와 네트워크 접근 제어는 구현 범위에 없습니다.

저장 실패는 storageError와 예외로 전달됩니다. 데이터는 평문이며 샘플 체험용입니다. 단일 프로세스/기기 전제의 중복 검사이므로 운영 환경에는 서버 트랜잭션·인증·권한·슬롯 모델·이미지 저장소가 추가로 필요합니다.
