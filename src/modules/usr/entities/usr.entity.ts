import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsrSocialEntity } from './usr-social.entity';

@Entity({ name: 'USR', comment: '사용자' })
@Index('uq_usr_01', ['usrEmail'], {
  unique: true,
  where: '"usr_email" IS NOT NULL AND "is_deleted" = false',
})
@Index('idx_usr_01', ['usrStatCd', 'isDeleted'])
@Index('idx_usr_02', ['lockedUntil'], {
  where: '"usr_stat_cd" = \'LOCKED\'',
})
@Check(
  'chk_usr_join_type',
  "\"join_type_cd\" IN ('EMAIL', 'KAKAO', 'GOOGLE', 'APPLE')",
)
@Check(
  'chk_usr_stat_cd',
  "\"usr_stat_cd\" IN ('ACTIVE', 'DORMANT', 'LOCKED', 'WITHDRAWN')",
)
@Check('chk_usr_role_cd', "\"usr_role_cd\" IN ('USER', 'ADMIN')")
@Check(
  'chk_usr_email_join',
  '"join_type_cd" <> \'EMAIL\' OR ("usr_email" IS NOT NULL AND "pwd" IS NOT NULL AND "pwd_hash" IS NOT NULL)',
)
@Check(
  'chk_usr_social_join',
  '"join_type_cd" = \'EMAIL\' OR ("pwd" IS NULL AND "pwd_hash" IS NULL)',
)
@Check('chk_usr_failed_login', '"failed_login_cnt" >= 0')
@Check(
  'chk_usr_locked',
  '"usr_stat_cd" <> \'LOCKED\' OR "locked_until" IS NOT NULL',
)
@Check('chk_usr_deleted', 'NOT "is_deleted" OR "deleted_at" IS NOT NULL')
@Check(
  'chk_usr_email_format',
  '"usr_email" IS NULL OR "usr_email" ~* \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$\'',
)
export class UsrEntity {
  @PrimaryColumn({
    name: 'usr_id',
    type: 'uuid',
    default: () => 'gen_random_uuid()',
    comment: '사용자 고유 식별자',
  })
  usrId: string;

  @Column({
    name: 'usr_email',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '사용자 이메일 (카카오 가입 시 미제공이면 NULL)',
  })
  usrEmail: string | null;

  @Column({
    name: 'usr_nm',
    type: 'varchar',
    length: 50,
    comment: '사용자 닉네임 또는 이름',
  })
  usrNm: string;

  @Column({
    name: 'pwd',
    type: 'varchar',
    length: 254,
    nullable: true,
    comment: '암호화된 비밀번호 (카카오 가입 시 NULL)',
  })
  pwd: string | null;

  @Column({
    name: 'pwd_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '암호화 알고리즘',
  })
  pwdHash: string | null;

  @Column({
    name: 'join_type_cd',
    type: 'varchar',
    length: 20,
    default: 'EMAIL',
    comment: '가입 유형 코드',
  })
  joinTypeCd: string;

  @Column({
    name: 'usr_stat_cd',
    type: 'varchar',
    length: 20,
    default: 'ACTIVE',
    comment: '계정 상태 코드',
  })
  usrStatCd: string;

  @Column({
    name: 'usr_role_cd',
    type: 'varchar',
    length: 20,
    default: 'USER',
    comment: '사용자 역할 코드',
  })
  usrRoleCd: string;

  @Column({
    name: 'email_verified_at',
    type: 'timestamptz',
    nullable: true,
    comment: '이메일 인증 완료 일시(UTC). NULL이면 미인증 상태',
  })
  emailVerifiedAt: Date | null;

  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
    comment: '마지막 로그인 성공 일시(UTC)',
  })
  lastLoginAt: Date | null;

  @Column({
    name: 'failed_login_cnt',
    type: 'smallint',
    default: 0,
    comment: '연속 로그인 실패 횟수. 로그인 성공 시 0으로 초기화',
  })
  failedLoginCnt: number;

  @Column({
    name: 'locked_until',
    type: 'timestamptz',
    nullable: true,
    comment: '계정 잠금 해제 일시(UTC). NULL이면 잠금 없음',
  })
  lockedUntil: Date | null;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
    comment: '논리 삭제 여부 (TRUE: 탈퇴, FALSE: 정상)',
  })
  isDeleted: boolean;

  @Column({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    comment: '회원 탈퇴 처리 일시(UTC)',
  })
  deletedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '최초 생성 일시(UTC)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '최종 수정 일시(UTC)',
  })
  updatedAt: Date;

  @OneToMany(() => UsrSocialEntity, (usrSocial) => usrSocial.usr)
  usrSocials: UsrSocialEntity[];
}
