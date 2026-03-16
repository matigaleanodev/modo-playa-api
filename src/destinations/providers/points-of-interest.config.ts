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
      title: 'Hospital Municipal Arturo Illia',
      category: 'healthcare',
      summary:
        'Principal referencia sanitaria de Villa Gesell para guardia, consultas y derivaciones.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Hospital Municipal Arturo Illia Villa Gesell',
      ),
      highlight: 'Guardia y salud',
      displayOrder: 1,
    },
    {
      id: 'police',
      title: 'Comisaria Primera',
      category: 'safety',
      summary:
        'Dependencia policial de referencia en la zona centrica para asistencia y seguridad publica.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Comisaria Primera Villa Gesell Buenos Aires',
      ),
      highlight: 'Seguridad',
      displayOrder: 2,
    },
    {
      id: 'downtown',
      title: 'Plaza Primera Junta y centro',
      category: 'downtown',
      summary:
        'Nucleo turistico y comercial sobre Avenida 3, util para ubicarse y resolver servicios.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Plaza Primera Junta Villa Gesell Buenos Aires',
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
      title: 'Muelle de Villa Gesell',
      category: 'beach',
      summary:
        'Referencia costera clasica para orientarse, encontrarse y bajar a la playa.',
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
      title: 'Centro de salud de cercania',
      category: 'healthcare',
      summary:
        'Referencia practica para ubicar rapido asistencia en el corredor sur y resolver una emergencia inicial.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Centro de salud cerca de Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Atencion cercana',
      displayOrder: 1,
    },
    {
      id: 'police',
      title: 'Comisaria Tercera Mar de las Pampas',
      category: 'safety',
      summary:
        'Dependencia policial de referencia para Mar de las Pampas y las localidades del sur.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Comisaria Tercera Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Seguridad',
      displayOrder: 2,
    },
    {
      id: 'downtown',
      title: 'Centro comercial de El Lucero',
      category: 'downtown',
      summary:
        'Corredor comercial principal del destino, con gastronomia, tiendas y movimiento peatonal.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'El Lucero Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Paseo y servicios',
      displayOrder: 3,
    },
    {
      id: 'pharmacy',
      title: 'Farmacia de Mar de las Pampas',
      category: 'pharmacy',
      summary:
        'Busqueda enfocada en farmacias del centro comercial para resolver compras esenciales.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Farmacia Mar de las Pampas Buenos Aires',
      ),
      highlight: 'Compras esenciales',
      displayOrder: 4,
    },
    {
      id: 'beach',
      title: 'Acceso de playa de Mar de las Pampas',
      category: 'beach',
      summary:
        'Punto de orientacion para bajar a la playa desde el bosque y el area comercial.',
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
      title: 'CAPS Mar Azul',
      category: 'healthcare',
      summary:
        'Centro de salud de referencia en Mar Azul para atencion primaria y consultas de cercania.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Centro de Salud Mar Azul Buenos Aires',
      ),
      highlight: 'Atencion primaria',
      displayOrder: 1,
    },
    {
      id: 'police',
      title: 'Comisaria del corredor sur',
      category: 'safety',
      summary:
        'Referencia de seguridad utilizada por Mar Azul y el resto de las localidades del sur.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Comisaria cerca de Mar Azul Buenos Aires',
      ),
      highlight: 'Seguridad',
      displayOrder: 2,
    },
    {
      id: 'downtown',
      title: 'Centro comercial Avenida Mar del Plata',
      category: 'downtown',
      summary:
        'Tramo comercial y peatonal mas reconocible para ubicarse y encontrar servicios en Mar Azul.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Avenida Mar del Plata Mar Azul Buenos Aires',
      ),
      highlight: 'Paseo y servicios',
      displayOrder: 3,
    },
    {
      id: 'pharmacy',
      title: 'Farmacia Gaita',
      category: 'pharmacy',
      summary:
        'Referencia concreta para compras esenciales y productos de farmacia en Mar Azul.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Farmacia Gaita Mar Azul Buenos Aires',
      ),
      highlight: 'Compras esenciales',
      displayOrder: 4,
    },
    {
      id: 'beach',
      title: 'Acceso de playa y Faro Querandi',
      category: 'beach',
      summary:
        'Referencia costera para llegar a la playa y tomar como orientacion la salida hacia el faro.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Playa Mar Azul Faro Querandi Buenos Aires',
      ),
      highlight: 'Naturaleza',
      displayOrder: 5,
    },
  ],
};
