// src/contacts/contacts.swagger.ts

export const CONTACT_RESPONSE_EXAMPLE = {
  _id: '65f1c2d9a2b5c9f1a2b3c4d5',
  name: 'Contacto Principal',
  email: 'contacto@modoplaya.com',
  whatsapp: '+5491112345678',
  isDefault: true,
  active: true,
  notes: 'Disponible solo temporada alta',
  ownerId: '65f1c2d9a2b5c9f1a2b3c000',
  createdAt: '2025-01-01T10:00:00.000Z',
  updatedAt: '2025-01-01T10:00:00.000Z',
};

export const CONTACT_LIST_RESPONSE_EXAMPLE = {
  data: [CONTACT_RESPONSE_EXAMPLE],
  total: 1,
  page: 1,
  limit: 10,
};

export const DELETE_CONTACT_RESPONSE_EXAMPLE = {
  deleted: true,
};
