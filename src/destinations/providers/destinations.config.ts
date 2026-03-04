import { DestinationConfig } from '../interfaces/destination.interface';
import { DestinationId } from './destination-id.enum';

const DEFAULT_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const DESTINATIONS: readonly DestinationConfig[] = [
  {
    id: DestinationId.GESELL,
    name: 'Villa Gesell',
    latitude: -37.2639,
    longitude: -56.973,
    timezone: DEFAULT_TIMEZONE,
  },
  {
    id: DestinationId.PAMPAS,
    name: 'Mar de las Pampas',
    latitude: -37.325,
    longitude: -57.025,
    timezone: DEFAULT_TIMEZONE,
  },
  {
    id: DestinationId.MAR_AZUL,
    name: 'Mar Azul',
    latitude: -37.344,
    longitude: -57.028,
    timezone: DEFAULT_TIMEZONE,
  },
];

export const DESTINATIONS_MAP: Readonly<
  Record<DestinationId, DestinationConfig>
> = DESTINATIONS.reduce(
  (accumulator, destination) => ({
    ...accumulator,
    [destination.id]: destination,
  }),
  {} as Record<DestinationId, DestinationConfig>,
);
