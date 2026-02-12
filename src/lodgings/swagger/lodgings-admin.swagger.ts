export const LODGING_RESPONSE_EXAMPLE = {
  _id: '65f1c2d9a2b5c9f1a2b3c4d5',
  title: 'Cabaña Frente al Mar',
  description: 'Hermosa cabaña equipada para 4 personas.',
  location: 'Villa Gesell',
  type: 'cabin',
  tags: ['wifi', 'pet-friendly', 'parking'],
  mainImage: 'https://example.com/main.jpg',
  images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
  occupiedRanges: [
    {
      from: '2026-01-10T00:00:00.000Z',
      to: '2026-01-20T00:00:00.000Z',
    },
  ],
  contactId: '65f1c2d9a2b5c9f1a2b3aaaa',
  ownerId: '65f1c2d9a2b5c9f1a2b3bbbb',
  active: true,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
};

export const PAGINATED_LODGINGS_RESPONSE_EXAMPLE = {
  data: [LODGING_RESPONSE_EXAMPLE],
  total: 1,
  page: 1,
  limit: 10,
};

export const DELETE_LODGING_RESPONSE_EXAMPLE = {
  deleted: true,
};
