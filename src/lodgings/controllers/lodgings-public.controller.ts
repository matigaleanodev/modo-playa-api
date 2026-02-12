import { Controller, Get, Param, Query } from '@nestjs/common';
import { LodgingsService } from '../lodgings.service';
import { PublicLodgingsQueryDto } from '../dto/pagination-query.dto';

@Controller('lodgings')
export class LodgingsPublicController {
  constructor(private readonly lodgingsService: LodgingsService) {}

  @Get()
  findAll(@Query() query: PublicLodgingsQueryDto) {
    return this.lodgingsService.findPublicPaginated(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lodgingsService.findPublicById(id);
  }
}
