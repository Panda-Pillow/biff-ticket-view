# 나의 상영 일정

BIFF 예매 목록을 관람일별로 모아 보고, 상세보기에서 돌아와도 필터와 보던 위치를 이어가는 **비공식 데스크톱 Chrome 확장**입니다.

![프로모 이미지](assets/promo-440x280.png)

부산국제영화제(BIFF) 및 예매 시스템 운영사와 제휴하거나 이들의 승인을 받은 제품이 아닙니다. 공식 로고를 사용하지 않습니다.

[소개](https://panda-pillow.github.io/biff-ticket-view/) · [개인정보 처리방침](https://panda-pillow.github.io/biff-ticket-view/privacy-policy.html) · [지원](https://panda-pillow.github.io/biff-ticket-view/support.html) · [배포 파일](https://github.com/Panda-Pillow/biff-ticket-view/releases)

## 기능

- 선택한 관람 월의 모든 페이지를 조회하고 날짜·시간순으로 정렬
- 날짜별 건수, 영화명 검색, 상영관 필터, 오름차순·내림차순 정렬
- 예매내역과 취소내역 전환
- 같은 탭의 조회 조건과 위치 복원; 사라진 항목은 기존 순서의 다음 또는 이전 항목으로 복원
- 공식 상세·취소 화면 연결; 조건에 맞는 HTTPS 모바일티켓 링크 연결
- 하단 배너·푸터 숨김, 원래 목록 보기

자동 예매·자동 취소 기능은 없습니다. 여러 달 통합, 기기 동기화, 오프라인 티켓 보관 기능도 없습니다. 원래 화면으로 전환해도 푸터 숨김은 유지됩니다.

## 설치

현재는 직접 설치용 배포입니다. Chrome 웹스토어 승인·출시가 완료된 상태가 아닙니다.

1. [Releases](https://github.com/Panda-Pillow/biff-ticket-view/releases)에서 ZIP을 내려받아 압축을 풉니다.
2. Chrome의 `chrome://extensions`에서 개발자 모드를 켭니다.
3. **압축해제된 확장 프로그램을 로드합니다**에서 `manifest.json`이 들어 있는 폴더를 선택합니다.
4. BIFF 예매 사이트에 로그인하고 [예매 목록](https://biff.maketicket.co.kr/mypage/tickets/list)을 새로고침합니다.
5. 예매한 영화의 **관람 월**을 선택합니다.

소스를 clone했다면 로드할 폴더는 `extension/`입니다. 업데이트할 때 확장 관리 화면에서 확장을 새로고침한 뒤 사이트도 새로고침하세요. iPhone/Android의 Chrome은 이 데스크톱 확장 설치 대상이 아닙니다.

## 데이터 처리

확장은 원래 예매 API에 기존 로그인 세션을 포함한 HTTPS 목록 요청을 보냅니다. 예매 데이터를 개발자 서버로 보내지 않으며 광고·분석 SDK가 없습니다.

목록은 페이지 메모리에서 처리합니다. 필터와 위치 복원용 예매번호·목록 순서는 해당 사이트의 탭 단위 `sessionStorage`에 저장합니다. 이 저장소는 웹사이트와 공유되며 별도의 애플리케이션 수준 암호화를 적용하지 않습니다. 브라우저 세션 복원에 따라 다시 복원될 수 있습니다. 확장 삭제나 필터 초기화만으로 이 데이터가 모두 삭제된다고 보장하지 않습니다.

저장 상태를 확실히 제거하려면 확장을 끄고 사이트 데이터를 삭제하세요. 사이트 로그인에도 영향을 줄 수 있습니다. [전체 처리방침](https://panda-pillow.github.io/biff-ticket-view/privacy-policy.html)을 참고하세요.

## 개발 및 확인

런타임에는 외부 라이브러리와 빌드 단계가 없습니다. Node.js 20 이상과 패키징용 Python 3을 사용합니다.

```sh
npm test
npm run check
npm run package
```

패키지는 `dist/biff-ticket-view-0.1.4.zip`에 생성됩니다. Manifest가 ZIP 최상위에 들어갑니다.

| 파일 | 역할 |
|---|---|
| `extension/core.js` | 응답 정규화, 필터·정렬, 페이지 수집·누락 감지, 복원 기준 선택 |
| `extension/content.js` | 목록 UI, 조회, 상태 저장과 복원 |
| `extension/page.css` | 목록 하단 배너·푸터 숨김 |
| `tests.cjs` | 가상 데이터 기반 핵심 동작 테스트 |

자동 테스트는 실제 예매 서비스의 가용성·취소 결과를 보장하지 않습니다. 실제 사이트의 로그인된 목록 표시가 확인되었지만, 사이트 변경과 모든 취소 시나리오를 검증한 것은 아닙니다. 조회 실패나 목록 누락 감지 시 원래 목록을 유지합니다.

## 기여 및 문의

기여 방법은 [CONTRIBUTING.md](CONTRIBUTING.md), 보안 제보는 [SECURITY.md](SECURITY.md)를 참고하세요. 예매번호·모바일티켓 URL·QR 코드·로그인 쿠키·결제정보를 공개 이슈에 올리지 마세요.

개발자: 팬더 필로 (Panda Pillow Apps) · heesu.jung.developer@gmail.com

소스는 검토할 수 있도록 공개되어 있습니다. 별도 오픈소스 라이선스는 아직 지정하지 않았습니다. 재배포·수정 배포의 허용 범위는 개발자에게 문의하세요.
