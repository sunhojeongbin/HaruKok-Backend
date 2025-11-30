// src/application/services/user.service.ts
import {
    Injectable,
    NotFoundException,
    ConflictException,
    Inject,
    UseGuards,
} from '@nestjs/common';
import { BaseService } from '../../common/services/base.service';
import { IUserRepository, User, FindAllOptions } from '../../core/interfaces/repository.interface';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto/user.dto';
import { ApiResponseDto, SuccessResponseDto } from '../../common/dto/api-response.dto';
import { CustomLoggerService } from '../../common/services/logger.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class UserService extends BaseService {
    private customLogger: CustomLoggerService;

    constructor(
        customLogger: CustomLoggerService,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    ) {
        super();
        this.customLogger = customLogger;
    }

    async createUser(createUserDto: CreateUserDto): Promise<SuccessResponseDto<UserResponseDto>> {
        return this.safeExecute(async () => {
            this.customLogger.log(
                `Creating user with email: ${createUserDto.email}`,
                'USER_SERVICE',
            );

            // 이메일 중복 체크
            const existingUser = await this.userRepository.findByEmail(createUserDto.email);
            if (existingUser) {
                throw new ConflictException('사용자가 이미 존재합니다.');
            }

            // 사용자명 중복 체크
            const existingUsername = await this.userRepository.findByUsernameOrEmail(
                createUserDto.username,
            );
            if (existingUsername) {
                throw new ConflictException('사용자명이 이미 존재합니다.');
            }

            const user = await this.userRepository.create({
                email: createUserDto.email,
                username: createUserDto.username,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                isActive: true,
            });

            const userResponse = this.mapToUserResponseDto(user);

            this.customLogger.log(`User created successfully: ${user.id}`, 'USER_SERVICE');
            return this.createSuccessResponse(userResponse, '사용자가 성공적으로 생성되었습니다.');
        }, 'createUser');
    }

    async getUserById(id: string): Promise<SuccessResponseDto<UserResponseDto>> {
        return this.safeExecute(async () => {
            this.customLogger.log(`Fetching user by ID: ${id}`, 'USER_SERVICE');

            const user = await this.userRepository.findById(id);
            if (!user) {
                throw new NotFoundException('사용자를 찾을 수 없습니다.');
            }

            const userResponse = this.mapToUserResponseDto(user);
            return this.createSuccessResponse(
                userResponse,
                '사용자 정보를 성공적으로 조회했습니다.',
            );
        }, 'getUserById');
    }

    // @UseGuards(JwtAuthGuard)
    async getAllUsers(options?: FindAllOptions): Promise<SuccessResponseDto<any>> {
        return this.safeExecute(async () => {
            this.customLogger.log('Fetching all users', 'USER_SERVICE');

            const result = await this.userRepository.findAll(options);

            const responseData = {
                users: result.data.map((user) => this.mapToUserResponseDto(user)),
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            };

            return this.createSuccessResponse(
                responseData,
                '사용자 목록을 성공적으로 조회했습니다.',
            );
        }, 'getAllUsers');
    }

    async getActiveUsers(options?: FindAllOptions): Promise<SuccessResponseDto<any>> {
        return this.safeExecute(async () => {
            this.customLogger.log('Fetching active users', 'USER_SERVICE');

            const result = await this.userRepository.findActiveUsers(options);

            const responseData = {
                users: result.data.map((user) => this.mapToUserResponseDto(user)),
                pagination: {
                    total: result.total,
                    page: result.page,
                    limit: result.limit,
                    totalPages: result.totalPages,
                },
            };

            return this.createSuccessResponse(
                responseData,
                '활성 사용자 목록을 성공적으로 조회했습니다.',
            );
        }, 'getActiveUsers');
    }

    async updateUser(
        id: string,
        updateUserDto: UpdateUserDto,
    ): Promise<SuccessResponseDto<UserResponseDto>> {
        return this.safeExecute(async () => {
            this.customLogger.log(`Updating user: ${id}`, 'USER_SERVICE');

            // 사용자 존재 확인
            const existingUser = await this.userRepository.findById(id);
            if (!existingUser) {
                throw new NotFoundException('사용자를 찾을 수 없습니다.');
            }

            // 이메일 중복 체크 (다른 사용자와)
            if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
                const userWithEmail = await this.userRepository.findByEmail(updateUserDto.email);
                if (userWithEmail && userWithEmail.id !== id) {
                    throw new ConflictException('해당 이메일을 사용하는 다른 사용자가 있습니다.');
                }
            }

            const updatedUser = await this.userRepository.update(id, updateUserDto);
            if (!updatedUser) {
                throw new Error('사용자 업데이트에 실패했습니다.');
            }

            const userResponse = this.mapToUserResponseDto(updatedUser);

            this.customLogger.log(`User updated successfully: ${id}`, 'USER_SERVICE');
            return this.createSuccessResponse(
                userResponse,
                '사용자 정보가 성공적으로 업데이트되었습니다.',
            );
        }, 'updateUser');
    }

    async deleteUser(id: string): Promise<SuccessResponseDto<null>> {
        return this.safeExecute(async () => {
            this.customLogger.log(`Deleting user: ${id}`, 'USER_SERVICE');

            const userExists = await this.userRepository.exists(id);
            if (!userExists) {
                throw new NotFoundException('사용자를 찾을 수 없습니다.');
            }

            const deleted = await this.userRepository.delete(id);
            if (!deleted) {
                throw new Error('사용자 삭제에 실패했습니다.');
            }

            this.customLogger.log(`User deleted successfully: ${id}`, 'USER_SERVICE');
            return this.createSuccessResponse(null, '사용자가 성공적으로 삭제되었습니다.');
        }, 'deleteUser');
    }

    private mapToUserResponseDto(user: User): UserResponseDto {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
