import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, Repository } from 'typeorm';
import { CtgEntity } from '../../ctg/entities/ctg.entity';
import { TodoEntity } from '../entities/todo.entity';
import { CreateTodoParams, TodoRepositoryPort } from './todo.repository.port';

/** @description TypeORM 기반 투두 저장소 */
@Injectable()
export class TypeOrmTodoRepository implements TodoRepositoryPort {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly repository: Repository<TodoEntity>,
  ) {}

  /** @description 사용자 소유의 활성 카테고리인지 확인 */
  async isCategoryOwnedByUser(usrId: string, ctgId: string): Promise<boolean> {
    const category = await this.repository.manager
      .getRepository(CtgEntity)
      .findOne({
        where: {
          ctgId,
          usrId,
          isDeleted: false,
        },
      });
    return Boolean(category);
  }

  /** @description 투두 ID와 사용자 ID로 활성 투두 단건을 조회 */
  findByIdAndUser(todoId: string, usrId: string): Promise<TodoEntity | null> {
    return this.repository.findOne({
      where: {
        todoId,
        usrId,
        isDeleted: false,
      },
    });
  }

  /** @description 트랜잭션 매니저 기준으로 투두를 생성하고 같은 날짜 내 정렬 순서를 부여하여 저장 */
  private async createAndSaveWithManager(
    manager: EntityManager,
    params: CreateTodoParams,
  ): Promise<TodoEntity> {
    const raw = await manager
      .createQueryBuilder(TodoEntity, 'todo')
      .select('MAX(todo.sort_order)', 'maxSortOrder')
      .where('todo.usr_id = :usrId', { usrId: params.usrId })
      .andWhere('todo.todo_date = :todoDate', { todoDate: params.todoDate })
      .andWhere('todo.is_deleted = false')
      .getRawOne<{ maxSortOrder: string | null }>();

    const nextSortOrder =
      raw?.maxSortOrder !== null && raw?.maxSortOrder !== undefined
        ? Number(raw.maxSortOrder) + 1
        : 0;

    const todo = manager.create(TodoEntity, {
      ...params,
      sortOrder: nextSortOrder,
    });

    return manager.save(TodoEntity, todo);
  }

  /** @description 투두를 생성하고 같은 날짜 내 정렬 순서를 부여하여 저장 */
  async createAndSave(params: CreateTodoParams): Promise<TodoEntity> {
    return this.repository.manager.transaction((manager) =>
      this.createAndSaveWithManager(manager, params),
    );
  }

  /** @description 투두 여러 건을 하나의 트랜잭션으로 생성 저장 */
  async createAndSaveMany(paramsList: CreateTodoParams[]): Promise<TodoEntity[]> {
    if (paramsList.length === 0) {
      return [];
    }

    return this.repository.manager.transaction(async (manager) => {
      const savedTodos: TodoEntity[] = [];
      for (const params of paramsList) {
        const savedTodo = await this.createAndSaveWithManager(manager, params);
        savedTodos.push(savedTodo);
      }
      return savedTodos;
    });
  }

  /** @description 투두 엔티티 단건을 저장 */
  save(todo: TodoEntity): Promise<TodoEntity> {
    return this.repository.save(todo);
  }

  /** @description 투두 완료 상태를 원자적으로 토글하고 변경된 투두를 반환 */
  async toggleCompletionByIdAndUser(
    todoId: string,
    usrId: string,
  ): Promise<TodoEntity | null> {
    return this.repository.manager.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .update(TodoEntity)
        .set({
          isCompleted: () => 'NOT "is_completed"',
          completedAt: () =>
            'CASE WHEN NOT "is_completed" THEN NOW() ELSE NULL END',
        })
        .where('todo_id = :todoId', { todoId })
        .andWhere('usr_id = :usrId', { usrId })
        .andWhere('is_deleted = false')
        .execute();

      if (!result.affected) {
        return null;
      }

      return manager.findOne(TodoEntity, {
        where: {
          todoId,
          usrId,
          isDeleted: false,
        },
      });
    });
  }

  /** @description 투두를 소프트 삭제 */
  async softDeleteByIdAndUser(todoId: string, usrId: string): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .update(TodoEntity)
      .set({
        isDeleted: true,
        deletedAt: () => 'NOW()',
      })
      .where('todo_id = :todoId', { todoId })
      .andWhere('usr_id = :usrId', { usrId })
      .andWhere('is_deleted = false')
      .execute();

    return (result.affected ?? 0) > 0;
  }

  /** @description 사용자/월 조건으로 투두 목록 조회 */
  findByUserAndMonth(
    usrId: string,
    startDate: string,
    endDate: string,
  ): Promise<TodoEntity[]> {
    return this.repository.find({
      where: {
        usrId,
        isDeleted: false,
        todoDate: Between(startDate, endDate),
      },
      order: {
        todoDate: 'ASC',
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }
}
