export const CREATE_USER_EXAMPLE = {
  email: 'admin@modo-playa.com',
  username: 'admin',
};

export const USER_RESPONSE_EXAMPLE = {
  _id: '507f1f77bcf86cd799439011',
  ownerId: '507f1f77bcf86cd799439000',
  email: 'admin@modo-playa.com',
  username: 'admin',
  isPasswordSet: false,
  isActive: true,
  createdAt: '2026-02-12T10:00:00.000Z',
  updatedAt: '2026-02-12T10:00:00.000Z',
};

export const UPDATE_USER_EXAMPLE = {
  firstName: 'Juan',
  lastName: 'Pérez',
  displayName: 'Juan Pérez',
  avatarUrl: 'https://example.com/avatar.jpg',
  phone: '+5491122334455',
};

export const USER_LIST_RESPONSE_EXAMPLE = {
  data: [USER_RESPONSE_EXAMPLE],
  total: 1,
  page: 1,
  limit: 10,
};
