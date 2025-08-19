// src/application/dto/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, IsOptional, Length, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @ApiProperty({
        description: '사용자 이메일',
        example: 'user@example.com',
        format: 'email',
    })
    @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
    @IsNotEmpty({ message: '이메일은 필수입니다.' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @ApiProperty({
        description: '사용자명',
        example: 'john_doe',
        minLength: 3,
        maxLength: 30,
    })
    @IsString({ message: '사용자명은 문자열이어야 합니다.' })
    @IsNotEmpty({ message: '사용자명은 필수입니다.' })
    @Length(3, 30, { message: '사용자명은 3~30자 사이여야 합니다.' })
    @Transform(({ value }) => value?.trim())
    username: string;

    @ApiProperty({
        description: '이름',
        example: 'John',
        minLength: 1,
        maxLength: 50,
    })
    @IsString({ message: '이름은 문자열이어야 합니다.' })
    @IsNotEmpty({ message: '이름은 필수입니다.' })
    @Length(1, 50, { message: '이름은 1~50자 사이여야 합니다.' })
    @Transform(({ value }) => value?.trim())
    firstName: string;

    @ApiProperty({
        description: '성',
        example: 'Doe',
        minLength: 1,
        maxLength: 50,
    })
    @IsString({ message: '성은 문자열이어야 합니다.' })
    @IsNotEmpty({ message: '성은 필수입니다.' })
    @Length(1, 50, { message: '성은 1~50자 사이여야 합니다.' })
    @Transform(({ value }) => value?.trim())
    lastName: string;
}

export class UpdateUserDto {
    @ApiProperty({
        description: '사용자 이메일',
        example: 'user@example.com',
        required: false,
        format: 'email',
    })
    @IsOptional()
    @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email?: string;

    @ApiProperty({
        description: '이름',
        example: 'John',
        required: false,
        minLength: 1,
        maxLength: 50,
    })
    @IsOptional()
    @IsString({ message: '이름은 문자열이어야 합니다.' })
    @Length(1, 50, { message: '이름은 1~50자 사이여야 합니다.' })
    @Transform(({ value }) => value?.trim())
    firstName?: string;

    @ApiProperty({
        description: '성',
        example: 'Doe',
        required: false,
        minLength: 1,
        maxLength: 50,
    })
    @IsOptional()
    @IsString({ message: '성은 문자열이어야 합니다.' })
    @Length(1, 50, { message: '성은 1~50자 사이여야 합니다.' })
    @Transform(({ value }) => value?.trim())
    lastName?: string;

    @ApiProperty({
        description: '활성화 상태',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean({ message: '활성화 상태는 boolean 값이어야 합니다.' })
    isActive?: boolean;
}

export class UserResponseDto {
    @ApiProperty({ description: '사용자 ID', example: '1' })
    id: string;

    @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: '사용자명', example: 'john_doe' })
    username: string;

    @ApiProperty({ description: '이름', example: 'John' })
    firstName: string;

    @ApiProperty({ description: '성', example: 'Doe' })
    lastName: string;

    @ApiProperty({ description: '전체 이름', example: 'John Doe' })
    fullName: string;

    @ApiProperty({ description: '활성화 상태', example: true })
    isActive: boolean;

    @ApiProperty({ description: '생성일시', example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ description: '수정일시', example: '2024-01-01T00:00:00.000Z' })
    updatedAt: Date;
}
