import {
  ExecutionContext,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';

type AuthenticatedRequest = {
  user?: {
    userId?: string;
  };
};

/** @description 인증 컨텍스트에서 현재 사용자 ID를 추출한다. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
    return userId;
  },
);
