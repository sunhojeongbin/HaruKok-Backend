import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsrEntity } from './entities/usr.entity';
import { UsrSocialEntity } from './entities/usr-social.entity';
import { UsrRepository } from './repositories/usr.repository';

const usrDatabaseImports =
  process.env.SKIP_DB === 'true'
    ? []
    : [TypeOrmModule.forFeature([UsrEntity, UsrSocialEntity])];

@Module({
  imports: [...usrDatabaseImports],
  providers: [UsrRepository],
  exports: [UsrRepository],
})
export class UsrModule {}
