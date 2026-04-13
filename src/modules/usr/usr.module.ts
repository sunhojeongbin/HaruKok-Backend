import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GetUsrDashboardUseCase } from './application/use-cases/get-usr-dashboard.use-case';
import { UsrFrdEntity } from './entities/usr-frd.entity';
import { UsrEntity } from './entities/usr.entity';
import { UsrSocialEntity } from './entities/usr-social.entity';
import { UsrController } from './presentation/usr.controller';
import { UsrRepository } from './repositories/usr.repository';
import { USR_REPOSITORY } from './repositories/usr.repository.port';

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
  ],
  exports: [USR_REPOSITORY],
})
export class UsrModule {}
