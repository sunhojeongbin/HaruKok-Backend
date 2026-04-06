import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../common/exceptions/business.exception';
import { CtgErrorCode } from '../errors/ctg-error-code';
import { CtgEntity } from '../entities/ctg.entity';
import { CtgCascadeRepositoryPort } from './ctg-cascade.repository.port';

@Injectable()
export class UnavailableCtgCascadeRepository
  implements CtgCascadeRepositoryPort
{
  async softDeleteAndReindex(_category: CtgEntity, _usrId: string): Promise<void> {
    throw new BusinessException(CtgErrorCode.CATEGORY_REPOSITORY_NOT_READY);
  }
}
