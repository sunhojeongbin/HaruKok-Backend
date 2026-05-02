import {
  Body,
  Controller,
  Delete,
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
import { GetUserByIdUseCase } from '../application/use-cases/get-user-by-id.use-case';
import { UpdatePasswordUseCase } from '../application/use-cases/update-password.use-case';
import { VerifyPasswordUseCase } from '../application/use-cases/verify-password.use-case';
import { WithdrawUseCase } from '../application/use-cases/withdraw.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { ResendEmailCodeUseCase } from '../application/use-cases/resend-email-code.use-case';
import { RefreshUseCase } from '../application/use-cases/refresh.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { SendEmailCodeUseCase } from '../application/use-cases/send-email-code.use-case';
import { SendTemporaryPasswordUseCase } from '../application/use-cases/send-temporary-password.use-case';
import { SignupUseCase } from '../application/use-cases/signup.use-case';
import { VerifyEmailCodeUseCase } from '../application/use-cases/verify-email-code.use-case';
import { LoginDto } from './dtos/login.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthResponse } from '../../../common/response/auth.response';
import { SendEmailCodeDto } from './dtos/send-email-code.dto';
import { VerifyEmailCodeDto } from './dtos/verify-email-code.dto';
import { SignupDto } from './dtos/signup.dto';
import { SendTemporaryPasswordDto } from './dtos/send-temporary-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { VerifyPasswordDto } from './dtos/verify-password.dto';
import { DeviceType } from '../enums/refresh-token.enum';
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
  constructor(
    private readonly sendEmailCodeUseCase: SendEmailCodeUseCase,
    private readonly resendEmailCodeUseCase: ResendEmailCodeUseCase,
    private readonly verifyEmailCodeUseCase: VerifyEmailCodeUseCase,
    private readonly sendTemporaryPasswordUseCase: SendTemporaryPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly signupUseCase: SignupUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
    private readonly verifyPasswordUseCase: VerifyPasswordUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
  ) {}

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
    status: 429,
    description: '인증 번호 재요청 제한',
    schema: {
      example: {
        httpCode: 429,
        message: '43초 후에 다시 시도해 주세요.',
        success: false,
        errorCode: AuthResponse.EMAIL_CODE_RESEND_TOO_SOON.errorCode,
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
    const result = await this.sendEmailCodeUseCase.execute(dto.email);
    return ApiResponseDto.success(
      result,
      AuthResponse.EMAIL_CODE_SENT.message,
      AuthResponse.EMAIL_CODE_SENT.httpCode,
    );
  }

  /** @description 이메일 인증 번호를 재전송하는 API */
  @HttpCode(HttpStatus.OK)
  @Post('email/resend')
  @ApiOperation({
    summary: '이메일 인증 번호 재전송',
    description:
      '인증 번호를 다시 전송합니다. 재전송은 3회까지는 즉시 가능하고, 4회째부터는 1분 대기 제한이 적용됩니다.',
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
    description: '인증 번호 재전송 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.EMAIL_CODE_RESENT.message,
        success: true,
        data: { ok: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '재전송 가능한 인증 번호가 없음(만료/미요청)',
    schema: {
      example: {
        httpCode: 400,
        message: AuthResponse.EMAIL_CODE_EXPIRED_OR_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.EMAIL_CODE_EXPIRED_OR_NOT_FOUND.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: '재전송 제한 초과',
    schema: {
      example: {
        httpCode: 429,
        message: '37초 후에 다시 시도해 주세요.',
        success: false,
        errorCode: AuthResponse.EMAIL_CODE_RESEND_TOO_SOON.errorCode,
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
        errorCode: AuthResponse.SIGNUP_ALREADY_EXISTS.errorCode,
      },
    },
  })
  async resend(@Body() dto: SendEmailCodeDto) {
    const result = await this.resendEmailCodeUseCase.execute(dto.email);
    return ApiResponseDto.success(
      result,
      AuthResponse.EMAIL_CODE_RESENT.message,
      AuthResponse.EMAIL_CODE_RESENT.httpCode,
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
    description: '인증 코드 검증 시도 횟수 초과(3회, 1분 잠금)',
    schema: {
      example: {
        httpCode: 429,
        message: '58초 후에 다시 시도해 주세요.',
        success: false,
        errorCode: 'EMAIL_CODE_ATTEMPTS_EXCEEDED',
      },
    },
  })
  async verify(@Body() dto: VerifyEmailCodeDto) {
    const result = await this.verifyEmailCodeUseCase.execute(
      dto.email,
      dto.code,
    );
    return ApiResponseDto.success(
      result,
      AuthResponse.EMAIL_CODE_VERIFIED.message,
      AuthResponse.EMAIL_CODE_VERIFIED.httpCode,
    );
  }

  /** @description 비밀번호 재설정용 임시 비밀번호를 메일로 전송하는 API */
  @Post('password/temp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 재설정 임시 비밀번호 전송',
    description:
      '입력한 이메일의 계정을 확인한 뒤 비밀번호 재설정에 사용할 임시 비밀번호를 전송합니다.',
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
    description: '임시 비밀번호 전송 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.PASSWORD_RESET_TEMP_SENT.message,
        success: true,
        data: {
          ok: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '비밀번호 재설정 불가 계정',
    schema: {
      example: {
        httpCode: 400,
        message: AuthResponse.PASSWORD_RESET_NOT_AVAILABLE.message,
        success: false,
        errorCode: AuthResponse.PASSWORD_RESET_NOT_AVAILABLE.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    schema: {
      example: {
        httpCode: 404,
        message: AuthResponse.PASSWORD_RESET_USER_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.PASSWORD_RESET_USER_NOT_FOUND.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '임시 비밀번호 전송 실패',
    schema: {
      example: {
        httpCode: 500,
        message: AuthResponse.PASSWORD_RESET_TEMP_SEND_FAILED.message,
        success: false,
        errorCode: AuthResponse.PASSWORD_RESET_TEMP_SEND_FAILED.errorCode,
      },
    },
  })
  async sendTemporaryPassword(@Body() dto: SendTemporaryPasswordDto) {
    const result = await this.sendTemporaryPasswordUseCase.execute(dto.email);
    return ApiResponseDto.success(
      result,
      AuthResponse.PASSWORD_RESET_TEMP_SENT.message,
      AuthResponse.PASSWORD_RESET_TEMP_SENT.httpCode,
    );
  }

  /** @description 임시 비밀번호를 검증하고 새 비밀번호로 변경하는 API */
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 재설정',
    description: '이메일과 임시 비밀번호를 검증한 뒤 새 비밀번호로 변경합니다.',
  })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        temporaryPassword: 'aB3dEf7GhK',
        newPassword: 'newStrongPassw0rd!',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 재설정 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.PASSWORD_RESET_SUCCESS.message,
        success: true,
        data: {
          ok: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '임시 비밀번호 검증 실패 또는 재설정 불가 계정',
    schema: {
      example: {
        httpCode: 400,
        message: AuthResponse.TEMP_PASSWORD_INVALID.message,
        success: false,
        errorCode: AuthResponse.TEMP_PASSWORD_INVALID.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    schema: {
      example: {
        httpCode: 404,
        message: AuthResponse.PASSWORD_RESET_USER_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.PASSWORD_RESET_USER_NOT_FOUND.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: '임시 비밀번호 검증 시도 횟수 초과',
    schema: {
      example: {
        httpCode: 429,
        message: AuthResponse.TEMP_PASSWORD_ATTEMPTS_EXCEEDED.message,
        success: false,
        errorCode: AuthResponse.TEMP_PASSWORD_ATTEMPTS_EXCEEDED.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '비밀번호 재설정 처리 실패',
    schema: {
      example: {
        httpCode: 500,
        message: AuthResponse.PASSWORD_RESET_SAVE_FAILED.message,
        success: false,
        errorCode: AuthResponse.PASSWORD_RESET_SAVE_FAILED.errorCode,
      },
    },
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.resetPasswordUseCase.execute(
      dto.email,
      dto.temporaryPassword,
      dto.newPassword,
    );

    return ApiResponseDto.success(
      result,
      AuthResponse.PASSWORD_RESET_SUCCESS.message,
      AuthResponse.PASSWORD_RESET_SUCCESS.httpCode,
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
    const user = await this.signupUseCase.execute(
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
    const result = await this.loginUseCase.execute(
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

    const result = await this.refreshUseCase.execute(refreshToken);
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
    const result = await this.logoutUseCase.execute(refreshToken);
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
          friendCount: 12,
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

    const user = await this.getUserByIdUseCase.execute(userId);

    if (!user) {
      throw new BusinessException(AuthResponse.USER_NOT_FOUND);
    }

    return ApiResponseDto.success(
      user,
      AuthResponse.USER_FOUND.message,
      AuthResponse.USER_FOUND.httpCode,
    );
  }

  /** @description 현재 로그인된 사용자의 비밀번호를 변경하는 API */
  @Post('me/update-pw')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '비밀번호 변경',
    description:
      '현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다. 기존 비밀번호와 동일한 비밀번호로는 변경할 수 없습니다. 변경 성공 시 모든 세션이 만료됩니다.',
  })
  @ApiBody({
    type: UpdatePasswordDto,
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 변경 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.UPDATE_PASSWORD_SUCCESS.message,
        success: true,
        data: { ok: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '소셜 로그인 계정 또는 동일한 비밀번호',
    schema: {
      example: {
        httpCode: 400,
        message: AuthResponse.UPDATE_PASSWORD_SAME_AS_CURRENT.message,
        success: false,
        errorCode: AuthResponse.UPDATE_PASSWORD_SAME_AS_CURRENT.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '현재 비밀번호 불일치',
    schema: {
      example: {
        httpCode: 401,
        message: AuthResponse.UPDATE_PASSWORD_WRONG_CURRENT.message,
        success: false,
        errorCode: AuthResponse.UPDATE_PASSWORD_WRONG_CURRENT.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    schema: {
      example: {
        httpCode: 404,
        message: AuthResponse.USER_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.USER_NOT_FOUND.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '비밀번호 변경 실패',
    schema: {
      example: {
        httpCode: 500,
        message: AuthResponse.UPDATE_PASSWORD_SAVE_FAILED.message,
        success: false,
        errorCode: AuthResponse.UPDATE_PASSWORD_SAVE_FAILED.errorCode,
      },
    },
  })
  async updatePassword(
    @NestRequest() req: { user?: { userId?: string } },
    @Body() dto: UpdatePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }

    const result = await this.updatePasswordUseCase.execute(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
    res.clearCookie('refreshToken', this.buildRefreshTokenCookieOptions());

    return ApiResponseDto.success(
      result,
      AuthResponse.UPDATE_PASSWORD_SUCCESS.message,
      AuthResponse.UPDATE_PASSWORD_SUCCESS.httpCode,
    );
  }

  /** @description 현재 로그인된 사용자의 비밀번호 일치 여부를 확인하는 API */
  @Post('me/check-pw')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '비밀번호 확인',
    description:
      '현재 로그인된 사용자의 비밀번호가 일치하는지 확인합니다. 소셜 로그인 사용자는 항상 false를 반환합니다.',
  })
  @ApiBody({
    schema: {
      example: { password: 'myPassw0rd!' },
    },
  })
  @ApiResponse({
    status: 200,
    description: '비밀번호 확인 성공',
    schema: {
      example: {
        httpCode: 200,
        message: AuthResponse.VERIFY_PASSWORD_SUCCESS.message,
        success: true,
        data: { matched: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    schema: {
      example: {
        httpCode: 404,
        message: AuthResponse.USER_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.USER_NOT_FOUND.errorCode,
      },
    },
  })
  async verifyPassword(
    @NestRequest() req: { user?: { userId?: string } },
    @Body() dto: VerifyPasswordDto,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }

    const result = await this.verifyPasswordUseCase.execute(
      userId,
      dto.password,
    );

    return ApiResponseDto.success(
      result,
      AuthResponse.VERIFY_PASSWORD_SUCCESS.message,
      AuthResponse.VERIFY_PASSWORD_SUCCESS.httpCode,
    );
  }

  /** @description 현재 로그인된 사용자의 계정을 탈퇴 처리하는 API */
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '회원 탈퇴',
    description: 'JWT AccessToken으로 인증된 사용자를 탈퇴 처리합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '회원 탈퇴 성공',
    schema: {
      example: {
        httpCode: 200,
        message: '회원 탈퇴가 완료됐어요. 이용해 주셔서 감사해요.',
        success: true,
        data: { ok: true },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자 없음',
    schema: {
      example: {
        httpCode: 404,
        message: AuthResponse.USER_NOT_FOUND.message,
        success: false,
        errorCode: AuthResponse.USER_NOT_FOUND.errorCode,
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '탈퇴 처리 실패',
    schema: {
      example: {
        httpCode: 500,
        message: '탈퇴 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
        success: false,
        errorCode: 'WITHDRAW_SAVE_FAILED',
      },
    },
  })
  async withdraw(
    @NestRequest() req: { user?: { userId?: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }

    const result = await this.withdrawUseCase.execute(userId);
    res.clearCookie('refreshToken', this.buildRefreshTokenCookieOptions());

    return ApiResponseDto.success(
      result,
      AuthResponse.WITHDRAW_SUCCESS.message,
      AuthResponse.WITHDRAW_SUCCESS.httpCode,
    );
  }
}
