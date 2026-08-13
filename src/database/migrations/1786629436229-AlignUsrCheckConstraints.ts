import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * @description USR 테이블의 CHECK 제약 3건을 엔티티 정의에 맞춘다.
 *
 *              베이스라인을 "적용됨"으로만 표시했기 때문에, 기존 DB 에는
 *              synchronize 로 만들어진 옛 제약이 남아 있다. 이 마이그레이션이 그 차이를 메운다.
 *
 *              1) chk_usr_stat_cd
 *                 'WITHDRAWN' 추가. docs/design-withdraw.md 의 탈퇴 설계가
 *                 usr_stat_cd = 'WITHDRAWN' 을 전제하는데 엔티티에서 누락돼 있었다.
 *
 *              2) chk_usr_email_join
 *                 이메일 가입 시 pwd 도 NOT NULL 이어야 한다.
 *                 signup.use-case.ts 가 pwd(해시)와 pwd_hash(알고리즘명)를 항상 함께 채운다.
 *
 *              3) chk_usr_social_join
 *                 소셜 가입 시 pwd 도 NULL 이어야 한다. 위와 대칭.
 *
 *              기존 데이터 위반 여부는 사전 확인했다 (세 조건 모두 0건).
 *              위반 행이 있으면 ADD CONSTRAINT 단계에서 트랜잭션이 롤백되므로 안전하다.
 */
export class AlignUsrCheckConstraints1786629436229 implements MigrationInterface {
  name = 'AlignUsrCheckConstraints1786629436229';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) 계정 상태 코드 — WITHDRAWN 추가
    await queryRunner.query(
      `ALTER TABLE "USR" DROP CONSTRAINT IF EXISTS "chk_usr_stat_cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR" ADD CONSTRAINT "chk_usr_stat_cd" CHECK ("usr_stat_cd" IN ('ACTIVE', 'DORMANT', 'LOCKED', 'WITHDRAWN'))`,
    );

    // 2) 이메일 가입 — pwd 필수화
    await queryRunner.query(
      `ALTER TABLE "USR" DROP CONSTRAINT IF EXISTS "chk_usr_email_join"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR" ADD CONSTRAINT "chk_usr_email_join" CHECK ("join_type_cd" <> 'EMAIL' OR ("usr_email" IS NOT NULL AND "pwd" IS NOT NULL AND "pwd_hash" IS NOT NULL))`,
    );

    // 3) 소셜 가입 — pwd 도 NULL 이어야 함
    await queryRunner.query(
      `ALTER TABLE "USR" DROP CONSTRAINT IF EXISTS "chk_usr_social_join"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR" ADD CONSTRAINT "chk_usr_social_join" CHECK ("join_type_cd" = 'EMAIL' OR ("pwd" IS NULL AND "pwd_hash" IS NULL))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "USR" DROP CONSTRAINT IF EXISTS "chk_usr_social_join"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR" ADD CONSTRAINT "chk_usr_social_join" CHECK ("join_type_cd" = 'EMAIL' OR "pwd_hash" IS NULL)`,
    );

    await queryRunner.query(
      `ALTER TABLE "USR" DROP CONSTRAINT IF EXISTS "chk_usr_email_join"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR" ADD CONSTRAINT "chk_usr_email_join" CHECK ("join_type_cd" <> 'EMAIL' OR ("usr_email" IS NOT NULL AND "pwd_hash" IS NOT NULL))`,
    );

    await queryRunner.query(
      `ALTER TABLE "USR" DROP CONSTRAINT IF EXISTS "chk_usr_stat_cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR" ADD CONSTRAINT "chk_usr_stat_cd" CHECK ("usr_stat_cd" IN ('ACTIVE', 'DORMANT', 'LOCKED', 'WITHDRAWN'))`,
    );
  }
}
