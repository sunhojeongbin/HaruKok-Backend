import { Inject, Injectable } from '@nestjs/common';
import {
  CTG_REPOSITORY,
  CtgRepositoryPort,
} from '../ports/ctg.repository.port';
import { toCategoryResult } from '../mappers/category-result.mapper';
import { CategoryResult } from '../types/category.type';

@Injectable()
export class GetCtgListUseCase {
  constructor(
    @Inject(CTG_REPOSITORY)
    private readonly ctgRepository: CtgRepositoryPort,
  ) {}

  async execute(userId: string): Promise<CategoryResult[]> {
    const categories = await this.ctgRepository.findAllByUser(userId);
    return categories.map((category) => toCategoryResult(category));
  }
}
