import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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
}
