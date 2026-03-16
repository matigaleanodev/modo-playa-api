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
      title: 'Clinica medica - Pediatria',
      category: 'healthcare',
      summary:
        'Clinica medica de referencia para consultas generales y pediatria en Mar de las Pampas.',
      googleMapsUrl:
        'https://www.google.com/maps/place/Cl%C3%ADnica+m%C3%A9dica+-+Pediatr%C3%ADa/@-37.3277167,-57.0214932,16.86z/data=!4m10!1m2!2m1!1sCentro+de+salud+cerca+de+Mar+de+las+Pampas+Buenos+Aires!3m6!1s0x959b5d89ccfddbf5:0x3bcdecdb61cdc1e4!8m2!3d-37.3263608!4d-57.0235063!15sCjdDZW50cm8gZGUgc2FsdWQgY2VyY2EgZGUgTWFyIGRlIGxhcyBQYW1wYXMgQnVlbm9zIEFpcmVzWjkiN2NlbnRybyBkZSBzYWx1ZCBjZXJjYSBkZSBtYXIgZGUgbGFzIHBhbXBhcyBidWVub3MgYWlyZXOSAQZkb2N0b3KaASNDaFpEU1VoTk1HOW5TMFZKUTBGblNVUm1iRXhVUlZSQkVBReABAPoBBAgAEDo!16s%2Fg%2F11frr1mf67?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
      highlight: 'Atencion medica',
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
      title: 'Centro Comercial de Mar de las Pampas',
      category: 'downtown',
      summary:
        'Nucleo comercial principal del destino, con gastronomia, tiendas y movimiento peatonal.',
      googleMapsUrl:
        'https://www.google.com/maps/place/Centro+Comercial+de+Mar+de+las+Pampas/@-37.3246593,-57.0236178,17z/data=!4m14!1m7!3m6!1s0x959b5dc1ae587b9b:0x6854898ced00154a!2sComisar%C3%ADa+Villa+Gesell+3%C2%B0+-+Mar+de+las+Pampas!8m2!3d-37.3172705!4d-57.0304735!16s%2Fg%2F11dflmr_56!3m5!1s0x959b5dce1e524e09:0x6552b4625743a489!8m2!3d-37.3257506!4d-57.022162!16s%2Fg%2F11clynsgyx?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
      highlight: 'Paseo y servicios',
      displayOrder: 3,
    },
    {
      id: 'pharmacy',
      title: 'Farmacia Pujol',
      category: 'pharmacy',
      summary:
        'Farmacia de referencia en Mar de las Pampas para compras esenciales y guardias cercanas.',
      googleMapsUrl:
        'https://www.google.com/maps/place/Farmacia+Pujol/@-37.3291654,-57.0223344,17.08z/data=!4m10!1m2!2m1!1sFarmacia+Mar+de+las+Pampas+Buenos+Aires!3m6!1s0x959b5dce24f7489d:0x2cf4490331347c29!8m2!3d-37.3257576!4d-57.0227451!15sCidGYXJtYWNpYSBNYXIgZGUgbGFzIFBhbXBhcyBCdWVub3MgQWlyZXNaKSInZmFybWFjaWEgbWFyIGRlIGxhcyBwYW1wYXMgYnVlbm9zIGFpcmVzkgEIcGhhcm1hY3maASNDaFpEU1VoTk1HOW5TMFZKUTBGblNVUkVkR05IV1VGM0VBReABAPoBBQiKAhBF!16s%2Fg%2F1hc3_mdt9?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
      highlight: 'Compras esenciales',
      displayOrder: 4,
    },
    {
      id: 'beach',
      title: 'Playa Mar de las Pampas',
      category: 'beach',
      summary:
        'Acceso recomendado para ubicar rapido la playa desde el bosque y el centro comercial.',
      googleMapsUrl:
        'https://www.google.com/maps/place/Playa+Mar+de+las+Pampas/@-37.3308372,-57.0191174,15z/data=!4m10!1m2!2m1!1sPlaya+Mar+de+las+Pampas+Buenos+Aires!3m6!1s0x959b5dd12edb36db:0x3c209cf45e96010!8m2!3d-37.3251268!4d-57.0159856!15sCiRQbGF5YSBNYXIgZGUgbGFzIFBhbXBhcyBCdWVub3MgQWlyZXNaJiIkcGxheWEgbWFyIGRlIGxhcyBwYW1wYXMgYnVlbm9zIGFpcmVzkgEMcHVibGljX2JlYWNomgEkQ2hkRFNVaE5NRzluUzBWSlEwRm5UVU5KTlU5WVF6TkJSUkFC4AEA-gEECAAQOg!16s%2Fg%2F11c5_l7xs3?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
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
      title: 'Policia',
      category: 'safety',
      summary:
        'Dependencia policial ubicada en Mar Azul para asistencia y seguridad publica.',
      googleMapsUrl:
        'https://www.google.com/maps/place/Policia/@-37.3369022,-57.0340071,16z/data=!4m10!1m2!2m1!1sComisaria+cerca+de+Mar+Azul+Buenos+Aires!3m6!1s0x959b5c3699091fcb:0xe930c825c8bccec4!8m2!3d-37.3393954!4d-57.0299867!15sCihDb21pc2FyaWEgY2VyY2EgZGUgTWFyIEF6dWwgQnVlbm9zIEFpcmVzkgESanVzdGljZV9kZXBhcnRtZW504AEA!16s%2Fg%2F11fkt4ry9j?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
      highlight: 'Seguridad',
      displayOrder: 2,
    },
    {
      id: 'downtown',
      title: 'Mar del Plata y Av. Gral. San Martin',
      category: 'downtown',
      summary:
        'Cruce de referencia para ubicarse en el centro comercial y resolver servicios en Mar Azul.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Mar del Plata y Avenida General San Martin Mar Azul Buenos Aires',
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
      googleMapsUrl:
        'https://www.google.com/maps/place/Farmacia+GAITA/@-37.3395673,-57.0313971,17z/data=!3m1!4b1!4m6!3m5!1s0x959b5c3678e56153:0x6b6ce872105d111d!8m2!3d-37.3395673!4d-57.0313971!16s%2Fg%2F1pp2v0694?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
      highlight: 'Compras esenciales',
      displayOrder: 4,
    },
    {
      id: 'beach',
      title: 'Playa Mar Azul',
      category: 'beach',
      summary:
        'Punto de acceso a la costa para orientarse rapido y llegar a la playa de Mar Azul.',
      googleMapsUrl:
        'https://www.google.com/maps/place/Playa+Mar+Azul/@-37.3466599,-57.0299008,16.99z/data=!4m9!1m2!2m1!1sPlaya+Mar+Azul+Faro+Querandi+Buenos+Aires!3m5!1s0x959b5c3a3e230b8d:0x8e39994395e78afd!8m2!3d-37.3440305!4d-57.0269055!16s%2Fg%2F11cs23tmdt?entry=ttu&g_ep=EgoyMDI2MDMxMS4wIKXMDSoASAFQAw%3D%3D',
      highlight: 'Naturaleza',
      displayOrder: 5,
    },
    {
      id: 'faro-querandi',
      title: 'Faro Querandi',
      category: 'landmark',
      summary:
        'Hito natural y turistico de referencia para excursiones y salidas hacia el sur de Mar Azul.',
      googleMapsUrl: createGoogleMapsSearchUrl(
        'Faro Querandi Mar Azul Buenos Aires',
      ),
      highlight: 'Excursion',
      displayOrder: 6,
    },
  ],
};
