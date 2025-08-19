# API 응답 설계 가이드

## 개요

이 문서는 NestJS 기반 API의 일관된 응답 형태를 위한 설계 가이드입니다.

## 응답 구조

### 기본 응답 형태

```json
{
  "statusCode": 200,
  "success": true,
  "code": "USER_FIND_ALL_SUCCESS",
  "message": "사용자 목록 조회 성공",
  "data": [...],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### 에러 응답 형태

```json
{
    "statusCode": 404,
    "success": false,
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다.",
    "errorCode": "USER_NOT_FOUND",
    "data": null,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/users/999"
}
```

## 서비스 레이어에서 응답 생성

### 1. BaseService 상속

```typescript
@Injectable()
export class MyService extends BaseService {
    // ...
}
```

### 2. 성공 응답 생성 방법

#### 데이터 없는 성공 응답

```typescript
return this.success(ResponseMessage.SUCCESS.USER_DELETE);
```

#### 데이터 포함 성공 응답

```typescript
return this.successWithData(ResponseMessage.SUCCESS.USER_FIND_ALL, users);
```

#### 생성 성공 응답 (201)

```typescript
return this.created(ResponseMessage.SUCCESS.USER_CREATE, newUser);
```

#### 단순 성공 응답

```typescript
return this.ok(); // 기본 메시지 사용
return this.ok('CUSTOM_CODE', '커스텀 메시지'); // 커스텀 메시지
```

### 3. 에러 처리 방법

#### HTTP Exception 사용 (권장)

```typescript
// 404 에러
throw new NotFoundException(ResponseMessage.ERROR.USER_NOT_FOUND);

// 409 충돌 에러
throw new ConflictException(ResponseMessage.ERROR.USER_ALREADY_EXISTS);

// 500 서버 에러
throw new InternalServerErrorException(ResponseMessage.ERROR.INTERNAL_SERVER_ERROR);
```

#### 에러 응답 반환 (throw 하지 않는 경우)

```typescript
return this.errorResponse(ResponseMessage.ERROR.USER_NOT_FOUND);
```

## 컨트롤러에서의 사용

### 1. 서비스 결과 직접 반환

```typescript
@Get()
async findAll(): Promise<SuccessResponseDto<User[]>> {
    return await this.userService.findAll();
}
```

### 2. Swagger 문서화

```typescript
@ApiResponse({
    status: 200,
    description: '사용자 목록 조회 성공',
    type: SuccessResponseDto<User[]>
})
@ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없습니다.'
})
```

## ResponseMessage 확장

새로운 도메인 추가 시:

```typescript
export const ResponseMessage = {
    SUCCESS: {
        // 기존 메시지들...
        PRODUCT_CREATE: { code: 'PRODUCT_CREATE_SUCCESS', message: '상품 생성 성공', status: 201 },
        PRODUCT_FIND_ALL: {
            code: 'PRODUCT_FIND_ALL_SUCCESS',
            message: '상품 목록 조회 성공',
            status: 200,
        },
    },
    ERROR: {
        // 기존 메시지들...
        PRODUCT_NOT_FOUND: {
            code: 'PRODUCT_NOT_FOUND',
            message: '상품을 찾을 수 없습니다.',
            status: 404,
        },
        PRODUCT_OUT_OF_STOCK: {
            code: 'PRODUCT_OUT_OF_STOCK',
            message: '상품이 품절되었습니다.',
            status: 409,
        },
    },
} as const;
```

## 베스트 프랙티스

### 1. 서비스에서 예외 던지기

- 비즈니스 로직 오류는 적절한 HTTP Exception으로 던지기
- Exception Filter가 자동으로 일관된 응답 형태로 변환

### 2. 로깅 활용

```typescript
try {
    // 비즈니스 로직
} catch (error) {
    console.error('사용자 조회 실패:', error);
    throw error; // Exception Filter가 처리
}
```

### 3. 타입 안전성

- `SuccessResponseDto<T>`를 사용하여 데이터 타입 명시
- ResponseItem 타입 활용

### 4. 일관된 응답 코드 사용

- ResponseMessage 상수 사용
- 도메인별로 체계적으로 관리

## 자동화된 처리

1. **ResponseInterceptor**: 모든 성공 응답을 일관된 형태로 변환
2. **HttpExceptionFilter**: 모든 예외를 일관된 에러 응답으로 변환
3. **BaseService**: 공통 응답 생성 메서드 제공
4. **ResponseBuilder**: 복잡한 응답 생성 로직 캡슐화

이 설계를 통해 개발자는 비즈니스 로직에 집중하면서도 일관된 API 응답을 보장할 수 있습니다.
