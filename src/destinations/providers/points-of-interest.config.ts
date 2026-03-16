import { PointOfInterestConfig } from '../interfaces/point-of-interest.interface';
import { DestinationId } from './destination-id.enum';

function createGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const POINTS_OF_INTEREST_MAP: Readonly<
  Record<DestinationId, readonly PointOfInterestConfig[]>
> = {
  [DestinationId.GESELL]: [
    {
      id: 'hospital',
      title: 'Hospital Municipal',
      category: 'healthcare',
      summary: 'Referencia sanitaria principal para guardia y atencion medica.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Hospital Municipal Arturo Illia Villa Gesell',
      ),
      highlight: 'Atencion de salud',
      displayOrder: 1,
    },
    {
      id: 'police',
      title: 'Policia',
      category: 'safety',
      summary:
        'Punto de referencia para asistencia policial y seguridad publica.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Comisaria Villa Gesell Buenos Aires',
      ),
      highlight: 'Seguridad',
      displayOrder: 2,
    },
    {
      id: 'downtown',
      title: 'Centro de la ciudad',
      category: 'downtown',
      summary:
        'Zona comercial y de paseo con mayor concentracion de servicios.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Centro Villa Gesell Buenos Aires',
      ),
      highlight: 'Paseo y servicios',
      displayOrder: 3,
    },
    {
      id: 'pharmacy',
      title: 'Farmacia',
      category: 'pharmacy',
      summary: 'Busqueda rapida de farmacias cercanas para compras esenciales.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Farmacia Villa Gesell Buenos Aires',
      ),
      highlight: 'Compras esenciales',
      displayOrder: 4,
    },
    {
      id: 'beach',
      title: 'Muelle y playa',
      category: 'beach',
      summary: 'Punto clasico para orientarse y bajar a la playa en la ciudad.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Muelle de Villa Gesell Buenos Aires',
      ),
      highlight: 'Costanera',
      displayOrder: 5,
    },
  ],
  [DestinationId.PAMPAS]: [
    {
      id: 'first-aid',
      title: 'Sala de primeros auxilios',
      category: 'healthcare',
      summary:
        'Referencia sanitaria mas cercana para atencion inicial en la zona.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Sala de primeros auxilios Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Atencion inicial',
      displayOrder: 1,
    },
    {
      id: 'police',
      title: 'Policia',
      category: 'safety',
      summary:
        'Punto de apoyo para consultas de seguridad y asistencia policial.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Policia Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Seguridad',
      displayOrder: 2,
    },
    {
      id: 'downtown',
      title: 'Centro de la ciudad',
      category: 'downtown',
      summary: 'Area comercial principal con gastronomia, paseo y servicios.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Centro de Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Paseo y servicios',
      displayOrder: 3,
    },
    {
      id: 'pharmacy',
      title: 'Farmacia',
      category: 'pharmacy',
      summary: 'Acceso rapido a farmacias cercanas para necesidades basicas.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Farmacia Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Compras esenciales',
      displayOrder: 4,
    },
    {
      id: 'beach',
      title: 'Acceso a la playa',
      category: 'beach',
      summary: 'Referencia para llegar a la playa desde el nucleo urbano.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Playa Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Naturaleza',
      displayOrder: 5,
    },
  ],
  [DestinationId.MAR_AZUL]: [
    {
      id: 'first-aid',
      title: 'Sala de primeros auxilios',
      category: 'healthcare',
      summary:
        'Punto de referencia para atencion inicial y derivaciones cercanas.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Sala de primeros auxilios Mar Azul Buenos Aires',
      ),
      highlight: 'Atencion inicial',
      displayOrder: 1,
    },
    {
      id: 'police',
      title: 'Policia',
      category: 'safety',
      summary: 'Punto de apoyo local para seguridad publica y emergencias.',
      googleMapsUrl: createGoogleMapsSearchUrl('Policia Mar Azul Buenos Aires'),
      highlight: 'Seguridad',
      displayOrder: 2,
    },
    {
      id: 'downtown',
      title: 'Centro de la ciudad',
      category: 'downtown',
      summary: 'Area central con comercios y movimiento cotidiano del destino.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Centro de Mar Azul Buenos Aires',
      ),
      highlight: 'Paseo y servicios',
      displayOrder: 3,
    },
    {
      id: 'pharmacy',
      title: 'Farmacia',
      category: 'pharmacy',
      summary:
        'Busqueda directa de farmacias cercanas para compras esenciales.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Farmacia Mar Azul Buenos Aires',
      ),
      highlight: 'Compras esenciales',
      displayOrder: 4,
    },
    {
      id: 'beach',
      title: 'Acceso a la playa',
      category: 'beach',
      summary:
        'Referencia rapida para ubicar la costa y sus accesos principales.',
      googleMapsUrl: createGoogleMapsSearchUrl('Playa Mar Azul Buenos Aires'),
      highlight: 'Naturaleza',
      displayOrder: 5,
    },
  ],
};
