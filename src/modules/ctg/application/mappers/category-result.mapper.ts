import { CtgEntity } from '../../entities/ctg.entity';
import { CategoryResult } from '../types/category.type';

/** @description 카테고리 엔티티를 API 응답 객체로 변환한다. */
export function toCategoryResult(category: CtgEntity): CategoryResult {
  return {
    ctgId: category.ctgId,
    usrId: category.usrId,
    ctgName: category.ctgName,
    visibility: category.visibility,
    colorCode: category.colorCode,
    sortOrder: category.sortOrder,
    isEnded: category.isEnded,
    endedAt: category.endedAt,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}
