import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CategoryResult, UpdateCategoryInput } from '../types/category.type';
import {
  CTG_REPOSITORY,
  CtgRepositoryPort,
} from '../ports/ctg.repository.port';
import { normalizeCategoryName } from '../../domain/policies/ctg-name.policy';
import { toCategoryResult } from '../mappers/category-result.mapper';
import { throwCtgPersistenceException } from '../policies/ctg-persistence-error.policy';
import { CtgErrorCode } from '../../errors/ctg-error-code';

@Injectable()
export class UpdateCtgUseCase {
  constructor(
    @Inject(CTG_REPOSITORY)
    private readonly ctgRepository: CtgRepositoryPort,
  ) {}

  async execute(
    userId: string,
    ctgId: string,
    input: UpdateCategoryInput,
  ): Promise<CategoryResult> {
    const category = await this.ctgRepository.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgErrorCode.CATEGORY_NOT_FOUND);
    }

    if (input.ctgName !== undefined) {
      const normalizedName = normalizeCategoryName(input.ctgName);
      if (!normalizedName || normalizedName.length > 10) {
        throw new BusinessException(CtgErrorCode.CATEGORY_NAME_INVALID);
      }

      if (normalizedName !== category.ctgName) {
        const duplicated = await this.ctgRepository.findByUserAndName(
          userId,
          normalizedName,
          ctgId,
        );
        if (duplicated) {
          throw new BusinessException(CtgErrorCode.CATEGORY_NAME_DUPLICATED);
        }
      }

      category.ctgName = normalizedName;
    }

    if (input.visibility !== undefined) {
      category.visibility = input.visibility;
    }

    if (input.colorCode !== undefined) {
      category.colorCode = input.colorCode;
    }

    if (input.isEnded !== undefined) {
      category.isEnded = input.isEnded;
      category.endedAt = input.isEnded ? new Date() : null;
    }

    try {
      const updated = await this.ctgRepository.save(category);
      return toCategoryResult(updated);
    } catch (error) {
      throwCtgPersistenceException(error, CtgErrorCode.CATEGORY_UPDATE_FAILED);
    }
  }
}
