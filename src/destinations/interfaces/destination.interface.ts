import { DestinationId } from '../providers/destination-id.enum';

export interface DestinationConfig {
  id: DestinationId;
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
