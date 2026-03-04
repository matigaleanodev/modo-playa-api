export interface OpenMeteoApiResponse {
  current_weather?: {
    temperature?: number;
    wind_speed?: number;
    windspeed?: number;
    weathercode?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
}

export interface WeatherSnapshot {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
}

export interface ForecastItem {
  day: 'today' | 'tomorrow';
  max: number;
  min: number;
}

export interface WeatherContext {
  weather: WeatherSnapshot;
  forecast: ForecastItem[];
}
