import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { MediaModule } from '@media/media.module';
import { UserProfileImagesService } from './services/user-profile-images.service';

@Module({
  imports: [
    MediaModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserProfileImagesService],
  exports: [UsersService, UserProfileImagesService],
})
export class UsersModule {}
