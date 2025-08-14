import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

export function createSwaggerAuthMiddleware(configService: ConfigService) {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers['authorization'];
        const expectedToken = `Bearer ${configService.get<string>('SWAGGER_AUTH_TOKEN')}`;

        if (token !== expectedToken) {
            return res
                .status(403)
                .json({ message: 'Forbidden: Invalid Token' });
        }
        next();
    };
}
