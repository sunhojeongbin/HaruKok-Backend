import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtgController } from './ctg.controller';
import { CtgService } from './ctg.service';
import { CtgEntity } from './entities/ctg.entity';
import {
  CTG_CASCADE_REPOSITORY,
} from './repositories/ctg-cascade.repository.port';
import { TypeOrmCtgCascadeRepository } from './repositories/ctg-cascade.repository';
import { TypeOrmCtgRepository } from './repositories/ctg.repository';
import { CTG_REPOSITORY } from './repositories/ctg.repository.port';
import { UnavailableCtgCascadeRepository } from './repositories/unavailable-ctg-cascade.repository';
import { UnavailableCtgRepository } from './repositories/unavailable-ctg.repository';

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
    CtgService,
    ...ctgRepositoryProviders,
    ...ctgCascadeRepositoryProviders,
  ],
  exports: [CtgService, CTG_REPOSITORY, CTG_CASCADE_REPOSITORY],
})
export class CtgModule {}
