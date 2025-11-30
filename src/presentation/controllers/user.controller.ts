// src/presentation/controllers/user.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe,
    ValidationPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../../application/services/user.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../../application/dto/user.dto';
import { SuccessResponseDto } from '../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../common/decorators/user.decorator';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth() // Swagger에서 Bearer 토큰 인증 표시
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @ApiOperation({ summary: '모든 사용자 조회' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수' })
    @ApiQuery({ name: 'search', required: false, type: String, description: '검색어' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: '정렬 기준' })
    @ApiQuery({
        name: 'sortOrder',
        required: false,
        enum: ['asc', 'desc'],
        description: '정렬 순서',
    })
    @ApiResponse({
        status: 200,
        description: '사용자 목록 조회 성공',
        type: SuccessResponseDto<any>,
    })
    async getAllUsers(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ): Promise<SuccessResponseDto<any>> {
        const options = {
            page: page || 1,
            limit: limit || 10,
            search,
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc',
        };
        return await this.userService.getAllUsers(options);
    }

    @Get('active')
    @ApiOperation({ summary: '활성 사용자 조회' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수' })
    @ApiQuery({ name: 'search', required: false, type: String, description: '검색어' })
    @ApiResponse({
        status: 200,
        description: '활성 사용자 목록 조회 성공',
        type: SuccessResponseDto<any>,
    })
    async getActiveUsers(
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
    ): Promise<SuccessResponseDto<any>> {
        const options = {
            page: page || 1,
            limit: limit || 10,
            search,
        };
        return await this.userService.getActiveUsers(options);
    }

    @Get('profile')
    @ApiOperation({ summary: '현재 사용자 프로필 조회' })
    @ApiResponse({
        status: 200,
        description: '사용자 프로필 조회 성공',
        type: SuccessResponseDto<UserResponseDto>,
    })
    @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
    async getProfile(@User() user: any): Promise<SuccessResponseDto<UserResponseDto>> {
        return await this.userService.getUserById(user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: '사용자 단건 조회' })
    @ApiResponse({
        status: 200,
        description: '사용자 조회 성공',
        type: SuccessResponseDto<UserResponseDto>,
    })
    @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
    @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
    async getUserById(@Param('id') id: string): Promise<SuccessResponseDto<UserResponseDto>> {
        return await this.userService.getUserById(id);
    }

    @Post()
    @Public() // 회원가입은 인증 없이 접근 가능
    @ApiOperation({ summary: '사용자 생성 (회원가입)' })
    @ApiResponse({
        status: 201,
        description: '사용자 생성 성공',
        type: SuccessResponseDto<UserResponseDto>,
    })
    @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
    @ApiResponse({ status: 409, description: '이미 존재하는 사용자' })
    async createUser(
        @Body(ValidationPipe) createUserDto: CreateUserDto,
    ): Promise<SuccessResponseDto<UserResponseDto>> {
        return await this.userService.createUser(createUserDto);
    }

    @Put(':id')
    @ApiOperation({ summary: '사용자 정보 수정' })
    @ApiResponse({
        status: 200,
        description: '사용자 수정 성공',
        type: SuccessResponseDto<UserResponseDto>,
    })
    @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
    @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
    @ApiResponse({ status: 409, description: '이메일 중복' })
    async updateUser(
        @Param('id') id: string,
        @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    ): Promise<SuccessResponseDto<UserResponseDto>> {
        return await this.userService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: '사용자 삭제' })
    @ApiResponse({
        status: 200,
        description: '사용자 삭제 성공',
        type: SuccessResponseDto<null>,
    })
    @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
    async deleteUser(@Param('id') id: string): Promise<SuccessResponseDto<null>> {
        return await this.userService.deleteUser(id);
    }
}
