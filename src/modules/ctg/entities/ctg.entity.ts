import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UsrEntity } from '../../users/entities/usr.entity';
import { VisibilityType } from '../enums/visibility-type.enum';

/**
 * @description 카테고리 엔티티
 */
@Entity({ name: 'CTG', comment: '카테고리 테이블' })
@Index('uq_ctg_usr_name_not_deleted', ['usrId', 'ctgName'], {
  unique: true,
  where: '"is_deleted" = false',
})
export class CtgEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'ctg_id',
    comment: '카테고리 ID',
  })
  ctgId: string;

  @Column({
    name: 'usr_id',
    type: 'uuid',
    comment: '사용자 ID',
  })
  usrId: string;

  @ManyToOne(() => UsrEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id', referencedColumnName: 'usrId' })
  user: UsrEntity;

  @Column({
    name: 'ctg_name',
    type: 'varchar',
    length: 10,
    comment: '카테고리 이름',
  })
  ctgName: string;

  @Column({
    name: 'visibility',
    type: 'enum',
    enum: VisibilityType,
    enumName: 'visibility_type',
    default: VisibilityType.FRIENDS,
    comment: '공개 설정', // FRIENDS: 친구 공개 / PRIVATE: 나만 보기
  })
  visibility: VisibilityType;

  @Column({
    name: 'color_code',
    type: 'char',
    length: 7,
    default: '#000000',
    comment: '색상 코드', // HEX 색상 코드 ex) #FF5733'
  })
  colorCode: string;

  @Column({
    name: 'sort_order',
    type: 'smallint',
    default: 0,
    comment: '정렬 순서',
  })
  sortOrder: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    comment: '생성 일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    comment: '수정 일시',
  })
  updatedAt: Date;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
    comment: '삭제 여부',
  })
  isDeleted: boolean;

  @Column({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    comment: '삭제 일시',
  })
  deletedAt: Date | null;

  @Column({
    name: 'is_ended',
    type: 'boolean',
    default: false,
    comment: '종료 여부',
  })
  isEnded: boolean;

  @Column({
    name: 'ended_at',
    type: 'timestamptz',
    nullable: true,
    comment: '종료 일시',
  })
  endedAt: Date | null;
}
