export const identifierRequestExample = {
  identifier: 'owner@modoplaya.app',
};

export const activateRequestExample = {
  identifier: 'owner@modoplaya.app',
  code: '123456',
};

export const loginRequestExample = {
  identifier: 'owner@modoplaya.app',
  password: 'Password123',
};

export const setInitialPasswordRequestExample = {
  password: 'Password123',
};

export const changePasswordRequestExample = {
  currentPassword: 'Password123',
  newPassword: 'Password456',
};

export const verifyResetCodeRequestExample = {
  identifier: 'owner@modoplaya.app',
  code: '123456',
};

export const resetPasswordRequestExample = {
  password: 'Password456',
};

export const updateMeRequestExample = {
  firstName: 'Juan',
  lastName: 'Perez',
  displayName: 'Juan Perez',
  phone: '+5492255123456',
};

export const authTokenResponseExample = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export const authUserProfileImageExample = {
  imageId: '244e45ae-bdb3-407b-adf2-ade015e1a5ef',
  key: 'users/699c9b30436edbee481101be/profile/original.webp',
  width: 1080,
  height: 1080,
  bytes: 185311,
  mime: 'image/webp',
  createdAt: '2026-01-01T10:00:00.000Z',
  url: 'https://media.example.com/users/699c9b30436edbee481101be/profile/original.webp',
  variants: {
    thumb:
      'https://media.example.com/cdn-cgi/image/width=320,height=320,fit=cover,quality=80,format=auto/users/699c9b30436edbee481101be/profile/original.webp',
    card: 'https://media.example.com/cdn-cgi/image/width=640,height=640,fit=cover,quality=82,format=auto/users/699c9b30436edbee481101be/profile/original.webp',
    hero: 'https://media.example.com/cdn-cgi/image/width=1200,height=1200,fit=cover,quality=85,format=auto/users/699c9b30436edbee481101be/profile/original.webp',
  },
};

export const authUserResponseExample = {
  id: '65f1c2d9a2b5c9f1a2b3c4d5',
  email: 'owner@modoplaya.app',
  username: 'owner',
  firstName: 'Juan',
  lastName: 'Perez',
  displayName: 'Juan Perez',
  avatarUrl: null,
  profileImage: authUserProfileImageExample,
  phone: '+5492255123456',
  role: 'OWNER',
};

export const authLoginResponseExample = {
  accessToken: 'access.token.here',
  refreshToken: 'refresh.token.here',
  user: authUserResponseExample,
};

export const forgotPasswordResponseExample = {
  message: 'If the user exists, a verification code has been sent.',
};

export const requestActivationResponseExample = {
  message: 'Si el usuario existe, se envio un codigo de activacion',
};

export const resetPasswordResponseExample = {
  message: 'Password updated successfully. Please login.',
};
