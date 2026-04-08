import { Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoEntity } from './entities/todo.entity';
import { TODO_REPOSITORY } from './application/ports/todo.repository.port';
import { CreateTodoUseCase } from './application/use-cases/create-todo.use-case';
import { DeleteTodoUseCase } from './application/use-cases/delete-todo.use-case';
import { GetTodoByIdUseCase } from './application/use-cases/get-todo-by-id.use-case';
import { GetTodoListUseCase } from './application/use-cases/get-todo-list.use-case';
import { RepeatTodoNextUseCase } from './application/use-cases/repeat-todo-next.use-case';
import { RepeatTodoTodayUseCase } from './application/use-cases/repeat-todo-today.use-case';
import { RepeatTodoTomorrowUseCase } from './application/use-cases/repeat-todo-tomorrow.use-case';
import { SearchTodosUseCase } from './application/use-cases/search-todos.use-case';
import { UpdateTodoCompletionUseCase } from './application/use-cases/update-todo-completion.use-case';
import { UpdateTodoUseCase } from './application/use-cases/update-todo.use-case';
import { TypeOrmTodoRepository } from './infrastructure/repositories/typeorm-todo.repository';
import { UnavailableTodoRepository } from './infrastructure/repositories/unavailable-todo.repository';
import { TodoController } from './presentation/todo.controller';

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
  providers: [
    CreateTodoUseCase,
    UpdateTodoUseCase,
    UpdateTodoCompletionUseCase,
    RepeatTodoTodayUseCase,
    RepeatTodoTomorrowUseCase,
    RepeatTodoNextUseCase,
    DeleteTodoUseCase,
    SearchTodosUseCase,
    GetTodoByIdUseCase,
    GetTodoListUseCase,
    ...todoRepositoryProviders,
  ],
  exports: [TODO_REPOSITORY],
})
export class TodoModule {}
