import { Module } from '@nestjs/common';
import { AuthController } from '@auth/auth.controller';
import { AuthProfileImageController } from '@auth/auth-profile-image.controller';
import { AuthService } from '@auth/auth.service';
import { ContactsController } from '@contacts/contacts.controller';
import { ContactsService } from '@contacts/contacts.service';
import { DashboardController } from '../dashboard/dashboard.controller';
import { DashboardService } from '../dashboard/dashboard.service';
import { DestinationsController } from '../destinations/destinations.controller';
import { DestinationsService } from '../destinations/destinations.service';
import { LodgingImagesAdminController } from '../lodgings/controllers/lodging-images-admin.controller';
import { LodgingDraftImageUploadsAdminController } from '../lodgings/controllers/lodging-draft-image-uploads-admin.controller';
import { LodgingsPublicController } from '../lodgings/controllers/lodgings-public.controller';
import { LodgingsAdminController } from '../lodgings/controllers/lodgings.controller';
import { LodgingImagesService } from '../lodgings/services/lodging-images.service';
import { LodgingsService } from '../lodgings/lodgings.service';
import { MEDIA_URL_BUILDER } from '../media/constants/media.tokens';
import { MediaHealthController } from '../media/controllers/media-health.controller';
import { R2HealthService } from '../media/services/r2-health.service';
import { UserProfileImagesService } from '../users/services/user-profile-images.service';
import { UsersController } from '../users/users.controller';
import { UsersService } from '../users/users.service';

const noop = () => undefined;

@Module({
  controllers: [
    AuthController,
    AuthProfileImageController,
    ContactsController,
    DashboardController,
    DestinationsController,
    LodgingDraftImageUploadsAdminController,
    LodgingImagesAdminController,
    LodgingsPublicController,
    LodgingsAdminController,
    MediaHealthController,
    UsersController,
  ],
  providers: [
    {
      provide: AuthService,
      useValue: {
        requestActivation: noop,
        activate: noop,
        setPassword: noop,
        login: noop,
        refresh: noop,
        changePassword: noop,
        forgotPassword: noop,
        verifyResetCode: noop,
        resetPassword: noop,
        me: noop,
        updateMe: noop,
      },
    },
    {
      provide: ContactsService,
      useValue: {
        create: noop,
        findAll: noop,
        findOne: noop,
        update: noop,
        remove: noop,
      },
    },
    {
      provide: DashboardService,
      useValue: {
        getSummary: noop,
      },
    },
    {
      provide: DestinationsService,
      useValue: {
        getAll: noop,
        getContext: noop,
      },
    },
    {
      provide: LodgingImagesService,
      useValue: {
        uploadDraftImageFile: noop,
        uploadImageFile: noop,
        setDefaultImage: noop,
        deleteImage: noop,
      },
    },
    {
      provide: LodgingsService,
      useValue: {
        create: noop,
        findAdminPaginated: noop,
        findAdminById: noop,
        update: noop,
        getOccupiedRanges: noop,
        addOccupiedRange: noop,
        removeOccupiedRange: noop,
        remove: noop,
        findPublicPaginated: noop,
        findPublicById: noop,
      },
    },
    {
      provide: MEDIA_URL_BUILDER,
      useValue: {
        buildPublicUrl: noop,
        buildLodgingVariants: noop,
      },
    },
    {
      provide: R2HealthService,
      useValue: {
        testConnection: noop,
      },
    },
    {
      provide: UsersService,
      useValue: {
        createUser: noop,
        findAllByScope: noop,
        findById: noop,
        updateUser: noop,
      },
    },
    {
      provide: UserProfileImagesService,
      useValue: {
        uploadOwnProfileImageFile: noop,
        deleteProfileImage: noop,
      },
    },
  ],
})
export class OpenApiAppModule {}
