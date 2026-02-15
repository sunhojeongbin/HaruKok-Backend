import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';
import { StringValue } from 'ms';

export function getJwtModuleOptions(config: ConfigService): JwtModuleOptions {
  const secret = config.get<string>('JWT_SECRET');
  if (!secret) {
    throw new Error('JWT_SECRET 환경변수가 필요합니다.');
  }

  const expiresIn = (config.get<string>('JWT_EXPIRES_IN') ??
    '1h') as StringValue;

  return {
    secret,
    signOptions: {
      expiresIn,
    },
  };
}
