export const createUserRequestExample = {
  email: 'admin@modo-playa.com',
  username: 'admin',
};

export const updateUserRequestExample = {
  firstName: 'Juan',
  lastName: 'Perez',
  displayName: 'Juan Perez',
  avatarUrl: 'https://example.com/avatar.jpg',
  phone: '+5491122334455',
};

export const userResponseExample = {
  id: '507f1f77bcf86cd799439011',
  email: 'admin@modo-playa.com',
  username: 'admin',
  isPasswordSet: false,
  isActive: true,
  createdAt: '2026-02-12T10:00:00.000Z',
  updatedAt: '2026-02-12T10:00:00.000Z',
};

export const usersPaginatedResponseExample = {
  data: [userResponseExample],
  total: 1,
  page: 1,
  limit: 10,
};
