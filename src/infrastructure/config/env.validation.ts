// src/infrastructure/config/env.validation.ts
import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, validateSync, IsOptional } from 'class-validator';

enum Environment {
    DEVELOPMENT = 'development',
    PRODUCTION = 'production',
    TEST = 'test',
}

export class EnvVariables {
    @IsEnum(Environment)
    NODE_ENV: Environment;

    @IsNumber()
    @Transform(({ value }) => parseInt(value, 10))
    PORT: number;

    @IsString()
    @IsOptional()
    SWAGGER_AUTH_TOKEN?: string;

    @IsString()
    @IsOptional()
    DB_HOST?: string;

    @IsNumber()
    @IsOptional()
    @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
    DB_PORT?: number;

    @IsString()
    @IsOptional()
    DB_USER?: string;

    @IsString()
    @IsOptional()
    DB_PASS?: string;

    @IsString()
    @IsOptional()
    DB_NAME?: string;

    @IsString()
    @IsOptional()
    KAFKA_BROKER?: string;
}

export function validate(config: Record<string, unknown>) {
    const validatedConfig = plainToInstance(EnvVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validatedConfig, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(
            `Environment variable validation failed:\n${errors
                .map((error) => Object.values(error.constraints || {}).join(', '))
                .join('\n')}`,
        );
    }

    return validatedConfig;
}
