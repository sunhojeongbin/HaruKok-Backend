import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
  CTG_REPOSITORY,
  CtgRepositoryPort,
} from '../ports/ctg.repository.port';
import { throwCtgPersistenceException } from '../policies/ctg-persistence-error.policy';
import { CategoryResult, CreateCategoryInput } from '../types/category.type';
import { normalizeCategoryName } from '../../domain/policies/ctg-name.policy';
import { toCategoryResult } from '../mappers/category-result.mapper';
import { VisibilityType } from '../../enums/visibility-type.enum';
import { CtgErrorCode } from '../../errors/ctg-error-code';

@Injectable()
export class CreateCtgUseCase {
  constructor(
    @Inject(CTG_REPOSITORY)
    private readonly ctgRepository: CtgRepositoryPort,
  ) {}

  private readonly MAX_CATEGORY_COUNT = 10;

  async execute(
    userId: string,
    input: CreateCategoryInput,
  ): Promise<CategoryResult> {
    const normalizedName = normalizeCategoryName(input.ctgName);
    if (!normalizedName || normalizedName.length > 10) {
      throw new BusinessException(CtgErrorCode.CATEGORY_NAME_INVALID);
    }

    const duplicated = await this.ctgRepository.findByUserAndName(
      userId,
      normalizedName,
    );
    if (duplicated) {
      throw new BusinessException(CtgErrorCode.CATEGORY_NAME_DUPLICATED);
    }

    try {
      const category = await this.ctgRepository.createWithUserLimit(
        {
          usrId: userId,
          ctgName: normalizedName,
          visibility: input.visibility ?? VisibilityType.FRIENDS,
          colorCode: input.colorCode ?? '#000000',
        },
        this.MAX_CATEGORY_COUNT,
      );

      if (!category) {
        throw new BusinessException(CtgErrorCode.CATEGORY_LIMIT_EXCEEDED);
      }

      return toCategoryResult(category);
    } catch (error) {
      throwCtgPersistenceException(error, CtgErrorCode.CATEGORY_CREATE_FAILED);
    }
  }
}
