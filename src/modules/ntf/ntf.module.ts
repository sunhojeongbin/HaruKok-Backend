import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoModule } from '../todo/todo.module';
import { UsrModule } from '../usr/usr.module';
import { NTF_TOKEN_REPOSITORY } from './application/ports/ntf-token.repository.port';
import { PUSH_SENDER } from './application/ports/push-sender.port';
import { RegisterNtfTokenUseCase } from './application/use-cases/register-ntf-token.use-case';
import { RemoveNtfTokenUseCase } from './application/use-cases/remove-ntf-token.use-case';
import { SendDailyTodoSummaryUseCase } from './application/use-cases/send-daily-todo-summary.use-case';
import { SendSamplePushUseCase } from './application/use-cases/send-sample-push.use-case';
import { NtfTokenEntity } from './entities/ntf-token.entity';
import { createPushSender } from './infrastructure/push/firebase-admin.provider';
import { TypeOrmNtfTokenRepository } from './infrastructure/repositories/typeorm-ntf-token.repository';
import { UnavailableNtfTokenRepository } from './infrastructure/repositories/unavailable-ntf-token.repository';
import { DailyTodoSummaryScheduler } from './infrastructure/scheduler/daily-todo-summary.scheduler';
import { NtfController } from './presentation/ntf.controller';

const isSkipDb = process.env.SKIP_DB === 'true';

const ntfDatabaseImports = isSkipDb
  ? []
  : [TypeOrmModule.forFeature([NtfTokenEntity])];

const ntfRepositoryProviders: Provider[] = isSkipDb
  ? [{ provide: NTF_TOKEN_REPOSITORY, useClass: UnavailableNtfTokenRepository }]
  : [
      TypeOrmNtfTokenRepository,
      { provide: NTF_TOKEN_REPOSITORY, useExisting: TypeOrmNtfTokenRepository },
    ];

const pushSenderProvider: Provider = {
  provide: PUSH_SENDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => createPushSender(config),
};

// 스케줄러는 DB가 있을 때만 동작한다.
const schedulerProviders: Provider[] = isSkipDb
  ? []
  : [DailyTodoSummaryScheduler];

/** @description 알림(FCM 푸시) 도메인 모듈 */
@Module({
  imports: [UsrModule, TodoModule, ...ntfDatabaseImports],
  controllers: [NtfController],
  providers: [
    RegisterNtfTokenUseCase,
    RemoveNtfTokenUseCase,
    SendDailyTodoSummaryUseCase,
    SendSamplePushUseCase,
    pushSenderProvider,
    ...ntfRepositoryProviders,
    ...schedulerProviders,
  ],
  exports: [NTF_TOKEN_REPOSITORY],
})
export class NtfModule {}
