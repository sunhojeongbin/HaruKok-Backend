import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { AuthResponse } from 'src/common/response/auth.response';

export class LoginResponseDto {
  user: {
    id: number;
    email: string;
    name: string;
  };
  accessToken: string;
}

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인' })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '로그인 성공',
        success: true,
        data: {
          user: {
            id: 1,
            email: 'user@example.com',
            name: '홍길동',
          },
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      example: {
        httpCode: 401,
        message: '아이디 또는 비밀번호가 올바르지 않습니다.',
        success: false,
        errorCode: 'UNAUTHORIZED',
      },
    },
  })
  login(@Body() dto: LoginDto) {
    const result = this.authService.login(dto.email, dto.password);

    if (!result) {
      throw new BusinessException(AuthResponse.LOGIN_FAIL);
    }

    return ApiResponseDto.success<LoginResponseDto>(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      '로그인 성공',
    );
  }
}
