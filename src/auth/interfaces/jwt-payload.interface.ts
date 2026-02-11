export interface JwtPayload {
  sub: string;
  ownerId: string;
  role?: 'OWNER' | 'SUPERADMIN';
  purpose?: TokenPurpose;
}
export type TokenPurpose = 'ACCESS' | 'PASSWORD_SETUP' | 'REFRESH';
