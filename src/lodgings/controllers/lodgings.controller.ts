import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { LodgingsService } from '../lodgings.service';
import { CreateLodgingDto } from '../dto/create-lodging.dto';
import { UpdateLodgingDto } from '../dto/update-lodging.dto';
import { AvailabilityRangeDto } from '../dto/availability-range.dto';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { AdminLodgingsQueryDto } from '@lodgings/dto/pagination-query.dto';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';
import { LodgingResponseDto } from '@lodgings/dto/lodging-response.dto';
import { LodgingMapper } from '@lodgings/mappers/lodgings.mapper';
import { MEDIA_URL_BUILDER } from '@media/constants/media.tokens';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';
import {
  ApiAddOccupiedRangeDoc,
  ApiAdminLodgingsController,
  ApiCreateLodgingDoc,
  ApiDeleteLodgingDoc,
  ApiFindAdminLodgingByIdDoc,
  ApiFindAllAdminLodgingsDoc,
  ApiGetOccupiedRangesDoc,
  ApiRemoveOccupiedRangeDoc,
  ApiUpdateLodgingDoc,
} from '../swagger/lodgings-admin.swagger';

@ApiAdminLodgingsController()
@Controller('admin/lodgings')
@UseGuards(JwtAuthGuard)
export class LodgingsAdminController {
  constructor(
    private readonly lodgingsService: LodgingsService,
    @Inject(MEDIA_URL_BUILDER)
    private readonly mediaUrlBuilder: MediaUrlBuilder,
  ) {}

  @ApiCreateLodgingDoc()
  @Post()
  async create(
    @Body() dto: CreateLodgingDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingResponseDto> {
    const lodging = await this.lodgingsService.create(
      dto,
      req.user.ownerId,
      req.user.role,
    );

    return LodgingMapper.toResponse(lodging, this.mediaUrlBuilder);
  }

  @ApiFindAllAdminLodgingsDoc()
  @Get()
  async findAll(
    @Query() query: AdminLodgingsQueryDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<PaginatedResponse<LodgingResponseDto>> {
    const result = await this.lodgingsService.findAdminPaginated(
      query,
      req.user.ownerId,
      req.user.role,
    );

    return {
      ...result,
      data: result.data.map((lodging) =>
        LodgingMapper.toResponse(lodging, this.mediaUrlBuilder),
      ),
    };
  }

  @ApiFindAdminLodgingByIdDoc()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingResponseDto> {
    const lodging = await this.lodgingsService.findAdminById(
      id,
      req.user.ownerId,
      req.user.role,
    );

    return LodgingMapper.toResponse(lodging, this.mediaUrlBuilder);
  }

  @ApiUpdateLodgingDoc()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLodgingDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingResponseDto> {
    const lodging = await this.lodgingsService.update(
      id,
      dto,
      req.user.ownerId,
      req.user.role,
    );

    return LodgingMapper.toResponse(lodging, this.mediaUrlBuilder);
  }

  @ApiGetOccupiedRangesDoc()
  @Get(':id/occupied-ranges')
  getOccupiedRanges(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<AvailabilityRangeDto[]> {
    return this.lodgingsService.getOccupiedRanges(
      id,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiAddOccupiedRangeDoc()
  @Post(':id/occupied-ranges')
  addOccupiedRange(
    @Param('id') id: string,
    @Body() dto: AvailabilityRangeDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<AvailabilityRangeDto[]> {
    return this.lodgingsService.addOccupiedRange(
      id,
      dto,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiRemoveOccupiedRangeDoc()
  @Delete(':id/occupied-ranges')
  removeOccupiedRange(
    @Param('id') id: string,
    @Body() dto: AvailabilityRangeDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<AvailabilityRangeDto[]> {
    return this.lodgingsService.removeOccupiedRange(
      id,
      dto,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiDeleteLodgingDoc()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<{ deleted: boolean }> {
    return this.lodgingsService.remove(id, req.user.ownerId, req.user.role);
  }
}
