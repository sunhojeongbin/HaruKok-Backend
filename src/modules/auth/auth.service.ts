import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';

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

  private CODE_TTL_SEC = 10 * 60;
  private SIGNUP_TTL_SEC = 30 * 60;

  async sendEmailCode(email: string) {
    const code = random6Digits();

    try {
      await this.mail.sendEmailVerificationCode(email, code);
    } catch {
      throw new BadRequestException(
        '메일 발송 실패: SMTP 설정 또는 서버 연결을 확인해주세요.',
      );
    }

    return { ok: true, code };
  }
  verifyEmailCode(email: string, code: string) {
    // 클라이언트가 제공한 코드가 올바른지만 확인
    // 실제 운영에서는 코드를 서버에서 저장해야 함
    if (!code || code.length !== 6) {
      throw new BadRequestException('인증 코드 형식이 올바르지 않습니다.');
    }

    const signupToken = jwt.sign(
      { sub: email, verified: true, purpose: 'signup' },
      process.env.JWT_SECRET ?? 'dev-jwt-secret',
      { expiresIn: this.SIGNUP_TTL_SEC },
    );

    return { ok: true, signupToken };
  }

  assertSignupToken(signupToken: string): string {
    interface SignupPayload {
      sub: string;
      verified: boolean;
      purpose: string;
    }

    let payload: SignupPayload;
    try {
      payload = jwt.verify(
        signupToken,
        process.env.JWT_SECRET ?? 'dev-jwt-secret',
      ) as SignupPayload;
    } catch {
      throw new ForbiddenException('signupToken이 유효하지 않습니다.');
    }

    if (payload?.purpose !== 'signup' || !payload?.sub || !payload?.verified) {
      throw new ForbiddenException('signupToken 형식이 올바르지 않습니다.');
    }

    return payload.sub;
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
