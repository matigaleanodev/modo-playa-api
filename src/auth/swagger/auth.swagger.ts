export const AUTH_TOKEN_RESPONSE_EXAMPLE = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

export const AUTH_LOGIN_RESPONSE_EXAMPLE = {
  accessToken: 'access.token.here',
  refreshToken: 'refresh.token.here',
  user: {
    id: '65f1c2d9a2b5c9f1a2b3c4d5',
    email: 'owner@modoplaya.app',
    username: 'owner',
    firstName: 'Juan',
    lastName: 'Pérez',
    displayName: 'Juan Pérez',
    avatarUrl: null,
    role: 'OWNER',
  },
};

export const FORGOT_PASSWORD_RESPONSE_EXAMPLE = {
  message: 'If the user exists, a verification code has been sent.',
};

export const RESET_PASSWORD_RESPONSE_EXAMPLE = {
  message: 'Password updated successfully. Please login.',
};
