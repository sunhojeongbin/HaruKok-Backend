import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoEntity } from './entities/todo.entity';
import { TodoController } from './todo.controller';
import { TODO_REPOSITORY } from './repositories/todo.repository.port';
import { TypeOrmTodoRepository } from './repositories/todo.repository';
import { UnavailableTodoRepository } from './repositories/unavailable-todo.repository';
import { TodoService } from './todo.service';

const isSkipDb = process.env.SKIP_DB === 'true';
const todoDatabaseImports = isSkipDb
  ? []
  : [TypeOrmModule.forFeature([TodoEntity])];

const todoRepositoryProviders: Provider[] = isSkipDb
  ? [{ provide: TODO_REPOSITORY, useClass: UnavailableTodoRepository }]
  : [
      TypeOrmTodoRepository,
      { provide: TODO_REPOSITORY, useExisting: TypeOrmTodoRepository },
    ];

/** @description 투두 도메인 모듈 */
@Module({
  imports: [...todoDatabaseImports],
  controllers: [TodoController],
  providers: [TodoService, ...todoRepositoryProviders],
  exports: [TodoService, TODO_REPOSITORY],
})
export class TodoModule {}
