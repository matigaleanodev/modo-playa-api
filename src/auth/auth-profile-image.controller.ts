import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from './guard/auth.guard';
import { RequestUser } from './interfaces/request-user.interface';
import { UserProfileImagesService } from '@users/services/user-profile-images.service';
import { RequestUserProfileImageUploadUrlDto } from '@users/dto/request-user-profile-image-upload-url.dto';
import { UserProfileImageUploadUrlResponseDto } from '@users/dto/user-profile-image-upload-url-response.dto';
import { ConfirmUserProfileImageDto } from '@users/dto/confirm-user-profile-image.dto';
import { ConfirmUserProfileImageResponseDto } from '@users/dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from '@users/dto/delete-user-profile-image-response.dto';
import { DomainException } from '@common/exceptions/domain.exception';
import { ERROR_CODES } from '@common/constants/error-code';
import {
  ApiAuthProfileImageController,
  ApiConfirmMyProfileImageUploadDoc,
  ApiCreateMyProfileImageUploadUrlDoc,
  ApiDeleteMyProfileImageDoc,
  ApiUploadMyProfileImageFileDoc,
} from './swagger/auth-profile-image.swagger';
import type { UploadedImageFile } from '@media/interfaces/uploaded-image-file.interface';

@ApiAuthProfileImageController()
@Controller('auth/me/profile-image')
@UseGuards(JwtAuthGuard)
export class AuthProfileImageController {
  constructor(
    private readonly userProfileImagesService: UserProfileImagesService,
  ) {}

  @ApiCreateMyProfileImageUploadUrlDoc()
  @Post('upload-url')
  createUploadUrl(
    @Body() dto: RequestUserProfileImageUploadUrlDto,
    @Request() req: { user: RequestUser },
  ): Promise<UserProfileImageUploadUrlResponseDto> {
    this.assertProfileImageAllowed(req.user);
    return this.userProfileImagesService.createUploadUrl(
      req.user.ownerId,
      req.user.userId,
      dto,
    );
  }

  @ApiConfirmMyProfileImageUploadDoc()
  @Post('confirm')
  confirmUpload(
    @Body() dto: ConfirmUserProfileImageDto,
    @Request() req: { user: RequestUser },
  ): Promise<ConfirmUserProfileImageResponseDto> {
    this.assertProfileImageAllowed(req.user);
    return this.userProfileImagesService.confirmUpload(
      req.user.ownerId,
      req.user.userId,
      dto,
    );
  }

  @ApiUploadMyProfileImageFileDoc()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadProfileImage(
    @UploadedFile() file: UploadedImageFile,
    @Request() req: { user: RequestUser },
  ): Promise<ConfirmUserProfileImageResponseDto> {
    this.assertProfileImageAllowed(req.user);
    return this.userProfileImagesService.uploadOwnProfileImageFile(
      req.user.ownerId,
      req.user.userId,
      file,
    );
  }

  @ApiDeleteMyProfileImageDoc()
  @Delete()
  deleteProfileImage(
    @Request() req: { user: RequestUser },
  ): Promise<DeleteUserProfileImageResponseDto> {
    this.assertProfileImageAllowed(req.user);
    return this.userProfileImagesService.deleteProfileImage(
      req.user.ownerId,
      req.user.userId,
    );
  }

  private assertProfileImageAllowed(user: RequestUser): void {
    if (user.role === 'SUPERADMIN') {
      throw new DomainException(
        'SUPERADMIN cannot manage profile images',
        ERROR_CODES.PROFILE_IMAGE_FORBIDDEN_FOR_SUPERADMIN,
        HttpStatus.FORBIDDEN,
      );
    }
  }
}
