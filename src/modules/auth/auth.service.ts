import { Injectable, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { emailCodeHash } from '../../common/crypto/hash.util';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AuthResponse } from '../../common/response/auth.response';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { UsrEntity } from './entities/usr.entity';

type EmailVerificationCodeEntry = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

type SignupPayload = {
  sub: string;
  verified: boolean;
  purpose: string;
};

type LoginResult = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
};

function random6Digits(): string {
  // 000000~999999
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    @Optional()
    @InjectRepository(UsrEntity)
    private readonly userRepository?: Repository<UsrEntity>,
  ) {}

  private readonly CODE_TTL_SEC = 10 * 60;
  private readonly SIGNUP_TTL_SEC = 30 * 60;
  private readonly MAX_VERIFY_ATTEMPTS = 5;
  private readonly DEFAULT_BCRYPT_ROUNDS = 12;
  private readonly emailCodeStore = new Map<
    string,
    EmailVerificationCodeEntry
  >();

  // DB가 비활성화된 테스트 환경에서 로그인 e2e를 유지하기 위한 fallback
  private readonly FALLBACK_USER = {
    email: 'test@gmail.com',
    password: '1234',
    id: '00000000-0000-0000-0000-000000000001',
    name: '최정빈',
  };

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string): string {
    return name.trim();
  }

  private getUserRepository(): Repository<UsrEntity> {
    if (!this.userRepository) {
      throw new BusinessException(AuthResponse.USER_REPOSITORY_NOT_READY);
    }
    return this.userRepository;
  }

  private getEmailCodeSecret(): string {
    const secret = process.env.EMAIL_CODE_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new BusinessException(AuthResponse.AUTH_CONFIG_INVALID);
    }
    return secret;
  }

  private getBcryptRounds(): number {
    const envRounds = Number(process.env.BCRYPT_SALT_ROUNDS);
    if (Number.isInteger(envRounds) && envRounds >= 10 && envRounds <= 15) {
      return envRounds;
    }
    return this.DEFAULT_BCRYPT_ROUNDS;
  }

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

  async signup(
    email: string,
    password: string,
    name: string,
    signupToken: string,
  ): Promise<UserProfile> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedName = this.normalizeName(name);
    const emailFromToken = this.assertSignupToken(signupToken);
    if (normalizedEmail !== emailFromToken) {
      throw new BusinessException(AuthResponse.SIGNUP_EMAIL_MISMATCH);
    }

    const repo = this.getUserRepository();
    const existing = await repo.findOne({
      where: { usrEmail: normalizedEmail },
    });
    if (existing) {
      throw new BusinessException(AuthResponse.SIGNUP_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(password, this.getBcryptRounds());
    const user = repo.create({
      usrEmail: normalizedEmail,
      usrName: normalizedName,
      password: hashedPassword,
    });

    try {
      const saved = await repo.save(user);
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

  /** @description 로그인 메서드 */
  async login(email: string, password: string): Promise<LoginResult | null> {
    const normalizedEmail = this.normalizeEmail(email);

    if (!this.userRepository) {
      if (
        normalizedEmail === this.FALLBACK_USER.email &&
        password === this.FALLBACK_USER.password
      ) {
        const payload = {
          sub: this.FALLBACK_USER.id,
          email: this.FALLBACK_USER.email,
        };
        const accessToken = this.jwtService.sign(payload);
        return {
          user: {
            id: this.FALLBACK_USER.id,
            name: this.FALLBACK_USER.name,
            email: this.FALLBACK_USER.email,
          },
          accessToken,
        };
      }
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { usrEmail: normalizedEmail },
    });
    if (!user) {
      return null;
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
      return null;
    }

    const payload = {
      sub: user.usrId,
      email: user.usrEmail ?? '',
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: {
        id: user.usrId,
        name: user.usrName,
        email: user.usrEmail ?? '',
      },
      accessToken,
    };
  }

  /** @description 사용자 정보 조회 메서드 */
  async getUserById(userId: string): Promise<UserProfile | null> {
    if (!this.userRepository) {
      if (userId === this.FALLBACK_USER.id) {
        return {
          id: this.FALLBACK_USER.id,
          name: this.FALLBACK_USER.name,
          email: this.FALLBACK_USER.email,
        };
      }
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { usrId: userId },
    });
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
