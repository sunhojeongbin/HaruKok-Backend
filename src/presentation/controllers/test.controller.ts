// src/presentation/controllers/test.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Test') // Swagger 카테고리
@Controller('test')
export class TestController {
    @Get()
    getTest(): string {
        return '안녕하세요! 테스트 컨트롤러 응답 결과입니다.';
    }
}
