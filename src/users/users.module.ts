import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { MediaModule } from '@media/media.module';
import { UsersProfileImagesController } from './users-profile-images.controller';
import { UserProfileImagesService } from './services/user-profile-images.service';

@Module({
  imports: [
    MediaModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UsersController, UsersProfileImagesController],
  providers: [UsersService, UserProfileImagesService],
  exports: [UsersService],
})
export class UsersModule {}
