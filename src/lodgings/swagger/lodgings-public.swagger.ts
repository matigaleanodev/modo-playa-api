export const PUBLIC_LODGING_RESPONSE_EXAMPLE = {
  id: '65f1c2d9a2b5c9f1a2b3c4d5',
  title: 'Cabaña Frente al Mar',
  description: 'Hermosa cabaña equipada para 4 personas.',
  location: 'Villa Gesell',
  city: 'Villa Gesell',
  type: 'cabin',
  price: 120000,
  priceUnit: 'night',
  maxGuests: 4,
  bedrooms: 2,
  bathrooms: 1,
  minNights: 2,
  distanceToBeach: 250,
  amenities: ['wifi', 'parking'],
  mainImage:
    'https://media.example.com/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
  images: [
    'https://media.example.com/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
  ],
  mediaImages: [
    {
      imageId: '244e45ae-bdb3-407b-adf2-ade015e1a5ef',
      key: 'lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
      isDefault: true,
      width: 1920,
      height: 1080,
      bytes: 285311,
      mime: 'image/webp',
      createdAt: '2026-01-01T10:00:00.000Z',
      url: 'https://media.example.com/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
      variants: {
        thumb:
          'https://media.example.com/cdn-cgi/image/width=320,height=240,fit=cover,quality=80,format=auto/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
        card: 'https://media.example.com/cdn-cgi/image/width=640,height=420,fit=cover,quality=82,format=auto/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
        hero: 'https://media.example.com/cdn-cgi/image/width=1600,height=900,fit=cover,quality=85,format=auto/lodgings/699c9b30436edbee481101be/244e45ae-bdb3-407b-adf2-ade015e1a5ef/original.webp',
      },
    },
  ],
};

export const PUBLIC_PAGINATED_RESPONSE_EXAMPLE = {
  data: [PUBLIC_LODGING_RESPONSE_EXAMPLE],
  total: 12,
  page: 1,
  limit: 10,
};
