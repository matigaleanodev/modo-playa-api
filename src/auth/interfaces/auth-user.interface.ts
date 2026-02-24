export interface AuthUserProfileImageResponse {
  imageId: string;
  key: string;
  width?: number;
  height?: number;
  bytes?: number;
  mime?: string;
  createdAt: string;
  url: string;
  variants?: {
    thumb: string;
    card: string;
    hero: string;
  };
}

export interface AuthUserResponse {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  profileImage?: AuthUserProfileImageResponse;
  phone?: string;
  role: 'OWNER' | 'SUPERADMIN';
}
