export const contactResponseExample = {
  id: '65f1c2d9a2b5c9f1a2b3c4d5',
  name: 'Contacto Principal',
  email: 'contacto@modoplaya.com',
  whatsapp: '+5491112345678',
  isDefault: true,
  active: true,
  notes: 'Disponible solo temporada alta',
};

export const contactsPaginatedResponseExample = {
  data: [contactResponseExample],
  total: 1,
  page: 1,
  limit: 10,
};
