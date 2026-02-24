import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { LodgingImagesService } from '@lodgings/services/lodging-images.service';
import { RequestLodgingImageUploadUrlDto } from '@lodgings/dto/request-lodging-image-upload-url.dto';
import { LodgingImageUploadUrlResponseDto } from '@lodgings/dto/lodging-image-upload-url-response.dto';
import { ConfirmLodgingImageDto } from '@lodgings/dto/confirm-lodging-image.dto';
import { ConfirmLodgingImageResponseDto } from '@lodgings/dto/confirm-lodging-image-response.dto';
import { SetDefaultLodgingImageResponseDto } from '@lodgings/dto/set-default-lodging-image-response.dto';
import { DeleteLodgingImageResponseDto } from '@lodgings/dto/delete-lodging-image-response.dto';

@ApiTags('Admin - Lodgings Images')
@ApiBearerAuth('access-token')
@Controller('admin/lodgings/:lodgingId/images')
@UseGuards(JwtAuthGuard)
export class LodgingImagesAdminController {
  constructor(private readonly lodgingImagesService: LodgingImagesService) {}

  @ApiOperation({
    summary: 'Generar URL firmada para imagen de alojamiento',
  })
  @Post('upload-url')
  createUploadUrl(
    @Param('lodgingId') lodgingId: string,
    @Body() dto: RequestLodgingImageUploadUrlDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingImageUploadUrlResponseDto> {
    return this.lodgingImagesService.createUploadUrl(
      lodgingId,
      dto,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiOperation({
    summary: 'Confirmar upload de imagen de alojamiento',
  })
  @Post('confirm')
  confirmUpload(
    @Param('lodgingId') lodgingId: string,
    @Body() dto: ConfirmLodgingImageDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ConfirmLodgingImageResponseDto> {
    return this.lodgingImagesService.confirmUpload(
      lodgingId,
      dto,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiOperation({
    summary: 'Marcar imagen predeterminada',
  })
  @Patch(':imageId/default')
  setDefault(
    @Param('lodgingId') lodgingId: string,
    @Param('imageId') imageId: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<SetDefaultLodgingImageResponseDto> {
    return this.lodgingImagesService.setDefaultImage(
      lodgingId,
      imageId,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiOperation({
    summary: 'Eliminar imagen de alojamiento',
  })
  @Delete(':imageId')
  delete(
    @Param('lodgingId') lodgingId: string,
    @Param('imageId') imageId: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<DeleteLodgingImageResponseDto> {
    return this.lodgingImagesService.deleteImage(
      lodgingId,
      imageId,
      req.user.ownerId,
      req.user.role,
    );
  }
}
