import { Inject, Injectable } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ResponseCode } from '../../common/response/response-code';
import { CtgResponse } from '../../common/response/ctg.response';
import { CreateCtgDto } from './dtos/create-ctg.dto';
import { UpdateCtgDto } from './dtos/update-ctg.dto';
import { CtgEntity } from './entities/ctg.entity';
import { VisibilityType } from './enums/visibility-type.enum';
import {
  CTG_REPOSITORY,
  CtgRepositoryPort,
} from './repositories/ctg.repository.port';

/** @description 카테고리 응답 데이터 형식 */
type CategoryResult = {
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

/** @description 카테고리 비즈니스 로직을 처리하는 서비스 */
@Injectable()
export class CtgService {
  constructor(
    @Inject(CTG_REPOSITORY)
    private readonly ctgRepository: CtgRepositoryPort,
  ) {}

  private readonly MAX_CATEGORY_COUNT = 10; // 사용자당 최대 카테고리 수 제한

  /**
   * @description 카테고리 이름의 앞뒤 공백을 제거 메소드
   * @param ctgName 정규화할 카테고리 이름
   * @returns 앞뒤 공백이 제거된 카테고리 이름
   */
  private normalizeCategoryName(ctgName: string): string {
    return ctgName.trim();
  }

  /** @description 저장소 예외를 도메인 예외로 변환 */
  private throwPersistenceException(
    error: unknown,
    fallbackResponse: ResponseCode,
  ): never {
    if (error instanceof BusinessException) {
      throw error;
    }

    if (error instanceof QueryFailedError) {
      const driverError = (
        error as QueryFailedError & { driverError?: { code?: string } }
      ).driverError;
      if (driverError?.code === '23505') {
        throw new BusinessException(CtgResponse.CATEGORY_NAME_DUPLICATED);
      }
    }

    throw new BusinessException(fallbackResponse);
  }

  /**
   * @description 엔티티를 API 응답 객체로 변환하는 메소드
   * @param category 변환할 카테고리 엔티티
   * @returns API 응답 형식으로 변환된 카테고리 정보
   */
  private toCategoryResult(category: CtgEntity): CategoryResult {
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

  /**
   * @description 카테고리를 생성하는 메소드
   * @param userId 사용자 ID
   * @param dto 생성할 카테고리 정보
   * @returns 생성된 카테고리 정보
   */
  async create(userId: string, dto: CreateCtgDto): Promise<CategoryResult> {
    const normalizedName = this.normalizeCategoryName(dto.ctgName);
    if (!normalizedName || normalizedName.length > 10) {
      throw new BusinessException(CtgResponse.CATEGORY_NAME_INVALID);
    }

    const duplicated = await this.ctgRepository.findByUserAndName(
      userId,
      normalizedName,
    );
    if (duplicated) {
      throw new BusinessException(CtgResponse.CATEGORY_NAME_DUPLICATED);
    }

    try {
      const category = await this.ctgRepository.createWithUserLimit(
        {
          usrId: userId,
          ctgName: normalizedName,
          visibility: dto.visibility ?? VisibilityType.FRIENDS,
          colorCode: dto.colorCode ?? '#000000',
        },
        this.MAX_CATEGORY_COUNT,
      );

      if (!category) {
        throw new BusinessException(CtgResponse.CATEGORY_LIMIT_EXCEEDED);
      }

      return this.toCategoryResult(category);
    } catch (error) {
      this.throwPersistenceException(error, CtgResponse.CATEGORY_CREATE_FAILED);
    }
  }

  /**
   * @description 카테고리 기본 정보를 수정하는 메소드
   * @param userId 사용자 ID
   * @param ctgId 수정할 카테고리 ID
   * @param dto 수정할 카테고리 정보
   * @returns 수정된 카테고리 정보
   */
  async update(
    userId: string,
    ctgId: string,
    dto: UpdateCtgDto,
  ): Promise<CategoryResult> {
    const category = await this.ctgRepository.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgResponse.CATEGORY_NOT_FOUND);
    }

    if (dto.ctgName !== undefined) {
      const normalizedName = this.normalizeCategoryName(dto.ctgName);
      if (!normalizedName || normalizedName.length > 10) {
        throw new BusinessException(CtgResponse.CATEGORY_NAME_INVALID);
      }

      if (normalizedName !== category.ctgName) {
        const duplicated = await this.ctgRepository.findByUserAndName(
          userId,
          normalizedName,
          ctgId,
        );
        if (duplicated) {
          throw new BusinessException(CtgResponse.CATEGORY_NAME_DUPLICATED);
        }
      }

      category.ctgName = normalizedName;
    }

    if (dto.visibility !== undefined) {
      category.visibility = dto.visibility;
    }

    if (dto.colorCode !== undefined) {
      category.colorCode = dto.colorCode;
    }

    if (dto.isEnded !== undefined) {
      category.isEnded = dto.isEnded;
      category.endedAt = dto.isEnded ? new Date() : null;
    }

    try {
      const updated = await this.ctgRepository.save(category);
      return this.toCategoryResult(updated);
    } catch (error) {
      this.throwPersistenceException(error, CtgResponse.CATEGORY_UPDATE_FAILED);
    }
  }

  /**
   * @description 카테고리와 연관 데이터(루틴/반복설정/투두)를 소프트 삭제하고 남은 카테고리 순서를 재정렬하는 메소드
   * @param userId 사용자 ID
   * @param ctgId 삭제할 카테고리 ID
   * @returns 삭제된 카테고리 ID
   */
  async delete(userId: string, ctgId: string): Promise<{ ctgId: string }> {
    const category = await this.ctgRepository.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgResponse.CATEGORY_NOT_FOUND);
    }

    category.isDeleted = true;
    category.deletedAt = new Date();

    try {
      await this.ctgRepository.softDeleteAndReindex(category, userId);
      return { ctgId };
    } catch {
      throw new BusinessException(CtgResponse.CATEGORY_DELETE_FAILED);
    }
  }

  /**
   * @description 카테고리 단건 정보를 조회하는 메소드
   * @param userId 사용자 ID
   * @param ctgId 조회할 카테고리 ID
   * @returns 조회된 카테고리 정보
   */
  async getById(userId: string, ctgId: string): Promise<CategoryResult> {
    const category = await this.ctgRepository.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgResponse.CATEGORY_NOT_FOUND);
    }
    return this.toCategoryResult(category);
  }

  /**
   * @description 사용자 카테고리 목록을 정렬 순서 기준으로 조회하는 메소드
   * @param userId 사용자 ID
   * @returns 조회된 카테고리 목록
   */
  async getList(userId: string): Promise<CategoryResult[]> {
    const categories = await this.ctgRepository.findAllByUser(userId);
    return categories.map((category) => this.toCategoryResult(category));
  }

  /**
   * @description 전달받은 카테고리 ID 배열 순서대로 정렬 순서를 일괄 재배치하는 메소드
   * @param userId 사용자 ID
   * @param ctgIds 정렬 순서대로 재배치할 카테고리 ID 배열
   * @returns 재배치된 카테고리 목록
   */
  async reorder(userId: string, ctgIds: string[]): Promise<CategoryResult[]> {
    const categories = await this.ctgRepository.findAllByUser(userId);
    if (ctgIds.length !== categories.length) {
      throw new BusinessException(CtgResponse.CATEGORY_ORDER_INVALID);
    }
    if (new Set(ctgIds).size !== ctgIds.length) {
      throw new BusinessException(CtgResponse.CATEGORY_ORDER_INVALID);
    }

    const categoryById = new Map(
      categories.map((category) => [category.ctgId, category]),
    );
    const reorderedCategories: CtgEntity[] = [];

    for (const ctgId of ctgIds) {
      const category = categoryById.get(ctgId);
      if (!category) {
        throw new BusinessException(CtgResponse.CATEGORY_ORDER_INVALID);
      }
      reorderedCategories.push(category);
    }

    for (let i = 0; i < reorderedCategories.length; i += 1) {
      reorderedCategories[i].sortOrder = i;
    }

    try {
      await this.ctgRepository.saveMany(reorderedCategories);
      return reorderedCategories.map((category) =>
        this.toCategoryResult(category),
      );
    } catch {
      throw new BusinessException(CtgResponse.CATEGORY_ORDER_UPDATE_FAILED);
    }
  }
}
