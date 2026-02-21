import { Injectable, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { emailCodeHash } from '../../common/crypto/hash.util';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuthResponse } from '../../common/response/auth.response';
import { QueryFailedError } from 'typeorm';
import { UsersRepository } from '../users/repositories/users.repository';
import ms, { StringValue } from 'ms';

/** @description 이메일 인증 코드 저장 */
type EmailVerificationCodeEntry = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

/** @description 회원가입 토큰 페이로드 */
type SignupPayload = {
  sub: string;
  verified: boolean;
  purpose: string;
};

/** @description 로그인 처리 결과 */
type LoginResult = {
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
};

/** @description 토큰 재발급 처리 결과 */
type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
};

/** @description JWT 서명용 사용자 식별 페이로드 */
type TokenPayload = {
  sub: string;
  email: string;
};

/** @description 사용자 조회 응답 */
type UserInfo = {
  id: string;
  name: string;
  email: string;
};

/** @description 6자리 숫자 인증 코드를 생성 메소드 */
function random6Digits(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

/** @description 인증(이메일 인증, 회원가입, 로그인, 토큰 재발급) 비즈니스 로직을 처리 서비스 레이어 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    @Optional()
    private readonly usersRepository?: UsersRepository,
  ) {}

  private readonly CODE_TTL_SEC = 10 * 60; // 이메일 인증 코드 유효 시간(초)
  private readonly SIGNUP_TTL_SEC = 30 * 60; // 회원가입 토큰 유효 시간(초)
  private readonly MAX_VERIFY_ATTEMPTS = 5; // 이메일 인증 코드 검증 최대 시도 횟수
  private readonly DEFAULT_ARGON2_TIME_COST = 3; // Argon2 시간 비용 기본값(초)
  private readonly DEFAULT_ARGON2_MEMORY_COST = 65536; // Argon2 메모리 비용 기본값(KiB)
  private readonly DEFAULT_ARGON2_PARALLELISM = 1; // Argon2 병렬성 기본값
  private readonly DEFAULT_ARGON2_HASH_LENGTH = 32; // Argon2 해시 길이 기본값(바이트)
  private readonly PASSWORD_ALGORITHM_ARGON2ID = 'argon2id'; // 패스워드 해시 알고리즘 식별자
  private readonly DEFAULT_REFRESH_TOKEN_EXPIRES_IN: StringValue = '30d'; // 리프레시 토큰 기본 만료 시간
  private readonly DEFAULT_REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 리프레시 토큰 기본 maxAge(밀리초)
  private readonly emailCodeStore = new Map<
    string,
    EmailVerificationCodeEntry
  >();

  /** @description DB가 비활성화된 테스트 환경에서 로그인 e2e를 유지하기 위한 fallback 사용자 */
  private readonly FALLBACK_USER = {
    email: 'test@gmail.com',
    password: '1234',
    id: '00000000-0000-0000-0000-000000000001',
    name: '홍길동',
  };
  private readonly ALLOW_FALLBACK_USER =
    process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'e2e';
  private fallbackRefreshToken: string | null = null;

  /** @description 이메일을 소문자/공백 제거 형태로 정규화 메소드 */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** @description 이름 문자열의 앞뒤 공백을 제거하는 메소드 */
  private normalizeName(name: string): string {
    return name.trim();
  }

  /** @description 사용자 리포지토리 준비 상태를 확인하고 반환하는 메소드 */
  private getUsersRepository(): UsersRepository {
    if (!this.usersRepository || !this.usersRepository.isReady()) {
      throw new BusinessException(AuthResponse.USER_REPOSITORY_NOT_READY);
    }
    return this.usersRepository;
  }

  /** @description 이메일 인증 코드 해시 생성에 사용할 시크릿을 조회하는 메소드 */
  private getEmailCodeSecret(): string {
    const secret = process.env.EMAIL_CODE_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new BusinessException(AuthResponse.AUTH_CONFIG_INVALID);
    }
    return secret;
  }

  /** @description 리프레시 토큰 서명 시크릿을 조회하는 메소드 */
  private getRefreshTokenSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new BusinessException(AuthResponse.AUTH_CONFIG_INVALID);
    }
    return secret;
  }

  /** @description 환경변수에서 리프레시 토큰 만료값을 읽어 파싱 가능한 형태로 반환하는 메소드 */
  private getRefreshTokenExpiresIn(): number | StringValue {
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN?.trim();
    if (!expiresIn) {
      return this.DEFAULT_REFRESH_TOKEN_EXPIRES_IN;
    }

    if (/^\d+$/.test(expiresIn)) {
      return Number(expiresIn);
    }

    const parsed = ms(expiresIn as StringValue);
    if (typeof parsed === 'number' && parsed > 0) {
      return expiresIn as StringValue;
    }

    return this.DEFAULT_REFRESH_TOKEN_EXPIRES_IN;
  }

  /** @description 리프레시 토큰 만료값을 쿠키 `maxAge(ms)`로 변환하는 메소드 */
  private getRefreshTokenMaxAgeMs(expiresIn: number | StringValue): number {
    if (typeof expiresIn === 'number') {
      return expiresIn * 1000;
    }

    const parsed = ms(expiresIn);
    if (typeof parsed === 'number' && parsed > 0) {
      return parsed;
    }

    return this.DEFAULT_REFRESH_TOKEN_MAX_AGE_MS;
  }

  /**
   * @description 액세스 토큰 / 리프레시 토큰 쌍을 생성하는 메소드
   * @param payload JWT 페이로드(사용자 식별 정보)
   * @returns 액세스 토큰, 리프레시 토큰, 리프레시 토큰 maxAge(ms) 정보를 포함하는 객체
   */
  private issueTokenPair(payload: TokenPayload): RefreshResult {
    const accessToken = this.jwtService.sign(payload);
    const refreshExpiresIn = this.getRefreshTokenExpiresIn();
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: refreshExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenMaxAgeMs: this.getRefreshTokenMaxAgeMs(refreshExpiresIn),
    };
  }

  /**
   * @description 리프레시 토큰을 검증하고 페이로드를 반환한다.
   * @param refreshToken 검증할 리프레시 토큰
   * @returns 유효한 토큰이면 페이로드, 그렇지 않으면 null
   */
  private verifyRefreshToken(refreshToken: string): TokenPayload | null {
    let payload: { sub?: string; email?: string };
    try {
      payload = this.jwtService.verify<{ sub?: string; email?: string }>(
        refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );
    } catch {
      return null;
    }

    if (!payload.sub || typeof payload.sub !== 'string') {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email ?? '',
    };
  }

  /**
   * @description Argon2 옵션 숫자 값을 범위 검증 후 파싱하는 메소드
   * @param value 파싱할 환경변수 값
   * @param fallback 기본값
   * @param min 허용되는 최소값
   * @param max 허용되는 최대값
   * @returns 유효한 숫자 값 또는 기본값
   */
  private parseArgon2Number(
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= min && parsed <= max) {
      return parsed;
    }
    return fallback;
  }

  /** @description 환경변수를 기반으로 Argon2 해시 옵션을 구성하는 메소드 */
  private getArgon2Options(): argon2.Options & { raw?: false } {
    return {
      type: argon2.argon2id,
      timeCost: this.parseArgon2Number(
        process.env.ARGON2_TIME_COST,
        this.DEFAULT_ARGON2_TIME_COST,
        2,
        10,
      ),
      memoryCost: this.parseArgon2Number(
        process.env.ARGON2_MEMORY_COST,
        this.DEFAULT_ARGON2_MEMORY_COST,
        19456,
        262144,
      ),
      parallelism: this.parseArgon2Number(
        process.env.ARGON2_PARALLELISM,
        this.DEFAULT_ARGON2_PARALLELISM,
        1,
        8,
      ),
      hashLength: this.parseArgon2Number(
        process.env.ARGON2_HASH_LENGTH,
        this.DEFAULT_ARGON2_HASH_LENGTH,
        16,
        64,
      ),
    };
  }

  /**
   * @description 이메일 인증 코드를 생성하고 메일로 발송한 뒤, 해시 형태로 저장하는 메소드
   * @param email 인증 코드를 발송할 이메일 주소
   * @returns 발송 성공 여부
   */
  async sendEmailCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const code = random6Digits();

    try {
      await this.mail.sendEmailVerificationCode(normalizedEmail, code);
    } catch {
      throw new BusinessException(AuthResponse.EMAIL_SEND_FAILED);
    }

    this.emailCodeStore.set(normalizedEmail, {
      codeHash: emailCodeHash(normalizedEmail, code, this.getEmailCodeSecret()),
      expiresAt: Date.now() + this.CODE_TTL_SEC * 1000,
      attempts: 0,
    });

    return { ok: true };
  }

  /**
   * @description 이메일 인증 코드를 검증하고 회원가입 전용 토큰을 발급하는 메소드
   * @param email 인증 대상 이메일 주소
   * @param code 검증할 6자리 인증 코드
   * @returns 검증 성공 시 회원가입 토큰을 포함한 객체, 실패 시 예외 발생
   */
  verifyEmailCode(email: string, code: string) {
    if (!code || code.length !== 6) {
      throw new BusinessException(AuthResponse.EMAIL_CODE_FORMAT_INVALID);
    }

    const normalizedEmail = this.normalizeEmail(email);
    const storedCode = this.emailCodeStore.get(normalizedEmail);

    if (!storedCode || storedCode.expiresAt < Date.now()) {
      this.emailCodeStore.delete(normalizedEmail);
      throw new BusinessException(AuthResponse.EMAIL_CODE_EXPIRED_OR_NOT_FOUND);
    }

    if (storedCode.attempts >= this.MAX_VERIFY_ATTEMPTS) {
      this.emailCodeStore.delete(normalizedEmail);
      throw new BusinessException(AuthResponse.EMAIL_CODE_ATTEMPTS_EXCEEDED);
    }

    const incomingCodeHash = emailCodeHash(
      normalizedEmail,
      code,
      this.getEmailCodeSecret(),
    );
    const storedHashBuffer = Buffer.from(storedCode.codeHash);
    const incomingHashBuffer = Buffer.from(incomingCodeHash);
    const isValidCode =
      storedHashBuffer.length === incomingHashBuffer.length &&
      crypto.timingSafeEqual(storedHashBuffer, incomingHashBuffer);

    if (!isValidCode) {
      storedCode.attempts += 1;
      this.emailCodeStore.set(normalizedEmail, storedCode);
      throw new BusinessException(AuthResponse.EMAIL_CODE_INVALID);
    }

    this.emailCodeStore.delete(normalizedEmail);

    const signupToken = this.jwtService.sign(
      { sub: normalizedEmail, verified: true, purpose: 'signup' },
      { expiresIn: this.SIGNUP_TTL_SEC },
    );

    return { ok: true, signupToken };
  }

  /**
   * @description 회원가입 토큰의 유효성을 검증하고 이메일(subject)을 반환하는 메소드
   * @param signupToken 검증할 회원가입 토큰
   * @returns 유효한 토큰이면 이메일, 그렇지 않으면 예외 발생
   */
  assertSignupToken(signupToken: string): string {
    let payload: SignupPayload;
    try {
      payload = this.jwtService.verify<SignupPayload>(signupToken);
    } catch {
      throw new BusinessException(AuthResponse.SIGNUP_TOKEN_INVALID);
    }

    if (payload?.purpose !== 'signup' || !payload?.sub || !payload?.verified) {
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

    const repo = this.getUsersRepository();
    const existing = await repo.findByEmail(normalizedEmail);
    if (existing) {
      throw new BusinessException(AuthResponse.SIGNUP_ALREADY_EXISTS);
    }

    const hashedPassword = await argon2.hash(password, this.getArgon2Options());
    const user = {
      usrEmail: normalizedEmail,
      usrName: normalizedName,
      password: hashedPassword,
      passwordHash: this.PASSWORD_ALGORITHM_ARGON2ID,
    };

    try {
      const saved = await repo.createAndSave(user);
      return {
        id: saved.usrId,
        email: saved.usrEmail ?? '',
        name: saved.usrName,
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = (
          error as QueryFailedError & { driverError?: { code?: string } }
        ).driverError;
        if (driverError?.code === '23505') {
          throw new BusinessException(AuthResponse.SIGNUP_ALREADY_EXISTS);
        }
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
  async login(email: string, password: string): Promise<LoginResult | null> {
    const normalizedEmail = this.normalizeEmail(email);

    if (!this.usersRepository || !this.usersRepository.isReady()) {
      if (!this.ALLOW_FALLBACK_USER) {
        return null;
      }

      if (
        normalizedEmail === this.FALLBACK_USER.email &&
        password === this.FALLBACK_USER.password
      ) {
        const payload: TokenPayload = {
          sub: this.FALLBACK_USER.id,
          email: this.FALLBACK_USER.email,
        };
        const tokenPair = this.issueTokenPair(payload);
        this.fallbackRefreshToken = tokenPair.refreshToken;
        return {
          name: this.FALLBACK_USER.name,
          email: this.FALLBACK_USER.email,
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken,
          refreshTokenMaxAgeMs: tokenPair.refreshTokenMaxAgeMs,
        };
      }
      return null;
    }

    const user = await this.usersRepository.findByEmail(normalizedEmail);
    if (!user) {
      return null;
    }

    if (user.password && user.passwordHash) {
      const passwordAlgorithm = user.passwordHash.toLowerCase();
      if (passwordAlgorithm !== this.PASSWORD_ALGORITHM_ARGON2ID) {
        return null;
      }

      const passwordMatched = await argon2.verify(user.password, password);
      if (!passwordMatched) {
        return null;
      }
    } else if (user.passwordHash && user.passwordHash.startsWith('$argon2')) {
      const passwordMatched = await argon2.verify(user.passwordHash, password);
      if (!passwordMatched) {
        return null;
      }
    } else {
      return null;
    }

    const payload: TokenPayload = {
      sub: user.usrId,
      email: user.usrEmail ?? '',
    };
    const tokenPair = this.issueTokenPair(payload);
    user.accessToken = tokenPair.accessToken;
    user.refreshToken = tokenPair.refreshToken;
    user.lastLoginAt = new Date();
    user.failedLoginCnt = 0;
    await this.usersRepository.save(user);

    return {
      name: user.usrName,
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

    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return null;
    }

    if (!this.usersRepository || !this.usersRepository.isReady()) {
      if (!this.ALLOW_FALLBACK_USER) {
        return null;
      }

      if (
        payload.sub !== this.FALLBACK_USER.id ||
        this.fallbackRefreshToken !== refreshToken
      ) {
        return null;
      }

      const tokenPair = this.issueTokenPair({
        sub: this.FALLBACK_USER.id,
        email: this.FALLBACK_USER.email,
      });
      this.fallbackRefreshToken = tokenPair.refreshToken;
      return tokenPair;
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user) {
      return null;
    }

    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      return null;
    }

    const tokenPair = this.issueTokenPair({
      sub: user.usrId,
      email: user.usrEmail ?? '',
    });
    user.accessToken = tokenPair.accessToken;
    user.refreshToken = tokenPair.refreshToken;
    await this.usersRepository.save(user);

    return tokenPair;
  }

  /**
   * @description 리프레시 토큰을 무효화하여 로그아웃 처리한다.
   * @param refreshToken 로그아웃 처리할 리프레시 토큰
   * @return 로그아웃 처리 결과(성공 여부)
   */
  async logout(refreshToken: string | null): Promise<void> {
    if (!this.usersRepository || !this.usersRepository.isReady()) {
      if (this.ALLOW_FALLBACK_USER) {
        this.fallbackRefreshToken = null;
      }
      return;
    }

    if (!refreshToken) {
      return;
    }

    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) {
      return;
    }

    const user = await this.usersRepository.findById(payload.sub);
    if (!user || user.refreshToken !== refreshToken) {
      return;
    }

    user.accessToken = null;
    user.refreshToken = null;
    await this.usersRepository.save(user);
  }

  /**
   * @description 사용자 ID로 사용자 정보를 조회하는 메소드
   * @param userId 조회할 사용자 ID
   * @returns 사용자 정보 또는 null
   */
  async getUserById(userId: string): Promise<UserInfo | null> {
    if (!this.usersRepository || !this.usersRepository.isReady()) {
      if (this.ALLOW_FALLBACK_USER && userId === this.FALLBACK_USER.id) {
        return {
          id: this.FALLBACK_USER.id,
          name: this.FALLBACK_USER.name,
          email: this.FALLBACK_USER.email,
        };
      }
      return null;
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.usrId,
      name: user.usrName,
      email: user.usrEmail ?? '',
    };
  }
}
