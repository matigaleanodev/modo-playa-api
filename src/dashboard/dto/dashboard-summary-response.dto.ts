export type DashboardAlertCode =
  | 'LODGING_WITHOUT_CONTACT'
  | 'USER_PENDING_ACTIVATION'
  | 'CONTACT_INCOMPLETE'
  | 'INACTIVE_LODGINGS_PRESENT';

export type DashboardAlertSeverity = 'info' | 'warning';

export interface DashboardSummaryResponseDto {
  generatedAt: string;
  ownerScope: {
    ownerId: string;
    role: string;
  };
  metrics: {
    lodgings: {
      total: number;
      active: number;
      inactive: number;
      withAvailability: number;
      withoutContact: number;
    };
    contacts: {
      total: number;
      active: number;
      inactive: number;
      defaults: number;
      withEmail: number;
      withWhatsapp: number;
      incomplete: number;
    };
    users: {
      total: number;
      active: number;
      inactive: number;
      passwordSet: number;
      pendingActivation: number;
      neverLoggedIn: number;
    };
  };
  distributions: {
    lodgingsByCity: Array<{
      city: string;
      total: number;
      active: number;
      inactive: number;
    }>;
    lodgingsByType: Array<{
      type: string;
      total: number;
    }>;
  };
  recentActivity: {
    items: Array<{
      kind: 'lodging' | 'contact' | 'user';
      action: 'created' | 'updated';
      entityId: string;
      title: string;
      timestamp: string;
    }>;
    source: 'derived' | 'none';
  };
  alerts: Array<{
    code: DashboardAlertCode;
    severity: DashboardAlertSeverity;
    count: number;
    message: string;
  }>;
}
