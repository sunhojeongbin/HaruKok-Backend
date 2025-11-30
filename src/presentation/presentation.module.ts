import { Module } from '@nestjs/common';
import { TestController } from './controllers/test.controller';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';
import { MonitoringController } from './controllers/monitoring.controller';
import { ApplicationModule } from '../application/application.module';
// import { CommonModule } from '../common/common.module';
import { CommonModule } from 'src/common/common.module';

@Module({
    imports: [ApplicationModule, CommonModule],
    controllers: [TestController, UserController, AuthController, MonitoringController],
})
export class PresentationModule {}
