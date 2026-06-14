import { UsrEntity } from '../entities/usr.entity';
import { TodoDashboardMetrics } from '../application/types/usr-dashboard.type';

export const USR_REPOSITORY = Symbol('USR_REPOSITORY');

export interface UsrRepositoryPort {
  isReady(): boolean;

  findByEmail(email: string): Promise<UsrEntity | null>;

  findActiveByEmail(email: string): Promise<UsrEntity | null>;

  findById(id: string): Promise<UsrEntity | null>;

  findActiveById(id: string): Promise<UsrEntity | null>;

  countAcceptedFrds(userId: string): Promise<number>;

  getTodoDashboardMetrics(params: {
    usrId: string;
    monthStartDt: string;
    monthEndDt: string;
  }): Promise<TodoDashboardMetrics>;

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

  hardDeleteById(userId: string): Promise<void>;
}
