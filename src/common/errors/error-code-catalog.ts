import { AuthResponse } from '../response/auth.response';
import { CommonResponse } from '../response/common.response';
import { CtgResponse } from '../response/ctg.response';
import { ResponseCode } from '../response/response-code';
import { RtnResponse } from '../response/rtn.response';
import { TodoResponse } from '../response/todo.response';

const catalogs = [
  AuthResponse,
  CommonResponse,
  CtgResponse,
  RtnResponse,
  TodoResponse,
] as const;

const errorCodeCatalog = new Map<string, ResponseCode>();

function isResponseCode(value: unknown): value is ResponseCode {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<ResponseCode>;
  return (
    typeof candidate.httpCode === 'number' &&
    typeof candidate.message === 'string'
  );
}

for (const catalog of catalogs) {
  for (const responseCode of Object.values(catalog) as unknown[]) {
    if (!isResponseCode(responseCode)) {
      continue;
    }

    if (!responseCode.errorCode) {
      continue;
    }
    errorCodeCatalog.set(responseCode.errorCode, responseCode);
  }
}

export function findResponseCodeByErrorCode(
  errorCode: string,
): ResponseCode | undefined {
  return errorCodeCatalog.get(errorCode);
}
