import {
  Body,
  Controller,
  Post,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Request as NestRequest,
  Res,
  Req,
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
import { DeviceType } from './enums/refresh-token.enum';
import { Request, Response } from 'express';
import {
  LoginResponseDto,
  LogoutResponseDto,
  RefreshResponseDto,
} from './dtos/auth-response.dto';

type RequestWithRefreshToken = Request & {
  refreshToken?: string | null;
};

/** @description 인증 관련 엔드포인트를 제공하는 컨트롤러 */
@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** @description 요청 기반 클라이언트 접속 정보를 추출한다. */
  private getClientContext(req: Request): {
    deviceName: string | null;
    deviceType: DeviceType;
    ipAddress: string | null;
  } {
    const rawUserAgent = req.headers['user-agent'];
    const userAgent =
      typeof rawUserAgent === 'string' ? rawUserAgent.trim() : '';

    return {
      deviceName:
        userAgent.length > 0
          ? userAgent.substring(0, Math.min(userAgent.length, 100))
          : null,
      deviceType: DeviceType.WEB,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    };
  }

  /**
   * @description 리프레시 토큰 쿠키 옵션을 생성한다.
   * @param maxAge 쿠키 만료 시간(ms)
   * @return HttpOnly, Secure, SameSite 옵션이 적용된 쿠키 설정 객체
   */
  private buildRefreshTokenCookieOptions(maxAge?: number) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      ...(maxAge ? { maxAge } : {}),
    };
  }

  /** @description 이메일 인증 번호를 메일로 전송하는 API */
  @Post('email/send')
  @ApiOperation({
    summary: '이메일 인증 번호 전송',
    description: '입력한 이메일로 6자리 인증 번호를 전송합니다.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '인증 번호 전송 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.EMAIL_CODE_SENT.message,
        success: true,
        data: { ok: true },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '메일 발송 실패',
    schema: {
      example: {
        httpCode: 500,
        message: AuthResponse.EMAIL_SEND_FAILED.message,
        success: false,
        errorCode: 'EMAIL_SEND_FAILED',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '이미 가입된 이메일',
    schema: {
      example: {
        httpCode: 409,
        message: AuthResponse.SIGNUP_ALREADY_EXISTS.message,
        success: false,
        errorCode: 'SIGNUP_ALREADY_EXISTS',
      },
    },
  })
  async send(@Body() dto: SendEmailCodeDto) {
    const result = await this.authService.sendEmailCode(dto.email);
    return ApiResponseDto.success(
      result,
      AuthResponse.EMAIL_CODE_SENT.message,
      AuthResponse.EMAIL_CODE_SENT.httpCode,
    );
  }

  /** @description 이메일 인증 번호를 검증하고 회원가입 토큰 발급 API */
  @Post('email/verify')
  @ApiOperation({
    summary: '이메일 인증 번호 검증',
    description:
      '인증 번호 검증 성공 시 회원가입 요청에 사용할 signupToken을 반환합니다.',
  })
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
        message: AuthResponse.EMAIL_CODE_VERIFIED.message,
        success: true,
        data: {
          ok: true,
          signupToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...signup-token',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '코드 형식/만료/불일치 오류',
    schema: {
      example: {
        httpCode: 400,
        message: AuthResponse.EMAIL_CODE_EXPIRED_OR_NOT_FOUND.message,
        success: false,
        errorCode: 'EMAIL_CODE_EXPIRED_OR_NOT_FOUND',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: '인증 코드 검증 시도 횟수 초과',
    schema: {
      example: {
        httpCode: 429,
        message: AuthResponse.EMAIL_CODE_ATTEMPTS_EXCEEDED.message,
        success: false,
        errorCode: 'EMAIL_CODE_ATTEMPTS_EXCEEDED',
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

  /** @description 이메일 인증이 완료된 사용자를 회원가입 처리 API */
  @Post('signup')
  @ApiOperation({
    summary: '회원가입 (이메일 인증 토큰 필요)',
    description:
      '`email/verify`에서 받은 `signupToken`으로 이메일 인증을 증명한 뒤 가입을 완료합니다.',
  })
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
        message: AuthResponse.SIGNUP_SUCCESS.message,
        success: true,
        data: {
          id: '8128ec5d-ed76-4510-89f3-d362ce6f572c',
          email: 'user@example.com',
          name: '홍길동',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '회원가입 토큰 유효성 오류',
    schema: {
      example: {
        httpCode: 403,
        message: AuthResponse.SIGNUP_TOKEN_INVALID.message,
        success: false,
        errorCode: 'SIGNUP_TOKEN_INVALID',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: '이미 가입된 이메일',
    schema: {
      example: {
        httpCode: 409,
        message: AuthResponse.SIGNUP_ALREADY_EXISTS.message,
        success: false,
        errorCode: 'SIGNUP_ALREADY_EXISTS',
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

  /** @description 이메일 로그인 API */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description:
      '로그인 성공 시 `accessToken`은 응답 바디로, `refreshToken`은 HttpOnly 쿠키로 발급됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.LOGIN_SUCCESS.message,
        success: true,
        data: {
          id: '8128ec5d-ed76-4510-89f3-d362ce6f572c',
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
        message: AuthResponse.LOGIN_FAIL.message,
        success: false,
        errorCode: 'UNAUTHORIZED',
      },
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto.email,
      dto.password,
      this.getClientContext(req),
    );

    if (!result) {
      throw new BusinessException(AuthResponse.LOGIN_FAIL);
    }

    const { refreshToken, refreshTokenMaxAgeMs, ...loginData } = result;

    res.cookie(
      'refreshToken',
      refreshToken,
      this.buildRefreshTokenCookieOptions(refreshTokenMaxAgeMs),
    );

    return ApiResponseDto.success<LoginResponseDto>(
      loginData,
      AuthResponse.LOGIN_SUCCESS.message,
      AuthResponse.LOGIN_SUCCESS.httpCode,
    );
  }

  /** @description 리프레시 토큰을 검증하여 액세스 토큰을 재발급하는 API */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '액세스 토큰 재발급',
    description:
      '요청 쿠키의 `refreshToken`을 사용해 액세스 토큰을 재발급합니다. 성공 시 리프레시 토큰도 재발급 됩니다.',
  })
  @ApiResponse({
    status: 200,
    description: '액세스 토큰 재발급 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.TOKEN_REFRESH_SUCCESS.message,
        success: true,
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '리프레시 토큰 인증 실패',
    schema: {
      example: {
        httpCode: 401,
        message: AuthResponse.REFRESH_TOKEN_INVALID.message,
        success: false,
        errorCode: 'REFRESH_TOKEN_INVALID',
      },
    },
  })
  async refresh(
    @Req() req: RequestWithRefreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.refreshToken ?? null;
    if (!refreshToken) {
      throw new BusinessException(AuthResponse.REFRESH_TOKEN_REQUIRED);
    }

    const result = await this.authService.refresh(refreshToken);
    if (!result) {
      res.clearCookie('refreshToken', this.buildRefreshTokenCookieOptions());
      throw new BusinessException(AuthResponse.REFRESH_TOKEN_INVALID);
    }

    const {
      refreshToken: nextRefreshToken,
      refreshTokenMaxAgeMs,
      ...data
    } = result;

    res.cookie(
      'refreshToken',
      nextRefreshToken,
      this.buildRefreshTokenCookieOptions(refreshTokenMaxAgeMs),
    );

    return ApiResponseDto.success<RefreshResponseDto>(
      data,
      AuthResponse.TOKEN_REFRESH_SUCCESS.message,
      AuthResponse.TOKEN_REFRESH_SUCCESS.httpCode,
    );
  }

  /** @description 리프레시 토큰을 무효화하고 로그아웃 처리하는 API*/
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그아웃',
    description:
      '리프레시 토큰 쿠키를 삭제하고 서버 측 토큰 상태를 무효화하여 로그아웃 처리합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    schema: {
      example: {
        httpCode: AuthResponse.LOGOUT_SUCCESS.httpCode,
        message: AuthResponse.LOGOUT_SUCCESS.message,
        success: true,
        data: {
          ok: true,
        },
      },
    },
  })
  async logout(
    @Req() req: RequestWithRefreshToken,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.refreshToken ?? null;
    const result = await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken', this.buildRefreshTokenCookieOptions());

    return ApiResponseDto.success<LogoutResponseDto>(
      result,
      AuthResponse.LOGOUT_SUCCESS.message,
      AuthResponse.LOGOUT_SUCCESS.httpCode,
    );
  }

  /** @description 현재 로그인된 사용자 정보를 조회하는 API */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '현재 사용자 정보 조회',
    description:
      'Authorization 헤더의 Bearer AccessToken으로 현재 사용자 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.USER_FOUND.message,
        success: true,
        data: {
          id: '8128ec5d-ed76-4510-89f3-d362ce6f572c',
          email: 'test@gmail.com',
          name: '홍길동',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
    schema: {
      example: {
        httpCode: AuthResponse.LOGIN_FAIL.httpCode,
        message: AuthResponse.LOGIN_FAIL.message,
        success: false,
        errorCode: AuthResponse.LOGIN_FAIL.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    schema: {
      example: {
        httpCode: AuthResponse.USER_NOT_FOUND.httpCode,
        message: AuthResponse.USER_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.USER_NOT_FOUND.errorCode,
      },
    },
  })
  async getMe(@NestRequest() req: { user?: { userId?: string } }) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }

    const user = await this.authService.getUserById(userId);

    if (!user) {
      throw new BusinessException(AuthResponse.USER_NOT_FOUND);
    }

    return ApiResponseDto.success(
      user,
      AuthResponse.USER_FOUND.message,
      AuthResponse.USER_FOUND.httpCode,
    );
  }
}
