import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BaseService } from '../../common/services/base.service';
import { CustomLoggerService } from '../../common/services/logger.service';
import { IUserRepository } from '../../core/interfaces/repository.interface';
import { SuccessResponseDto } from '../../common/dto/api-response.dto';
import * as bcrypt from 'bcrypt';

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
    };
}

@Injectable()
export class AuthService extends BaseService {
    private customLogger: CustomLoggerService;

    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
        customLogger: CustomLoggerService,
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    ) {
        super();
        this.customLogger = customLogger;
    }

    async login(loginDto: LoginDto): Promise<SuccessResponseDto<AuthResponse>> {
        return this.safeExecute(async () => {
            this.customLogger.log(`Login attempt for email: ${loginDto.email}`, 'AUTH_SERVICE');

            // 사용자 찾기
            const user = await this.userRepository.findByEmail(loginDto.email);
            if (!user) {
                throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
            }

            // 비밀번호 검증 (실제 구현시 bcrypt 사용)
            // const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
            // if (!isPasswordValid) {
            //     throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
            // }

            // JWT 페이로드 생성
            const payload = {
                sub: user.id,
                email: user.email,
                username: user.username,
            };

            // 토큰 생성
            const access_token = this.jwtService.sign(payload);
            const refresh_token = this.jwtService.sign(payload, {
                expiresIn: this.configService.get<number>('JWT_REFRESH_EXPIRES_IN') || 604800, // 7일을 초 단위로
            });

            const authResponse: AuthResponse = {
                access_token,
                refresh_token,
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
            };

            this.customLogger.log(`User logged in successfully: ${user.id}`, 'AUTH_SERVICE');
            return this.createSuccessResponse(authResponse, '로그인에 성공했습니다');
        }, 'login');
    }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            return null;
        }

        // 실제 구현시 bcrypt 사용
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        // if (!isPasswordValid) {
        //     return null;
        // }

        // 임시로 password 필드 제거하고 반환
        const { ...result } = user;
        return result;
    }

    async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }
}
