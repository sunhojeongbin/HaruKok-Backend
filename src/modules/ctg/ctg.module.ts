import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtgController } from './ctg.controller';
import { CtgService } from './ctg.service';
import { CtgEntity } from './entities/ctg.entity';
import { CtgRepository } from './repositories/ctg.repository';

/**
 * @description 카테고리 엔티티 TypeORM 등록 설정
 */
const ctgDatabaseImports =
  process.env.SKIP_DB === 'true' ? [] : [TypeOrmModule.forFeature([CtgEntity])];

/**
 * @description 카테고리 도메인 모듈
 */
@Module({
  imports: [...ctgDatabaseImports],
  controllers: [CtgController],
  providers: [CtgService, CtgRepository],
  exports: [CtgService, CtgRepository],
})
export class CtgModule {}
