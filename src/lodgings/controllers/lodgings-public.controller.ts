import { Controller, Get, Inject, Param, Query } from '@nestjs/common';

import { LodgingsService } from '../lodgings.service';
import { PublicLodgingsQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';
import {
  ApiFindAllPublicLodgingsDoc,
  ApiFindPublicLodgingByIdDoc,
  ApiPublicLodgingsController,
} from '../swagger/lodgings-public.swagger';
import { LodgingMapper } from '@lodgings/mappers/lodgings.mapper';
import { MEDIA_URL_BUILDER } from '@media/constants/media.tokens';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';
import { PublicLodgingResponseDto } from '@lodgings/dto/public-lodging-response.dto';

@ApiPublicLodgingsController()
@Controller('lodgings')
export class LodgingsPublicController {
  constructor(
    private readonly lodgingsService: LodgingsService,
    @Inject(MEDIA_URL_BUILDER)
    private readonly mediaUrlBuilder: MediaUrlBuilder,
  ) {}

  @ApiFindAllPublicLodgingsDoc()
  @Get()
  async findAll(
    @Query() query: PublicLodgingsQueryDto,
  ): Promise<PaginatedResponse<PublicLodgingResponseDto>> {
    const result = await this.lodgingsService.findPublicPaginated(query);

    return {
      ...result,
      data: result.data.map((lodging) =>
        LodgingMapper.toPublicResponse(lodging, this.mediaUrlBuilder),
      ),
    };
  }

  @ApiFindPublicLodgingByIdDoc()
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PublicLodgingResponseDto> {
    const lodging = await this.lodgingsService.findPublicById(id);
    return LodgingMapper.toPublicResponse(lodging, this.mediaUrlBuilder);
  }
}
