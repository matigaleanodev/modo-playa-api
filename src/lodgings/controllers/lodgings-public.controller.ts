import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { LodgingsService } from '../lodgings.service';
import { PublicLodgingsQueryDto } from '../dto/pagination-query.dto';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';

import {
  PUBLIC_LODGING_RESPONSE_EXAMPLE,
  PUBLIC_PAGINATED_RESPONSE_EXAMPLE,
} from '../swagger/lodgings-public.swagger';
import { LodgingMapper } from '@lodgings/mappers/lodgings.mapper';
import { LodgingResponseDto } from '@lodgings/dto/lodging-response.dto';
import { MEDIA_URL_BUILDER } from '@media/constants/media.tokens';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';

@ApiTags('Public - Lodgings')
@Controller('lodgings')
export class LodgingsPublicController {
  constructor(
    private readonly lodgingsService: LodgingsService,
    @Inject(MEDIA_URL_BUILDER)
    private readonly mediaUrlBuilder: MediaUrlBuilder,
  ) {}

  @ApiOperation({
    summary: 'Listar alojamientos públicos',
    description:
      'Devuelve alojamientos activos. Permite búsqueda por texto y filtrado por tags.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Número de página',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Cantidad de registros por página (máx 50)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Búsqueda por título, descripción o tags (insensible a mayúsculas)',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    type: [String],
    description: 'Filtrar por uno o más tags. Ej: ?tag=wifi&tag=parking',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de alojamientos públicos',
    schema: { example: PUBLIC_PAGINATED_RESPONSE_EXAMPLE },
  })
  @Get()
  async findAll(
    @Query() query: PublicLodgingsQueryDto,
  ): Promise<PaginatedResponse<LodgingResponseDto>> {
    const result = await this.lodgingsService.findPublicPaginated(query);

    return {
      ...result,
      data: result.data.map((lodging) =>
        LodgingMapper.toResponse(lodging, this.mediaUrlBuilder),
      ),
    };
  }

  @ApiOperation({
    summary: 'Obtener alojamiento público por ID',
    description:
      'Devuelve un alojamiento activo específico. Si no está activo, devuelve 404.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del alojamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Alojamiento encontrado',
    schema: { example: PUBLIC_LODGING_RESPONSE_EXAMPLE },
  })
  @ApiResponse({
    status: 404,
    description: 'Alojamiento no encontrado',
  })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<LodgingResponseDto> {
    const lodging = await this.lodgingsService.findPublicById(id);
    return LodgingMapper.toResponse(lodging, this.mediaUrlBuilder);
  }
}
