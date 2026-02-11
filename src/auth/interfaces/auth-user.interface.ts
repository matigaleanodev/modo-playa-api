export interface AuthUserResponse {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  role: 'OWNER' | 'SUPERADMIN';
}
