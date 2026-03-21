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

/**
 * @description 로그인 응답 데이터 구조
 * @property email 사용자 이메일
 * @property name 사용자 이름
 * @property accessToken JWT 액세스 토큰
 */
export class LoginResponseDto {
  email: string;
  name: string;
  accessToken: string;
}

/**
 * @description 토큰 재발급 응답 데이터 구조
 * @property accessToken 새로 발급된 JWT 액세스 토큰
 * @remarks 리프레시 토큰은 HttpOnly 쿠키로 발급되므로 응답 바디에는 포함되지 않습니다.
 */
export class RefreshResponseDto {
  accessToken: string;
}

/** @description 로그아웃 응답 데이터 구조 */
export class LogoutResponseDto {
  ok: boolean;
}

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
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipFromHeader =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : null;

    return {
      deviceName:
        userAgent.length > 0
          ? userAgent.substring(0, Math.min(userAgent.length, 100))
          : null,
      deviceType: DeviceType.WEB,
      ipAddress: ipFromHeader || req.ip || null,
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

  /**
   * @description 요청에서 리프레시 토큰을 조회한다.
   * 'cookie-parser'가 있으면 'req.cookies'를, 없으면 'cookie' 헤더를 파싱한다.
   * @param req HTTP 요청 객체
   * @return 리프레시 토큰 문자열 또는 null
   */
  private getRefreshTokenFromRequest(req: Request): string | null {
    const cookies = (req as unknown as { cookies?: unknown }).cookies;
    if (cookies && typeof cookies === 'object' && !Array.isArray(cookies)) {
      const cookieFromParser = (cookies as Record<string, unknown>)
        .refreshToken;
      if (typeof cookieFromParser === 'string' && cookieFromParser.length > 0) {
        return cookieFromParser;
      }
    }

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return null;
    }

    // 'cookie' 헤더에서 'refreshToken' 쿠키를 찾아 반환
    const refreshCookie = cookieHeader
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith('refreshToken='));

    if (!refreshCookie) {
      return null;
    }

    try {
      return decodeURIComponent(
        refreshCookie.substring('refreshToken='.length),
      );
    } catch {
      return null;
    }
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
        message: '이메일 인증 번호가 발송되었습니다.',
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
        message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
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
        message: '이미 가입된 이메일입니다.',
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
        message: '이메일 인증이 완료되었습니다.',
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
        message: '인증 코드가 없거나 만료되었습니다.',
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
        message: '인증 코드 검증 시도 횟수를 초과했습니다.',
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
  @ApiResponse({
    status: 403,
    description: '회원가입 토큰 유효성 오류',
    schema: {
      example: {
        httpCode: 403,
        message: '회원가입 토큰이 유효하지 않습니다.',
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
        message: '이미 가입된 이메일입니다.',
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

    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.buildRefreshTokenCookieOptions(result.refreshTokenMaxAgeMs),
    );

    return ApiResponseDto.success<LoginResponseDto>(
      {
        email: result.email,
        name: result.name,
        accessToken: result.accessToken,
      },
      '로그인 성공',
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
        message: '액세스 토큰 재발급에 성공했습니다.',
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
        message: '리프레시 토큰이 유효하지 않습니다.',
        success: false,
        errorCode: 'REFRESH_TOKEN_INVALID',
      },
    },
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromRequest(req);
    if (!refreshToken) {
      throw new BusinessException({
        httpCode: AuthResponse.REFRESH_TOKEN_REQUIRED.httpCode,
        message: AuthResponse.REFRESH_TOKEN_REQUIRED.message,
        errorCode: AuthResponse.REFRESH_TOKEN_REQUIRED.errorCode,
      });
    }

    const result = await this.authService.refresh(refreshToken);
    if (!result) {
      res.clearCookie('refreshToken', this.buildRefreshTokenCookieOptions());
      throw new BusinessException({
        httpCode: AuthResponse.REFRESH_TOKEN_INVALID.httpCode,
        message: AuthResponse.REFRESH_TOKEN_INVALID.message,
        errorCode: AuthResponse.REFRESH_TOKEN_INVALID.errorCode,
      });
    }

    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.buildRefreshTokenCookieOptions(result.refreshTokenMaxAgeMs),
    );

    return ApiResponseDto.success<RefreshResponseDto>(
      {
        accessToken: result.accessToken,
      },
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
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = this.getRefreshTokenFromRequest(req);
    await this.authService.logout(refreshToken);
    res.clearCookie('refreshToken', this.buildRefreshTokenCookieOptions());

    return ApiResponseDto.success<LogoutResponseDto>(
      { ok: true },
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
        message: '사용자 정보 조회 성공',
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
