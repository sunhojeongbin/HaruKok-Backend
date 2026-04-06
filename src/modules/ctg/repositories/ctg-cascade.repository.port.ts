import { CtgEntity } from '../entities/ctg.entity';

export const CTG_CASCADE_REPOSITORY = Symbol('CTG_CASCADE_REPOSITORY');

export interface CtgCascadeRepositoryPort {
  softDeleteAndReindex(category: CtgEntity, usrId: string): Promise<void>;
}
