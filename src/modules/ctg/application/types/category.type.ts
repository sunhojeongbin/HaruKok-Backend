import { VisibilityType } from '../../enums/visibility-type.enum';

export type CreateCategoryInput = {
  ctgName: string;
  visibility?: VisibilityType;
  colorCode?: string;
};

export type UpdateCategoryInput = {
  ctgName?: string;
  visibility?: VisibilityType;
  colorCode?: string;
  isEnded?: boolean;
};

/** @description 카테고리 응답 데이터 형식 */
export type CategoryResult = {
  ctgId: string;
  usrId: string;
  ctgName: string;
  visibility: VisibilityType;
  colorCode: string;
  sortOrder: number;
  isEnded: boolean;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
