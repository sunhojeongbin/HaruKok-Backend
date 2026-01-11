/** @description API 응답 코드 인터페이스 */
export interface ResponseCode {
  httpCode: number;
  message: string;
  errorCode?: string;
}
