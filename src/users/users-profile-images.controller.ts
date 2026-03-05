import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@auth/guard/auth.guard';
import { RequestUser } from '@auth/interfaces/request-user.interface';
import { UserProfileImagesService } from '@users/services/user-profile-images.service';
import { RequestUserProfileImageUploadUrlDto } from '@users/dto/request-user-profile-image-upload-url.dto';
import { UserProfileImageUploadUrlResponseDto } from '@users/dto/user-profile-image-upload-url-response.dto';
import { ConfirmUserProfileImageDto } from '@users/dto/confirm-user-profile-image.dto';
import { ConfirmUserProfileImageResponseDto } from '@users/dto/confirm-user-profile-image-response.dto';
import { DeleteUserProfileImageResponseDto } from '@users/dto/delete-user-profile-image-response.dto';

@ApiTags('Admin - Users Profile Images')
@ApiBearerAuth('access-token')
@Controller('admin/users/:id/profile-image')
@UseGuards(JwtAuthGuard)
export class UsersProfileImagesController {
  constructor(
    private readonly userProfileImagesService: UserProfileImagesService,
  ) {}

  @ApiOperation({ summary: 'Generar URL firmada para imagen de perfil' })
  @Post('upload-url')
  createUploadUrl(
    @Param('id') userId: string,
    @Body() dto: RequestUserProfileImageUploadUrlDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<UserProfileImageUploadUrlResponseDto> {
    return this.userProfileImagesService.createUploadUrl(
      req.user.ownerId,
      userId,
      dto,
    );
  }

  @ApiOperation({
    summary: 'Subir imagen de perfil directo al backend',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('id') userId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number } | undefined,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ConfirmUserProfileImageResponseDto> {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    return this.userProfileImagesService.uploadProfileImage(
      req.user.ownerId,
      userId,
      file,
    );
  }

  @ApiOperation({ summary: 'Confirmar upload de imagen de perfil' })
  @Post('confirm')
  confirmUpload(
    @Param('id') userId: string,
    @Body() dto: ConfirmUserProfileImageDto,
    @Req() req: Request & { user: RequestUser },
  ): Promise<ConfirmUserProfileImageResponseDto> {
    return this.userProfileImagesService.confirmUpload(
      req.user.ownerId,
      userId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Eliminar imagen de perfil' })
  @Delete()
  deleteProfileImage(
    @Param('id') userId: string,
    @Req() req: Request & { user: RequestUser },
  ): Promise<DeleteUserProfileImageResponseDto> {
    return this.userProfileImagesService.deleteProfileImage(
      req.user.ownerId,
      userId,
    );
  }
}
