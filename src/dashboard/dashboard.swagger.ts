import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';

export const DASHBOARD_SUMMARY_RESPONSE_EXAMPLE: DashboardSummaryResponseDto = {
  generatedAt: '2026-02-23T15:00:00.000Z',
  ownerScope: {
    ownerId: '65f1c2d9a2b5c9f1a2b3c000',
    role: 'OWNER',
  },
  metrics: {
    lodgings: {
      total: 12,
      active: 10,
      inactive: 2,
      withAvailability: 7,
      withoutContact: 1,
    },
    contacts: {
      total: 3,
      active: 2,
      inactive: 1,
      defaults: 1,
      withEmail: 2,
      withWhatsapp: 2,
      incomplete: 1,
    },
    users: {
      total: 3,
      active: 3,
      inactive: 0,
      passwordSet: 2,
      pendingActivation: 1,
      neverLoggedIn: 1,
    },
  },
  distributions: {
    lodgingsByCity: [
      { city: 'Mar del Plata', total: 8, active: 7, inactive: 1 },
      { city: 'Pinamar', total: 4, active: 3, inactive: 1 },
    ],
    lodgingsByType: [
      { type: 'HOUSE', total: 6 },
      { type: 'APARTMENT', total: 4 },
      { type: 'CABIN', total: 2 },
    ],
  },
  recentActivity: {
    source: 'derived',
    items: [
      {
        kind: 'lodging',
        action: 'updated',
        entityId: '65f1c2d9a2b5c9f1a2b3c111',
        title: 'Casa frente al mar',
        timestamp: '2026-02-23T14:48:00.000Z',
      },
      {
        kind: 'user',
        action: 'created',
        entityId: '65f1c2d9a2b5c9f1a2b3c112',
        title: 'ana@modoplaya.com',
        timestamp: '2026-02-23T13:20:00.000Z',
      },
    ],
  },
  alerts: [
    {
      code: 'LODGING_WITHOUT_CONTACT',
      severity: 'warning',
      count: 1,
      message: 'Hay alojamientos activos sin contacto asignado.',
    },
    {
      code: 'USER_PENDING_ACTIVATION',
      severity: 'info',
      count: 1,
      message: 'Hay usuarios pendientes de activación de contraseña.',
    },
  ],
};
