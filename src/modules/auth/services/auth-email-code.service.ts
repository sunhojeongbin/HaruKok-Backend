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
  sendAvailableAt: number;
  resendCount: number;
  resendRateLimitUntil: number | null;
  verifyLockedUntil: number | null;
};

@Injectable()
export class AuthEmailCodeService {
  private readonly CODE_TTL_SEC = 10 * 60; // 이메일 인증 번호 유효 시간: 10분
  private readonly RESEND_COOLDOWN_SEC = 60; // 1분
  private readonly MAX_VERIFY_ATTEMPTS = 3; // 최대 3회 시도 허용
  private readonly VERIFY_LOCK_SEC = 60; // 1분 동안 검증 잠금
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

  /** @description 남은 시간을 초 단위(최소 1초)로 계산한다. */
  private getRemainingSeconds(until: number): number {
    return Math.max(1, Math.ceil((until - Date.now()) / 1000));
  }

  /** @description 이메일의 저장된 인증코드가 만료됐는지 확인하고 정리한다. */
  private getValidStoredCode(
    normalizedEmail: string,
  ): EmailVerificationCodeEntry | null {
    const storedCode = this.emailCodeStore.get(normalizedEmail);
    if (!storedCode) {
      return null;
    }

    if (storedCode.expiresAt < Date.now()) {
      this.emailCodeStore.delete(normalizedEmail);
      return null;
    }

    return storedCode;
  }

  /** @description 이메일 인증 코드를 생성/발송하고 해시를 저장한다. */
  async sendCode(normalizedEmail: string): Promise<void> {
    const existingCode = this.getValidStoredCode(normalizedEmail);
    if (existingCode && existingCode.sendAvailableAt > Date.now()) {
      const remainingSeconds = this.getRemainingSeconds(
        existingCode.sendAvailableAt,
      );
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_RESEND_TOO_SOON, {
        message: `${remainingSeconds}초 후에 다시 시도해 주세요.`,
      });
    }

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
      sendAvailableAt: Date.now() + this.RESEND_COOLDOWN_SEC * 1000,
      resendCount: 0,
      resendRateLimitUntil: null,
      verifyLockedUntil: null,
    });
  }

  /** @description 저장된 인증 코드 기준으로 인증 번호를 재전송한다. */
  async resendCode(normalizedEmail: string): Promise<void> {
    const storedCode = this.getValidStoredCode(normalizedEmail);
    if (!storedCode) {
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_EXPIRED_OR_NOT_FOUND);
    }

    if (
      storedCode.resendCount >= 3 &&
      storedCode.resendRateLimitUntil &&
      storedCode.resendRateLimitUntil > Date.now()
    ) {
      const remainingSeconds = this.getRemainingSeconds(
        storedCode.resendRateLimitUntil,
      );
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_RESEND_TOO_SOON, {
        message: `${remainingSeconds}초 후에 다시 시도해 주세요.`,
      });
    }

    const code = this.random6Digits();
    try {
      await this.mailService.sendEmailVerificationCode(normalizedEmail, code);
    } catch {
      throw new BusinessException(AuthErrorCode.EMAIL_SEND_FAILED);
    }

    storedCode.codeHash = emailCodeHash(
      normalizedEmail,
      code,
      this.getEmailCodeSecret(),
    );
    storedCode.expiresAt = Date.now() + this.CODE_TTL_SEC * 1000;
    storedCode.attempts = 0;
    storedCode.verifyLockedUntil = null;
    storedCode.sendAvailableAt = Date.now() + this.RESEND_COOLDOWN_SEC * 1000;
    storedCode.resendCount += 1;

    if (storedCode.resendCount >= 3) {
      storedCode.resendRateLimitUntil =
        Date.now() + this.RESEND_COOLDOWN_SEC * 1000;
    } else {
      storedCode.resendRateLimitUntil = null;
    }

    this.emailCodeStore.set(normalizedEmail, storedCode);
  }

  /** @description 이메일 인증 코드를 검증한다. */
  verifyCode(normalizedEmail: string, code: string): void {
    const normalizedCode = String(code ?? '').trim();

    const storedCode = this.getValidStoredCode(normalizedEmail);
    if (!storedCode) {
      throw new BusinessException(
        AuthErrorCode.EMAIL_CODE_EXPIRED_OR_NOT_FOUND,
      );
    }

    if (
      storedCode.verifyLockedUntil &&
      storedCode.verifyLockedUntil > Date.now()
    ) {
      const remainingSeconds = this.getRemainingSeconds(
        storedCode.verifyLockedUntil,
      );
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_ATTEMPTS_EXCEEDED, {
        message: `${remainingSeconds}초 후에 다시 시도해 주세요.`,
      });
    }

    if (
      storedCode.verifyLockedUntil &&
      storedCode.verifyLockedUntil <= Date.now()
    ) {
      storedCode.verifyLockedUntil = null;
      storedCode.attempts = 0;
      this.emailCodeStore.set(normalizedEmail, storedCode);
    }

    if (!normalizedCode || normalizedCode.length !== 6) {
      storedCode.attempts += 1;

      if (storedCode.attempts >= this.MAX_VERIFY_ATTEMPTS) {
        storedCode.verifyLockedUntil = Date.now() + this.VERIFY_LOCK_SEC * 1000;
        this.emailCodeStore.set(normalizedEmail, storedCode);
        const remainingSeconds = this.getRemainingSeconds(
          storedCode.verifyLockedUntil,
        );
        throw new BusinessException(
          AuthErrorCode.EMAIL_CODE_ATTEMPTS_EXCEEDED,
          {
            message: `${remainingSeconds}초 후에 다시 시도해 주세요.`,
          },
        );
      }

      this.emailCodeStore.set(normalizedEmail, storedCode);
      throw new BusinessException(AuthErrorCode.EMAIL_CODE_FORMAT_INVALID);
    }

    const incomingCodeHash = emailCodeHash(
      normalizedEmail,
      normalizedCode,
      this.getEmailCodeSecret(),
    );
    const storedHashBuffer = Buffer.from(storedCode.codeHash);
    const incomingHashBuffer = Buffer.from(incomingCodeHash);
    const isValidCode =
      storedHashBuffer.length === incomingHashBuffer.length &&
      crypto.timingSafeEqual(storedHashBuffer, incomingHashBuffer);

    if (!isValidCode) {
      storedCode.attempts += 1;

      if (storedCode.attempts >= this.MAX_VERIFY_ATTEMPTS) {
        storedCode.verifyLockedUntil = Date.now() + this.VERIFY_LOCK_SEC * 1000;
        this.emailCodeStore.set(normalizedEmail, storedCode);
        const remainingSeconds = this.getRemainingSeconds(
          storedCode.verifyLockedUntil,
        );
        throw new BusinessException(
          AuthErrorCode.EMAIL_CODE_ATTEMPTS_EXCEEDED,
          {
            message: `${remainingSeconds}초 후에 다시 시도해 주세요.`,
          },
        );
      }

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
