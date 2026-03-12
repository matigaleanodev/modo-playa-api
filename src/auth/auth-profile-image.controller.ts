import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './guard/auth.guard';
import { RequestUser } from './interfaces/request-user.interface';
import { UserProfileImagesService } from '@users/services/user-profile-images.service';
import { RequestUserProfileImageUploadUrlDto } from '@users/dto/request-user-profile-image-upload-url.dto';
import { UserProfileImageUploadUrlResponseDto } from '@users/dto/user-profile-image-upload-url-response.dto';
import { ConfirmUserProfileImageDto } from '@users/dto/confirm-user-profile-image.dto';
import { ConfirmUserProfileImageResponseDto } from '@users/dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from '@users/dto/delete-user-profile-image-response.dto';
import {
  ApiAuthProfileImageController,
  ApiConfirmMyProfileImageUploadDoc,
  ApiCreateMyProfileImageUploadUrlDoc,
  ApiDeleteMyProfileImageDoc,
} from './swagger/auth-profile-image.swagger';

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
    return this.userProfileImagesService.confirmUpload(
      req.user.ownerId,
      req.user.userId,
      dto,
    );
  }

  @ApiDeleteMyProfileImageDoc()
  @Delete()
  deleteProfileImage(
    @Request() req: { user: RequestUser },
  ): Promise<DeleteUserProfileImageResponseDto> {
    return this.userProfileImagesService.deleteProfileImage(
      req.user.ownerId,
      req.user.userId,
    );
  }
}
