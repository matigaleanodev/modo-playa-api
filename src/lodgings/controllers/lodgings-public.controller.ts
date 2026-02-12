import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

import { LodgingsService } from '../lodgings.service';
import { PublicLodgingsQueryDto } from '../dto/pagination-query.dto';
import { Lodging } from '../schemas/lodging.schema';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';

import {
  PUBLIC_LODGING_RESPONSE_EXAMPLE,
  PUBLIC_PAGINATED_RESPONSE_EXAMPLE,
} from '../swagger/lodgings-public.swagger';

@ApiTags('Public - Lodgings')
@Controller('lodgings')
export class LodgingsPublicController {
  constructor(private readonly lodgingsService: LodgingsService) {}

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
  findAll(
    @Query() query: PublicLodgingsQueryDto,
  ): Promise<PaginatedResponse<Lodging>> {
    return this.lodgingsService.findPublicPaginated(query);
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
  findOne(@Param('id') id: string): Promise<Lodging> {
    return this.lodgingsService.findPublicById(id);
  }
}
