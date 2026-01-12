import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { AuthResponse } from 'src/common/response/auth.response';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

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

  @Get('me')
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiOperation({ summary: '현재 사용자 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '사용자 정보 조회 성공',
        success: true,
        data: {
          id: 1,
          email: 'test@gmail.com',
          name: '최정빈',
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
        message: '인증에 실패했습니다.',
        success: false,
        errorCode: 'UNAUTHORIZED',
      },
    },
  })
  getMe() {
    const user = this.authService.getUserById(1);

    if (!user) {
      throw new BusinessException(AuthResponse.USER_NOT_FOUND);
    }

    return ApiResponseDto.success(user, '사용자 정보 조회 성공');
  }
}
