import {
  BadRequestException,
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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { LodgingsService } from '../lodgings.service';
import { CreateLodgingDto } from '../dto/create-lodging.dto';
import {
  CreateLodgingMultipartBodyDto,
  CreateLodgingWithImagesDto,
} from '../dto/create-lodging-with-images.dto';
import {
  UpdateLodgingMultipartBodyDto,
  UpdateLodgingWithImagesDto,
} from '../dto/update-lodging-with-images.dto';
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
    summary: 'Crear alojamiento con imágenes (flujo unificado)',
    description:
      'Crea un alojamiento y procesa imágenes en una sola transacción backend usando multipart/form-data.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['payload'],
      properties: {
        payload: {
          type: 'string',
          description: 'JSON serializado con el CreateLodgingWithImagesDto',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Alojamiento creado correctamente con imágenes procesadas',
    schema: { example: LODGING_RESPONSE_EXAMPLE },
  })
  @Post('with-images')
  @UseInterceptors(FilesInterceptor('images', 5))
  async createWithImages(
    @Body() body: CreateLodgingMultipartBodyDto,
    @UploadedFiles()
    files: Array<{ buffer: Buffer; mimetype: string; size: number }>,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingResponseDto> {
    const dto = this.parseMultipartPayload(body.payload);
    const lodging = await this.lodgingsService.createWithImages(
      dto,
      files,
      req.user.ownerId,
      req.user.role,
    );

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
    summary: 'Actualizar alojamiento con imágenes (flujo unificado)',
    description:
      'Actualiza el alojamiento y procesa nuevas imágenes en una sola llamada multipart/form-data.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['payload'],
      properties: {
        payload: {
          type: 'string',
          description: 'JSON serializado con UpdateLodgingWithImagesDto',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Alojamiento actualizado correctamente con imágenes procesadas',
    schema: { example: LODGING_RESPONSE_EXAMPLE },
  })
  @Patch(':id/with-images')
  @UseInterceptors(FilesInterceptor('images', 5))
  async updateWithImages(
    @Param('id') id: string,
    @Body() body: UpdateLodgingMultipartBodyDto,
    @UploadedFiles()
    files: Array<{ buffer: Buffer; mimetype: string; size: number }>,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingResponseDto> {
    const dto = this.parseMultipartUpdatePayload(body.payload);
    const lodging = await this.lodgingsService.updateWithImages(
      id,
      dto,
      files,
      req.user.ownerId,
      req.user.role,
    );

    return LodgingMapper.toResponse(lodging, this.mediaUrlBuilder);
  }

  @ApiOperation({
    summary: 'Obtener rangos ocupados del alojamiento',
    description: 'Devuelve los rangos ocupados (availability) del alojamiento.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del alojamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Rangos ocupados encontrados',
    type: [AvailabilityRangeDto],
  })
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

  @ApiOperation({
    summary: 'Agregar rango ocupado',
    description:
      'Agrega un rango ocupado normalizado a inicio del día y valida conflictos.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del alojamiento',
  })
  @ApiResponse({
    status: 201,
    description: 'Rango ocupado agregado',
    type: [AvailabilityRangeDto],
  })
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

  @ApiOperation({
    summary: 'Eliminar rango ocupado',
    description: 'Elimina un rango ocupado exacto del alojamiento.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID del alojamiento',
  })
  @ApiResponse({
    status: 200,
    description: 'Rango ocupado eliminado',
    type: [AvailabilityRangeDto],
  })
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

  private parseMultipartPayload(payload: string): CreateLodgingWithImagesDto {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new BadRequestException('Invalid payload JSON');
    }

    const dto = plainToInstance(CreateLodgingWithImagesDto, parsed);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return dto;
  }

  private parseMultipartUpdatePayload(payload: string): UpdateLodgingWithImagesDto {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      throw new BadRequestException('Invalid payload JSON');
    }

    const dto = plainToInstance(UpdateLodgingWithImagesDto, parsed);
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    return dto;
  }
}
