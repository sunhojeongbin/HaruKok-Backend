/** @description 이메일 문자열을 인증 도메인 표준 형식으로 정규화한다. */
export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** @description 사용자 이름 문자열의 앞뒤 공백을 제거한다. */
export function normalizeAuthName(name: string): string {
  return name.trim();
}
