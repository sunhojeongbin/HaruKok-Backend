import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsrEntity } from './usr.entity';

@Entity({ name: 'USR_SOCIAL', comment: '사용자 소셜 로그인 연동 정보' })
@Index('uq_usr_social_01', ['providerCd', 'providerUid'], {
  unique: true,
  where: '"is_deleted" = false',
})
@Index('uq_usr_social_02', ['usrId', 'providerCd'], {
  unique: true,
  where: '"is_deleted" = false',
})
@Index('idx_usr_social_01', ['usrId', 'isDeleted'])
@Check(
  'chk_usr_social_provider',
  "\"provider_cd\" IN ('KAKAO', 'GOOGLE', 'APPLE')",
)
export class UsrSocialEntity {
  @PrimaryColumn({
    name: 'social_id',
    type: 'uuid',
    default: () => 'gen_random_uuid()',
    comment: '소셜 연동 고유 식별자',
  })
  socialId: string;

  @Column({
    name: 'usr_id',
    type: 'uuid',
    comment: '연동된 사용자 ID',
  })
  usrId: string;

  @Column({
    name: 'provider_cd',
    type: 'varchar',
    length: 20,
    comment: '소셜 제공자 코드 (KAKAO / GOOGLE / APPLE)',
  })
  providerCd: string;

  @Column({
    name: 'provider_uid',
    type: 'varchar',
    length: 255,
    comment: '소셜 제공자가 발급한 사용자 고유 ID',
  })
  providerUid: string;

  @Column({
    name: 'provider_email',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '소셜 제공자로부터 수신한 이메일 (미제공 시 NULL)',
  })
  providerEmail: string | null;

  @CreateDateColumn({
    name: 'connected_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '소셜 계정 최초 연동 일시(UTC)',
  })
  connectedAt: Date;

  @Column({
    name: 'last_login_at',
    type: 'timestamptz',
    nullable: true,
    comment: '해당 소셜 계정으로 마지막 로그인한 일시(UTC)',
  })
  lastLoginAt: Date | null;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
    comment: '삭제 여부 (TRUE: 연동 해제, FALSE: 정상)',
  })
  isDeleted: boolean;

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

  @ManyToOne(() => UsrEntity, (usr) => usr.usrSocials, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'usr_id', referencedColumnName: 'usrId' })
  usr: UsrEntity;
}
