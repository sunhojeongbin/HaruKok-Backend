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
import { RptType } from '../enums/rpt-type.enum';
import { RtnEntity } from './rtn.entity';

/**
 * @description 루틴 반복 설정 엔티티
 */
@Entity({ name: 'RTN_RPT', comment: '루틴 반복 설정' })
@Index('idx_rtn_rpt_01', ['rtnId', 'rptTypeCd'], {
  where: '"is_deleted" = false',
})
@Check('chk_rtn_rpt_type', `"rpt_type_cd" IN ('DAILY', 'WEEKLY', 'MONTHLY')`)
@Check('chk_rtn_rpt_day_of_week', '"day_of_week" BETWEEN 0 AND 6')
@Check('chk_rtn_rpt_day_of_mth', '"day_of_mth" BETWEEN 1 AND 31')
@Check(
  'chk_rtn_rpt_weekly',
  `"rpt_type_cd" <> 'WEEKLY' OR "day_of_week" IS NOT NULL`,
)
@Check(
  'chk_rtn_rpt_monthly',
  `"rpt_type_cd" <> 'MONTHLY' OR "day_of_mth" IS NOT NULL`,
)
@Check(
  'chk_rtn_rpt_daily',
  `"rpt_type_cd" <> 'DAILY' OR ("day_of_week" IS NULL AND "day_of_mth" IS NULL)`,
)
export class RtnRptEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'rtn_rpt_id',
    comment: '반복 설정 고유 식별자',
  })
  rtnRptId: string;

  @Column({
    name: 'rtn_id',
    type: 'uuid',
    comment: '대상 루틴 ID',
  })
  rtnId: string;

  @Column({
    name: 'rpt_type_cd',
    type: 'varchar',
    length: 10,
    comment: '반복 유형 코드',
  })
  rptTypeCd: RptType;

  @Column({
    name: 'day_of_week',
    type: 'smallint',
    nullable: true,
    comment: '요일 (0:일~6:토, WEEKLY만 사용)',
  })
  dayOfWeek: number | null;

  @Column({
    name: 'day_of_mth',
    type: 'smallint',
    nullable: true,
    comment: '반복 일자 (1~31, MONTHLY만 사용)',
  })
  dayOfMth: number | null;

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

  @ManyToOne(() => RtnEntity, (rtn) => rtn.rtnRpts, {
    onDelete: 'CASCADE',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'rtn_id', referencedColumnName: 'rtnId' })
  rtn: RtnEntity;
}
