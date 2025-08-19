// src/core/interfaces/repository.interface.ts
export interface IBaseRepository<T, ID = string> {
    create(entity: Partial<T>): Promise<T>;
    findById(id: ID): Promise<T | null>;
    findAll(options?: FindAllOptions): Promise<PaginatedResult<T>>;
    update(id: ID, updateData: Partial<T>): Promise<T | null>;
    delete(id: ID): Promise<boolean>;
    exists(id: ID): Promise<boolean>;
}

export interface FindAllOptions {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// User Repository 인터페이스
export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User | null>;
    findByUsernameOrEmail(usernameOrEmail: string): Promise<User | null>;
    findActiveUsers(options?: FindAllOptions): Promise<PaginatedResult<User>>;
}

// User 엔티티 인터페이스 (임시)
export interface User {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
