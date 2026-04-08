import { Injectable } from '@nestjs/common';
import { normalizeAuthEmail } from '../../domain/policies/auth-normalization.policy';
import { AuthEmailCodeService } from '../services/auth-email-code.service';
import { AuthTokenService } from '../../services/auth-token.service';

@Injectable()
export class VerifyEmailCodeUseCase {
  private readonly SIGNUP_TTL_SEC = 30 * 60;

  constructor(
    private readonly authEmailCodeService: AuthEmailCodeService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  async execute(
    email: string,
    code: string,
  ): Promise<{ ok: true; signupToken: string }> {
    const normalizedEmail = normalizeAuthEmail(email);
    await this.authEmailCodeService.verifyCode(normalizedEmail, code);

    const signupToken = this.authTokenService.issueSignupToken(
      { sub: normalizedEmail, verified: true, purpose: 'signup' },
      this.SIGNUP_TTL_SEC,
    );

    return { ok: true, signupToken };
  }
}
