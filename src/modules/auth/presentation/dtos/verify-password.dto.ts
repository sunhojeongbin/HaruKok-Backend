import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyPasswordDto {
  @ApiProperty({ description: '확인할 비밀번호' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  password: string;
}
