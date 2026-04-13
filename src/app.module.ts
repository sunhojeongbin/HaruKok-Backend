import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CtgModule } from './modules/ctg/ctg.module';
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
            const isProduction =
              (config.get<string>('NODE_ENV') ?? 'development') ===
              'production';
            const forceSync = config.get<string>('DB_SYNCHRONIZE') === 'true';

            return {
              type: 'postgres' as const,
              host: config.get<string>('DB_HOST'),
              port: Number(config.get<string>('DB_PORT') ?? 5432),
              username: config.get<string>('DB_USER'),
              password: config.get<string>('DB_PASSWORD'),
              database: config.get<string>('DB_NAME'),
              autoLoadEntities: true,
              synchronize: forceSync || !isProduction,
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
    AuthModule,
    UsrModule,
    CtgModule,
    RtnModule,
    TodoModule,
    ...databaseImports,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
