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
import { CtgEntity } from '../../ctg/entities/ctg.entity';
import { RtnEntity } from '../../rtn/entities/rtn.entity';
import { UsrEntity } from '../../usr/entities/usr.entity';

/**
 * @description 투두 엔티티
 */
@Entity({ name: 'TODOS', comment: '투두 리스트 테이블' })
@Index('idx_todos_usr_date', ['usrId', 'todoDate'], {
  where: '"is_deleted" = false',
})
@Index('idx_todos_ctg_id', ['ctgId'], {
  where: '"is_deleted" = false AND "ctg_id" IS NOT NULL',
})
@Index('idx_todos_rtn_id', ['rtnId'], {
  where: '"is_deleted" = false AND "rtn_id" IS NOT NULL',
})
@Index('idx_todos_usr_date_completed', ['usrId', 'todoDate', 'isCompleted'], {
  where: '"is_deleted" = false',
})
@Check('chk_todo_content_not_blank', `btrim("content") <> ''`)
@Check('chk_todo_completed', 'NOT "is_completed" OR "completed_at" IS NOT NULL')
@Check('chk_todo_deleted', 'NOT "is_deleted" OR "deleted_at" IS NOT NULL')
export class TodoEntity {
  @PrimaryColumn({
    name: 'todo_id',
    type: 'uuid',
    default: () => 'gen_random_uuid()',
    comment: 'PK - 투두 고유 ID',
  })
  todoId: string;

  @Column({
    name: 'usr_id',
    type: 'uuid',
    comment: 'FK - 투두 작성자 사용자 ID',
  })
  usrId: string;

  @Column({
    name: 'ctg_id',
    type: 'uuid',
    nullable: true,
    comment: 'FK - 선택한 카테고리 ID (NULL: 미분류, 카테고리 삭제 시 NULL)',
  })
  ctgId: string | null;

  @Column({
    name: 'rtn_id',
    type: 'uuid',
    nullable: true,
    comment: 'FK - 연결된 루틴 ID (NULL: 일반 투두)',
  })
  rtnId: string | null;

  @Column({
    name: 'content',
    type: 'varchar',
    length: 255,
    comment: '투두 할 일 내용 (최대 255자)',
  })
  content: string;

  @Column({
    name: 'memo',
    type: 'text',
    nullable: true,
    comment: '투두 상세 메모 (선택 입력)',
  })
  memo: string | null;

  @Column({
    name: 'todo_date',
    type: 'date',
    comment: '해당 투두가 속한 날짜',
  })
  todoDate: string;

  @Column({
    name: 'is_completed',
    type: 'boolean',
    default: false,
    comment: '완료 여부 (TRUE: 완료 / FALSE: 미완료)',
  })
  isCompleted: boolean;

  @Column({
    name: 'completed_at',
    type: 'timestamptz',
    nullable: true,
    comment: '투두 완료 처리 일시',
  })
  completedAt: Date | null;

  @Column({
    name: 'sort_order',
    type: 'smallint',
    default: 0,
    comment: '같은 날짜 내 사용자 지정 정렬 순서',
  })
  sortOrder: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '투두 최초 생성 일시',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'NOW()',
    comment: '투두 마지막 수정 일시',
  })
  updatedAt: Date;

  @Column({
    name: 'is_deleted',
    type: 'boolean',
    default: false,
    comment: '소프트 삭제 여부 (TRUE: 삭제됨)',
  })
  isDeleted: boolean;

  @Column({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    comment: '소프트 삭제 처리 일시',
  })
  deletedAt: Date | null;

  @ManyToOne(() => UsrEntity, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'usr_id', referencedColumnName: 'usrId' })
  usr: UsrEntity;

  @ManyToOne(() => CtgEntity, { onDelete: 'SET NULL', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'ctg_id', referencedColumnName: 'ctgId' })
  ctg: CtgEntity | null;

  @ManyToOne(() => RtnEntity, (rtn) => rtn.todos, {
    onDelete: 'SET NULL',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'rtn_id', referencedColumnName: 'rtnId' })
  rtn: RtnEntity | null;
}
