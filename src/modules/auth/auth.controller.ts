import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BusinessException } from 'src/common/exceptions/business.exception';
import { AuthResponse } from 'src/common/response/auth.response';
// import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SendEmailCodeDto } from './dtos/send-email-code.dto';
import { VerifyEmailCodeDto } from './dtos/verify-email-code.dto';
import { SignupDto } from './dtos/signup.dto';

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

  @Post('email/send')
  @ApiOperation({ summary: '이메일 인증 코드 전송' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '코드 전송 성공',
    schema: {
      example: { ok: true },
    },
  })
  // async를 붙일 필요가 없나?
  send(@Body() dto: SendEmailCodeDto) {
    return this.authService.sendEmailCode(dto.email);
  }

  @Post('email/verify')
  @ApiOperation({ summary: '이메일 인증 코드 검증' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        code: '123456',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '인증 성공 및 signupToken 발급',
    schema: {
      example: {
        ok: true,
        signupToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...signup-token',
      },
    },
  })
  verify(@Body() dto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(dto.email, dto.code);
  }

  @Post('signup')
  @ApiOperation({ summary: '회원가입 (인증 토큰 필요)' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'strongPassw0rd!',
        name: '홍길동',
        signupToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...signup-token',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '회원가입 처리 완료',
    schema: {
      example: { ok: true },
    },
  })
  async signup(@Body() dto: SignupDto) {
    const emailFromToken = await this.authService.assertSignupToken(
      dto.signupToken,
    );

    // 여기서 dto.email이 토큰의 email과 동일한지도 체크 권장
    if (dto.email !== emailFromToken) {
      // 토큰 탈취/혼용 방지
      throw new Error('email mismatch'); // 실제론 BadRequestException
    }

    // TODO: 유저 생성 로직
    // - email unique 체크
    // - password 해시 (argon2/bcrypt)
    // - email_verified_at = now()
    return { ok: true };
  }

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
