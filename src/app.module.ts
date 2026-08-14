import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CtgModule } from './modules/ctg/ctg.module';
import { NtfModule } from './modules/ntf/ntf.module';
import { RtnModule } from './modules/rtn/rtn.module';
import { TodoModule } from './modules/todo/todo.module';
import { UsrModule } from './modules/usr/usr.module';

const databaseImports =
  process.env.SKIP_DB === 'true'
    ? []
    : [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const forceSync = config.get<string>('DB_SYNCHRONIZE') === 'true';

            return {
              type: 'postgres' as const,
              host: config.get<string>('DB_HOST'),
              port: Number(config.get<string>('DB_PORT') ?? 5432),
              username: config.get<string>('DB_USER'),
              password: config.get<string>('DB_PASSWORD'),
              database: config.get<string>('DB_NAME'),
              autoLoadEntities: true,
              /**
               * @PrimaryGeneratedColumn('uuid') 가 gen_random_uuid() 를 쓰도록 한다.
               * data-source.ts(CLI) 와 반드시 동일하게 유지할 것 —
               * 어긋나면 migration:generate 가 매번 불필요한 diff 를 만든다.
               */
              uuidExtension: 'pgcrypto' as const,
              /**
               * 스키마 변경은 마이그레이션으로만 반영한다.
               * `npm run migration:generate` / `migration:run` 사용.
               * DB_SYNCHRONIZE=true 를 명시한 경우에만 예외적으로 동기화한다.
               */
              synchronize: forceSync,
            };
          },
        }),
      ];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsrModule,
    CtgModule,
    RtnModule,
    TodoModule,
    NtfModule,
    ...databaseImports,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
