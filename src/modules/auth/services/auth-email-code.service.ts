import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { emailCodeHash } from '../../../common/crypto/hash.util';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { MailService } from '../../mail/mail.service';
import { AuthErrorCode } from '../errors/auth-error-code';

/** @description 이메일 인증 코드 저장 */
type EmailVerificationCodeEntry = {
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

@Injectable()
export class AuthEmailCodeService {
  private readonly CODE_TTL_SEC = 10 * 60;
  private readonly MAX_VERIFY_ATTEMPTS = 5;
  private readonly emailCodeStore = new Map<
    string,
    EmailVerificationCodeEntry
  >();

  constructor(private readonly mailService: MailService) {}

  /** @description 6자리 숫자 인증 코드를 생성한다. */
  private random6Digits(): string {
    const n = crypto.randomInt(0, 1_000_000);
    return n.toString().padStart(6, '0');
  }

  /** @description 이메일 인증 코드 해시 생성에 사용할 시크릿을 조회한다. */
  private getEmailCodeSecret(): string {
    const secret = process.env.EMAIL_CODE_SECRET ?? process.env.JWT_SECRET;
    if (!secret) {
      throw new BusinessException(AuthErrorCode.AUTH_CONFIG_INVALID);
    }
    return secret;
  }

  /** @description 이메일 인증 코드를 생성/발송하고 해시를 저장한다. */
  async sendCode(normalizedEmail: string): Promise<void> {
    const code = this.random6Digits();

    try {
      await this.mailService.sendEmailVerificationCode(normalizedEmail, code);
    } catch {
      throw new BusinessException(AuthErrorCode.EMAIL_SEND_FAILED);
    }

    this.emailCodeStore.set(normalizedEmail, {
      codeHash: emailCodeHash(normalizedEmail, code, this.getEmailCodeSecret()),
      expiresAt: Date.now() + this.CODE_TTL_SEC * 1000,
      attempts: 0,
    });
  }

  /** @description 이메일 인증 코드를 검증한다. */
  verifyCode(normalizedEmail: string, code: string): void {
    if (!code || code.length !== 6) {
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_FORMAT_INVALID);
    }

    const storedCode = this.emailCodeStore.get(normalizedEmail);

    if (!storedCode || storedCode.expiresAt < Date.now()) {
      this.emailCodeStore.delete(normalizedEmail);
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_EXPIRED_OR_NOT_FOUND);
    }

    if (storedCode.attempts >= this.MAX_VERIFY_ATTEMPTS) {
      this.emailCodeStore.delete(normalizedEmail);
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_ATTEMPTS_EXCEEDED);
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
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_INVALID);
    }

    this.emailCodeStore.delete(normalizedEmail);
  }

  /** @description 이메일에 저장된 인증코드를 제거한다. */
  clearCode(normalizedEmail: string): void {
    this.emailCodeStore.delete(normalizedEmail);
  }
}
