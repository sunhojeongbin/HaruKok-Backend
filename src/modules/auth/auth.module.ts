import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { getJwtModuleOptions } from '../../config/jwt.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RftEntity } from './entities/rft.entity';
import { AuthEmailCodeService } from './services/auth-email-code.service';
import { AuthFallbackService } from './services/auth-fallback.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthTemporaryPasswordService } from './services/auth-temporary-password.service';
import { AuthRefreshTokenStoreService } from './services/rft-store.service';
import { AuthTokenService } from './services/auth-token.service';
import { DbAuthRefreshTokenStoreService } from './services/db-rft-store.service';
import { InMemoryAuthRefreshTokenStoreService } from './services/memory-rft-store.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
import { UsrModule } from '../usr/usr.module';
import { RefreshTokenCookieMiddleware } from './middlewares/refresh-token-cookie.middleware';

const authDatabaseImports =
  process.env.SKIP_DB === 'true' ? [] : [TypeOrmModule.forFeature([RftEntity])];

const refreshTokenStoreProviders =
  process.env.SKIP_DB === 'true'
    ? [
        InMemoryAuthRefreshTokenStoreService,
        {
          provide: AuthRefreshTokenStoreService,
          useExisting: InMemoryAuthRefreshTokenStoreService,
        },
      ]
    : [
        DbAuthRefreshTokenStoreService,
        {
          provide: AuthRefreshTokenStoreService,
          useExisting: DbAuthRefreshTokenStoreService,
        },
      ];

/**
 * @description 인증 도메인 모듈
 */
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => getJwtModuleOptions(config),
    }),
    MailModule,
    UsrModule,
    ...authDatabaseImports,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokenService,
    AuthPasswordService,
    AuthEmailCodeService,
    AuthTemporaryPasswordService,
    AuthFallbackService,
    ...refreshTokenStoreProviders,
    JwtStrategy,
    JwtAuthGuard,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RefreshTokenCookieMiddleware)
      .forRoutes(
        { path: 'auth/refresh', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.POST },
      );
  }
}
