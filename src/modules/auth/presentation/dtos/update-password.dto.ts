import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({ description: '현재 비밀번호' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  currentPassword: string;

  @ApiProperty({ description: '새 비밀번호 (영문·숫자·특수문자 각 1자 이상, 8~20자)' })
  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상 입력해 주세요' })
  @MaxLength(20, { message: '비밀번호는 20자 이하로 입력해 주세요' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z\d])/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 각 1자 이상 포함해야 합니다',
  })
  newPassword: string;
}
