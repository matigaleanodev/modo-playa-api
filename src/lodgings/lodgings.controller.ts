import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { LodgingsService } from './lodgings.service';
import { CreateLodgingDto } from './dto/create-lodging.dto';
import { UpdateLodgingDto } from './dto/update-lodging.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('lodgings')
export class LodgingsController {
  constructor(private readonly lodgingsService: LodgingsService) {}

  @Post()
  create(@Body() createLodgingDto: CreateLodgingDto) {
    return this.lodgingsService.create(createLodgingDto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.lodgingsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.lodgingsService.findOne(id, query.includeInactive);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLodgingDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.lodgingsService.update(id, dto, query.includeInactive);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.lodgingsService.remove(id, query.includeInactive);
  }
}
