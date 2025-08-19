// src/infrastructure/database/database.module.ts
import { Module } from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { CustomLoggerService } from '../../common/services/logger.service';

@Module({
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
