<p align="center">
  <h1 align="center">HaruKok Backend</h1>
  <p align="center">
    하루의 할일(투두)를 관리하고 친구와 함께 일정을 공유할 수 있는 생산성 앱의 백엔드 서비스<br/>
    Backend service for a productivity app to manage daily to-dos and share schedules with friends.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-20-339933?logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS"/>
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/PostgreSQL-TypeORM-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/Redis-ioredis-DC382D?logo=redis&logoColor=white" alt="Redis"/>
    <img src="https://img.shields.io/badge/license-UNLICENSED-lightgrey" alt="License"/>
  </p>
</p>

---

## Tech Stack

| 분류       | 기술                                     |
| ---------- | ---------------------------------------- |
| 프레임워크 | NestJS 11, TypeScript 5.7                |
| ORM / DB   | TypeORM 0.3, PostgreSQL                  |
| cache      | Redis (ioredis)                          |
| 인증       | JWT (Access + Refresh), Argon2, Passport |
| 이메일     | Nodemailer (SMTP)                        |
| API 문서   | Swagger UI (`/api`)                      |
| 보안       | Helmet, sanitize-html, class-validator   |
| 테스트     | Jest 30, Supertest                       |
| 컨테이너   | Docker (멀티스테이지, node:20-alpine)    |

---

## Architecture

이 프로젝트는 **모듈러 모놀리스 + 클린 아키텍처(Ports & Adapters)** 패턴을 따릅니다.

This project follows **Modular Monolith + Clean Architecture (Ports & Adapters)** pattern.

### 계층 구조 / Layer Structure

```
presentation   — Controller, DTO, Guard, Swagger, 응답 변환
     ↓
application    — UseCase, Port(interface), Application Service
     ↓
domain         — Domain Rule, Policy, Domain Error (프레임워크 의존 금지)
     ↑
infrastructure — TypeORM Repository, Redis Adapter, Mail/JWT Adapter
```

**의존성 방향 / Dependency Rules**

- `presentation` → `application` 만 참조
- `application` → `domain` 만 참조
- `infrastructure` → `application` / `domain` 참조
- `domain` 은 NestJS, TypeORM import 금지

### 모듈 목록 / Modules

| 모듈   | 역할                                                      |
| ------ | --------------------------------------------------------- |
| `auth` | 회원가입, 로그인, 이메일 인증, 비밀번호 재설정, 토큰 갱신 |
| `usr`  | 사용자 프로필 조회·수정, 마이페이지 대시보드              |
| `todo` | 할 일(투두) CRUD, 검색                                    |
| `rtn`  | 루틴 관리                                                 |
| `ctg`  | 카테고리 관리                                             |
| `mail` | 이메일 발송 인프라 어댑터                                 |

### 폴더 구조 예시 / Folder Structure Example

```
src/modules/{module}/
  presentation/
    {module}.controller.ts
    dtos/
  application/
    use-cases/
      create-{entity}.use-case.ts
      create-{entity}.use-case.spec.ts
    ports/
      {entity}-repository.port.ts
  domain/
    policies/
    errors/
  infrastructure/
    repositories/
      typeorm-{entity}.repository.adapter.ts
```

---

## 로컬 실행 / Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis 7+

### 실행 순서 / Getting Started

```bash
# 1. 의존성 설치 / Install dependencies
npm install

# 2. 개발 서버 실행 (watch mode) / Start dev server
npm run start:dev

# 3. 프로덕션 빌드 및 실행 / Build and run for production
npm run build
npm run start:prod
```

**Docker로 실행 / Run with Docker**

```bash
docker build -t harukok-backend .
docker run -p 3000:3000 --env-file .env harukok-backend
```

---

## 테스트 / Testing

### 유닛 테스트 / Unit Tests

```bash
# 전체 실행
npm run test

# Watch 모드
npm run test:watch

# 커버리지 리포트
npm run test:cov
```

UseCase마다 동일 디렉터리에 `.spec.ts`를 작성합니다. 필수 케이스: 성공 / NOT_FOUND / 권한 오류 / 저장 실패.

Each UseCase has a colocated `.spec.ts`. Required cases: success / NOT_FOUND / permission error / save failure.

### 아키텍처 검사 / Architecture Check

```bash
# 계층 위반 + 순환 의존 검사
npm run arch:check

# 순환 의존만 확인
npm run arch:circular
```

---

## API 문서 / API Docs

서버 실행 후 브라우저에서 접근합니다 / Open in browser after starting the server:

```
http://localhost:3000/api
```

인증 순서 / Auth flow:

1. `POST /auth/login` 호출
2. 응답의 `accessToken`으로 상단 **Authorize (Bearer)** 설정
3. 만료 시 `POST /auth/refresh` 호출 (HttpOnly 쿠키 기반)
