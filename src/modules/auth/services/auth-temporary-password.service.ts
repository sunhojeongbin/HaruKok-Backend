import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { sha256 } from '../../../common/crypto/hash.util';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { MailService } from '../../mail/mail.service';
import { AuthErrorCode } from '../errors/auth-error-code';

type TemporaryPasswordEntry = {
  tempPasswordHash: string;
  expiresAt: number;
  attempts: number;
  cooldownUntil: number;
};

@Injectable()
export class AuthTemporaryPasswordService {
  private readonly TEMP_PASSWORD_TTL_SEC = 10 * 60;
  private readonly MAX_VERIFY_ATTEMPTS = 5;
  private readonly TEMP_PASSWORD_LENGTH = 10;
  private readonly TEMP_PASSWORD_CHARS =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  private readonly SEND_COOLDOWN_SEC = 60;
  private readonly temporaryPasswordStore = new Map<
    string,
    TemporaryPasswordEntry
  >();

  constructor(private readonly mailService: MailService) {}

  /** @description 임시 비밀번호 해시에 사용할 시크릿을 조회한다. */
  private getTemporaryPasswordSecret(): string {
    const secret =
      process.env.TEMP_PASSWORD_SECRET ??
      process.env.EMAIL_CODE_SECRET ??
      process.env.JWT_SECRET;
    if (!secret) {
      throw new BusinessException(AuthErrorCode.AUTH_CONFIG_INVALID);
    }
    return secret;
  }

  /** @description 영문/숫자로 구성된 임시 비밀번호를 생성한다. */
  private generateTemporaryPassword(): string {
    const randomBytes = crypto.randomBytes(this.TEMP_PASSWORD_LENGTH);
    let password = '';

    for (let i = 0; i < this.TEMP_PASSWORD_LENGTH; i += 1) {
      password += this.TEMP_PASSWORD_CHARS[
        randomBytes[i] % this.TEMP_PASSWORD_CHARS.length
      ];
    }

    return password;
  }

  /** @description 이메일/비밀번호/시크릿 조합으로 임시 비밀번호 해시를 생성한다. */
  private hashTemporaryPassword(email: string, temporaryPassword: string): string {
    return sha256(
      `${email}:${temporaryPassword}:${this.getTemporaryPasswordSecret()}`,
    );
  }

  /** @description 남은 시간을 초 단위(최소 1초)로 계산한다. */
  private getRemainingSeconds(until: number): number {
    return Math.max(1, Math.ceil((until - Date.now()) / 1000));
  }

  /** @description 임시 비밀번호를 발급/전송하고 메모리에 해시로 저장한다. */
  async sendTemporaryPassword(normalizedEmail: string): Promise<void> {
    const existing = this.temporaryPasswordStore.get(normalizedEmail);
    if (existing && existing.cooldownUntil > Date.now()) {
      const remainingSeconds = this.getRemainingSeconds(existing.cooldownUntil);
      throw new BusinessException(AuthErrorCode.PASSWORD_RESET_TEMP_SEND_FAILED, {
        message: `${remainingSeconds}초 후에 다시 시도해 주세요.`,
      });
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const temporaryPasswordHash = this.hashTemporaryPassword(
      normalizedEmail,
      temporaryPassword,
    );

    try {
      await this.mailService.sendTemporaryPassword(
        normalizedEmail,
        temporaryPassword,
      );
    } catch {
      throw new BusinessException(AuthErrorCode.PASSWORD_RESET_TEMP_SEND_FAILED);
    }

    this.temporaryPasswordStore.set(normalizedEmail, {
      tempPasswordHash: temporaryPasswordHash,
      expiresAt: Date.now() + this.TEMP_PASSWORD_TTL_SEC * 1000,
      attempts: 0,
      cooldownUntil: Date.now() + this.SEND_COOLDOWN_SEC * 1000,
    });
  }

  /** @description 임시 비밀번호를 검증한다. */
  verifyTemporaryPassword(normalizedEmail: string, temporaryPassword: string): void {
    const stored = this.temporaryPasswordStore.get(normalizedEmail);

    if (!stored || stored.expiresAt < Date.now()) {
      this.temporaryPasswordStore.delete(normalizedEmail);
      throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_EXPIRED_OR_NOT_FOUND);
    }

    if (stored.attempts >= this.MAX_VERIFY_ATTEMPTS) {
      this.temporaryPasswordStore.delete(normalizedEmail);
      throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_ATTEMPTS_EXCEEDED);
    }

    const incomingHash = this.hashTemporaryPassword(
      normalizedEmail,
      temporaryPassword,
    );
    const storedHashBuffer = Buffer.from(stored.tempPasswordHash);
    const incomingHashBuffer = Buffer.from(incomingHash);
    const isValid =
      storedHashBuffer.length === incomingHashBuffer.length &&
      crypto.timingSafeEqual(storedHashBuffer, incomingHashBuffer);

    if (!isValid) {
      stored.attempts += 1;
      this.temporaryPasswordStore.set(normalizedEmail, stored);
      if (stored.attempts >= this.MAX_VERIFY_ATTEMPTS) {
        this.temporaryPasswordStore.delete(normalizedEmail);
        throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_ATTEMPTS_EXCEEDED);
      }
      throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_INVALID);
    }

    this.temporaryPasswordStore.delete(normalizedEmail);
  }

  /** @description 임시 비밀번호를 검증하지만 소비하지 않는다. */
  verifyTemporaryPasswordWithoutConsuming(
    normalizedEmail: string,
    temporaryPassword: string,
  ): void {
    const stored = this.temporaryPasswordStore.get(normalizedEmail);

    if (!stored || stored.expiresAt < Date.now()) {
      this.temporaryPasswordStore.delete(normalizedEmail);
      throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_EXPIRED_OR_NOT_FOUND);
    }

    if (stored.attempts >= this.MAX_VERIFY_ATTEMPTS) {
      this.temporaryPasswordStore.delete(normalizedEmail);
      throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_ATTEMPTS_EXCEEDED);
    }

    const incomingHash = this.hashTemporaryPassword(
      normalizedEmail,
      temporaryPassword,
    );
    const storedHashBuffer = Buffer.from(stored.tempPasswordHash);
    const incomingHashBuffer = Buffer.from(incomingHash);
    const isValid =
      storedHashBuffer.length === incomingHashBuffer.length &&
      crypto.timingSafeEqual(storedHashBuffer, incomingHashBuffer);

    if (!isValid) {
      stored.attempts += 1;
      this.temporaryPasswordStore.set(normalizedEmail, stored);
      if (stored.attempts >= this.MAX_VERIFY_ATTEMPTS) {
        this.temporaryPasswordStore.delete(normalizedEmail);
        throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_ATTEMPTS_EXCEEDED);
      }
      throw new BusinessException(AuthErrorCode.TEMP_PASSWORD_INVALID);
    }
  }

  /** @description 검증된 임시 비밀번호를 소비(삭제)한다. */
  consumeTemporaryPassword(normalizedEmail: string): void {
    this.temporaryPasswordStore.delete(normalizedEmail);
  }

  /** @description 이메일에 저장된 임시 비밀번호를 제거한다. */
  clearTemporaryPassword(normalizedEmail: string): void {
    this.temporaryPasswordStore.delete(normalizedEmail);
  }
}