import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

const FRIENDLY_UUID_ERROR_MESSAGE =
  '요청한 ID 형식이 올바르지 않아요. 확인 후 다시 시도해 주세요.';

export const UuidParamPipe = new ParseUUIDPipe({
  exceptionFactory: () => new BadRequestException(FRIENDLY_UUID_ERROR_MESSAGE),
});
