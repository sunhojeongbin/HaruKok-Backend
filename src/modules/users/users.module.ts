import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsrEntity } from './entities/usr.entity';
import { UsersRepository } from './repositories/users.repository';

const usersDatabaseImports =
  process.env.SKIP_DB === 'true' ? [] : [TypeOrmModule.forFeature([UsrEntity])];

@Module({
  imports: [...usersDatabaseImports],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
