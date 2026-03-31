import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RtnController } from './rtn.controller';
import { RtnService } from './rtn.service';
import { RtnEntity } from './entities/rtn.entity';
import { RtnRptEntity } from './entities/rtn-rpt.entity';
import { TypeOrmRtnRepository } from './repositories/rtn.repository';
import { RTN_REPOSITORY } from './repositories/rtn.repository.port';
import { UnavailableRtnRepository } from './repositories/unavailable-rtn.repository';

const isSkipDb = process.env.SKIP_DB === 'true';
const rtnDatabaseImports = isSkipDb
  ? []
  : [TypeOrmModule.forFeature([RtnEntity, RtnRptEntity])];

const rtnRepositoryProviders: Provider[] = isSkipDb
  ? [{ provide: RTN_REPOSITORY, useClass: UnavailableRtnRepository }]
  : [
      TypeOrmRtnRepository,
      { provide: RTN_REPOSITORY, useExisting: TypeOrmRtnRepository },
    ];

/** @description 루틴 도메인 모듈 */
@Module({
  imports: [...rtnDatabaseImports],
  controllers: [RtnController],
  providers: [RtnService, ...rtnRepositoryProviders],
  exports: [RtnService, RTN_REPOSITORY],
})
export class RtnModule {}
