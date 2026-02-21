import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CtgController } from './ctg.controller';
import { CtgService } from './ctg.service';
import { CtgEntity } from './entities/ctg.entity';
import { CtgRepository } from './repositories/ctg.repository';

const ctgDatabaseImports =
  process.env.SKIP_DB === 'true' ? [] : [TypeOrmModule.forFeature([CtgEntity])];

@Module({
  imports: [...ctgDatabaseImports],
  controllers: [CtgController],
  providers: [CtgService, CtgRepository],
  exports: [CtgService, CtgRepository],
})
export class CtgModule {}
