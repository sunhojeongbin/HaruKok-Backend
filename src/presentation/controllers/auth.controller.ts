import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService, LoginDto, AuthResponse } from '../../application/services/auth.service';
import { SuccessResponseDto } from '../../common/dto/api-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @Public() // 로그인은 인증 없이 접근 가능
    @ApiOperation({ summary: '로그인' })
    @ApiResponse({
        status: 200,
        description: '로그인 성공',
        type: SuccessResponseDto<AuthResponse>,
    })
    @ApiResponse({ status: 401, description: '인증 실패' })
    async login(
        @Body(ValidationPipe) loginDto: LoginDto,
    ): Promise<SuccessResponseDto<AuthResponse>> {
        return await this.authService.login(loginDto);
    }
}
