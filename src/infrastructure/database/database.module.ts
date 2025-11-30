// src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CustomLoggerService } from '../../common/services/logger.service';
import { ConfigModule } from '../config/config.module';

@Module({
    imports: [ConfigModule], // ConfigModule을 import하여 ConfigService 사용 가능하게 함
    providers: [
        CustomLoggerService,
        {
            provide: 'IUserRepository',
            useClass: UserRepository,
        },
    ],
    exports: ['IUserRepository', CustomLoggerService],
})
export class DatabaseModule {}
