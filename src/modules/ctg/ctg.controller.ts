import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CtgResponse } from '../../common/response/ctg.response';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { CreateCtgDto } from './dtos/create-ctg.dto';
import { UpdateCtgDto } from './dtos/update-ctg.dto';
import { CtgService } from './ctg.service';

@ApiTags('카테고리')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ctg')
export class CtgController {
  constructor(private readonly ctgService: CtgService) {}

  private getUserId(req: { user?: { userId?: string } }): string {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('인증에 실패했습니다.');
    }
    return userId;
  }

  @Post()
  @ApiOperation({ summary: '카테고리 생성' })
  @ApiBody({
    type: CreateCtgDto,
    examples: {
      default: {
        value: {
          ctgName: '운동',
          visibility: 'FRIENDS',
          colorCode: '#FF5733',
          sortOrder: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '카테고리 생성 성공',
  })
  async create(
    @Request() req: { user?: { userId?: string } },
    @Body() dto: CreateCtgDto,
  ) {
    const ctg = await this.ctgService.create(this.getUserId(req), dto);
    return ApiResponseDto.success(
      ctg,
      CtgResponse.CATEGORY_CREATE_SUCCESS.message,
      CtgResponse.CATEGORY_CREATE_SUCCESS.httpCode,
    );
  }

  @Get()
  @ApiOperation({ summary: '카테고리 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 목록 조회 성공',
  })
  async getList(@Request() req: { user?: { userId?: string } }) {
    const ctgs = await this.ctgService.getList(this.getUserId(req));
    return ApiResponseDto.success(
      ctgs,
      CtgResponse.CATEGORY_LIST_SUCCESS.message,
      CtgResponse.CATEGORY_LIST_SUCCESS.httpCode,
    );
  }

  @Get(':ctgId')
  @ApiOperation({ summary: '카테고리 단건 조회' })
  @ApiResponse({
    status: 200,
    description: '카테고리 조회 성공',
  })
  async getById(
    @Request() req: { user?: { userId?: string } },
    @Param('ctgId', ParseUUIDPipe) ctgId: string,
  ) {
    const ctg = await this.ctgService.getById(this.getUserId(req), ctgId);
    return ApiResponseDto.success(
      ctg,
      CtgResponse.CATEGORY_GET_SUCCESS.message,
      CtgResponse.CATEGORY_GET_SUCCESS.httpCode,
    );
  }

  @Patch(':ctgId')
  @ApiOperation({ summary: '카테고리 수정' })
  @ApiBody({
    type: UpdateCtgDto,
    examples: {
      default: {
        value: {
          ctgName: '독서',
          visibility: 'PRIVATE',
          colorCode: '#33AAFF',
          sortOrder: 2,
          isEnded: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '카테고리 수정 성공',
  })
  async update(
    @Request() req: { user?: { userId?: string } },
    @Param('ctgId', ParseUUIDPipe) ctgId: string,
    @Body() dto: UpdateCtgDto,
  ) {
    const ctg = await this.ctgService.update(this.getUserId(req), ctgId, dto);
    return ApiResponseDto.success(
      ctg,
      CtgResponse.CATEGORY_UPDATE_SUCCESS.message,
      CtgResponse.CATEGORY_UPDATE_SUCCESS.httpCode,
    );
  }

  @Delete(':ctgId')
  @HttpCode(200)
  @ApiOperation({ summary: '카테고리 삭제 (소프트 삭제)' })
  @ApiResponse({
    status: 200,
    description: '카테고리 삭제 성공',
  })
  async delete(
    @Request() req: { user?: { userId?: string } },
    @Param('ctgId', ParseUUIDPipe) ctgId: string,
  ) {
    const deleted = await this.ctgService.delete(this.getUserId(req), ctgId);
    return ApiResponseDto.success(
      deleted,
      CtgResponse.CATEGORY_DELETE_SUCCESS.message,
      CtgResponse.CATEGORY_DELETE_SUCCESS.httpCode,
    );
  }
}
