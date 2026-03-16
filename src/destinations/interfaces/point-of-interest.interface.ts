export type PointOfInterestCategory =
  | 'healthcare'
  | 'safety'
  | 'downtown'
  | 'pharmacy'
  | 'beach'
  | 'landmark';

export interface PointOfInterestConfig {
  id: string;
  title: string;
  category: PointOfInterestCategory;
  summary: string;
  googleMapsUrl: string;
  highlight: string;
  displayOrder: number;
}
