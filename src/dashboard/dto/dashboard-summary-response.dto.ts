import { ApiProperty } from '@nestjs/swagger';

export type DashboardAlertCode =
  | 'CONTACTS_NOT_CREATED'
  | 'LODGING_WITHOUT_CONTACT'
  | 'USER_PENDING_ACTIVATION'
  | 'CONTACT_INCOMPLETE'
  | 'INACTIVE_LODGINGS_PRESENT';

export type DashboardAlertSeverity = 'info' | 'warning';

class DashboardOwnerScopeDto {
  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  role!: string;
}

class DashboardLodgingMetricsDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  inactive!: number;

  @ApiProperty()
  withAvailability!: number;

  @ApiProperty()
  withoutContact!: number;
}

class DashboardContactMetricsDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  inactive!: number;

  @ApiProperty()
  defaults!: number;

  @ApiProperty()
  withEmail!: number;

  @ApiProperty()
  withWhatsapp!: number;

  @ApiProperty()
  incomplete!: number;
}

class DashboardUserMetricsDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  inactive!: number;

  @ApiProperty()
  passwordSet!: number;

  @ApiProperty()
  pendingActivation!: number;

  @ApiProperty()
  neverLoggedIn!: number;
}

class DashboardMetricsDto {
  @ApiProperty({ type: DashboardLodgingMetricsDto })
  lodgings!: DashboardLodgingMetricsDto;

  @ApiProperty({ type: DashboardContactMetricsDto })
  contacts!: DashboardContactMetricsDto;

  @ApiProperty({ type: DashboardUserMetricsDto })
  users!: DashboardUserMetricsDto;
}

class DashboardLodgingsByCityDto {
  @ApiProperty()
  city!: string;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  inactive!: number;
}

class DashboardLodgingsByTypeDto {
  @ApiProperty()
  type!: string;

  @ApiProperty()
  total!: number;
}

class DashboardDistributionsDto {
  @ApiProperty({ type: [DashboardLodgingsByCityDto] })
  lodgingsByCity!: DashboardLodgingsByCityDto[];

  @ApiProperty({ type: [DashboardLodgingsByTypeDto] })
  lodgingsByType!: DashboardLodgingsByTypeDto[];
}

class DashboardRecentActivityItemDto {
  @ApiProperty({ enum: ['lodging', 'contact', 'user'] })
  kind!: 'lodging' | 'contact' | 'user';

  @ApiProperty({ enum: ['created', 'updated'] })
  action!: 'created' | 'updated';

  @ApiProperty()
  entityId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  timestamp!: string;
}

class DashboardRecentActivityDto {
  @ApiProperty({ type: [DashboardRecentActivityItemDto] })
  items!: DashboardRecentActivityItemDto[];

  @ApiProperty({ enum: ['derived', 'none'] })
  source!: 'derived' | 'none';
}

class DashboardAlertDto {
  @ApiProperty({
    enum: [
      'CONTACTS_NOT_CREATED',
      'LODGING_WITHOUT_CONTACT',
      'USER_PENDING_ACTIVATION',
      'CONTACT_INCOMPLETE',
      'INACTIVE_LODGINGS_PRESENT',
    ],
  })
  code!: DashboardAlertCode;

  @ApiProperty({ enum: ['info', 'warning'] })
  severity!: DashboardAlertSeverity;

  @ApiProperty()
  count!: number;

  @ApiProperty()
  message!: string;
}

export class DashboardSummaryResponseDto {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({ type: DashboardOwnerScopeDto })
  ownerScope!: DashboardOwnerScopeDto;

  @ApiProperty({ type: DashboardMetricsDto })
  metrics!: DashboardMetricsDto;

  @ApiProperty({ type: DashboardDistributionsDto })
  distributions!: DashboardDistributionsDto;

  @ApiProperty({ type: DashboardRecentActivityDto })
  recentActivity!: DashboardRecentActivityDto;

  @ApiProperty({ type: [DashboardAlertDto] })
  alerts!: DashboardAlertDto[];
}
