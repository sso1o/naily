# 개발 안내

Node 22+, npm ci → npm run web. 검사: npm run typecheck, npm test. 정적 빌드: npm run build:web, npm run preview. Android/iOS 코드는 npm run android 또는 npm run ios로 개발 서버에서 실행할 수 있으나 이 포트폴리오 작업에서는 실기기 실행을 검증하지 않았습니다.

Web 저장 키는 naily.portfolio.v1이며 개발자 도구에서 해당 키를 지우면 다음 새로고침에 샘플 상태로 돌아갑니다. Native는 앱 문서 디렉터리의 같은 이름 JSON과 복사 미디어를 사용합니다.

services에 검증 가능한 로직을 두고 app에는 화면 연결을 둡니다. 테스트는 TypeScript를 transpile하고 React/Native를 모킹하는 경우가 있으므로 실기기 E2E와 구분합니다. scripts/preview.cjs는 127.0.0.1에 바인딩하는 로컬 미리보기 서버입니다. 운영 서버가 아닙니다.

기존 react-native-tab-view 패치는 현재 의존성에 대상 패키지가 없어 제거했습니다. 새 설치에서 patch-package 오류 없이 시작하도록 package.json과 lockfile을 정리했습니다.

docs 내 다른 편집기·타이포그래피 문서는 이전 개발 당시의 기록이며 현재 검증 결과는 project-status.md를 기준으로 확인합니다.

## 브라우저 회귀 검사

npm ci 후 npx playwright install chromium, npm run build:web, npm run test:e2e 순서로 실행합니다. Windows에서 설치된 Edge를 사용할 경우 PLAYWRIGHT_CHANNEL 환경변수를 msedge로 지정할 수 있습니다. 검사는 별도 임시 브라우저 프로필과 로컬 서버를 사용하며 테스트 자료는 개인 브라우저에 영향을 주지 않습니다.
