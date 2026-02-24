export interface MediaUrlVariants {
  thumb: string;
  card: string;
  hero: string;
}

export interface MediaUrlBuilder {
  buildPublicUrl(key: string): string;
  buildLodgingVariants(key: string): MediaUrlVariants;
}
