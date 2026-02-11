import { TokenPurpose } from './jwt-payload.interface';

export interface RequestUser {
  userId: string;
  ownerId: string;
  role: 'OWNER' | 'SUPERADMIN';
  purpose: TokenPurpose;
}
