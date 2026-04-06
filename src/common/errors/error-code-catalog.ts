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

for (const catalog of catalogs) {
  for (const responseCode of Object.values(catalog)) {
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
