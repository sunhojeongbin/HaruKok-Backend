import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsrEntity } from '../../usr/entities/usr.entity';
import { DeviceType, RevokeReason } from '../enums/refresh-token.enum';

@Entity({
  name: 'REFRESH_TOKENS',
  comment: '리프레시 토큰 관리 테이블 (1유저 1토큰)',
})
@Index('uq_rft_usr_id', ['usrId'], { unique: true })
@Index('idx_rft_token_hash', ['tokenHash'], { unique: true })
@Index('idx_rft_jti', ['jti'], { unique: true })
@Index('idx_rft_expires_at', ['expiresAt'], {
  where: '"is_revoked" = false',
})
@Check(
  'chk_refresh_token_dev_type',
  `"device_type" IS NULL OR "device_type" IN ('IOS', 'ANDROID', 'WEB')`,
)
@Check('chk_refresh_token_expires', '"expires_at" > "issued_at"')
@Check(
  'chk_refresh_token_revoked',
  'NOT "is_revoked" OR "revoked_at" IS NOT NULL',
)
export class RftEntity {
  @PrimaryColumn({
    name: 'rft_id',
    type: 'uuid',
    default: () => 'gen_random_uuid()',
    comment: 'PK - 토큰 고유 ID',
  })
  rftId: string;

  @Column({
    name: 'usr_id',
    type: 'uuid',
    comment: 'FK - 사용자 ID (UNIQUE: 1유저 1토큰 강제)',
  })
  usrId: string;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'Refresh Token 원문의 SHA-256 해시값 (원문은 저장하지 않음)',
  })
  tokenHash: string;

  @Column({
    name: 'jti',
    type: 'uuid',
    unique: true,
    comment: 'JWT ID - Access Token과의 연결 식별자',
  })
  jti: string;

  @Column({
    name: 'device_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '로그인 기기명 ex) iPhone 15, Galaxy S24',
  })
  deviceName: string | null;

  @Column({
    name: 'device_type',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '기기 유형 - IOS / ANDROID / WEB',
  })
  deviceType: DeviceType | null;

  @Column({
    name: 'ip_address',
    type: 'inet',
    nullable: true,
    comment: '로그인 시점의 클라이언트 IP 주소',
  })
  ipAddress: string | null;

  @Column({
    name: 'issued_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '토큰 최초 발급 일시',
  })
  issuedAt: Date;

  @Column({
    name: 'expires_at',
    type: 'timestamptz',
    comment: '토큰 만료 일시 (발급일 + 60일)',
  })
  expiresAt: Date;

  @Column({
    name: 'last_used_at',
    type: 'timestamptz',
    nullable: true,
    comment: '토큰 마지막 사용 일시 - 재발급 요청 시마다 갱신',
  })
  lastUsedAt: Date | null;

  @Column({
    name: 'is_revoked',
    type: 'boolean',
    default: false,
    comment: '토큰 폐기 여부 (TRUE: 사용 불가)',
  })
  isRevoked: boolean;

  @Column({
    name: 'revoked_at',
    type: 'timestamptz',
    nullable: true,
    comment: '토큰 폐기 처리 일시',
  })
  revokedAt: Date | null;

  @Column({
    name: 'revoke_reason',
    type: 'enum',
    enum: RevokeReason,
    enumName: 'revoke_reason_type',
    nullable: true,
    comment:
      '토큰 폐기 사유 - LOGOUT / PASSWORD_CHANGE / SUSPICIOUS / EXPIRED / RE_LOGIN',
  })
  revokeReason: RevokeReason | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '최초 생성 일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '최종 수정 일시',
  })
  updatedAt: Date;

  @OneToOne(() => UsrEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id', referencedColumnName: 'usrId' })
  usr: UsrEntity;
}
