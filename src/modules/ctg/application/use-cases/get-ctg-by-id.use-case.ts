import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
  CTG_REPOSITORY,
  CtgRepositoryPort,
} from '../ports/ctg.repository.port';
import { toCategoryResult } from '../mappers/category-result.mapper';
import { CategoryResult } from '../types/category.type';
import { CtgErrorCode } from '../../errors/ctg-error-code';

@Injectable()
export class GetCtgByIdUseCase {
  constructor(
    @Inject(CTG_REPOSITORY)
    private readonly ctgRepository: CtgRepositoryPort,
  ) {}

  async execute(userId: string, ctgId: string): Promise<CategoryResult> {
    const category = await this.ctgRepository.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgErrorCode.CATEGORY_NOT_FOUND);
    }
    return toCategoryResult(category);
  }
}
