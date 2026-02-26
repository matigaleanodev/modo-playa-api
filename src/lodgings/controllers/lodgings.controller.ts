import {
  Controller,
  Get,
  Inject,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { LodgingsService } from '../lodgings.service';
import { CreateLodgingDto } from '../dto/create-lodging.dto';
import { UpdateLodgingDto } from '../dto/update-lodging.dto';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { AdminLodgingsQueryDto } from '@lodgings/dto/pagination-query.dto';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';
import { LodgingResponseDto } from '@lodgings/dto/lodging-response.dto';
import { LodgingMapper } from '@lodgings/mappers/lodgings.mapper';
import { MEDIA_URL_BUILDER } from '@media/constants/media.tokens';
import type { MediaUrlBuilder } from '@media/interfaces/media-url-builder.interface';

import {
  LODGING_RESPONSE_EXAMPLE,
  PAGINATED_LODGINGS_RESPONSE_EXAMPLE,
  DELETE_LODGING_RESPONSE_EXAMPLE,
} from '../swagger/lodgings-admin.swagger';

@ApiTags('Admin - Lodgings')
@ApiBearerAuth('access-token')
@Controller('admin/lodgings')
@UseGuards(JwtAuthGuard)
export class LodgingsAdminController {
  constructor(
    private readonly lodgingsService: LodgingsService,
    @Inject(MEDIA_URL_BUILDER)
    private readonly mediaUrlBuilder: MediaUrlBuilder,
  ) {}

  @ApiOperation({
    summary: 'Crear alojamiento',
    description: 'Crea un nuevo alojamiento asociado al owner autenticado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Alojamiento creado correctamente',
    schema: { example: LODGING_RESPONSE_EXAMPLE },
  })
  @Post()
  async create(
    @Body() dto: CreateLodgingDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingResponseDto> {
    const lodging = await this.lodgingsService.create(dto, req.user.ownerId);

    return LodgingMapper.toResponse(lodging, this.mediaUrlBuilder);
  }

  @ApiOperation({
    summary: 'Listar alojamientos (admin)',
    description:
      'Devuelve alojamientos del owner autenticado. SUPERADMIN puede ver todos.',
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
    description: 'Cantidad de registros por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado paginado de alojamientos',
    schema: { example: PAGINATED_LODGINGS_RESPONSE_EXAMPLE },
  })
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

  @ApiOperation({
    summary: 'Obtener alojamiento por ID (admin)',
    description:
      'Devuelve un alojamiento específico del owner. SUPERADMIN puede acceder a cualquiera.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del alojamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Alojamiento encontrado',
    schema: { example: LODGING_RESPONSE_EXAMPLE },
  })
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

  @ApiOperation({
    summary: 'Actualizar alojamiento',
    description:
      'Actualiza un alojamiento existente. Respeta reglas de owner y SUPERADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del alojamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Alojamiento actualizado',
    schema: { example: LODGING_RESPONSE_EXAMPLE },
  })
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

  @ApiOperation({
    summary: 'Eliminar alojamiento',
    description:
      'Realiza soft delete de un alojamiento. SUPERADMIN puede eliminar cualquier registro.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del alojamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Alojamiento eliminado',
    schema: { example: DELETE_LODGING_RESPONSE_EXAMPLE },
  })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<{ deleted: boolean }> {
    return this.lodgingsService.remove(id, req.user.ownerId, req.user.role);
  }
}
