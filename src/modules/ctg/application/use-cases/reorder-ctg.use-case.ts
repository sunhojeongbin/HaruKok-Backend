import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CtgEntity } from '../../entities/ctg.entity';
import { CtgErrorCode } from '../../errors/ctg-error-code';
import { toCategoryResult } from '../mappers/category-result.mapper';
import {
  CTG_REPOSITORY,
  CtgRepositoryPort,
} from '../ports/ctg.repository.port';
import { CategoryResult } from '../types/category.type';

@Injectable()
export class ReorderCtgUseCase {
  constructor(
    @Inject(CTG_REPOSITORY)
    private readonly ctgRepository: CtgRepositoryPort,
  ) {}

  async execute(userId: string, ctgIds: string[]): Promise<CategoryResult[]> {
    const categories = await this.ctgRepository.findAllByUser(userId);
    if (ctgIds.length !== categories.length) {
      throw new BusinessException(CtgErrorCode.CATEGORY_ORDER_INVALID);
    }
    if (new Set(ctgIds).size !== ctgIds.length) {
      throw new BusinessException(CtgErrorCode.CATEGORY_ORDER_INVALID);
    }

    const categoryById = new Map(
      categories.map((category) => [category.ctgId, category]),
    );
    const reorderedCategories: CtgEntity[] = [];

    for (const ctgId of ctgIds) {
      const category = categoryById.get(ctgId);
      if (!category) {
        throw new BusinessException(CtgErrorCode.CATEGORY_ORDER_INVALID);
      }
      reorderedCategories.push(category);
    }

    for (let index = 0; index < reorderedCategories.length; index += 1) {
      reorderedCategories[index].sortOrder = index;
    }

    try {
      await this.ctgRepository.saveMany(reorderedCategories);
      return reorderedCategories.map((category) => toCategoryResult(category));
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(CtgErrorCode.CATEGORY_ORDER_UPDATE_FAILED);
    }
  }
}
