import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetUsrDashboardUseCase } from './application/use-cases/get-usr-dashboard.use-case';
import { UsrFrdEntity } from './entities/usr-frd.entity';
import { UsrEntity } from './entities/usr.entity';
import { UsrSocialEntity } from './entities/usr-social.entity';
import { UsrController } from './presentation/usr.controller';
import { UsrRepository } from './repositories/usr.repository';
import { USR_REPOSITORY } from './repositories/usr.repository.port';
import { UsrSocialRepository } from './repositories/usr-social.repository';
import { USR_SOCIAL_REPOSITORY } from './repositories/usr-social.repository.port';

const usrDatabaseImports =
  process.env.SKIP_DB === 'true'
    ? []
    : [TypeOrmModule.forFeature([UsrEntity, UsrSocialEntity, UsrFrdEntity])];

@Module({
  imports: [...usrDatabaseImports],
  controllers: [UsrController],
  providers: [
    GetUsrDashboardUseCase,
    UsrRepository,
    {
      provide: USR_REPOSITORY,
      useExisting: UsrRepository,
    },
    UsrSocialRepository,
    {
      provide: USR_SOCIAL_REPOSITORY,
      useExisting: UsrSocialRepository,
    },
  ],
  exports: [USR_REPOSITORY, USR_SOCIAL_REPOSITORY],
})
export class UsrModule {}
