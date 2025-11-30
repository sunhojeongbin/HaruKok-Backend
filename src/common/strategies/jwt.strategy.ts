import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
    sub: string;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
        });
    }

    async validate(payload: JwtPayload) {
        if (!payload.sub || !payload.email) {
            throw new UnauthorizedException('유효하지 않은 토큰입니다');
        }

        return {
            id: payload.sub,
            email: payload.email,
            username: payload.username,
        };
    }
}
