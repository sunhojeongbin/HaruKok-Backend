import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'USR' })
export class UsrEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'usr_id' })
  usrId: string;

  @Column({
    name: 'usr_email',
    type: 'varchar',
    length: 254,
    nullable: true,
    unique: true,
  })
  usrEmail: string | null;

  @Column({ name: 'usr_name', type: 'varchar', length: 50 })
  usrName: string;

  @Column({ name: 'password', type: 'varchar', length: 254 })
  password: string;
}
