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
