import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './infrastructure/config/config.module';
import { PresentationModule } from './presentation/presentation.module';

/**
 * @description 애플리케이션 모듈
 */
@Module({
    imports: [
        ConfigModule, // 환경 설정 모듈
        PresentationModule, // 프레젠테이션 모듈
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
