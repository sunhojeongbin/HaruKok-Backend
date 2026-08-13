import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * @description TypeORM CLI 전용 DataSource.
 *
 *              애플리케이션 런타임은 `AppModule` 의 `TypeOrmModule.forRootAsync` 를 사용하고,
 *              이 파일은 `migration:generate` / `migration:run` / `migration:revert` 에만 쓰인다.
 *
 *              CLI 는 NestJS 컨테이너를 거치지 않으므로 ConfigService 대신 process.env 를 직접 읽는다.
 *              dotenv/config 는 `.env` 만 로드하므로, 환경별 파일을 쓰려면
 *              `DOTENV_CONFIG_PATH=.env.development npm run migration:run` 처럼 지정하거나
 *              셸에서 DB_* 변수를 직접 export 한다.
 *
 * @example
 * ```bash
 * npm run migration:run
 * npm run migration:revert
 * npm run migration:generate -- src/database/migrations/AddSomething
 * ```
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
  /**
   * @PrimaryGeneratedColumn('uuid') 의 기본값 생성 함수를 결정한다.
   * 'pgcrypto' 지정 시 gen_random_uuid() 를, 미지정 시 uuid_generate_v4() 를 사용한다.
   * gen_random_uuid() 는 PostgreSQL 13+ 코어 내장이라 pgcrypto 확장 설치가
   * 실패해도(권한 부족 등) 정상 동작한다.
   */
  uuidExtension: 'pgcrypto',
  /** 마이그레이션 체계에서는 항상 false — 스키마 변경은 마이그레이션으로만 반영한다 */
  synchronize: false,
  logging: ['error', 'migration'],
};

export default new DataSource(dataSourceOptions);
