import { CtgEntity } from '../../entities/ctg.entity';
import { VisibilityType } from '../../enums/visibility-type.enum';

export const CTG_REPOSITORY = Symbol('CTG_REPOSITORY');

/** @description 카테고리 생성(최대 개수 제한 포함) 파라미터 */
export type CreateCategoryWithLimitParams = {
  usrId: string;
  ctgName: string;
  visibility: VisibilityType;
  colorCode: string;
};

/** @description 카테고리 저장소 추상화 */
export interface CtgRepositoryPort {
  findByUserAndName(
    usrId: string,
    ctgName: string,
    excludeCtgId?: string,
  ): Promise<CtgEntity | null>;

  findByIdAndUser(ctgId: string, usrId: string): Promise<CtgEntity | null>;

  findAllByUser(usrId: string): Promise<CtgEntity[]>;

  createWithUserLimit(
    params: CreateCategoryWithLimitParams,
    maxCategoryCount: number,
  ): Promise<CtgEntity | null>;

  save(category: CtgEntity): Promise<CtgEntity>;

  saveMany(categories: CtgEntity[]): Promise<CtgEntity[]>;
}
