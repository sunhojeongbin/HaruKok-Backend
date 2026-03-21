import { Injectable, Optional } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuthResponse } from '../../common/response/auth.response';
import { UsrRepository } from '../usr/repositories/usr.repository';
import { AuthEmailCodeService } from './services/auth-email-code.service';
import { AuthFallbackService } from './services/auth-fallback.service';
import { DeviceType, RevokeReason } from './enums/refresh-token.enum';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthRefreshTokenStoreService } from './services/rft-store.service';
import { AuthTokenService } from './services/auth-token.service';
import { LoginResult, RefreshResult, UserInfo } from './types/auth.types';
import { UsrEntity } from '../usr/entities/usr.entity';

type LoginContext = {
  deviceName?: string | null;
  deviceType?: DeviceType | null;
  ipAddress?: string | null;
};

/** @description 인증(이메일 인증, 회원가입, 로그인, 토큰 재발급) 비즈니스 로직을 처리 서비스 레이어 */
@Injectable()
export class AuthService {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authPasswordService: AuthPasswordService,
    private readonly authEmailCodeService: AuthEmailCodeService,
    private readonly authFallbackService: AuthFallbackService,
    private readonly refreshTokenStore: AuthRefreshTokenStoreService,
    @Optional()
    private readonly usrRepository?: UsrRepository,
  ) {}

  private readonly SIGNUP_TTL_SEC = 30 * 60;
  private readonly MAX_FAILED_LOGIN_COUNT = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  /** @description 이메일을 소문자/공백 제거 형태로 정규화 메소드 */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** @description 이름 문자열의 앞뒤 공백을 제거하는 메소드 */
  private normalizeName(name: string): string {
    return name.trim();
  }

  /** @description 로그인 실패 카운트를 증가시키고 필요 시 계정을 잠금 처리한다. */
  private applyFailedLoginAttempt(user: UsrEntity): void {
    const nextFailedCount = (user.failedLoginCnt ?? 0) + 1;
    user.failedLoginCnt = nextFailedCount;

    if (nextFailedCount >= this.MAX_FAILED_LOGIN_COUNT) {
      user.usrStatCd = 'LOCKED';
      user.lockedUntil = new Date(
        Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000,
      );
    }
  }

  /** @description 로그인 성공 시 실패 카운트/잠금 정보를 초기화한다. */
  private resetLoginAttemptState(user: UsrEntity): void {
    user.failedLoginCnt = 0;
    user.lockedUntil = null;
  }

  /** @description 사용자 리포지토리 준비 상태를 확인하고 반환하는 메소드 */
  private getUsrRepository(): UsrRepository {
    if (!this.usrRepository || !this.usrRepository.isReady()) {
      throw new BusinessException(AuthResponse.USER_REPOSITORY_NOT_READY);
    }
    return this.usrRepository;
  }

  /** @description DB 에러가 PostgreSQL unique violation(23505)인지 판별한다. */
  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = (error as { driverError?: unknown }).driverError;
    if (!driverError || typeof driverError !== 'object') {
      return false;
    }

    const code = (driverError as { code?: unknown }).code;
    return code === '23505';
  }

  /** @description 이메일 인증 코드를 생성하고 메일로 발송한다. */
  async sendEmailCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);

    if (this.usrRepository && this.usrRepository.isReady()) {
      const existing = await this.usrRepository.findByEmail(normalizedEmail);
      if (existing) {
        this.authEmailCodeService.clearCode(normalizedEmail);
        throw new BusinessException(AuthResponse.SIGNUP_ALREADY_EXISTS);
      }
    }

    await this.authEmailCodeService.sendCode(normalizedEmail);
    return { ok: true };
  }

  /** @description 이메일 인증 코드를 검증하고 회원가입 토큰을 발급한다. */
  verifyEmailCode(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.authEmailCodeService.verifyCode(normalizedEmail, code);

    const signupToken = this.authTokenService.issueSignupToken(
      { sub: normalizedEmail, verified: true, purpose: 'signup' },
      this.SIGNUP_TTL_SEC,
    );

    return { ok: true, signupToken };
  }

  /** @description 회원가입 토큰의 유효성을 검증하고 이메일(subject)을 반환한다. */
  assertSignupToken(signupToken: string): string {
    const payload = this.authTokenService.verifySignupToken(signupToken);
    if (!payload) {
      throw new BusinessException(AuthResponse.SIGNUP_TOKEN_INVALID);
    }

    if (payload.purpose !== 'signup' || !payload.sub || !payload.verified) {
      throw new BusinessException(AuthResponse.SIGNUP_TOKEN_FORMAT_INVALID);
    }

    return this.normalizeEmail(payload.sub);
  }

  /**
   * @description 회원가입을 처리하고 사용자 기본 정보를 반환하는 메소드
   * @param email 회원가입할 이메일 주소
   * @param password 회원가입할 비밀번호
   * @param name 회원가입할 사용자 이름
   * @param signupToken 회원가입 토큰
   * @returns 생성된 사용자 정보(사용자 ID, 이메일, 이름)를 포함하는 객체
   */
  async signup(
    email: string,
    password: string,
    name: string,
    signupToken: string,
  ): Promise<UserInfo> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedName = this.normalizeName(name);
    const emailFromToken = this.assertSignupToken(signupToken);
    if (normalizedEmail !== emailFromToken) {
      throw new BusinessException(AuthResponse.SIGNUP_EMAIL_MISMATCH);
    }

    const repo = this.getUsrRepository();
    const existing = await repo.findByEmail(normalizedEmail);
    if (existing) {
      throw new BusinessException(AuthResponse.SIGNUP_ALREADY_EXISTS);
    }

    const hashedPassword =
      await this.authPasswordService.hashPassword(password);
    const usr = {
      usrEmail: normalizedEmail,
      usrNm: normalizedName,
      pwd: hashedPassword,
      pwdHash: this.authPasswordService.algorithm,
      joinTypeCd: 'EMAIL',
    };

    try {
      const saved = await repo.createAndSave(usr);
      return {
        id: saved.usrId,
        email: saved.usrEmail ?? '',
        name: saved.usrNm,
      };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new BusinessException(AuthResponse.SIGNUP_ALREADY_EXISTS);
      }
      throw new BusinessException(AuthResponse.SIGNUP_SAVE_FAILED);
    }
  }

  /**
   * @description 로그인 정보를 검증하고 토큰을 발급하는 메소드
   * @param email 로그인할 이메일 주소
   * @param password 로그인할 비밀번호
   * @returns 로그인 성공 시 액세스 토큰 정보를 포함한 객체, 실패 시 null
   */
  async login(
    email: string,
    password: string,
    context: LoginContext = {},
  ): Promise<LoginResult | null> {
    const normalizedEmail = this.normalizeEmail(email);

    if (!this.usrRepository || !this.usrRepository.isReady()) {
      return this.authFallbackService.tryLogin(normalizedEmail, password);
    }

    const user = await this.usrRepository.findActiveByEmail(normalizedEmail);
    if (!user) {
      return null;
    }

    const passwordMatched = await this.authPasswordService.verifyPassword(
      user.pwd,
      user.pwdHash,
      password,
    );
    if (!passwordMatched) {
      this.applyFailedLoginAttempt(user);
      await this.usrRepository.save(user);
      return null;
    }

    const tokenPair = this.authTokenService.issueTokenPair({
      sub: user.usrId,
      email: user.usrEmail ?? '',
    });
    await this.refreshTokenStore.upsertToken({
      usrId: user.usrId,
      refreshToken: tokenPair.refreshToken,
      jti: tokenPair.jti,
      expiresAt: tokenPair.refreshTokenExpiresAt,
      deviceName: context.deviceName ?? null,
      deviceType: context.deviceType ?? null,
      ipAddress: context.ipAddress ?? null,
      lastUsedAt: null,
    });
    user.lastLoginAt = new Date();
    this.resetLoginAttemptState(user);
    await this.usrRepository.save(user);

    return {
      id: user.usrId,
      name: user.usrNm,
      email: user.usrEmail ?? '',
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      refreshTokenMaxAgeMs: tokenPair.refreshTokenMaxAgeMs,
    };
  }

  /**
   * @description 리프레시 토큰을 검증해 새로운 토큰 쌍을 발급 하는 메소드
   * @param refreshToken 재발급에 사용할 리프레시 토큰
   * @returns 유효한 리프레시 토큰이면 새로운 액세스 토큰과 리프레시 토큰 정보를 포함하는 객체, 그렇지 않으면 null
   */
  async refresh(refreshToken: string): Promise<RefreshResult | null> {
    if (!refreshToken) {
      return null;
    }

    const payload = this.authTokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    if (!this.usrRepository || !this.usrRepository.isReady()) {
      return this.authFallbackService.tryRefresh(payload, refreshToken);
    }

    const user = await this.usrRepository.findActiveById(payload.sub);
    if (!user) {
      return null;
    }

    const isValidRefreshToken = await this.refreshTokenStore.verifyToken({
      usrId: user.usrId,
      refreshToken,
      jti: payload.jti,
    });
    if (!isValidRefreshToken) {
      return null;
    }

    const tokenPair = this.authTokenService.issueTokenPair({
      sub: user.usrId,
      email: user.usrEmail ?? '',
    });
    await this.refreshTokenStore.upsertToken({
      usrId: user.usrId,
      refreshToken: tokenPair.refreshToken,
      jti: tokenPair.jti,
      expiresAt: tokenPair.refreshTokenExpiresAt,
      lastUsedAt: new Date(),
    });
    // await this.usrRepository.save(user);

    return tokenPair;
  }

  /**
   * @description 리프레시 토큰을 무효화하여 로그아웃 처리한다.
   * @param refreshToken 로그아웃 처리할 리프레시 토큰
   * @return 로그아웃 처리 결과(성공 여부)
   */
  async logout(refreshToken: string | null): Promise<void> {
    if (!this.usrRepository || !this.usrRepository.isReady()) {
      await this.authFallbackService.logout();
      return;
    }

    if (!refreshToken) {
      return;
    }

    const payload = this.authTokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return;
    }

    const user = await this.usrRepository.findById(payload.sub);
    if (!user) {
      return;
    }

    const isValidRefreshToken = await this.refreshTokenStore.verifyToken({
      usrId: user.usrId,
      refreshToken,
      jti: payload.jti,
    });
    if (!isValidRefreshToken) {
      return;
    }

    await this.refreshTokenStore.revokeToken(user.usrId, RevokeReason.LOGOUT);
  }

  /**
   * @description 사용자 ID로 사용자 정보를 조회하는 메소드
   * @param userId 조회할 사용자 ID
   * @returns 사용자 정보 또는 null
   */
  async getUserById(userId: string): Promise<UserInfo | null> {
    if (!this.usrRepository || !this.usrRepository.isReady()) {
      return this.authFallbackService.getUserById(userId);
    }

    const user = await this.usrRepository.findActiveById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.usrId,
      name: user.usrNm,
      email: user.usrEmail ?? '',
    };
  }
}
