import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../../common/exceptions/business.exception';
import { CtgErrorCode } from '../../errors/ctg-error-code';
import { CtgEntity } from '../../entities/ctg.entity';
import { CtgCascadeRepositoryPort } from '../../application/ports/ctg-cascade.repository.port';

@Injectable()
export class UnavailableCtgCascadeRepository implements CtgCascadeRepositoryPort {
  softDeleteAndReindex(category: CtgEntity, usrId: string): Promise<void> {
    void category;
    void usrId;
    throw new BusinessException(CtgErrorCode.CATEGORY_REPOSITORY_NOT_READY);
  }
}
