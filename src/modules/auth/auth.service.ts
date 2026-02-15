import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { emailCodeHash } from '../../common/crypto/hash.util';

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
  ) {}

  private readonly CODE_TTL_SEC = 10 * 60;
  private readonly SIGNUP_TTL_SEC = 30 * 60;
  private readonly MAX_VERIFY_ATTEMPTS = 5;
  private readonly emailCodeStore = new Map<
    string,
    EmailVerificationCodeEntry
  >();

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private getEmailCodeSecret(): string {
    const secret = process.env.EMAIL_CODE_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException(
        '인증 코드 보안 설정이 누락되었습니다.',
      );
    }
    return secret;
  }

  async sendEmailCode(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const code = random6Digits();

    try {
      await this.mail.sendEmailVerificationCode(normalizedEmail, code);
    } catch {
      throw new BadRequestException(
        '메일 발송 실패: SMTP 설정 또는 서버 연결을 확인해주세요.',
      );
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
      throw new BadRequestException('인증 코드 형식이 올바르지 않습니다.');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const storedCode = this.emailCodeStore.get(normalizedEmail);

    if (!storedCode || storedCode.expiresAt < Date.now()) {
      this.emailCodeStore.delete(normalizedEmail);
      throw new BadRequestException('인증 코드가 없거나 만료되었습니다.');
    }

    if (storedCode.attempts >= this.MAX_VERIFY_ATTEMPTS) {
      this.emailCodeStore.delete(normalizedEmail);
      throw new ForbiddenException('인증 코드 검증 시도 횟수를 초과했습니다.');
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
      throw new BadRequestException('인증 코드가 올바르지 않습니다.');
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
      throw new ForbiddenException('signupToken이 유효하지 않습니다.');
    }

    if (payload?.purpose !== 'signup' || !payload?.sub || !payload?.verified) {
      throw new ForbiddenException('signupToken 형식이 올바르지 않습니다.');
    }

    return this.normalizeEmail(payload.sub);
  }

  // 하드코딩된 사용자 정보
  private readonly USER = {
    email: 'test@gmail.com',
    password: '1234',
    id: 1,
    name: '최정빈',
  };

  /** @description 로그인 메서드 */
  login(email: string, password: string) {
    if (email === this.USER.email && password === this.USER.password) {
      const payload = { sub: this.USER.id, email: this.USER.email };
      const accessToken = this.jwtService.sign(payload);

      return {
        user: {
          id: this.USER.id,
          name: this.USER.name,
          email: this.USER.email,
        },
        accessToken,
      };
    }

    return null;
  }

  /** @description 사용자 정보 조회 메서드 */
  getUserById(userId: number) {
    if (userId === this.USER.id) {
      return {
        id: this.USER.id,
        name: this.USER.name,
        email: this.USER.email,
      };
    }
    return null;
  }
}
