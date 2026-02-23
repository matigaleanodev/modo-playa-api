import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, QueryFilter, Types } from 'mongoose';
import { UserRole } from '@common/interfaces/role.interface';
import { toObjectIdOrThrow } from '@common/utils/object-id.util';
import { ERROR_CODES } from '@common/constants/error-code';
import { Lodging, LodgingDocument } from '@lodgings/schemas/lodging.schema';
import { Contact, ContactDocument } from '@contacts/schemas/contact.schema';
import { User, UserDocument } from '@users/schemas/user.schema';
import {
  DashboardSummaryResponseDto,
  DashboardAlertCode,
  DashboardAlertSeverity,
} from './dto/dashboard-summary-response.dto';

type LodgingFacetResult = {
  totals: Array<{
    total: number;
    active: number;
    inactive: number;
    withAvailability: number;
    withoutContact: number;
  }>;
  byCity: Array<{
    city: string;
    total: number;
    active: number;
    inactive: number;
  }>;
  byType: Array<{
    type: string;
    total: number;
  }>;
};

type ContactsTotals = {
  total: number;
  active: number;
  inactive: number;
  defaults: number;
  withEmail: number;
  withWhatsapp: number;
  incomplete: number;
};

type UsersTotals = {
  total: number;
  active: number;
  inactive: number;
  passwordSet: number;
  pendingActivation: number;
  neverLoggedIn: number;
};

type RecentActivityItem =
  DashboardSummaryResponseDto['recentActivity']['items'][number];

type RecentLodging = {
  _id: Types.ObjectId | string;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type RecentContact = {
  _id: Types.ObjectId | string;
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type RecentUser = {
  _id: Types.ObjectId | string;
  email?: string;
  username?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Lodging.name)
    private readonly lodgingModel: Model<LodgingDocument>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<ContactDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getSummary(
    ownerId: string,
    role: UserRole,
  ): Promise<DashboardSummaryResponseDto> {
    const ownerObjectId = toObjectIdOrThrow(ownerId, {
      message: 'Invalid owner id',
      errorCode: ERROR_CODES.INVALID_OBJECT_ID,
      httpStatus: 400,
    });
    const scopedOwnerId = role === 'SUPERADMIN' ? null : ownerObjectId;

    const [lodgings, contacts, users, recentActivity] = await Promise.all([
      this.getLodgingsSummary(scopedOwnerId),
      this.getContactsSummary(scopedOwnerId),
      this.getUsersSummary(scopedOwnerId),
      this.getRecentActivity(scopedOwnerId),
    ]);

    const alerts = this.buildAlerts({
      lodgings: lodgings.metrics,
      contacts,
      users,
    });

    return {
      generatedAt: new Date().toISOString(),
      ownerScope: {
        ownerId,
        role,
      },
      metrics: {
        lodgings: lodgings.metrics,
        contacts,
        users,
      },
      distributions: lodgings.distributions,
      recentActivity,
      alerts,
    };
  }

  private async getLodgingsSummary(ownerId: Types.ObjectId | null): Promise<{
    metrics: DashboardSummaryResponseDto['metrics']['lodgings'];
    distributions: DashboardSummaryResponseDto['distributions'];
  }> {
    const match: QueryFilter<LodgingDocument> = ownerId ? { ownerId } : {};
    const pipeline: PipelineStage[] = [
      { $match: match as Record<string, unknown> },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: { $cond: ['$active', 1, 0] },
                },
                inactive: {
                  $sum: { $cond: ['$active', 0, 1] },
                },
                withAvailability: {
                  $sum: {
                    $cond: [
                      {
                        $gt: [
                          {
                            $size: { $ifNull: ['$occupiedRanges', []] },
                          },
                          0,
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                withoutContact: {
                  $sum: {
                    $cond: [{ $ifNull: ['$contactId', false] }, 0, 1],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
                active: 1,
                inactive: 1,
                withAvailability: 1,
                withoutContact: 1,
              },
            },
          ],
          byCity: [
            {
              $group: {
                _id: {
                  $cond: [
                    {
                      $gt: [
                        {
                          $strLenCP: {
                            $trim: { input: { $ifNull: ['$city', ''] } },
                          },
                        },
                        0,
                      ],
                    },
                    '$city',
                    'Sin ciudad',
                  ],
                },
                total: { $sum: 1 },
                active: { $sum: { $cond: ['$active', 1, 0] } },
                inactive: { $sum: { $cond: ['$active', 0, 1] } },
              },
            },
            { $sort: { total: -1, _id: 1 } },
            {
              $project: {
                _id: 0,
                city: '$_id',
                total: 1,
                active: 1,
                inactive: 1,
              },
            },
          ],
          byType: [
            {
              $group: {
                _id: { $ifNull: ['$type', 'UNKNOWN'] },
                total: { $sum: 1 },
              },
            },
            { $sort: { total: -1, _id: 1 } },
            {
              $project: {
                _id: 0,
                type: '$_id',
                total: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] =
      await this.lodgingModel.aggregate<LodgingFacetResult>(pipeline);

    const totals = result?.totals?.[0] ?? {
      total: 0,
      active: 0,
      inactive: 0,
      withAvailability: 0,
      withoutContact: 0,
    };

    return {
      metrics: totals,
      distributions: {
        lodgingsByCity: result?.byCity ?? [],
        lodgingsByType: result?.byType ?? [],
      },
    };
  }

  private async getContactsSummary(
    ownerId: Types.ObjectId | null,
  ): Promise<DashboardSummaryResponseDto['metrics']['contacts']> {
    const match: QueryFilter<ContactDocument> = ownerId ? { ownerId } : {};
    const pipeline: PipelineStage[] = [
      { $match: match as Record<string, unknown> },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$active', 1, 0] } },
          inactive: { $sum: { $cond: ['$active', 0, 1] } },
          defaults: { $sum: { $cond: ['$isDefault', 1, 0] } },
          withEmail: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $trim: { input: { $ifNull: ['$email', ''] } },
                      },
                    },
                    0,
                  ],
                },
                1,
                0,
              ],
            },
          },
          withWhatsapp: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $strLenCP: {
                        $trim: { input: { $ifNull: ['$whatsapp', ''] } },
                      },
                    },
                    0,
                  ],
                },
                1,
                0,
              ],
            },
          },
          incomplete: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: [
                        {
                          $strLenCP: {
                            $trim: { input: { $ifNull: ['$email', ''] } },
                          },
                        },
                        0,
                      ],
                    },
                    {
                      $eq: [
                        {
                          $strLenCP: {
                            $trim: { input: { $ifNull: ['$whatsapp', ''] } },
                          },
                        },
                        0,
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ];

    const [totals] =
      await this.contactModel.aggregate<ContactsTotals>(pipeline);

    return (
      totals ?? {
        total: 0,
        active: 0,
        inactive: 0,
        defaults: 0,
        withEmail: 0,
        withWhatsapp: 0,
        incomplete: 0,
      }
    );
  }

  private async getUsersSummary(
    ownerId: Types.ObjectId | null,
  ): Promise<DashboardSummaryResponseDto['metrics']['users']> {
    const match: QueryFilter<UserDocument> = ownerId ? { ownerId } : {};
    const pipeline: PipelineStage[] = [
      { $match: match as Record<string, unknown> },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          passwordSet: { $sum: { $cond: ['$isPasswordSet', 1, 0] } },
          pendingActivation: { $sum: { $cond: ['$isPasswordSet', 0, 1] } },
          neverLoggedIn: {
            $sum: {
              $cond: [
                { $eq: [{ $ifNull: ['$lastLoginAt', null] }, null] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ];

    const [totals] = await this.userModel.aggregate<UsersTotals>(pipeline);

    return (
      totals ?? {
        total: 0,
        active: 0,
        inactive: 0,
        passwordSet: 0,
        pendingActivation: 0,
        neverLoggedIn: 0,
      }
    );
  }

  private async getRecentActivity(
    ownerId: Types.ObjectId | null,
  ): Promise<DashboardSummaryResponseDto['recentActivity']> {
    const lodgingsMatch: QueryFilter<LodgingDocument> = ownerId
      ? { ownerId }
      : {};
    const contactsMatch: QueryFilter<ContactDocument> = ownerId
      ? { ownerId }
      : {};
    const usersMatch: QueryFilter<UserDocument> = ownerId ? { ownerId } : {};

    const [lodgings, contacts, users] = await Promise.all([
      this.lodgingModel
        .find(lodgingsMatch)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(5)
        .lean()
        .exec() as Promise<RecentLodging[]>,
      this.contactModel
        .find(contactsMatch)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(5)
        .lean()
        .exec() as Promise<RecentContact[]>,
      this.userModel
        .find(usersMatch)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(5)
        .lean()
        .exec() as Promise<RecentUser[]>,
    ]);

    const items = [
      ...lodgings.map((doc) => this.toRecentItem('lodging', doc)),
      ...contacts.map((doc) => this.toRecentItem('contact', doc)),
      ...users.map((doc) => this.toRecentItem('user', doc)),
    ]
      .filter((item): item is RecentActivityItem => item !== null)
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 10);

    return {
      items,
      source: items.length > 0 ? 'derived' : 'none',
    };
  }

  private toRecentItem(
    kind: 'lodging',
    doc: RecentLodging,
  ): RecentActivityItem | null;
  private toRecentItem(
    kind: 'contact',
    doc: RecentContact,
  ): RecentActivityItem | null;
  private toRecentItem(
    kind: 'user',
    doc: RecentUser,
  ): RecentActivityItem | null;
  private toRecentItem(
    kind: 'lodging' | 'contact' | 'user',
    doc: RecentLodging | RecentContact | RecentUser,
  ): RecentActivityItem | null {
    const timestamp = doc.updatedAt ?? doc.createdAt;

    if (!timestamp) {
      return null;
    }

    const createdAt = doc.createdAt;
    const updatedAt = doc.updatedAt;
    const action: RecentActivityItem['action'] =
      createdAt && updatedAt && createdAt.getTime() !== updatedAt.getTime()
        ? 'updated'
        : 'created';

    let title = 'Sin título';
    if (kind === 'lodging') {
      title = (doc as RecentLodging).title || 'Alojamiento';
    }
    if (kind === 'contact') {
      title = (doc as RecentContact).name || 'Contacto';
    }
    if (kind === 'user') {
      const user = doc as RecentUser;
      title =
        user.displayName ||
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
        user.username ||
        user.email ||
        'Usuario';
    }

    return {
      kind,
      action,
      entityId: String(doc._id),
      title,
      timestamp: timestamp.toISOString(),
    };
  }

  private buildAlerts(input: {
    lodgings: DashboardSummaryResponseDto['metrics']['lodgings'];
    contacts: DashboardSummaryResponseDto['metrics']['contacts'];
    users: DashboardSummaryResponseDto['metrics']['users'];
  }): DashboardSummaryResponseDto['alerts'] {
    const alerts: DashboardSummaryResponseDto['alerts'] = [];

    this.pushAlert(alerts, {
      code: 'LODGING_WITHOUT_CONTACT',
      severity: 'warning',
      count: input.lodgings.withoutContact,
      message: 'Hay alojamientos sin contacto asignado.',
    });

    this.pushAlert(alerts, {
      code: 'USER_PENDING_ACTIVATION',
      severity: 'info',
      count: input.users.pendingActivation,
      message: 'Hay usuarios pendientes de activación de contraseña.',
    });

    this.pushAlert(alerts, {
      code: 'CONTACT_INCOMPLETE',
      severity: 'warning',
      count: input.contacts.incomplete,
      message: 'Hay contactos sin email ni WhatsApp.',
    });

    this.pushAlert(alerts, {
      code: 'INACTIVE_LODGINGS_PRESENT',
      severity: 'info',
      count: input.lodgings.inactive,
      message: 'Existen alojamientos inactivos en el catálogo.',
    });

    return alerts;
  }

  private pushAlert(
    alerts: DashboardSummaryResponseDto['alerts'],
    alert: {
      code: DashboardAlertCode;
      severity: DashboardAlertSeverity;
      count: number;
      message: string;
    },
  ) {
    if (alert.count > 0) {
      alerts.push(alert);
    }
  }
}
