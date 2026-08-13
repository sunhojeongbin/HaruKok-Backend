import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsrEntity } from '../../usr/entities/usr.entity';

/**
 * @description FCM 디바이스 토큰 엔티티 (사용자당 여러 기기 지원)
 */
@Entity({ name: 'NTF_TOKEN', comment: 'FCM 디바이스 토큰' })
@Index('uq_ntf_token_fcm', ['fcmToken'], { unique: true })
@Index('idx_ntf_token_01', ['usrId', 'isActive'])
@Check('chk_ntf_token_platform', `"platform_cd" IN ('AOS', 'IOS', 'WEB')`)
@Check('chk_ntf_token_fcm', `btrim("fcm_token") <> ''`)
export class NtfTokenEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ntf_token_id',
    comment: 'PK - 디바이스 토큰 고유 ID',
  })
  ntfTokenId: string;

  @Column({
    name: 'usr_id',
    type: 'uuid',
    comment: 'FK - 토큰 소유 사용자 ID',
  })
  usrId: string;

  @Column({
    name: 'fcm_token',
    type: 'varchar',
    length: 512,
    comment: 'FCM 등록 토큰',
  })
  fcmToken: string;

  @Column({
    name: 'platform_cd',
    type: 'varchar',
    length: 10,
    comment: '플랫폼 코드 (AOS / IOS / WEB)',
  })
  platformCd: string;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
    comment: '활성 여부 (FALSE: 무효 토큰)',
  })
  isActive: boolean;

  @Column({
    name: 'last_used_at',
    type: 'timestamptz',
    nullable: true,
    comment: '마지막 발송/갱신 일시',
  })
  lastUsedAt: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '레코드 생성 일시 (UTC)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '레코드 수정 일시 (UTC)',
  })
  updatedAt: Date;

  @ManyToOne(() => UsrEntity, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'usr_id', referencedColumnName: 'usrId' })
  usr: UsrEntity;
}
