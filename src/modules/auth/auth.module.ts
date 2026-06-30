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
import { AuthController } from './presentation/auth.controller';
import { EMAIL_CODE_STORE } from './application/ports/email-code-store.port';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.use-case';
import { UpdatePasswordUseCase } from './application/use-cases/update-password.use-case';
import { VerifyPasswordUseCase } from './application/use-cases/verify-password.use-case';
import { WithdrawUseCase } from './application/use-cases/withdraw.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ResendEmailCodeUseCase } from './application/use-cases/resend-email-code.use-case';
import { RequestEmailChangeUseCase } from './application/use-cases/request-email-change.use-case';
import { ConfirmEmailChangeUseCase } from './application/use-cases/confirm-email-change.use-case';
import { RefreshUseCase } from './application/use-cases/refresh.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { SendEmailCodeUseCase } from './application/use-cases/send-email-code.use-case';
import { SendTemporaryPasswordUseCase } from './application/use-cases/send-temporary-password.use-case';
import { SignupUseCase } from './application/use-cases/signup.use-case';
import { VerifyEmailCodeUseCase } from './application/use-cases/verify-email-code.use-case';
import { RftEntity } from './entities/rft.entity';
import { InMemoryEmailCodeStore } from './infrastructure/stores/in-memory-email-code.store';
import { RedisEmailCodeStore } from './infrastructure/stores/redis-email-code.store';
import { AuthEmailCodeService } from './application/services/auth-email-code.service';
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

const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
const isLocalOrTestEnv =
  nodeEnv === 'development' ||
  nodeEnv === 'dev' ||
  nodeEnv === 'test' ||
  nodeEnv === 'local';

const emailCodeStoreProviders = isLocalOrTestEnv
  ? [
      InMemoryEmailCodeStore,
      {
        provide: EMAIL_CODE_STORE,
        useExisting: InMemoryEmailCodeStore,
      },
    ]
  : [
      RedisEmailCodeStore,
      {
        provide: EMAIL_CODE_STORE,
        useExisting: RedisEmailCodeStore,
      },
    ];

const emailCodeStoreExports = isLocalOrTestEnv
  ? [EMAIL_CODE_STORE, InMemoryEmailCodeStore]
  : [EMAIL_CODE_STORE, RedisEmailCodeStore];

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
    SendEmailCodeUseCase,
    ResendEmailCodeUseCase,
    VerifyEmailCodeUseCase,
    RequestEmailChangeUseCase,
    ConfirmEmailChangeUseCase,
    SendTemporaryPasswordUseCase,
    ResetPasswordUseCase,
    SignupUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    GetUserByIdUseCase,
    UpdatePasswordUseCase,
    VerifyPasswordUseCase,
    WithdrawUseCase,
    AuthTokenService,
    AuthPasswordService,
    ...emailCodeStoreProviders,
    AuthEmailCodeService,
    AuthTemporaryPasswordService,
    AuthFallbackService,
    ...refreshTokenStoreProviders,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [...emailCodeStoreExports],
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
