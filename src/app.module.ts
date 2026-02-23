import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { LodgingsModule } from './lodgings/lodgings.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsModule } from './contacts/contacts.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    LodgingsModule,
    ContactsModule,
    UsersModule,
    AuthModule,
    MailModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
