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

export enum FriendStatusCode {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  BLOCKED = 'BLOCKED',
}

/**
 * @description 사용자 친구 관계 엔티티 (단방향 저장)
 */
@Entity({ name: 'USR_FRD', comment: '사용자 친구 목록' })
@Index('uq_usr_frd_01', ['usrId', 'frdUsrId'], {
  unique: true,
  where: '"is_deleted" = false',
})
@Index('idx_usr_frd_01', ['usrId', 'frdStatCd', 'isDeleted'])
@Index('idx_usr_frd_02', ['frdUsrId', 'frdStatCd', 'isDeleted'])
@Check('chk_usr_frd_self', '"usr_id" <> "frd_usr_id"')
@Check(
  'chk_usr_frd_stat',
  "\"frd_stat_cd\" IN ('PENDING', 'ACCEPTED', 'BLOCKED')",
)
export class UsrFrdEntity {
  @PrimaryColumn({
    name: 'frd_id',
    type: 'uuid',
    default: () => 'gen_random_uuid()',
    comment: '친구 관계 고유 식별자',
  })
  frdId: string;

  @Column({
    name: 'usr_id',
    type: 'uuid',
    comment: '친구 요청을 보낸 사용자 ID',
  })
  usrId: string;

  @Column({
    name: 'frd_usr_id',
    type: 'uuid',
    comment: '친구로 등록된 대상 사용자 ID',
  })
  frdUsrId: string;

  @Column({
    name: 'frd_stat_cd',
    type: 'varchar',
    length: 20,
    default: FriendStatusCode.PENDING,
    comment: '친구 상태 코드 (PENDING/ACCEPTED/BLOCKED)',
  })
  frdStatCd: FriendStatusCode;

  @Column({
    name: 'req_dt',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '친구 요청 일시 (UTC)',
  })
  reqDt: Date;

  @Column({
    name: 'acpt_dt',
    type: 'timestamptz',
    nullable: true,
    comment: '친구 수락 일시 (UTC), 수락 전 NULL',
  })
  acptDt: Date | null;

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

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
    comment: '논리 삭제 여부 (TRUE/FALSE)',
  })
  isDeleted: boolean;

  @ManyToOne(() => UsrEntity, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'usr_id', referencedColumnName: 'usrId' })
  usr: UsrEntity;

  @ManyToOne(() => UsrEntity, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'frd_usr_id', referencedColumnName: 'usrId' })
  frdUsr: UsrEntity;
}
