import { BusinessException } from '../../../../common/exceptions/business.exception';
import { RtnErrorCode } from '../../errors/rtn-error-code';
import { RtnRepositoryPort } from '../ports/rtn.repository.port';

/** @description 사용자 소유의 활성 카테고리인지 검증한다. */
export async function ensureOwnedRoutineCategory(
  rtnRepository: RtnRepositoryPort,
  userId: string,
  ctgId: string,
): Promise<void> {
  const isOwnedCategory = await rtnRepository.isCategoryOwnedByUser(
    userId,
    ctgId,
  );
  if (!isOwnedCategory) {
    throw new BusinessException(RtnErrorCode.ROUTINE_CATEGORY_NOT_FOUND);
  }
}
