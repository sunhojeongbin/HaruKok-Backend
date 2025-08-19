# HaruKok-BE

HaruKok BE

### 버전 관리

node -v

v22.14.0

npm -v

11.5.2

nest -v

11.0.10

### 클린 아키텍처 기반 폴더 구조

```
src/
├── main.ts # 앱 부트스트랩
├── app.module.ts # 최상위 모듈
│
├── core/ # 도메인 계층 (순수 비즈니스 규칙)
│ ├── entities/ # 엔티티(도메인 모델)
│ ├── use-cases/ # 유스케이스(비즈니스 로직)
│ └── interfaces/ # 추상 인터페이스(Repository 등)
│
├── infrastructure/ # 인프라 계층
│ ├── database/ # DB 연결, TypeORM 설정
│ │ ├── entities/ # DB 엔티티
│ │ └── repositories/ # DB 구현체
│ ├── messaging/ # Kafka, RabbitMQ, Redis 어댑터
│ └── config/ # 환경변수, 설정
│
├── application/ # 애플리케이션 계층
│ ├── dto/ # 요청/응답 DTO
│ ├── services/ # 유스케이스 호출 + 트랜잭션 관리
│ └── mappers/ # 엔티티 ↔ DTO 변환
│
├── presentation/ # 프레젠테이션 계층 (Nest 컨트롤러)
│ ├── controllers/
│ └── filters/ # 예외 필터
│
├── common/ # 전역 공통 (미들웨어, 가드, 인터셉터 등)
│
└── docs/ # 스웨거 설정
```

```
HaruKok-BE/
├── 📁 docs/                                    # 📚 프로젝트 문서
│   └── API_RESPONSE_GUIDE.md                   # API 응답 가이드
│
├── 📁 src/                                     # 🎯 소스 코드
│   ├── 📄 app.controller.spec.ts               # 앱 컨트롤러 테스트
│   ├── 📄 app.controller.ts                    # 앱 컨트롤러
│   ├── 📄 app.module.ts                        # 앱 메인 모듈
│   ├── 📄 app.service.ts                       # 앱 서비스
│   ├── 📄 main.ts                              # 애플리케이션 진입점
│   │
│   ├── 📁 application/                         # 🏢 애플리케이션 계층
│   │   ├── 📄 application.module.ts            # 애플리케이션 모듈
│   │   ├── 📁 dto/                             # 데이터 전송 객체
│   │   │   └── 📄 user.dto.ts                  # 사용자 DTO
│   │   └── 📁 services/                        # 비즈니스 로직 서비스
│   │       ├── 📄 user.service.ts              # 사용자 서비스
│   │       └── 📄 user.service.new.ts          # 사용자 서비스 (신규)
│   │
│   ├── 📁 common/                              # 🔧 공통 모듈
│   │   ├── 📄 common.module.ts                 # 공통 모듈 정의
│   │   ├── 📁 builders/                        # 빌더 패턴
│   │   │   └── 📄 response.builder.ts          # 응답 빌더
│   │   ├── 📁 constants/                       # 상수 정의
│   │   │   └── 📄 response-message.ts          # 응답 메시지 상수
│   │   ├── 📁 dto/                             # 공통 DTO
│   │   │   └── 📄 api-response.dto.ts          # API 응답 DTO
│   │   ├── 📁 filters/                         # 예외 필터
│   │   │   └── 📄 http-exception.filter.ts     # HTTP 예외 필터
│   │   ├── 📁 guards/                          # 가드 (인증/인가)
│   │   ├── 📁 interceptors/                    # 인터셉터
│   │   │   ├── 📄 performance.interceptor.ts   # 성능 모니터링 인터셉터
│   │   │   ├── 📄 response.interceptor.ts      # 응답 변환 인터셉터
│   │   │   └── 📄 simple-metrics.interceptor.ts # 간단한 메트릭 인터셉터
│   │   ├── 📁 middleware/                      # 미들웨어
│   │   │   └── 📄 swagger-auth.middleware.ts   # Swagger 인증 미들웨어
│   │   └── 📁 services/                        # 공통 서비스
│   │       ├── 📄 base.service.ts              # 기본 서비스
│   │       ├── 📄 logger.service.ts            # 로깅 서비스
│   │       └── 📄 metrics.service.ts           # 메트릭 수집 서비스
│   │
│   ├── 📁 core/                                # 💎 도메인 코어
│   │   ├── 📁 entities/                        # 도메인 엔티티
│   │   ├── 📁 interfaces/                      # 인터페이스 정의
│   │   │   └── 📄 repository.interface.ts      # 리포지토리 인터페이스
│   │   └── 📁 use-cases/                       # 유스케이스
│   │
│   ├── 📁 docs/                                # 📋 API 문서
│   │   └── 📄 swagger.config.ts                # Swagger 설정
│   │
│   ├── 📁 infrastructure/                      # 🏗️ 인프라 계층
│   │   ├── 📁 config/                          # 설정 관리
│   │   │   ├── 📄 config.interface.ts          # 설정 인터페이스
│   │   │   ├── 📄 config.module.ts             # 설정 모듈
│   │   │   └── 📄 env.validation.ts            # 환경변수 검증
│   │   └── 📁 database/                        # 데이터베이스
│   │       ├── 📄 database.module.ts           # 데이터베이스 모듈
│   │       ├── 📁 entities/                    # 데이터베이스 엔티티
│   │       └── 📁 repositories/                # 리포지토리 구현
│   │           ├── 📄 base.repository.ts       # 기본 리포지토리
│   │           └── 📄 user.repository.ts       # 사용자 리포지토리
│   │
│   └── 📁 presentation/                        # 🎨 프레젠테이션 계층
│       ├── 📄 presentation.module.ts           # 프레젠테이션 모듈
│       ├── 📁 controllers/                     # REST API 컨트롤러
│       │   ├── 📄 monitoring.controller.ts     # 모니터링 컨트롤러
│       │   ├── 📄 test.controller.ts           # 테스트 컨트롤러
│       │   ├── 📄 user.controller.ts           # 사용자 컨트롤러
│       │   └── 📄 user.controller.new.ts       # 사용자 컨트롤러 (신규)
│       └── 📁 filters/                         # 프레젠테이션 필터
│
├── 📁 test/                                    # 🧪 테스트
│   ├── 📄 app.e2e-spec.ts                      # E2E 테스트
│   └── 📄 jest-e2e.json                        # Jest E2E 설정
│
├── 📄 .env                                     # 🔐 환경변수
├── 📄 .eslintrc.js                             # ESLint 설정
├── 📄 .prettierrc                              # Prettier 설정
├── 📄 install-packages.md                      # 패키지 설치 가이드
├── 📄 nest-cli.json                            # NestJS CLI 설정
├── 📄 package-lock.json                        # 패키지 잠금 파일
├── 📄 package.json                             # 패키지 정의
├── 📄 README.md                                # 프로젝트 README
├── 📄 REPOSITORY_IMPLEMENTATION.md             # 리포지토리 구현 가이드
├── 📄 tsconfig.build.json                      # TypeScript 빌드 설정
├── 📄 tsconfig.json                            # TypeScript 설정
└── 📄 WEB_MONITORING_GUIDE.md                  # 웹 모니터링 가이드
```
