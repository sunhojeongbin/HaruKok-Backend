import { MigrationInterface, QueryRunner } from 'typeorm';

export class Baseline1786600000000 implements MigrationInterface {
  name = 'Baseline1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "USR_SOCIAL" ("social_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_id" uuid NOT NULL, "provider_cd" character varying(20) NOT NULL, "provider_uid" character varying(255) NOT NULL, "provider_email" character varying(255), "connected_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "last_login_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "chk_usr_social_provider" CHECK ("provider_cd" IN ('KAKAO', 'GOOGLE', 'APPLE')), CONSTRAINT "PK_80cd8dd9b8746edbb4ed6a1c30e" PRIMARY KEY ("social_id")); COMMENT ON COLUMN "USR_SOCIAL"."social_id" IS '소셜 연동 고유 식별자'; COMMENT ON COLUMN "USR_SOCIAL"."usr_id" IS '연동된 사용자 ID'; COMMENT ON COLUMN "USR_SOCIAL"."provider_cd" IS '소셜 제공자 코드 (KAKAO / GOOGLE / APPLE)'; COMMENT ON COLUMN "USR_SOCIAL"."provider_uid" IS '소셜 제공자가 발급한 사용자 고유 ID'; COMMENT ON COLUMN "USR_SOCIAL"."provider_email" IS '소셜 제공자로부터 수신한 이메일 (미제공 시 NULL)'; COMMENT ON COLUMN "USR_SOCIAL"."connected_at" IS '소셜 계정 최초 연동 일시(UTC)'; COMMENT ON COLUMN "USR_SOCIAL"."last_login_at" IS '해당 소셜 계정으로 마지막 로그인한 일시(UTC)'; COMMENT ON COLUMN "USR_SOCIAL"."is_deleted" IS '삭제 여부 (TRUE: 연동 해제, FALSE: 정상)'; COMMENT ON COLUMN "USR_SOCIAL"."created_at" IS '최초 생성 일시(UTC)'; COMMENT ON COLUMN "USR_SOCIAL"."updated_at" IS '최종 수정 일시(UTC)'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usr_social_01" ON "USR_SOCIAL" ("usr_id", "is_deleted") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_usr_social_02" ON "USR_SOCIAL" ("usr_id", "provider_cd") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_usr_social_01" ON "USR_SOCIAL" ("provider_cd", "provider_uid") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "USR_SOCIAL" IS '사용자 소셜 로그인 연동 정보'`,
    );
    await queryRunner.query(
      `CREATE TABLE "USR" ("usr_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_email" character varying(255), "usr_nm" character varying(50) NOT NULL, "pwd" character varying(254), "pwd_hash" character varying(255), "join_type_cd" character varying(20) NOT NULL DEFAULT 'EMAIL', "usr_stat_cd" character varying(20) NOT NULL DEFAULT 'ACTIVE', "usr_role_cd" character varying(20) NOT NULL DEFAULT 'USER', "email_verified_at" TIMESTAMP WITH TIME ZONE, "last_login_at" TIMESTAMP WITH TIME ZONE, "failed_login_cnt" smallint NOT NULL DEFAULT '0', "locked_until" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "chk_usr_email_format" CHECK ("usr_email" IS NULL OR "usr_email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'), CONSTRAINT "chk_usr_locked" CHECK ("usr_stat_cd" <> 'LOCKED' OR "locked_until" IS NOT NULL), CONSTRAINT "chk_usr_failed_login" CHECK ("failed_login_cnt" >= 0), CONSTRAINT "chk_usr_social_join" CHECK ("join_type_cd" = 'EMAIL' OR ("pwd" IS NULL AND "pwd_hash" IS NULL)), CONSTRAINT "chk_usr_email_join" CHECK ("join_type_cd" <> 'EMAIL' OR ("usr_email" IS NOT NULL AND "pwd" IS NOT NULL AND "pwd_hash" IS NOT NULL)), CONSTRAINT "chk_usr_role_cd" CHECK ("usr_role_cd" IN ('USER', 'ADMIN')), CONSTRAINT "chk_usr_stat_cd" CHECK ("usr_stat_cd" IN ('ACTIVE', 'DORMANT', 'LOCKED', 'WITHDRAWN')), CONSTRAINT "chk_usr_join_type" CHECK ("join_type_cd" IN ('EMAIL', 'KAKAO', 'GOOGLE', 'APPLE')), CONSTRAINT "PK_385559b3aedf8f90850bcdcfaf0" PRIMARY KEY ("usr_id")); COMMENT ON COLUMN "USR"."usr_id" IS '사용자 고유 식별자'; COMMENT ON COLUMN "USR"."usr_email" IS '사용자 이메일 (카카오 가입 시 미제공이면 NULL)'; COMMENT ON COLUMN "USR"."usr_nm" IS '사용자 닉네임 또는 이름'; COMMENT ON COLUMN "USR"."pwd" IS '암호화된 비밀번호 (카카오 가입 시 NULL)'; COMMENT ON COLUMN "USR"."pwd_hash" IS '암호화 알고리즘'; COMMENT ON COLUMN "USR"."join_type_cd" IS '가입 유형 코드'; COMMENT ON COLUMN "USR"."usr_stat_cd" IS '계정 상태 코드'; COMMENT ON COLUMN "USR"."usr_role_cd" IS '사용자 역할 코드'; COMMENT ON COLUMN "USR"."email_verified_at" IS '이메일 인증 완료 일시(UTC). NULL이면 미인증 상태'; COMMENT ON COLUMN "USR"."last_login_at" IS '마지막 로그인 성공 일시(UTC)'; COMMENT ON COLUMN "USR"."failed_login_cnt" IS '연속 로그인 실패 횟수. 로그인 성공 시 0으로 초기화'; COMMENT ON COLUMN "USR"."locked_until" IS '계정 잠금 해제 일시(UTC). NULL이면 잠금 없음'; COMMENT ON COLUMN "USR"."created_at" IS '최초 생성 일시(UTC)'; COMMENT ON COLUMN "USR"."updated_at" IS '최종 수정 일시(UTC)'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usr_02" ON "USR" ("locked_until") WHERE "usr_stat_cd" = 'LOCKED'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usr_01" ON "USR" ("usr_stat_cd") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_usr_01" ON "USR" ("usr_email") WHERE "usr_email" IS NOT NULL`,
    );
    await queryRunner.query(`COMMENT ON TABLE "USR" IS '사용자'`);
    await queryRunner.query(
      `CREATE TABLE "USR_FRD" ("frd_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_id" uuid NOT NULL, "frd_usr_id" uuid NOT NULL, "frd_stat_cd" character varying(20) NOT NULL DEFAULT 'PENDING', "req_dt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "acpt_dt" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "chk_usr_frd_stat" CHECK ("frd_stat_cd" IN ('PENDING', 'ACCEPTED', 'BLOCKED')), CONSTRAINT "chk_usr_frd_self" CHECK ("usr_id" <> "frd_usr_id"), CONSTRAINT "PK_f56b7837df466ed27bb6ccd1336" PRIMARY KEY ("frd_id")); COMMENT ON COLUMN "USR_FRD"."frd_id" IS '친구 관계 고유 식별자'; COMMENT ON COLUMN "USR_FRD"."usr_id" IS '친구 요청을 보낸 사용자 ID'; COMMENT ON COLUMN "USR_FRD"."frd_usr_id" IS '친구로 등록된 대상 사용자 ID'; COMMENT ON COLUMN "USR_FRD"."frd_stat_cd" IS '친구 상태 코드 (PENDING/ACCEPTED/BLOCKED)'; COMMENT ON COLUMN "USR_FRD"."req_dt" IS '친구 요청 일시 (UTC)'; COMMENT ON COLUMN "USR_FRD"."acpt_dt" IS '친구 수락 일시 (UTC), 수락 전 NULL'; COMMENT ON COLUMN "USR_FRD"."created_at" IS '레코드 생성 일시 (UTC)'; COMMENT ON COLUMN "USR_FRD"."updated_at" IS '레코드 수정 일시 (UTC)'; COMMENT ON COLUMN "USR_FRD"."is_deleted" IS '논리 삭제 여부 (TRUE/FALSE)'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usr_frd_02" ON "USR_FRD" ("frd_usr_id", "frd_stat_cd", "is_deleted") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_usr_frd_01" ON "USR_FRD" ("usr_id", "frd_stat_cd", "is_deleted") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_usr_frd_01" ON "USR_FRD" ("usr_id", "frd_usr_id") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(`COMMENT ON TABLE "USR_FRD" IS '사용자 친구 목록'`);
    await queryRunner.query(
      `CREATE TYPE "public"."visibility_type" AS ENUM('FRIENDS', 'PRIVATE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "CTG" ("ctg_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_id" uuid NOT NULL, "ctg_name" character varying(10) NOT NULL, "visibility" "public"."visibility_type" NOT NULL DEFAULT 'FRIENDS', "color_code" character(7) NOT NULL DEFAULT '#AAD1F0', "sort_order" smallint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP WITH TIME ZONE, "is_ended" boolean NOT NULL DEFAULT false, "ended_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7d276aae22b488f3513ee650ea1" PRIMARY KEY ("ctg_id")); COMMENT ON COLUMN "CTG"."ctg_id" IS '카테고리 ID'; COMMENT ON COLUMN "CTG"."usr_id" IS '사용자 ID'; COMMENT ON COLUMN "CTG"."ctg_name" IS '카테고리 이름'; COMMENT ON COLUMN "CTG"."visibility" IS '공개 설정'; COMMENT ON COLUMN "CTG"."color_code" IS '색상 코드'; COMMENT ON COLUMN "CTG"."sort_order" IS '정렬 순서'; COMMENT ON COLUMN "CTG"."created_at" IS '생성 일시'; COMMENT ON COLUMN "CTG"."updated_at" IS '수정 일시'; COMMENT ON COLUMN "CTG"."is_deleted" IS '삭제 여부'; COMMENT ON COLUMN "CTG"."deleted_at" IS '삭제 일시'; COMMENT ON COLUMN "CTG"."is_ended" IS '종료 여부'; COMMENT ON COLUMN "CTG"."ended_at" IS '종료 일시'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_ctg_usr_name_not_deleted" ON "CTG" ("usr_id", "ctg_name") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(`COMMENT ON TABLE "CTG" IS '카테고리 테이블'`);
    await queryRunner.query(
      `CREATE TABLE "RTN_RPT" ("rtn_rpt_id" uuid NOT NULL DEFAULT gen_random_uuid(), "rtn_id" uuid NOT NULL, "rpt_type_cd" character varying(10) NOT NULL, "day_of_week" smallint, "day_of_mth" smallint, "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "chk_rtn_rpt_daily" CHECK ("rpt_type_cd" <> 'DAILY' OR ("day_of_week" IS NULL AND "day_of_mth" IS NULL)), CONSTRAINT "chk_rtn_rpt_monthly" CHECK ("rpt_type_cd" <> 'MONTHLY' OR "day_of_mth" IS NOT NULL), CONSTRAINT "chk_rtn_rpt_weekly" CHECK ("rpt_type_cd" <> 'WEEKLY' OR "day_of_week" IS NOT NULL), CONSTRAINT "chk_rtn_rpt_day_of_mth" CHECK ("day_of_mth" BETWEEN 1 AND 31), CONSTRAINT "chk_rtn_rpt_day_of_week" CHECK ("day_of_week" BETWEEN 0 AND 6), CONSTRAINT "chk_rtn_rpt_type" CHECK ("rpt_type_cd" IN ('DAILY', 'WEEKLY', 'MONTHLY')), CONSTRAINT "PK_a183497c4096c3a6acd94d23367" PRIMARY KEY ("rtn_rpt_id")); COMMENT ON COLUMN "RTN_RPT"."rtn_rpt_id" IS '반복 설정 고유 식별자'; COMMENT ON COLUMN "RTN_RPT"."rtn_id" IS '대상 루틴 ID'; COMMENT ON COLUMN "RTN_RPT"."rpt_type_cd" IS '반복 유형 코드'; COMMENT ON COLUMN "RTN_RPT"."day_of_week" IS '요일 (0:일~6:토, WEEKLY만 사용)'; COMMENT ON COLUMN "RTN_RPT"."day_of_mth" IS '반복 일자 (1~31, MONTHLY만 사용)'; COMMENT ON COLUMN "RTN_RPT"."is_deleted" IS '논리 삭제 여부'; COMMENT ON COLUMN "RTN_RPT"."created_at" IS '레코드 생성 일시 (UTC)'; COMMENT ON COLUMN "RTN_RPT"."updated_at" IS '레코드 수정 일시 (UTC)'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rtn_rpt_01" ON "RTN_RPT" ("rtn_id", "rpt_type_cd") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(`COMMENT ON TABLE "RTN_RPT" IS '루틴 반복 설정'`);
    await queryRunner.query(
      `CREATE TABLE "RTN" ("rtn_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_id" uuid NOT NULL, "ctg_id" uuid NOT NULL, "rtn_nm" character varying(100) NOT NULL, "rpt_type_cd" character varying(10) NOT NULL, "start_dt" date NOT NULL, "end_dt" date NOT NULL, "alarm_time" TIME, "sort_order" smallint NOT NULL DEFAULT '0', "is_deleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "chk_rtn_nm" CHECK (btrim("rtn_nm") <> ''), CONSTRAINT "chk_rtn_dt_range" CHECK ("end_dt" >= "start_dt"), CONSTRAINT "chk_rtn_rpt_type" CHECK ("rpt_type_cd" IN ('DAILY', 'WEEKLY', 'MONTHLY')), CONSTRAINT "PK_83e9f3520ec7318b7cc4588887b" PRIMARY KEY ("rtn_id")); COMMENT ON COLUMN "RTN"."rtn_id" IS '루틴 고유 식별자'; COMMENT ON COLUMN "RTN"."usr_id" IS '루틴 등록 사용자 ID'; COMMENT ON COLUMN "RTN"."ctg_id" IS '카테고리 ID'; COMMENT ON COLUMN "RTN"."rtn_nm" IS '루틴 내용'; COMMENT ON COLUMN "RTN"."rpt_type_cd" IS '반복 유형 코드'; COMMENT ON COLUMN "RTN"."start_dt" IS '루틴 시작 일자'; COMMENT ON COLUMN "RTN"."end_dt" IS '루틴 종료 일자'; COMMENT ON COLUMN "RTN"."alarm_time" IS '알림 시간(NULL: 알림 없음)'; COMMENT ON COLUMN "RTN"."sort_order" IS '루틴 정렬 순서'; COMMENT ON COLUMN "RTN"."is_deleted" IS '논리 삭제 여부'; COMMENT ON COLUMN "RTN"."created_at" IS '레코드 생성 일시 (UTC)'; COMMENT ON COLUMN "RTN"."updated_at" IS '레코드 수정 일시 (UTC)'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rtn_03" ON "RTN" ("usr_id", "sort_order") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rtn_02" ON "RTN" ("usr_id", "start_dt", "end_dt") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rtn_01" ON "RTN" ("usr_id", "ctg_id", "is_deleted") `,
    );
    await queryRunner.query(`COMMENT ON TABLE "RTN" IS '루틴 기본 정보'`);
    await queryRunner.query(
      `CREATE TABLE "TODOS" ("todo_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_id" uuid NOT NULL, "ctg_id" uuid, "rtn_id" uuid, "content" character varying(255) NOT NULL, "memo" text, "todo_date" date NOT NULL, "is_completed" boolean NOT NULL DEFAULT false, "completed_at" TIMESTAMP WITH TIME ZONE, "sort_order" smallint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "is_deleted" boolean NOT NULL DEFAULT false, "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "chk_todo_deleted" CHECK (NOT "is_deleted" OR "deleted_at" IS NOT NULL), CONSTRAINT "chk_todo_completed" CHECK (NOT "is_completed" OR "completed_at" IS NOT NULL), CONSTRAINT "chk_todo_content_not_blank" CHECK (btrim("content") <> ''), CONSTRAINT "PK_aebf60e32ff6ec8ffbb3b161293" PRIMARY KEY ("todo_id")); COMMENT ON COLUMN "TODOS"."todo_id" IS 'PK - 투두 고유 ID'; COMMENT ON COLUMN "TODOS"."usr_id" IS 'FK - 투두 작성자 사용자 ID'; COMMENT ON COLUMN "TODOS"."ctg_id" IS 'FK - 선택한 카테고리 ID (NULL: 미분류, 카테고리 삭제 시 NULL)'; COMMENT ON COLUMN "TODOS"."rtn_id" IS 'FK - 연결된 루틴 ID (NULL: 일반 투두)'; COMMENT ON COLUMN "TODOS"."content" IS '투두 할 일 내용 (최대 255자)'; COMMENT ON COLUMN "TODOS"."memo" IS '투두 상세 메모 (선택 입력)'; COMMENT ON COLUMN "TODOS"."todo_date" IS '해당 투두가 속한 날짜'; COMMENT ON COLUMN "TODOS"."is_completed" IS '완료 여부 (TRUE: 완료 / FALSE: 미완료)'; COMMENT ON COLUMN "TODOS"."completed_at" IS '투두 완료 처리 일시'; COMMENT ON COLUMN "TODOS"."sort_order" IS '같은 날짜 내 사용자 지정 정렬 순서'; COMMENT ON COLUMN "TODOS"."created_at" IS '투두 최초 생성 일시'; COMMENT ON COLUMN "TODOS"."updated_at" IS '투두 마지막 수정 일시'; COMMENT ON COLUMN "TODOS"."is_deleted" IS '소프트 삭제 여부 (TRUE: 삭제됨)'; COMMENT ON COLUMN "TODOS"."deleted_at" IS '소프트 삭제 처리 일시'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_todos_usr_date_completed" ON "TODOS" ("usr_id", "todo_date", "is_completed") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_todos_rtn_id" ON "TODOS" ("rtn_id") WHERE "is_deleted" = false AND "rtn_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_todos_ctg_id" ON "TODOS" ("ctg_id") WHERE "is_deleted" = false AND "ctg_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_todos_usr_date" ON "TODOS" ("usr_id", "todo_date") WHERE "is_deleted" = false`,
    );
    await queryRunner.query(`COMMENT ON TABLE "TODOS" IS '투두 리스트 테이블'`);
    await queryRunner.query(
      `CREATE TABLE "NTF_TOKEN" ("ntf_token_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_id" uuid NOT NULL, "fcm_token" character varying(512) NOT NULL, "platform_cd" character varying(10) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "last_used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "chk_ntf_token_fcm" CHECK (btrim("fcm_token") <> ''), CONSTRAINT "chk_ntf_token_platform" CHECK ("platform_cd" IN ('AOS', 'IOS', 'WEB')), CONSTRAINT "PK_d4dc72f6b889d8844d245c5e9fa" PRIMARY KEY ("ntf_token_id")); COMMENT ON COLUMN "NTF_TOKEN"."ntf_token_id" IS 'PK - 디바이스 토큰 고유 ID'; COMMENT ON COLUMN "NTF_TOKEN"."usr_id" IS 'FK - 토큰 소유 사용자 ID'; COMMENT ON COLUMN "NTF_TOKEN"."fcm_token" IS 'FCM 등록 토큰'; COMMENT ON COLUMN "NTF_TOKEN"."platform_cd" IS '플랫폼 코드 (AOS / IOS / WEB)'; COMMENT ON COLUMN "NTF_TOKEN"."is_active" IS '활성 여부 (FALSE: 무효 토큰)'; COMMENT ON COLUMN "NTF_TOKEN"."last_used_at" IS '마지막 발송/갱신 일시'; COMMENT ON COLUMN "NTF_TOKEN"."created_at" IS '레코드 생성 일시 (UTC)'; COMMENT ON COLUMN "NTF_TOKEN"."updated_at" IS '레코드 수정 일시 (UTC)'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ntf_token_01" ON "NTF_TOKEN" ("usr_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_ntf_token_fcm" ON "NTF_TOKEN" ("fcm_token") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "NTF_TOKEN" IS 'FCM 디바이스 토큰'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."revoke_reason_type" AS ENUM('LOGOUT', 'PASSWORD_CHANGE', 'SUSPICIOUS', 'EXPIRED', 'RE_LOGIN')`,
    );
    await queryRunner.query(
      `CREATE TABLE "REFRESH_TOKENS" ("rft_id" uuid NOT NULL DEFAULT gen_random_uuid(), "usr_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "jti" uuid NOT NULL, "device_name" character varying(100), "device_type" character varying(50), "ip_address" inet, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_used_at" TIMESTAMP WITH TIME ZONE, "is_revoked" boolean NOT NULL DEFAULT false, "revoked_at" TIMESTAMP WITH TIME ZONE, "revoke_reason" "public"."revoke_reason_type", "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_0fb8ea193de1e4072d0f42ac033" UNIQUE ("token_hash"), CONSTRAINT "UQ_494cbb039d1449aa007c6d70949" UNIQUE ("jti"), CONSTRAINT "REL_7a2b48f8ce6034eceb7e9b6ec6" UNIQUE ("usr_id"), CONSTRAINT "chk_refresh_token_revoked" CHECK (NOT "is_revoked" OR "revoked_at" IS NOT NULL), CONSTRAINT "chk_refresh_token_expires" CHECK ("expires_at" > "issued_at"), CONSTRAINT "chk_refresh_token_dev_type" CHECK ("device_type" IS NULL OR "device_type" IN ('IOS', 'ANDROID', 'WEB')), CONSTRAINT "PK_8a36e3ef9db1b3bb0d09e5c7bbd" PRIMARY KEY ("rft_id")); COMMENT ON COLUMN "REFRESH_TOKENS"."rft_id" IS 'PK - 토큰 고유 ID'; COMMENT ON COLUMN "REFRESH_TOKENS"."usr_id" IS 'FK - 사용자 ID (UNIQUE: 1유저 1토큰 강제)'; COMMENT ON COLUMN "REFRESH_TOKENS"."token_hash" IS 'Refresh Token 원문의 SHA-256 해시값 (원문은 저장하지 않음)'; COMMENT ON COLUMN "REFRESH_TOKENS"."jti" IS 'JWT ID - Access Token과의 연결 식별자'; COMMENT ON COLUMN "REFRESH_TOKENS"."device_name" IS '로그인 기기명 ex) iPhone 15, Galaxy S24'; COMMENT ON COLUMN "REFRESH_TOKENS"."device_type" IS '기기 유형 - IOS / ANDROID / WEB'; COMMENT ON COLUMN "REFRESH_TOKENS"."ip_address" IS '로그인 시점의 클라이언트 IP 주소'; COMMENT ON COLUMN "REFRESH_TOKENS"."issued_at" IS '토큰 최초 발급 일시'; COMMENT ON COLUMN "REFRESH_TOKENS"."expires_at" IS '토큰 만료 일시 (발급일 + 60일)'; COMMENT ON COLUMN "REFRESH_TOKENS"."last_used_at" IS '토큰 마지막 사용 일시 - 재발급 요청 시마다 갱신'; COMMENT ON COLUMN "REFRESH_TOKENS"."is_revoked" IS '토큰 폐기 여부 (TRUE: 사용 불가)'; COMMENT ON COLUMN "REFRESH_TOKENS"."revoked_at" IS '토큰 폐기 처리 일시'; COMMENT ON COLUMN "REFRESH_TOKENS"."revoke_reason" IS '토큰 폐기 사유 - LOGOUT / PASSWORD_CHANGE / SUSPICIOUS / EXPIRED / RE_LOGIN'; COMMENT ON COLUMN "REFRESH_TOKENS"."created_at" IS '최초 생성 일시'; COMMENT ON COLUMN "REFRESH_TOKENS"."updated_at" IS '최종 수정 일시'`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_rft_expires_at" ON "REFRESH_TOKENS" ("expires_at") WHERE "is_revoked" = false`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_rft_jti" ON "REFRESH_TOKENS" ("jti") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_rft_token_hash" ON "REFRESH_TOKENS" ("token_hash") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_rft_usr_id" ON "REFRESH_TOKENS" ("usr_id") `,
    );
    await queryRunner.query(
      `COMMENT ON TABLE "REFRESH_TOKENS" IS '리프레시 토큰 관리 테이블 (1유저 1토큰)'`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR_SOCIAL" ADD CONSTRAINT "FK_718773c9d3eb6b68473b2da3689" FOREIGN KEY ("usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR_FRD" ADD CONSTRAINT "FK_d50c331fbbab59da7a74348c979" FOREIGN KEY ("usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR_FRD" ADD CONSTRAINT "FK_896c10c917c940881d4a66ace8f" FOREIGN KEY ("frd_usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "CTG" ADD CONSTRAINT "FK_57680e9387f772d10d25fa126a7" FOREIGN KEY ("usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "RTN_RPT" ADD CONSTRAINT "FK_15418d99dd9cca107d7800495dd" FOREIGN KEY ("rtn_id") REFERENCES "RTN"("rtn_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "RTN" ADD CONSTRAINT "FK_e1b4413a7d2a669e6bedb6d22ba" FOREIGN KEY ("usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "RTN" ADD CONSTRAINT "FK_ca09e681305ef32a71cec783d50" FOREIGN KEY ("ctg_id") REFERENCES "CTG"("ctg_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "TODOS" ADD CONSTRAINT "FK_7be27c0ea58ba00cfcc6dc497f6" FOREIGN KEY ("usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "TODOS" ADD CONSTRAINT "FK_1fcbcca6dfe2cd87660220bad5a" FOREIGN KEY ("ctg_id") REFERENCES "CTG"("ctg_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "TODOS" ADD CONSTRAINT "FK_968be817021a0258da213039e24" FOREIGN KEY ("rtn_id") REFERENCES "RTN"("rtn_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "NTF_TOKEN" ADD CONSTRAINT "FK_b6e64e67268c8da997923dc5f53" FOREIGN KEY ("usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "REFRESH_TOKENS" ADD CONSTRAINT "FK_7a2b48f8ce6034eceb7e9b6ec65" FOREIGN KEY ("usr_id") REFERENCES "USR"("usr_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "REFRESH_TOKENS" DROP CONSTRAINT "FK_7a2b48f8ce6034eceb7e9b6ec65"`,
    );
    await queryRunner.query(
      `ALTER TABLE "NTF_TOKEN" DROP CONSTRAINT "FK_b6e64e67268c8da997923dc5f53"`,
    );
    await queryRunner.query(
      `ALTER TABLE "TODOS" DROP CONSTRAINT "FK_968be817021a0258da213039e24"`,
    );
    await queryRunner.query(
      `ALTER TABLE "TODOS" DROP CONSTRAINT "FK_1fcbcca6dfe2cd87660220bad5a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "TODOS" DROP CONSTRAINT "FK_7be27c0ea58ba00cfcc6dc497f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "RTN" DROP CONSTRAINT "FK_ca09e681305ef32a71cec783d50"`,
    );
    await queryRunner.query(
      `ALTER TABLE "RTN" DROP CONSTRAINT "FK_e1b4413a7d2a669e6bedb6d22ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "RTN_RPT" DROP CONSTRAINT "FK_15418d99dd9cca107d7800495dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "CTG" DROP CONSTRAINT "FK_57680e9387f772d10d25fa126a7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR_FRD" DROP CONSTRAINT "FK_896c10c917c940881d4a66ace8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR_FRD" DROP CONSTRAINT "FK_d50c331fbbab59da7a74348c979"`,
    );
    await queryRunner.query(
      `ALTER TABLE "USR_SOCIAL" DROP CONSTRAINT "FK_718773c9d3eb6b68473b2da3689"`,
    );
    await queryRunner.query(`COMMENT ON TABLE "REFRESH_TOKENS" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."uq_rft_usr_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rft_token_hash"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rft_jti"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rft_expires_at"`);
    await queryRunner.query(`DROP TABLE "REFRESH_TOKENS"`);
    await queryRunner.query(`DROP TYPE "public"."revoke_reason_type"`);
    await queryRunner.query(`COMMENT ON TABLE "NTF_TOKEN" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."uq_ntf_token_fcm"`);
    await queryRunner.query(`DROP INDEX "public"."idx_ntf_token_01"`);
    await queryRunner.query(`DROP TABLE "NTF_TOKEN"`);
    await queryRunner.query(`COMMENT ON TABLE "TODOS" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."idx_todos_usr_date"`);
    await queryRunner.query(`DROP INDEX "public"."idx_todos_ctg_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_todos_rtn_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_todos_usr_date_completed"`,
    );
    await queryRunner.query(`DROP TABLE "TODOS"`);
    await queryRunner.query(`COMMENT ON TABLE "RTN" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."idx_rtn_01"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rtn_02"`);
    await queryRunner.query(`DROP INDEX "public"."idx_rtn_03"`);
    await queryRunner.query(`DROP TABLE "RTN"`);
    await queryRunner.query(`COMMENT ON TABLE "RTN_RPT" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."idx_rtn_rpt_01"`);
    await queryRunner.query(`DROP TABLE "RTN_RPT"`);
    await queryRunner.query(`COMMENT ON TABLE "CTG" IS NULL`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_ctg_usr_name_not_deleted"`,
    );
    await queryRunner.query(`DROP TABLE "CTG"`);
    await queryRunner.query(`DROP TYPE "public"."visibility_type"`);
    await queryRunner.query(`COMMENT ON TABLE "USR_FRD" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."uq_usr_frd_01"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usr_frd_01"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usr_frd_02"`);
    await queryRunner.query(`DROP TABLE "USR_FRD"`);
    await queryRunner.query(`COMMENT ON TABLE "USR" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."uq_usr_01"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usr_01"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usr_02"`);
    await queryRunner.query(`DROP TABLE "USR"`);
    await queryRunner.query(`COMMENT ON TABLE "USR_SOCIAL" IS NULL`);
    await queryRunner.query(`DROP INDEX "public"."uq_usr_social_01"`);
    await queryRunner.query(`DROP INDEX "public"."uq_usr_social_02"`);
    await queryRunner.query(`DROP INDEX "public"."idx_usr_social_01"`);
    await queryRunner.query(`DROP TABLE "USR_SOCIAL"`);
  }
}
