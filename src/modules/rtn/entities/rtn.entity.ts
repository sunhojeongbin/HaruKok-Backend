import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CtgEntity } from '../../ctg/entities/ctg.entity';
import { TodoEntity } from '../../todo/entities/todo.entity';
import { UsrEntity } from '../../usr/entities/usr.entity';
import { RptType } from '../enums/rpt-type.enum';
import { RtnRptEntity } from './rtn-rpt.entity';

/**
 * @description 루틴 기본 정보 엔티티
 */
@Entity({ name: 'RTN', comment: '루틴 기본 정보' })
@Index('idx_rtn_01', ['usrId', 'ctgId', 'isDeleted'])
@Index('idx_rtn_02', ['usrId', 'startDt', 'endDt'], {
  where: '"is_deleted" = false',
})
@Index('idx_rtn_03', ['usrId', 'sortOrder'], {
  where: '"is_deleted" = false',
})
@Check('chk_rtn_rpt_type', `"rpt_type_cd" IN ('DAILY', 'WEEKLY', 'MONTHLY')`)
@Check('chk_rtn_dt_range', '"end_dt" >= "start_dt"')
@Check('chk_rtn_nm', `btrim("rtn_nm") <> ''`)
export class RtnEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'rtn_id',
    comment: '루틴 고유 식별자',
  })
  rtnId: string;

  @Column({
    name: 'usr_id',
    type: 'uuid',
    comment: '루틴 등록 사용자 ID',
  })
  usrId: string;

  @Column({
    name: 'ctg_id',
    type: 'uuid',
    comment: '카테고리 ID',
  })
  ctgId: string;

  @Column({
    name: 'rtn_nm',
    type: 'varchar',
    length: 100,
    comment: '루틴 내용',
  })
  rtnContent: string;

  @Column({
    name: 'rtn_desc',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '루틴 설명',
  })
  rtnDesc: string | null;

  @Column({
    name: 'rpt_type_cd',
    type: 'varchar',
    length: 10,
    comment: '반복 유형 코드',
  })
  rptTypeCd: RptType;

  @Column({
    name: 'start_dt',
    type: 'date',
    comment: '루틴 시작 일자',
  })
  startDt: string;

  @Column({
    name: 'end_dt',
    type: 'date',
    comment: '루틴 종료 일자',
  })
  endDt: string;

  @Column({
    name: 'alarm_time',
    type: 'time',
    nullable: true,
    comment: '알림 시간(NULL: 알림 없음)',
  })
  alarmTime: string | null;

  @Column({
    name: 'sort_order',
    type: 'smallint',
    default: 0,
    comment: '루틴 정렬 순서',
  })
  sortOrder: number;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
    comment: '논리 삭제 여부',
  })
  isDeleted: boolean;

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

  @ManyToOne(() => UsrEntity, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'usr_id', referencedColumnName: 'usrId' })
  usr: UsrEntity;

  @ManyToOne(() => CtgEntity, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'ctg_id', referencedColumnName: 'ctgId' })
  ctg: CtgEntity;

  @OneToMany(() => RtnRptEntity, (rtnRpt) => rtnRpt.rtn)
  rtnRpts: RtnRptEntity[];

  @OneToMany(() => TodoEntity, (todo) => todo.rtn)
  todos: TodoEntity[];
}
