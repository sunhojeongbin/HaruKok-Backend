// src/infrastructure/database/repositories/base.repository.ts
import { Injectable } from '@nestjs/common';
import {
    IBaseRepository,
    FindAllOptions,
    PaginatedResult,
} from '../../../core/interfaces/repository.interface';
import { CustomLoggerService } from '../../../common/services/logger.service';

@Injectable()
export abstract class BaseRepository<T, ID = string> implements IBaseRepository<T, ID> {
    protected abstract entityName: string;

    constructor(protected readonly logger: CustomLoggerService) {}

    abstract create(entity: Partial<T>): Promise<T>;
    abstract findById(id: ID): Promise<T | null>;
    abstract update(id: ID, updateData: Partial<T>): Promise<T | null>;
    abstract delete(id: ID): Promise<boolean>;
    abstract exists(id: ID): Promise<boolean>;

    async findAll(options?: FindAllOptions): Promise<PaginatedResult<T>> {
        const startTime = Date.now();

        try {
            const {
                page = 1,
                limit = 10,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                filters = {},
            } = options || {};

            // 실제 구현은 데이터베이스에 따라 달라집니다
            const result = await this.performFindAll({
                page,
                limit,
                search,
                sortBy,
                sortOrder,
                filters,
            });

            const executionTime = Date.now() - startTime;
            this.logger.log(
                `${this.entityName} findAll completed - ${executionTime}ms`,
                'REPOSITORY',
            );

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.logBusinessError(error as Error, 'REPOSITORY', {
                entityName: this.entityName,
                executionTime,
                options,
            });
            throw error;
        }
    }

    protected abstract performFindAll(
        options: Required<FindAllOptions>,
    ): Promise<PaginatedResult<T>>;

    protected createPaginatedResult<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
    ): PaginatedResult<T> {
        const totalPages = Math.ceil(total / limit);

        return {
            data,
            total,
            page,
            limit,
            totalPages,
        };
    }

    protected validatePaginationParams(page: number, limit: number): void {
        if (page < 1) {
            throw new Error('Page must be greater than 0');
        }

        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }
    }
}
