import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * @description CTG / RTN / RTN_RPT 의 PK 기본값을 `uuid_generate_v4()` 에서
 *              `gen_random_uuid()` 로 정정한다.
 *
 *              배경:
 *              세 엔티티만 `@PrimaryGeneratedColumn('uuid')` 를 사용했고, TypeORM 은
 *              `uuidExtension` 옵션이 없으면 `uuid_generate_v4()` 를 생성한다.
 *              이 함수는 `uuid-ossp` 확장이 있어야 동작하는 반면,
 *              나머지 6개 엔티티가 쓰는 `gen_random_uuid()` 는 PostgreSQL 13+ 코어 내장이라
 *              확장이 필요 없다.
 *
 *              엔티티는 `@PrimaryColumn({ type: 'uuid', default: () => 'gen_random_uuid()' })`
 *              로 이미 통일했으며, 이 마이그레이션은 기존 DB 스키마를 여기에 맞춘다.
 *
 *              기존 데이터는 변환하지 않는다 — 두 함수 모두 UUIDv4 를 생성하므로
 *              이미 저장된 값의 성질이 동일하다. 컬럼 타입(`uuid`)도 바뀌지 않는다.
 *
 *              `IF EXISTS` 를 붙인 이유: 아직 베이스라인 마이그레이션이 없어
 *              테이블이 없는 신규 DB 에서도 안전하게 no-op 이 되도록 한다.
 */
export class AlignUuidDefaults1786627641112 implements MigrationInterface {
  name = 'AlignUuidDefaults1786627641112';

  private readonly targets = [
    { table: 'CTG', column: 'ctg_id' },
    { table: 'RTN', column: 'rtn_id' },
    { table: 'RTN_RPT', column: 'rtn_rpt_id' },
  ] as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const { table, column } of this.targets) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "${table}" ALTER COLUMN "${column}" SET DEFAULT gen_random_uuid()`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 되돌리려면 uuid_generate_v4() 가 필요하므로 uuid-ossp 확장을 먼저 확보한다.
    // 이 확장은 PostgreSQL 13+ 에서 trusted 이므로 DB CREATE 권한만 있으면 설치된다.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    for (const { table, column } of this.targets) {
      await queryRunner.query(
        `ALTER TABLE IF EXISTS "${table}" ALTER COLUMN "${column}" SET DEFAULT uuid_generate_v4()`,
      );
    }
  }
}
