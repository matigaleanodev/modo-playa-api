import { AuthUserResponse } from './auth-user.interface';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
}
