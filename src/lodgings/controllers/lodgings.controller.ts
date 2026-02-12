import {
  Controller,
  Get,
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
import { LodgingsService } from '../lodgings.service';
import { CreateLodgingDto } from '../dto/create-lodging.dto';
import { UpdateLodgingDto } from '../dto/update-lodging.dto';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { AdminLodgingsQueryDto } from '@lodgings/dto/pagination-query.dto';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { Lodging } from '../schemas/lodging.schema';
import { PaginatedResponse } from '@common/interfaces/pagination-response.interface';

@Controller('admin/lodgings')
@UseGuards(JwtAuthGuard)
export class LodgingsAdminController {
  constructor(private readonly lodgingsService: LodgingsService) {}

  @Post()
  create(
    @Body() dto: CreateLodgingDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Lodging> {
    return this.lodgingsService.create(dto, req.user.ownerId);
  }

  @Get()
  findAll(
    @Query() query: AdminLodgingsQueryDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<PaginatedResponse<Lodging>> {
    return this.lodgingsService.findAdminPaginated(
      query,
      req.user.ownerId,
      req.user.role,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Lodging> {
    return this.lodgingsService.findAdminById(
      id,
      req.user.ownerId,
      req.user.role,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLodgingDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<Lodging> {
    return this.lodgingsService.update(
      id,
      dto,
      req.user.ownerId,
      req.user.role,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<{ deleted: boolean }> {
    return this.lodgingsService.remove(id, req.user.ownerId, req.user.role);
  }
}
