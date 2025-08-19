// src/infrastructure/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import * as path from 'path';

@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true, // 전역 모듈
            envFilePath: [
                path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
                path.resolve(process.cwd(), `.env`),
            ],
            validate, // 환경 변수 검증 함수 추가
            validationOptions: {
                allowUnknown: true, // 정의되지 않은 환경 변수 허용
                abortEarly: false, // 모든 검증 오류 수집
            },
        }),
    ],
})
export class ConfigModule {}
