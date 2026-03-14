import {
  Body,
  Controller,
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
import { ConfirmDraftLodgingImageResponseDto } from '@lodgings/dto/confirm-draft-lodging-image-response.dto';
import {
  ApiLodgingDraftImageUploadsAdminController,
  ApiUploadDraftLodgingImageFileDoc,
} from '@lodgings/swagger/lodging-draft-image-uploads-admin.swagger';
import { UploadDraftLodgingImageFileDto } from '@lodgings/dto/upload-draft-lodging-image-file.dto';
import type { UploadedImageFile } from '@media/interfaces/uploaded-image-file.interface';

@ApiLodgingDraftImageUploadsAdminController()
@Controller('admin/lodging-image-uploads')
@UseGuards(JwtAuthGuard)
export class LodgingDraftImageUploadsAdminController {
  constructor(private readonly lodgingImagesService: LodgingImagesService) {}

  @ApiUploadDraftLodgingImageFileDoc()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: UploadedImageFile,
    @Body() dto: UploadDraftLodgingImageFileDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ConfirmDraftLodgingImageResponseDto> {
    return this.lodgingImagesService.uploadDraftImageFile(
      dto,
      file,
      req.user.ownerId,
    );
  }
}
