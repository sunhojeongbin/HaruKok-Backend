import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
  normalizeAuthEmail,
  normalizeAuthName,
} from '../../domain/policies/auth-normalization.policy';
import { AuthErrorCode } from '../../errors/auth-error-code';
import { throwIfAuthDuplicatePersistenceError } from '../policies/auth-persistence-error.policy';
import { AuthPasswordService } from '../../services/auth-password.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { UserInfo } from '../../types/auth.types';
import {
  USR_REPOSITORY,
  UsrRepositoryPort,
} from '../../../usr/repositories/usr.repository.port';

@Injectable()
export class SignupUseCase {
  constructor(
    private readonly authTokenService: AuthTokenService,
    private readonly authPasswordService: AuthPasswordService,
    @Inject(USR_REPOSITORY)
    private readonly usrRepository: UsrRepositoryPort,
  ) {}

  private getUsrRepository(): UsrRepositoryPort {
    if (!this.usrRepository.isReady()) {
      throw new BusinessException(AuthErrorCode.USER_REPOSITORY_NOT_READY);
    }
    return this.usrRepository;
  }

  private assertSignupToken(signupToken: string): string {
    const payload = this.authTokenService.verifySignupToken(signupToken);
    if (!payload) {
      throw new BusinessException(AuthErrorCode.SIGNUP_TOKEN_INVALID);
    }

    if (payload.purpose !== 'signup' || !payload.sub || !payload.verified) {
      throw new BusinessException(AuthErrorCode.SIGNUP_TOKEN_FORMAT_INVALID);
    }

    return normalizeAuthEmail(payload.sub);
  }

  execute(
    email: string,
    password: string,
    name: string,
    signupToken: string,
  ): Promise<UserInfo> {
    return this.signup(email, password, name, signupToken);
  }

  private async signup(
    email: string,
    password: string,
    name: string,
    signupToken: string,
  ): Promise<UserInfo> {
    const normalizedEmail = normalizeAuthEmail(email);
    const normalizedName = normalizeAuthName(name);
    const emailFromToken = this.assertSignupToken(signupToken);

    if (normalizedEmail !== emailFromToken) {
      throw new BusinessException(AuthErrorCode.SIGNUP_EMAIL_MISMATCH);
    }

    const repo = this.getUsrRepository();
    const existing = await repo.findByEmail(normalizedEmail);
    if (existing) {
      throw new BusinessException(AuthErrorCode.SIGNUP_ALREADY_EXISTS);
    }

    const hashedPassword =
      await this.authPasswordService.hashPassword(password);

    try {
      const saved = await repo.createAndSave({
        usrEmail: normalizedEmail,
        usrNm: normalizedName,
        pwd: hashedPassword,
        pwdHash: this.authPasswordService.algorithm,
        joinTypeCd: 'EMAIL',
      });

      return {
        id: saved.usrId,
        email: saved.usrEmail ?? '',
        name: saved.usrNm,
      };
    } catch (error: unknown) {
      try {
        throwIfAuthDuplicatePersistenceError(error);
      } catch (translatedError: unknown) {
        if (translatedError instanceof BusinessException) {
          throw translatedError;
        }
      }

      throw new BusinessException(AuthErrorCode.SIGNUP_SAVE_FAILED);
    }
  }
}
