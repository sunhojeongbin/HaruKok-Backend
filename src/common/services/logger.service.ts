// src/common/services/logger.service.ts
import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomLoggerService implements LoggerService {
    private logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

    constructor(private readonly configService: ConfigService) {
        // 환경에 따른 로그 레벨 설정
        const nodeEnv = this.configService.get<string>('NODE_ENV');
        if (nodeEnv === 'production') {
            this.logLevels = ['error', 'warn', 'log'];
        } else if (nodeEnv === 'test') {
            this.logLevels = ['error'];
        }
    }

    log(message: any, context?: string) {
        this.printMessage(message, 'LOG', context);
    }

    error(message: any, trace?: string, context?: string) {
        this.printMessage(message, 'ERROR', context);
        if (trace) {
            console.trace(trace);
        }
    }

    warn(message: any, context?: string) {
        this.printMessage(message, 'WARN', context);
    }

    debug(message: any, context?: string) {
        if (this.logLevels.includes('debug')) {
            this.printMessage(message, 'DEBUG', context);
        }
    }

    verbose(message: any, context?: string) {
        if (this.logLevels.includes('verbose')) {
            this.printMessage(message, 'VERBOSE', context);
        }
    }

    private printMessage(message: any, level: string, context?: string) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? `[${context}] ` : '';
        const levelStr = `[${level}]`;

        console.log(`${timestamp} ${levelStr} ${contextStr}${message}`);
    }

    /**
     * HTTP 요청 로깅
     */
    logHttpRequest(method: string, url: string, statusCode: number, responseTime: number) {
        const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;
        this.log(message, 'HTTP');
    }

    /**
     * 데이터베이스 쿼리 로깅
     */
    logDatabaseQuery(query: string, executionTime: number) {
        const message = `Query executed in ${executionTime}ms: ${query}`;
        this.debug(message, 'DATABASE');
    }

    /**
     * 비즈니스 로직 에러 로깅
     */
    logBusinessError(error: Error, context: string, additionalInfo?: any) {
        const message = `Business error in ${context}: ${error.message}`;
        this.error(message, error.stack, 'BUSINESS');

        if (additionalInfo) {
            this.debug(`Additional info: ${JSON.stringify(additionalInfo)}`, 'BUSINESS');
        }
    }
}
