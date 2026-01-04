import { JwtModuleOptions } from '@nestjs/jwt';
import { StringValue } from 'ms';

export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_EXPIRES_IN: StringValue =
  (process.env.JWT_EXPIRES_IN as StringValue) ?? '1h';

export const jwtModuleOptions: JwtModuleOptions = {
  secret: JWT_SECRET,
  signOptions: {
    expiresIn: JWT_EXPIRES_IN,
  },
};
