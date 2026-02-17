import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'USR', comment: '사용자 테이블' })
export class UsrEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'usr_id',
    comment: '사용자 ID',
  })
  usrId: string;

  @Column({
    name: 'usr_email',
    type: 'varchar',
    length: 254,
    nullable: true,
    unique: true,
    comment: '사용자 이메일',
  })
  usrEmail: string | null;

  @Column({
    name: 'usr_name',
    type: 'varchar',
    length: 50,
    comment: '사용자 이름',
  })
  usrName: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '비밀번호 알고리즘',
  })
  passwordHash: string | null;

  @Column({
    name: 'last_login_at',
    type: 'timestamp',
    nullable: true,
    comment: '마지막 로그인 시각',
  })
  lastLoginAt: Date | null;

  @Column({
    name: 'failed_login_cnt',
    type: 'integer',
    default: 0,
    comment: '로그인 실패 횟수',
  })
  failedLoginCnt: number;

  @Column({
    name: 'locked_until',
    type: 'timestamp',
    nullable: true,
    comment: '계정 잠금 해제 시각',
  })
  lockedUntil: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: '생성 시각',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: '수정 시각',
  })
  updatedAt: Date;

  @Column({
    name: 'created_by',
    type: 'uuid',
    nullable: true,
    comment: '생성자',
  })
  createdBy: string | null;

  @Column({
    name: 'updated_by',
    type: 'uuid',
    nullable: true,
    comment: '수정자',
  })
  updatedBy: string | null;

  @Column({
    name: 'accessToken',
    type: 'varchar',
    nullable: true,
    comment: '액세스 토큰',
  })
  accessToken: string | null;

  @Column({
    name: 'refresh_token',
    type: 'varchar',
    nullable: true,
    comment: '리프레시 토큰',
  })
  refreshToken: string | null;
}
