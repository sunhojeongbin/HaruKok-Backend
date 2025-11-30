import { Module } from '@nestjs/common';
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
    imports: [
        I18nModule.forRoot({
            fallbackLanguage: 'ko',
            loaderOptions: {
                path: path.join(__dirname, '../../../i18n/'),
                watch: true,
            },
            resolvers: [
                { use: QueryResolver, options: ['lang'] },
                AcceptLanguageResolver,
                new HeaderResolver(['x-lang']),
            ],
        }),
    ],
    exports: [I18nModule],
})
export class CustomI18nModule {}
