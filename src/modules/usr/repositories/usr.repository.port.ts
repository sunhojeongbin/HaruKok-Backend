import { UsrEntity } from '../entities/usr.entity';

export const USR_REPOSITORY = Symbol('USR_REPOSITORY');

export interface UsrRepositoryPort {
  isReady(): boolean;

  findByEmail(email: string): Promise<UsrEntity | null>;

  findActiveByEmail(email: string): Promise<UsrEntity | null>;

  findById(id: string): Promise<UsrEntity | null>;

  findActiveById(id: string): Promise<UsrEntity | null>;

  createAndSave(params: {
    usrEmail: string | null;
    usrNm: string;
    pwd: string | null;
    pwdHash: string | null;
    joinTypeCd?: string;
    usrStatCd?: string;
    usrRoleCd?: string;
  }): Promise<UsrEntity>;

  save(usr: UsrEntity): Promise<UsrEntity>;
}
