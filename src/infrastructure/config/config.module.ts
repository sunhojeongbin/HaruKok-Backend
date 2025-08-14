// src/infrastructure/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // 전역 모듈
      envFilePath: [
        path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
        path.resolve(process.cwd(), `.env`),
      ],
    }),
  ],
})
export class ConfigModule {}
