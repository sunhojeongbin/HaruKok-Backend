import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import {
  CTG_CASCADE_REPOSITORY,
  CtgCascadeRepositoryPort,
} from '../ports/ctg-cascade.repository.port';
import {
  CTG_REPOSITORY,
  CtgRepositoryPort,
} from '../ports/ctg.repository.port';
import { CtgErrorCode } from '../../errors/ctg-error-code';

@Injectable()
export class DeleteCtgUseCase {
  constructor(
    @Inject(CTG_REPOSITORY)
    private readonly ctgRepository: CtgRepositoryPort,
    @Inject(CTG_CASCADE_REPOSITORY)
    private readonly ctgCascadeRepository: CtgCascadeRepositoryPort,
  ) {}

  async execute(userId: string, ctgId: string): Promise<{ ctgId: string }> {
    const category = await this.ctgRepository.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgErrorCode.CATEGORY_NOT_FOUND);
    }

    category.isDeleted = true;
    category.deletedAt = new Date();

    try {
      await this.ctgCascadeRepository.softDeleteAndReindex(category, userId);
      return { ctgId };
    } catch (err) {
      if (err instanceof BusinessException) {
        throw err;
      }
      throw new BusinessException(CtgErrorCode.CATEGORY_DELETE_FAILED);
    }
  }
}
