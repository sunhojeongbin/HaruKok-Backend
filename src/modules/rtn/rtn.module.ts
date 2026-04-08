import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RtnEntity } from './entities/rtn.entity';
import { RtnRptEntity } from './entities/rtn-rpt.entity';
import { RtnController } from './presentation/rtn.controller';
import { RTN_REPOSITORY } from './application/ports/rtn.repository.port';
import { TypeOrmRtnRepository } from './infrastructure/repositories/typeorm-rtn.repository';
import { UnavailableRtnRepository } from './infrastructure/repositories/unavailable-rtn.repository';
import { CreateRtnUseCase } from './application/use-cases/create-rtn.use-case';
import { UpdateRtnUseCase } from './application/use-cases/update-rtn.use-case';
import { DeleteRtnUseCase } from './application/use-cases/delete-rtn.use-case';
import { ReorderRtnUseCase } from './application/use-cases/reorder-rtn.use-case';
import { GetRtnByIdUseCase } from './application/use-cases/get-rtn-by-id.use-case';
import { GetRtnListUseCase } from './application/use-cases/get-rtn-list.use-case';

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
  providers: [
    CreateRtnUseCase,
    UpdateRtnUseCase,
    DeleteRtnUseCase,
    ReorderRtnUseCase,
    GetRtnByIdUseCase,
    GetRtnListUseCase,
    ...rtnRepositoryProviders,
  ],
  exports: [RTN_REPOSITORY],
})
export class RtnModule {}
