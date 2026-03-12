import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { LodgingImagesService } from '@lodgings/services/lodging-images.service';
import { RequestDraftLodgingImageUploadUrlDto } from '@lodgings/dto/request-draft-lodging-image-upload-url.dto';
import { LodgingImageUploadUrlResponseDto } from '@lodgings/dto/lodging-image-upload-url-response.dto';
import { ConfirmDraftLodgingImageDto } from '@lodgings/dto/confirm-draft-lodging-image.dto';
import { ConfirmDraftLodgingImageResponseDto } from '@lodgings/dto/confirm-draft-lodging-image-response.dto';
import {
  ApiConfirmDraftLodgingImageUploadDoc,
  ApiCreateDraftLodgingImageUploadUrlDoc,
  ApiLodgingDraftImageUploadsAdminController,
} from '@lodgings/swagger/lodging-draft-image-uploads-admin.swagger';

@ApiLodgingDraftImageUploadsAdminController()
@Controller('admin/lodging-image-uploads')
@UseGuards(JwtAuthGuard)
export class LodgingDraftImageUploadsAdminController {
  constructor(private readonly lodgingImagesService: LodgingImagesService) {}

  @ApiCreateDraftLodgingImageUploadUrlDoc()
  @Post('upload-url')
  createUploadUrl(
    @Body() dto: RequestDraftLodgingImageUploadUrlDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<LodgingImageUploadUrlResponseDto> {
    return this.lodgingImagesService.createDraftUploadUrl(
      dto,
      req.user.ownerId,
    );
  }

  @ApiConfirmDraftLodgingImageUploadDoc()
  @Post('confirm')
  confirmUpload(
    @Body() dto: ConfirmDraftLodgingImageDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ConfirmDraftLodgingImageResponseDto> {
    return this.lodgingImagesService.confirmDraftUpload(dto, req.user.ownerId);
  }
}
