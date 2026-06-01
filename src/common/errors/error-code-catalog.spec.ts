import { findResponseCodeByErrorCode } from './error-code-catalog';
import { AuthResponse } from '../response/auth.response';
import { CommonResponse } from '../response/common.response';
import { CtgResponse } from '../response/ctg.response';
import { RtnResponse } from '../response/rtn.response';
import { TodoResponse } from '../response/todo.response';
import { AuthErrorCode } from '../../modules/auth/errors/auth-error-code';
import { CtgErrorCode } from '../../modules/ctg/errors/ctg-error-code';
import { RtnErrorCode } from '../../modules/rtn/errors/rtn-error-code';
import { TodoErrorCode } from '../../modules/todo/errors/todo-error-code';

type ResponseLike = {
  httpCode: number;
  message: string;
  errorCode?: string;
};

const responseCatalogs = [
  AuthResponse,
  CommonResponse,
  CtgResponse,
  RtnResponse,
  TodoResponse,
] as const;

function collectResponseCodesWithErrorCode(): ResponseLike[] {
  return responseCatalogs.flatMap((catalog) =>
    Object.values(catalog).filter((value): value is ResponseLike => {
      if (!value || typeof value !== 'object') {
        return false;
      }

      const candidate = value as Record<string, unknown>;
      return (
        typeof candidate.httpCode === 'number' &&
        typeof candidate.message === 'string' &&
        typeof candidate.errorCode === 'string'
      );
    }),
  );
}

describe('ErrorCode Catalog Contract', () => {
  it('모든 도메인 ErrorCode가 Response catalog에 정의되어 있어야 한다', () => {
    const responseErrorCodes = new Set(
      collectResponseCodesWithErrorCode().map((response) => response.errorCode),
    );
    const domainErrorCodes = [
      ...Object.values(AuthErrorCode),
      ...Object.values(CtgErrorCode),
      ...Object.values(RtnErrorCode),
      ...Object.values(TodoErrorCode),
    ];

    for (const errorCode of domainErrorCodes) {
      expect(responseErrorCodes.has(errorCode)).toBe(true);
    }
  });

  it('Response catalog의 errorCode는 error-code-catalog으로 조회 가능해야 한다', () => {
    const responses = collectResponseCodesWithErrorCode();

    for (const response of responses) {
      expect(response.errorCode).toBeDefined();
      const resolved = findResponseCodeByErrorCode(response.errorCode!);
      expect(resolved).toBeDefined();
      expect(resolved?.message).toBe(response.message);
      expect(resolved?.httpCode).toBe(response.httpCode);
    }
  });
});
