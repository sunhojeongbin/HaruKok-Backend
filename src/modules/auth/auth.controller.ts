import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuthResponse } from '../../common/response/auth.response';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SendEmailCodeDto } from './dtos/send-email-code.dto';
import { VerifyEmailCodeDto } from './dtos/verify-email-code.dto';
import { SignupDto } from './dtos/signup.dto';

export class LoginResponseDto {
  email: string;
  name: string;
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
      example: {
        httpCode: 200,
        message: '이메일 인증 코드가 발송되었습니다.',
        success: true,
        data: { ok: true },
      },
    },
  })
  // async를 붙일 필요가 없나?
  async send(@Body() dto: SendEmailCodeDto) {
    const result = await this.authService.sendEmailCode(dto.email);
    return ApiResponseDto.success(
      result,
      AuthResponse.EMAIL_CODE_SENT.message,
      AuthResponse.EMAIL_CODE_SENT.httpCode,
    );
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
        httpCode: 200,
        message: '이메일 인증이 완료되었습니다.',
        success: true,
        data: {
          ok: true,
          signupToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...signup-token',
        },
      },
    },
  })
  verify(@Body() dto: VerifyEmailCodeDto) {
    const result = this.authService.verifyEmailCode(dto.email, dto.code);
    return ApiResponseDto.success(
      result,
      AuthResponse.EMAIL_CODE_VERIFIED.message,
      AuthResponse.EMAIL_CODE_VERIFIED.httpCode,
    );
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
    status: 201,
    description: '회원가입 처리 완료',
    schema: {
      example: {
        httpCode: 201,
        message: '회원가입이 완료되었습니다.',
        success: true,
        data: {
          id: '8128ec5d-ed76-4510-89f3-d362ce6f572c',
          email: 'user@example.com',
          name: '홍길동',
        },
      },
    },
  })
  async signup(@Body() dto: SignupDto) {
    const user = await this.authService.signup(
      dto.email,
      dto.password,
      dto.name,
      dto.signupToken,
    );
    return ApiResponseDto.success(
      user,
      AuthResponse.SIGNUP_SUCCESS.message,
      AuthResponse.SIGNUP_SUCCESS.httpCode,
    );
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
          email: 'user@example.com',
          name: '홍길동',
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
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.email, dto.password);

    if (!result) {
      throw new BusinessException(AuthResponse.LOGIN_FAIL);
    }

    return ApiResponseDto.success<LoginResponseDto>(
      {
        email: result.email,
        name: result.name,
        accessToken: result.accessToken,
      },
      '로그인 성공',
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
          id: '8128ec5d-ed76-4510-89f3-d362ce6f572c',
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
  async getMe(@Request() req: { user?: { userId?: string } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }

    const user = await this.authService.getUserById(userId);

    if (!user) {
      throw new BusinessException(AuthResponse.USER_NOT_FOUND);
    }

    return ApiResponseDto.success(user, '사용자 정보 조회 성공');
  }
}
