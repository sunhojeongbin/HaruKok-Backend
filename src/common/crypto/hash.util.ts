import * as crypto from 'crypto';

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// 이메일+코드+서버시크릿 조합 추천(레인보우 테이블 방지)
export function emailCodeHash(
  email: string,
  code: string,
  secret: string,
): string {
  return sha256(`${email}:${code}:${secret}`);
}
