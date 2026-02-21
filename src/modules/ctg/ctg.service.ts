import { Injectable, Optional } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { BusinessException } from '../../common/exceptions/business.exception';
import { CtgResponse } from '../../common/response/ctg.response';
import { CreateCtgDto } from './dtos/create-ctg.dto';
import { UpdateCtgDto } from './dtos/update-ctg.dto';
import { CtgEntity } from './entities/ctg.entity';
import { VisibilityType } from './enums/visibility-type.enum';
import { CtgRepository } from './repositories/ctg.repository';

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

@Injectable()
export class CtgService {
  constructor(
    @Optional()
    private readonly ctgRepository?: CtgRepository,
  ) {}

  private readonly MAX_CATEGORY_COUNT = 10;

  private getCtgRepository(): CtgRepository {
    if (!this.ctgRepository || !this.ctgRepository.isReady()) {
      throw new BusinessException(CtgResponse.CATEGORY_REPOSITORY_NOT_READY);
    }
    return this.ctgRepository;
  }

  private normalizeCategoryName(ctgName: string): string {
    return ctgName.trim();
  }

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

  async create(userId: string, dto: CreateCtgDto): Promise<CategoryResult> {
    const repo = this.getCtgRepository();
    const normalizedName = this.normalizeCategoryName(dto.ctgName);
    if (!normalizedName || normalizedName.length > 10) {
      throw new BusinessException(CtgResponse.CATEGORY_NAME_INVALID);
    }

    const categoryCount = await repo.countActiveByUserId(userId);
    if (categoryCount >= this.MAX_CATEGORY_COUNT) {
      throw new BusinessException(CtgResponse.CATEGORY_LIMIT_EXCEEDED);
    }

    const duplicated = await repo.findByUserAndName(userId, normalizedName);
    if (duplicated) {
      throw new BusinessException(CtgResponse.CATEGORY_NAME_DUPLICATED);
    }

    try {
      const category = await repo.createAndSave({
        usrId: userId,
        ctgName: normalizedName,
        visibility: dto.visibility ?? VisibilityType.FRIENDS,
        colorCode: dto.colorCode ?? '#000000',
        sortOrder: dto.sortOrder ?? 0,
      });

      return this.toCategoryResult(category);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = (
          error as QueryFailedError & { driverError?: { code?: string } }
        ).driverError;
        if (driverError?.code === '23505') {
          throw new BusinessException(CtgResponse.CATEGORY_NAME_DUPLICATED);
        }
      }
      throw new BusinessException(CtgResponse.CATEGORY_CREATE_FAILED);
    }
  }

  async update(
    userId: string,
    ctgId: string,
    dto: UpdateCtgDto,
  ): Promise<CategoryResult> {
    const repo = this.getCtgRepository();
    const category = await repo.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgResponse.CATEGORY_NOT_FOUND);
    }

    if (dto.ctgName !== undefined) {
      const normalizedName = this.normalizeCategoryName(dto.ctgName);
      if (!normalizedName || normalizedName.length > 10) {
        throw new BusinessException(CtgResponse.CATEGORY_NAME_INVALID);
      }

      if (normalizedName !== category.ctgName) {
        const duplicated = await repo.findByUserAndName(
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

    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    if (dto.isEnded !== undefined) {
      category.isEnded = dto.isEnded;
      category.endedAt = dto.isEnded ? new Date() : null;
    }

    try {
      const updated = await repo.save(category);
      return this.toCategoryResult(updated);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = (
          error as QueryFailedError & { driverError?: { code?: string } }
        ).driverError;
        if (driverError?.code === '23505') {
          throw new BusinessException(CtgResponse.CATEGORY_NAME_DUPLICATED);
        }
      }
      throw new BusinessException(CtgResponse.CATEGORY_UPDATE_FAILED);
    }
  }

  async delete(userId: string, ctgId: string): Promise<{ ctgId: string }> {
    const repo = this.getCtgRepository();
    const category = await repo.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgResponse.CATEGORY_NOT_FOUND);
    }

    category.isDeleted = true;
    category.deletedAt = new Date();

    try {
      await repo.save(category);
      return { ctgId };
    } catch {
      throw new BusinessException(CtgResponse.CATEGORY_DELETE_FAILED);
    }
  }

  async getById(userId: string, ctgId: string): Promise<CategoryResult> {
    const repo = this.getCtgRepository();
    const category = await repo.findByIdAndUser(ctgId, userId);
    if (!category) {
      throw new BusinessException(CtgResponse.CATEGORY_NOT_FOUND);
    }
    return this.toCategoryResult(category);
  }

  async getList(userId: string): Promise<CategoryResult[]> {
    const repo = this.getCtgRepository();
    const categories = await repo.findAllByUser(userId);
    return categories.map((category) => this.toCategoryResult(category));
  }
}
