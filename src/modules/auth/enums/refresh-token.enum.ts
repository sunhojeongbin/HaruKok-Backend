/** 토큰 폐기 사유 */
export enum RevokeReason {
  /** 사용자 직접 로그아웃 */
  LOGOUT = 'LOGOUT',
  /** 비밀번호 변경으로 인한 강제 폐기 */
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  /** 비정상 접근 감지로 인한 강제 폐기 */
  SUSPICIOUS = 'SUSPICIOUS',
  /** 만료 시간 초과 */
  EXPIRED = 'EXPIRED',
  /** 동일 계정 재로그인으로 인한 기존 토큰 교체 */
  RE_LOGIN = 'RE_LOGIN',
}

/** 로그인 기기 유형 */
export enum DeviceType {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}
