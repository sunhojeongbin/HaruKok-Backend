import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  // 하드코딩된 사용자 정보
  private readonly USER = {
    email: 'test@gmail.com',
    password: '1234',
    id: 1,
    name: '최정빈',
  };

  /**
   * 로그인 검증
   */
  login(email: string, password: string) {
    if (email === this.USER.email && password === this.USER.password) {
      return {
        id: this.USER.id,
        name: this.USER.name,
      };
    }

    return null;
  }
}
