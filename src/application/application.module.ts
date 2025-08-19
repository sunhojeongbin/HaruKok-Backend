// src/application/application.module.ts
import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [UserService],
    exports: [UserService],
})
export class ApplicationModule {}
