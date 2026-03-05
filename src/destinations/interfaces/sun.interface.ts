export interface SunriseSunsetApiResponse {
  status: string;
  results?: {
    sunrise?: string;
    sunset?: string;
  };
}

export interface SunContext {
  sunrise: string;
  sunset: string;
}
