// src/application/application.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
    imports: [
        DatabaseModule,
        ConfigModule, // ConfigService를 위해 필요
        JwtModule, // AppModule에서 이미 설정된 JwtModule을 재사용
    ],
    providers: [UserService, AuthService],
    exports: [UserService, AuthService],
})
export class ApplicationModule {}
