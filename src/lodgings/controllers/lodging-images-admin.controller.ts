import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { LodgingImagesService } from '@lodgings/services/lodging-images.service';
import { RequestLodgingImageUploadUrlDto } from '@lodgings/dto/request-lodging-image-upload-url.dto';
import { LodgingImageUploadUrlResponseDto } from '@lodgings/dto/lodging-image-upload-url-response.dto';
import { ConfirmLodgingImageDto } from '@lodgings/dto/confirm-lodging-image.dto';
import { ConfirmLodgingImageResponseDto } from '@lodgings/dto/confirm-lodging-image-response.dto';
import { SetDefaultLodgingImageResponseDto } from '@lodgings/dto/set-default-lodging-image-response.dto';
import { DeleteLodgingImageResponseDto } from '@lodgings/dto/delete-lodging-image-response.dto';
import {
  ApiConfirmLodgingImageUploadDoc,
  ApiCreateLodgingImageUploadUrlDoc,
  ApiDeleteLodgingImageDoc,
  ApiLodgingImagesAdminController,
  ApiSetDefaultLodgingImageDoc,
  ApiUploadLodgingImageFileDoc,
} from '../swagger/lodging-images-admin.swagger';
import type { UploadedImageFile } from '@media/interfaces/uploaded-image-file.interface';

@ApiLodgingImagesAdminController()
@Controller('admin/lodgings/:lodgingId/images')
@UseGuards(JwtAuthGuard)
export class LodgingImagesAdminController {
  constructor(private readonly lodgingImagesService: LodgingImagesService) {}

  @ApiCreateLodgingImageUploadUrlDoc()
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

  @ApiConfirmLodgingImageUploadDoc()
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

  @ApiUploadLodgingImageFileDoc()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @Param('lodgingId') lodgingId: string,
    @UploadedFile() file: UploadedImageFile,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ConfirmLodgingImageResponseDto> {
    return this.lodgingImagesService.uploadImageFile(
      lodgingId,
      file,
      req.user.ownerId,
      req.user.role,
    );
  }

  @ApiSetDefaultLodgingImageDoc()
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

  @ApiDeleteLodgingImageDoc()
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
