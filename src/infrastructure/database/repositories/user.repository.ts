// src/infrastructure/database/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import {
    IUserRepository,
    User,
    FindAllOptions,
    PaginatedResult,
} from '../../../core/interfaces/repository.interface';
import { CustomLoggerService } from '../../../common/services/logger.service';

@Injectable()
export class UserRepository extends BaseRepository<User> implements IUserRepository {
    protected entityName = 'User';

    // 임시 메모리 데이터 (실제로는 데이터베이스 연결)
    private users: User[] = [
        {
            id: '1',
            email: 'user1@example.com',
            username: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        },
        {
            id: '2',
            email: 'user2@example.com',
            username: 'user2',
            firstName: 'Jane',
            lastName: 'Smith',
            isActive: true,
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
        },
    ];

    constructor(logger: CustomLoggerService) {
        super(logger);
    }

    async create(userData: Partial<User>): Promise<User> {
        const id = (this.users.length + 1).toString();
        const newUser: User = {
            id,
            email: userData.email!,
            username: userData.username!,
            firstName: userData.firstName!,
            lastName: userData.lastName!,
            isActive: userData.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.users.push(newUser);
        this.logger.log(`User created with ID: ${id}`, 'USER_REPOSITORY');

        return newUser;
    }

    async findById(id: string): Promise<User | null> {
        const user = this.users.find((u) => u.id === id) || null;
        this.logger.debug(
            `User findById: ${id} - ${user ? 'found' : 'not found'}`,
            'USER_REPOSITORY',
        );
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = this.users.find((u) => u.email === email) || null;
        this.logger.debug(
            `User findByEmail: ${email} - ${user ? 'found' : 'not found'}`,
            'USER_REPOSITORY',
        );
        return user;
    }

    async findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null> {
        const user =
            this.users.find((u) => u.username === usernameOrEmail || u.email === usernameOrEmail) ||
            null;

        this.logger.debug(
            `User findByUsernameOrEmail: ${usernameOrEmail} - ${user ? 'found' : 'not found'}`,
            'USER_REPOSITORY',
        );
        return user;
    }

    async findActiveUsers(options?: FindAllOptions): Promise<PaginatedResult<User>> {
        const activeUsers = this.users.filter((u) => u.isActive);

        const {
            page = 1,
            limit = 10,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options || {};

        let filteredUsers = activeUsers;

        // 검색 적용
        if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter(
                (user) =>
                    user.firstName.toLowerCase().includes(searchLower) ||
                    user.lastName.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower) ||
                    user.username.toLowerCase().includes(searchLower),
            );
        }

        // 정렬 적용
        filteredUsers.sort((a, b) => {
            const aValue = a[sortBy as keyof User];
            const bValue = b[sortBy as keyof User];

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // 페이지네이션 적용
        const total = filteredUsers.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        this.logger.log(
            `Active users retrieved - Total: ${total}, Page: ${page}`,
            'USER_REPOSITORY',
        );

        return this.createPaginatedResult(paginatedUsers, total, page, limit);
    }

    async update(id: string, updateData: Partial<User>): Promise<User | null> {
        const userIndex = this.users.findIndex((u) => u.id === id);

        if (userIndex === -1) {
            this.logger.warn(`User update failed - User not found: ${id}`, 'USER_REPOSITORY');
            return null;
        }

        this.users[userIndex] = {
            ...this.users[userIndex],
            ...updateData,
            updatedAt: new Date(),
        };

        this.logger.log(`User updated: ${id}`, 'USER_REPOSITORY');
        return this.users[userIndex];
    }

    async delete(id: string): Promise<boolean> {
        const userIndex = this.users.findIndex((u) => u.id === id);

        if (userIndex === -1) {
            this.logger.warn(`User delete failed - User not found: ${id}`, 'USER_REPOSITORY');
            return false;
        }

        this.users.splice(userIndex, 1);
        this.logger.log(`User deleted: ${id}`, 'USER_REPOSITORY');
        return true;
    }

    async exists(id: string): Promise<boolean> {
        const exists = this.users.some((u) => u.id === id);
        this.logger.debug(`User exists check: ${id} - ${exists}`, 'USER_REPOSITORY');
        return exists;
    }

    protected async performFindAll(
        options: Required<FindAllOptions>,
    ): Promise<PaginatedResult<User>> {
        this.validatePaginationParams(options.page, options.limit);

        let filteredUsers = [...this.users];

        // 검색 적용
        if (options.search) {
            const searchLower = options.search.toLowerCase();
            filteredUsers = filteredUsers.filter(
                (user) =>
                    user.firstName.toLowerCase().includes(searchLower) ||
                    user.lastName.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower) ||
                    user.username.toLowerCase().includes(searchLower),
            );
        }

        // 필터 적용
        if (options.filters) {
            for (const [key, value] of Object.entries(options.filters)) {
                if (value !== undefined && value !== null) {
                    filteredUsers = filteredUsers.filter(
                        (user) => user[key as keyof User] === value,
                    );
                }
            }
        }

        // 정렬 적용
        filteredUsers.sort((a, b) => {
            const aValue = a[options.sortBy as keyof User];
            const bValue = b[options.sortBy as keyof User];

            if (options.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        // 페이지네이션 적용
        const total = filteredUsers.length;
        const startIndex = (options.page - 1) * options.limit;
        const endIndex = startIndex + options.limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        return this.createPaginatedResult(paginatedUsers, total, options.page, options.limit);
    }
}
