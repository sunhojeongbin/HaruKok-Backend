/** @description 회원가입 토큰 페이로드 */
export type SignupPayload = {
  sub: string;
  verified: boolean;
  purpose: string;
};

/** @description JWT 서명용 사용자 식별 페이로드 */
export type TokenPayload = {
  sub: string;
  email: string;
  jti: string;
};

/** @description 로그인 처리 결과 */
export type LoginResult = {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
};

/** @description 토큰 재발급 처리 결과 */
export type RefreshResult = {
  accessToken: string;
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
};

/** @description 내부 토큰 발급 결과 (jti, 만료일 포함) */
export type IssuedTokenPair = RefreshResult & {
  jti: string;
  refreshTokenExpiresAt: Date;
};

/** @description 사용자 조회 응답 */
export type UserInfo = {
  id: string;
  name: string;
  email: string;
  frdCnt?: number;
};
