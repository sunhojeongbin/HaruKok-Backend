// src/presentation/controllers/test.controller.ts
import {
    Controller,
    Get,
    NotFoundException,
    InternalServerErrorException,
    Res,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ResponseItem, ResponseMessage } from 'src/common/constants/response-message';

@ApiTags('Test') // Swagger 카테고리
@Controller('test')
export class TestController {
    @Get()
    getTest(): string {
        return '안녕하세요! 테스트 컨트롤러 응답 결과입니다.';
    }

    @Get('simple-html')
    getSimpleHtml(@Res() res: Response) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>테스트 페이지</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .link-card { 
            display: block; 
            padding: 15px; 
            margin: 10px 0; 
            text-decoration: none; 
            color: #333; 
            background: #f8f9fa; 
            border-radius: 8px; 
            border: 1px solid #dee2e6;
            transition: all 0.3s;
        }
        .link-card:hover { 
            background: #e9ecef; 
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 HaruKok-BE 서버 테스트</h1>
        <p>현재 시간: ${new Date().toLocaleString()}</p>
        <p>서버가 정상적으로 작동중입니다!</p>
        
        <hr>
        
        <h2>📊 모니터링 링크</h2>
        <a href="/monitoring/dashboard" class="link-card">
            <strong>📊 실시간 모니터링 대시보드</strong><br>
            <small>웹브라우저에서 서버 성능을 실시간으로 모니터링</small>
        </a>
        
        <a href="/monitoring/stats" class="link-card">
            <strong>📈 성능 통계 (JSON)</strong><br>
            <small>API 응답시간, 요청 수, 에러율 등의 통계 데이터</small>
        </a>
        
        <a href="/monitoring/health" class="link-card">
            <strong>🏥 헬스체크 (JSON)</strong><br>
            <small>서버 상태 및 시스템 정보</small>
        </a>
        
        <hr>
        
        <h2>🧪 API 테스트</h2>
        <a href="/users" class="link-card">
            <strong>👥 사용자 목록</strong><br>
            <small>모든 사용자 조회 API</small>
        </a>
        
        <a href="/test/json" class="link-card">
            <strong>🔧 JSON 응답 테스트</strong><br>
            <small>간단한 JSON 응답 테스트</small>
        </a>
        
        <hr>
        
        <h2>📚 API 문서</h2>
        <a href="/api" class="link-card">
            <strong>📖 Swagger API 문서</strong><br>
            <small>모든 API 엔드포인트 문서 및 테스트</small>
        </a>
    </div>
</body>
</html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    }

    @Get('json')
    getJsonTest() {
        return {
            success: true,
            message: '서버가 정상적으로 작동중입니다',
            timestamp: new Date(),
            server: 'HaruKok-BE',
            version: '1.0.0',
        };
    }

    @Get('/users')
    getUsers(): ResponseItem {
        return ResponseMessage.SUCCESS.USER_FIND_ALL;
    }

    @Get('error')
    @ApiResponse({
        status: ResponseMessage.ERROR.USER_NOT_FOUND.status,
        description: ResponseMessage.ERROR.USER_NOT_FOUND.message,
    })
    throwError() {
        throw new NotFoundException(ResponseMessage.ERROR.USER_NOT_FOUND);
    }

    @Get('not-found')
    @ApiResponse({
        status: ResponseMessage.ERROR.USER_NOT_FOUND.status,
        description: ResponseMessage.ERROR.USER_NOT_FOUND.message,
    })
    throwNotFound() {
        // 실제로 404 에러 발생
        throw new NotFoundException(ResponseMessage.ERROR.USER_NOT_FOUND);
    }

    @Get('server-error')
    @ApiResponse({
        status: 500,
        description: '내부 서버 오류',
    })
    throwServerError() {
        // 실제로 500 에러 발생 (일반 Error 던지기)
        throw new Error('데이터베이스 연결 실패');
    }

    @Get('null-pointer')
    @ApiResponse({
        status: 500,
        description: '널 포인터 예외',
    })
    throwNullPointer() {
        // null 객체에 접근하여 500 에러 발생
        const obj: any = null;
        return obj.someProperty; // TypeError 발생
    }

    @Get('internal-error')
    @ApiResponse({
        status: ResponseMessage.ERROR.INTERNAL_SERVER_ERROR.status,
        description: ResponseMessage.ERROR.INTERNAL_SERVER_ERROR.message,
    })
    throwInternalError() {
        // NestJS InternalServerErrorException 사용
        throw new InternalServerErrorException(ResponseMessage.ERROR.INTERNAL_SERVER_ERROR);
    }

    @Get('database-error')
    @ApiResponse({
        status: ResponseMessage.ERROR.DATABASE_ERROR.status,
        description: ResponseMessage.ERROR.DATABASE_ERROR.message,
    })
    throwDatabaseError() {
        // 데이터베이스 연결 오류 시뮬레이션
        throw new InternalServerErrorException(ResponseMessage.ERROR.DATABASE_ERROR);
    }
}
