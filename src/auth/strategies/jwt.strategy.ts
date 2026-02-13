import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@auth/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SECRET_KEY', 'SECRET_KEY'),
    });
    console.log('SECRET', this.configService.get('SECRET_KEY'));
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      ownerId: payload.ownerId,
      role: payload.role ?? 'OWNER',
      purpose: payload.purpose ?? 'ACCESS',
    };
  }
}
