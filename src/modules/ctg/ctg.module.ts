import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtgController } from './presentation/ctg.controller';
import { CreateCtgUseCase } from './application/use-cases/create-ctg.use-case';
import { DeleteCtgUseCase } from './application/use-cases/delete-ctg.use-case';
import { GetCtgByIdUseCase } from './application/use-cases/get-ctg-by-id.use-case';
import { GetCtgListUseCase } from './application/use-cases/get-ctg-list.use-case';
import { ReorderCtgUseCase } from './application/use-cases/reorder-ctg.use-case';
import { UpdateCtgUseCase } from './application/use-cases/update-ctg.use-case';
import { CtgEntity } from './entities/ctg.entity';
import { CTG_CASCADE_REPOSITORY } from './application/ports/ctg-cascade.repository.port';
import { CTG_REPOSITORY } from './application/ports/ctg.repository.port';
import { TypeOrmCtgCascadeRepository } from './infrastructure/repositories/typeorm-ctg-cascade.repository';
import { TypeOrmCtgRepository } from './infrastructure/repositories/typeorm-ctg.repository';
import { UnavailableCtgCascadeRepository } from './infrastructure/repositories/unavailable-ctg-cascade.repository';
import { UnavailableCtgRepository } from './infrastructure/repositories/unavailable-ctg.repository';

/**
 * @description 카테고리 엔티티 TypeORM 등록 설정
 */
const isSkipDb = process.env.SKIP_DB === 'true';
const ctgDatabaseImports = isSkipDb
  ? []
  : [TypeOrmModule.forFeature([CtgEntity])];

const ctgRepositoryProviders: Provider[] = isSkipDb
  ? [{ provide: CTG_REPOSITORY, useClass: UnavailableCtgRepository }]
  : [
      TypeOrmCtgRepository,
      { provide: CTG_REPOSITORY, useExisting: TypeOrmCtgRepository },
    ];

const ctgCascadeRepositoryProviders: Provider[] = isSkipDb
  ? [
      {
        provide: CTG_CASCADE_REPOSITORY,
        useClass: UnavailableCtgCascadeRepository,
      },
    ]
  : [
      TypeOrmCtgCascadeRepository,
      {
        provide: CTG_CASCADE_REPOSITORY,
        useExisting: TypeOrmCtgCascadeRepository,
      },
    ];

/**
 * @description 카테고리 도메인 모듈
 */
@Module({
  imports: [...ctgDatabaseImports],
  controllers: [CtgController],
  providers: [
    CreateCtgUseCase,
    GetCtgListUseCase,
    GetCtgByIdUseCase,
    ReorderCtgUseCase,
    UpdateCtgUseCase,
    DeleteCtgUseCase,
    ...ctgRepositoryProviders,
    ...ctgCascadeRepositoryProviders,
  ],
  exports: [CTG_REPOSITORY, CTG_CASCADE_REPOSITORY],
})
export class CtgModule {}
