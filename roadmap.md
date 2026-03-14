# Roadmap

Estado general: in progress

Este archivo es local y operativo. Se usa para ordenar la evolucion real de la API y no para abrir una plataforma mas grande de lo necesario.

Regla de trabajo:

- Marcar cada tarea completada con `[x]`
- Marcar tareas activas con `[~]`
- Dejar pendientes con `[ ]`
- Actualizar este archivo cuando cambie una decision tecnica relevante o se cierre una fase real

## Baseline actual - 2026-03-08

Estado: completed

Hallazgos confirmados en el repositorio:

- La API actual usa NestJS 11, MongoDB/Mongoose, JWT, Resend, Cloudflare R2 y Sharp
- El arbol actual incluye `auth`, `contacts`, `dashboard`, `destinations`, `lodgings`, `mail`, `media` y `users`
- `npm run lint`, `npm test`, `npm run test:e2e` y `npm run build` pasan
- La cobertura unitaria es amplia, pero el e2e real hoy solo cubre `health` y `destinations` con modulos de prueba acotados
- La capa de media ya no depende del browser para hablar con R2; el flujo vigente vuelve a estar centralizado en backend
- El contrato de media queda simplificado a uploads multipart hacia la API con procesamiento y persistencia en backend
- La semantica de `SUPERADMIN` no es completamente uniforme entre modulos
- El auth controller todavia mezcla DTOs consistentes con algun contrato inline
- Sigue habiendo naming debt tecnico en archivos como `chage-password` y `verifiy-reset-code`

Decision operativa:

- La prioridad inmediata es formalizar contratos y deuda visible antes de seguir agregando endpoints.

## Fase 0 - Auditoria y alineacion

Estado: completed
Impact: small
Repositorio: modo-playa-api

Objetivo:
Fijar la foto real de la API y de sus inconsistencias documentales y arquitectonicas.

Tareas:

- [x] Auditar modulos, servicios y contratos reales
- [x] Verificar lint, test, e2e y build
- [x] Contrastar documentacion con runtime y endpoints efectivos
- [x] Registrar deuda prioritaria

Done when:

- Existe una baseline real del backend
- Las siguientes decisiones pueden priorizarse con datos concretos

## Fase 1 - Base solida y deuda tecnica

Estado: in progress
Impact: medium
Repositorio: modo-playa-api
Dependencias: Fase 0

Objetivo:
Normalizar contratos visibles y decisiones tecnicas que hoy siguen implicitas o mezcladas.

Tareas:

- [x] Decidir y documentar la estrategia canonica de media: signed URL, upload backend o convivencia soportada
- [x] Uniformar o documentar el alcance real de `SUPERADMIN` en contacts, lodgings, dashboard, users y media
  Alcance backend alineado y cubierto en `contacts`, `lodgings`, `dashboard`, `users` y flujos nuevos de media
- [x] Reemplazar contratos debiles del auth controller por DTOs consistentes
- [~] Corregir naming debt tecnico visible sin abrir un refactor general del repo
  Ya se corrigio la deuda visible en `auth`, se elimino el legado `with-images` de `lodgings` y se alineo naming admin/openapi en draft image uploads; pueden quedar ajustes menores residuales
- [x] Alinear README y guias de desarrollo con endpoints reales de media y retirar la ambiguedad del upload directo
- [ ] Revisar si el e2e base debe bootstraper la app real con prefix global para dar una senal mas representativa
- [x] Normalizar `users` para que use el mismo patron canonico de media que `lodgings`
- [x] Definir contrato de alta de `lodging` con imagenes iniciales en una sola UX y uploads tecnicamente desacoplados
- [x] Definir regla de `SUPERADMIN_OWNER_ID` como origen del rol `SUPERADMIN` y `targetOwnerId` explicito para creaciones de soporte

Done when:

- Las decisiones clave dejan de quedar tacitas
- La documentacion describe la API real y no una direccion a medias

## Fase 2 - Evolucion funcional

Estado: pending
Impact: medium
Repositorio: modo-playa-api
Dependencias: Fase 1

Objetivo:
Endurecer los flujos actuales sin inflar el backend con dominios nuevos.

Tareas:

- [x] Consolidar contratos admin de media y limpieza de pending uploads
- [x] Implementar uploads pendientes desacoplados del ente final para permitir alta de `lodging` con imagenes iniciales en una sola experiencia de UI
- [x] Implementar asociacion final de imagenes pendientes al crear `lodging`
- [x] Normalizar `user profile image` al mismo patron tecnico de upload pendiente + confirmacion
- [x] Restringir `user profile image` para que un owner solo pueda modificar su propia imagen, no la de otros usuarios del mismo owner
- [ ] Revisar si `recentActivity` del dashboard debe seguir derivado de timestamps o requiere una fuente operacional mas explicita
- [ ] Endurecer contratos publicos de destinos y lodgings pensando en crecimiento del catalogo
- [~] Validar owner isolation, media flows y excepciones `SUPERADMIN` de punta a punta con ambos frontends actuales
  Ya existe cobertura e2e backend de ownership y media; sigue pendiente la validacion contractual con `modo-playa-admin` y `modo-playa-app`

Done when:

- Los flujos actuales quedan mas claros y confiables
- La API sigue creciendo sobre limites definidos y no sobre excepciones acumuladas

## Fase 3 - DX, testing, observabilidad y documentacion

Estado: pending
Impact: small
Repositorio: modo-playa-api
Dependencias: Fase 2

Objetivo:
Subir la calidad operativa y de validacion sin reescribir la API.

Tareas:

- [x] Convertir tests `todo` en cobertura real o eliminarlos si ya no aplican
  La deuda visible de `todo` quedo resuelta en backend: media ya tiene cobertura real y el barrido actual no deja `it.todo` residuales en `src` ni `test`
- [ ] Agregar e2e full-app para auth, contacts, lodgings y media
  Ya existen suites e2e modulares para media, ownership admin y un flujo de lodging media mas cercano al runtime real; falta bootstrapping full-app
- [ ] Documentar contrato de Mongo, R2 y Resend por ambiente
- [ ] Definir smoke checks minimos post-deploy

Done when:

- El repo tiene una senal mas fuerte sobre runtime real
- La operacion deja de depender tanto de conocimiento tacito

## Decisiones abiertas

- [ ] Definir si `SUPERADMIN` podra administrar imagenes de perfil ajenas por soporte o si esa capacidad quedara fuera del alcance inicial

## Decision tecnica vigente - Media y ownership 2026-03-12

Estado: accepted

Media:

- El backend adopta como contrato canonico de media el flujo `multipart backend-only`
- El frontend no debe hablar con el bucket ni coordinar firmas, headers de storage o confirmaciones en dos pasos
- Las imagenes se gestionan como subrecursos tecnicos del ente principal; no deben viajar como archivo binario dentro de los endpoints generales de create o update
- La metadata final puede seguir viviendo embebida en el ente principal cuando el cardinal y el dominio lo justifiquen, como en `lodging.mediaImages` o `user.profileImage`
- La normalizacion, validacion, variantes, publicacion y limpieza siguen centralizadas en backend

Lodgings:

- La UX final puede seguir siendo de una sola pantalla para alta con imagenes iniciales
- Para soportarlo, la API debe permitir uploads pendientes previos a la creacion definitiva del lodging
- Al crear el lodging, el cliente debe poder enviar referencias de imagenes pendientes para que el backend las asocie en la misma operacion de negocio
- La gestion posterior de imagenes del lodging debe seguir el mismo patron de subrecurso, pero con upload multipart directo a la API, default y delete

Users:

- `user profile image` debe normalizarse al mismo patron tecnico que `lodgings`
- Un usuario owner solo puede modificar su propia imagen de perfil
- Usuarios del mismo owner no deben poder modificar entre si sus imagenes de perfil solo por compartir tenant

SUPERADMIN:

- El rol `SUPERADMIN` deja de modelarse como un usuario puntual y pasa a derivarse de `SUPERADMIN_OWNER_ID`
- Usuarios cuyo `ownerId` coincida con `SUPERADMIN_OWNER_ID` operan sin filtros por `ownerId`
- Cuando `SUPERADMIN` deba crear recursos en nombre de un owner, la API debe exigir `targetOwnerId` explicito en vez de inferirlo implicitamente
- El aislamiento multi-tenant por `ownerId` sigue siendo obligatorio para `OWNER` en todos los endpoints administrativos y flujos de media

## Corte implementado - 2026-03-12

Estado: partial delivery

Implementado en este corte:

- `lodgings` dejo de usar los endpoints multipart `with-images` y paso a un flujo canonico de uploads pendientes + asociacion final en `create`
- Se agrego un subrecurso admin para uploads pendientes de borrador de lodging antes de que exista el `lodgingId`
- `POST /admin/lodgings` ahora puede asociar `pendingImageIds` de una `uploadSessionId` en la misma operacion de alta
- `user profile image` dejo de exponerse como recurso editable por `admin/users/:id` y paso a gestionarse como imagen propia del usuario autenticado
- El upload directo al backend para imagen de perfil fue retirado del camino principal
- `SUPERADMIN` paso a resolverse por `SUPERADMIN_OWNER_ID`

Pendiente inmediato despues de este corte:

- Actualizar documentacion operativa y ejemplos de OpenAPI/README a los endpoints nuevos
- Validar el contrato nuevo contra `modo-playa-admin`
- Revisar si algun modulo administrativo adicional necesita `targetOwnerId` explicito ademas de `lodgings`

## Corte implementado - 2026-03-12-b

Estado: partial delivery

Implementado en este corte:

- README y guias de desarrollo quedaron alineadas con el flujo canonico de media y `SUPERADMIN_OWNER_ID`
- `contacts` ahora soporta `targetOwnerId` explicito para altas realizadas por `SUPERADMIN`
- `users` ahora soporta `targetOwnerId` explicito para altas realizadas por `SUPERADMIN`
- Los tests unitarios quedaron alineados con esta regla de soporte

Pendiente inmediato despues de este corte:

- Llevar esta consistencia de `SUPERADMIN` a cualquier otro flujo administrativo nuevo que implique alta en nombre de un owner
- Empezar cobertura e2e del flujo real de media para lodgings y perfil

## Corte implementado - 2026-03-12-c

Estado: partial delivery

Implementado en este corte:

- El setup e2e paso a resolver aliases reales del repo en `jest-e2e.json`
- Se agrego una primera suite e2e para los endpoints nuevos de media
- La suite nueva cubre borrador de imagenes de lodging, alta de lodging con `pendingImageIds` y gestion de imagen propia en `auth/me/profile-image`

Pendiente inmediato despues de este corte:

- Extender el e2e a escenarios de error y conflictos de estado en media
- Evaluar si conviene bootstraper una app mas cercana al runtime real para los siguientes e2e

## Corte implementado - 2026-03-12-d

Estado: partial delivery

Implementado en este corte:

- `users` alineo el alcance de `SUPERADMIN` para listado, detalle y update sin filtro por `ownerId`
- Se agrego una suite e2e administrativa para ownership y soporte con `targetOwnerId` en `contacts` y `users`
- La suite de media crecio con casos de error, expiracion y validaciones de contrato
- Se agrego una suite e2e de lodging media mas cercana al runtime real usando servicios reales con dependencias in-memory

Pendiente inmediato despues de este corte:

- Revisar `dashboard` y cualquier consulta admin restante para cerrar por completo la semantica de `SUPERADMIN`
- Decidir si el siguiente e2e debe subir a full-app o seguir ampliando modulos con runtime parcial real
- Validar el contrato definitivo de ownership y media contra `modo-playa-admin` y `modo-playa-app`

## Corte implementado - 2026-03-12-e

Estado: partial delivery

Implementado en este corte:

- Quedo cerrada la semantica backend de `SUPERADMIN` en `contacts`, `lodgings`, `dashboard`, `users` y media
- `users` reforzo su cobertura unitaria para acceso y update cross-owner de `SUPERADMIN`
- La suite e2e administrativa ahora cubre tambien `dashboard/summary` operando como `SUPERADMIN`
- Swagger de `users` quedo alineado con el alcance real del rol

Pendiente inmediato despues de este corte:

- Resolver contratos debiles restantes en auth con DTOs consistentes
- Corregir naming debt tecnico visible sin abrir un refactor transversal
- Decidir si el siguiente salto de testing sera e2e full-app o ampliar mas runtime parcial real

## Corte implementado - 2026-03-12-f

Estado: partial delivery

Implementado en este corte:

- `auth` reemplazo contratos repetidos o debiles por DTOs base reutilizables para identifier, code y password
- Se corrigio el naming debt visible en DTOs de `auth` (`change-password`, `verify-reset-code`)
- `auth.controller`, `auth.service` y Swagger quedaron alineados sobre los mismos contratos tipados
- Se agregaron ejemplos request explicitos para los endpoints de auth en Swagger

Pendiente inmediato despues de este corte:

- Corregir el naming debt tecnico restante fuera de `auth`
- Decidir si el siguiente salto de testing sera e2e full-app o ampliar mas runtime parcial real
- Consolidar limpieza operativa y contratos admin de pending uploads en media

## Corte implementado - 2026-03-12-g

Estado: partial delivery

Implementado en este corte:

- Los flujos de media ahora purgan `pending uploads` expirados antes de reservar, confirmar o asociar imagenes
- `lodging draft uploads` sumo cleanup best-effort de staging y TTL index como red de seguridad en coleccion
- `auth/me/profile-image/confirm` ahora valida el `key` esperado igual que los confirms de lodging
- Se agrego cobertura e2e con runtime parcial real para expiracion y cleanup tanto en draft images de lodging como en profile image

Pendiente inmediato despues de este corte:

- Corregir el naming debt tecnico restante fuera de `auth`
- Seguir ampliando suites con runtime parcial real en vez de ir a full-app
- Revisar si conviene bajar algunos `todo` de servicios de media a cobertura real

## Corte implementado - 2026-03-12-h

Estado: partial delivery

Implementado en este corte:

- Se elimino el legado DTO `with-images` de `lodgings`, ya sin uso en el flujo vigente
- El controller y Swagger de draft uploads quedaron renombrados con sufijo `-admin` para alinearse con el resto del modulo
- `OpenApiAppModule` dejo de exponer el nombre obsoleto `findAllByOwner` y paso a `findAllByScope`

Pendiente inmediato despues de este corte:

- Seguir ampliando suites con runtime parcial real en vez de ir a full-app
- Revisar si conviene bajar algunos `todo` de servicios de media a cobertura real
- Evaluar si queda naming debt menor en tests o helpers, pero ya no hay deuda visible de contrato o endpoints retirados

## Corte implementado - 2026-03-12-i

Estado: partial delivery

Implementado en este corte:

- Se reemplazaron los `todo` restantes de imagenes por cobertura real en `lodging-images.service`, `user-profile-images.service` y `lodging-images-admin.controller`
- La señal de testing de imagenes ahora combina unit tests, e2e de contrato y e2e con runtime parcial real
- El frente de imagenes queda operativo y validado en backend sin huecos visibles de contrato, cleanup o cobertura pendiente inmediata

Pendiente inmediato despues de este corte:

- Seguir ampliando suites con runtime parcial real en otros dominios del backend
- Evaluar si queda algun `todo` residual fuera del frente de imagenes y priorizarlo por impacto

## Corte implementado - 2026-03-12-j

Estado: partial delivery

Implementado en este corte:

- `contacts` sumo una suite e2e con runtime parcial real para create/list/default/delete
- `dashboard` sumo una suite e2e con runtime parcial real para summary derivado con metricas, alerts y recent activity
- El barrido de `src` y `test` ya no deja `it.todo` residuales

Pendiente inmediato despues de este corte:

- Seguir ampliando suites con runtime parcial real en dominios restantes cuando haga falta mayor señal funcional
- Elegir el siguiente frente backend fuera de testing, porque la deuda visible de imagenes, `SUPERADMIN`, DTOs y naming ya quedo cerrada

## Corte implementado - 2026-03-12-k

Estado: partial delivery

Implementado en este corte:

- El contrato publico de `lodgings` quedo separado del admin con un DTO propio sin exponer metadata interna de media ni referencias administrativas de contacto
- `lodgings` endurecio la normalizacion de queries publicas con trim, limites de longitud y deduplicacion de tags, ademas de validar `minPrice <= maxPrice`
- `destinations/context` ahora expone `destinationId` y `timezone` como parte estable del contrato publico
- Swagger, ejemplos y tests de `lodgings` y `destinations` quedaron alineados con el contrato publico endurecido

Pendiente inmediato despues de este corte:

- Validar el impacto contractual contra `modo-playa-app` y `modo-playa-admin` antes de considerarlo seguro fuera del backend
- Revisar si conviene promover codigos de error mas semanticos para validaciones de query publica
- Seguir ampliando runtime parcial real solo donde aparezca deuda funcional nueva

## Corte implementado - 2026-03-12-l

Estado: partial delivery

Implementado en este corte:

- La validacion de contrato ahora responde con `DomainException` y codigo estable `REQUEST_VALIDATION_ERROR` en vez del payload generico de Nest
- `lodgings` publico deja de reutilizar `INVALID_OBJECT_ID` para queries invalidas y pasa a usar `PUBLIC_QUERY_INVALID_RANGE` cuando `minPrice > maxPrice`
- `main.ts` y las suites e2e quedaron alineadas sobre una unica fabrica de `ValidationPipe`
- Se agrego cobertura unitaria y e2e para errores semanticos de contrato en `lodgings`, `destinations` y flujos de media

Pendiente inmediato despues de este corte:

- Validar el impacto contractual contra `modo-playa-app` y `modo-playa-admin` antes de considerarlo seguro fuera del backend
- Revisar si vale la pena introducir codigos mas especificos por dominio sobre la base de `REQUEST_VALIDATION_ERROR`
- Seguir ampliando runtime parcial real solo si aparece deuda funcional nueva en otros modulos

## Corte implementado - 2026-03-12-m

Estado: partial delivery

Implementado en este corte:

- La validacion de contrato paso de un codigo paraguas a un mapeo explicito por causa para endpoints publicos y de media
- `destinations` ahora responde `INVALID_DESTINATION_ID` cuando el param `id` no corresponde a un destino valido
- Los flujos de media ahora responden `INVALID_UPLOAD_SESSION_ID`, `INVALID_TARGET_OWNER_ID` e `INVALID_IMAGE_MIME` segun el campo invalido
- `lodgings` publico usa `INVALID_PRICE_RANGE` para `minPrice > maxPrice`

Pendiente inmediato despues de este corte:

- Extender el mapeo explicito a otros campos sensibles si aparecen consumidores que lo necesiten, sin caer en codes excesivamente atomicos
- Validar el impacto contractual contra `modo-playa-app` y `modo-playa-admin` antes de considerarlo seguro fuera del backend
- Seguir ampliando runtime parcial real solo si aparece deuda funcional nueva en otros modulos

## Corte implementado - 2026-03-12-n

Estado: partial delivery

Implementado en este corte:

- El criterio de codigos explicitos se extendio a servicios sensibles con `INVALID_OWNER_ID`, `INVALID_USER_ID`, `INVALID_LODGING_ID` e `INVALID_CONTACT_ID`
- `dashboard`, `contacts`, `users`, `lodgings`, `lodging-images` y `user-profile-images` dejaron de depender de `INVALID_OBJECT_ID` en los caminos principales de ids sensibles
- `auth/me/profile-image` quedo fuera del alcance de `SUPERADMIN`; ahora responde `PROFILE_IMAGE_FORBIDDEN_FOR_SUPERADMIN`
- Swagger y e2e de profile image quedaron alineados con esa restriccion

Pendiente inmediato despues de este corte:

- Extender el mismo criterio a otros ids sensibles residuales solo donde aporte valor contractual real
- Validar el impacto contractual contra `modo-playa-app` y `modo-playa-admin` antes de considerarlo seguro fuera del backend
- Seguir ampliando runtime parcial real solo si aparece deuda funcional nueva en otros modulos

## Corte implementado - 2026-03-12-o

Estado: partial delivery

Implementado en este corte:

- Se completo el barrido residual del code `INVALID_OBJECT_ID`
- El catalogo de errores ya no conserva ese fallback legacy porque no quedaban usos activos en la aplicacion
- La matriz completa de lint, unit, e2e y build se revalido despues de retirar el code legado

Pendiente inmediato despues de este corte:

- Validar el impacto contractual contra `modo-playa-app` y `modo-playa-admin` antes de considerarlo seguro fuera del backend
- Seguir ampliando runtime parcial real solo si aparece deuda funcional nueva en otros modulos
- Abrir el siguiente frente backend funcional, porque la limpieza de codigos ambiguos ya quedo cerrada

## Corte implementado - 2026-03-12-p

Estado: partial delivery

Implementado en este corte:

- `dashboard.recentActivity` quedo cerrado como contrato heuristico con `source=timestamps`
- Swagger, DTOs, ejemplos y tests del dashboard dejan explicito que `recentActivity` no es una auditoria persistida
- README y DEVELOPMENT en ambos idiomas quedaron alineados con los codigos de error explicitos, la restriccion de `SUPERADMIN` sobre profile image y la semantica real del dashboard

Pendiente inmediato despues de este corte:

- Validar el impacto contractual contra `modo-playa-app` y `modo-playa-admin` antes de considerar el backend cerrado y seguro fuera de este repo
- Si la validacion cruzada no detecta bloqueos, dar por cerrado el roadmap backend actual y trasladar el contexto actualizado a los roadmaps locales de frontend

## Corte implementado - 2026-03-12-q

Estado: backend ready pending frontend adoption

Implementado en este corte:

- Se valido el contrato backend vigente contra `modo-playa-admin` y `modo-playa-app`
- `modo-playa-admin` quedo con dos incompatibilidades reales a resolver del lado frontend: profile image en rutas legacy y lodgings `with-images`
- `modo-playa-app` no muestra bloqueos funcionales inmediatos, pero debe alinear modelos con el contrato publico endurecido de `lodgings` y `destinations`
- Los roadmaps locales de ambos frontends quedaron actualizados con el contexto tecnico que surge de este backend

Decision operativa:

- El roadmap de backend puede considerarse funcionalmente cerrado para esta etapa
- El siguiente trabajo prioritario se mueve a frontend adoption, salvo que aparezca un bug nuevo o un bloqueo real al integrar

## Resolucion operativa - Media backend-only 2026-03-14

Estado: completed

Decision cerrada:

- el bloqueo de CORS del bucket R2 dejo de tratarse como condicion para el flujo principal
- `modo-playa-api` vuelve a recibir archivos por multipart y el backend pasa a ser el unico actor que sube objetos a R2
- `modo-playa-admin` deja de coordinar signed URLs, `PUT` al bucket y confirmaciones de media desde browser
- el flujo draft de alta de lodging se conserva, pero la imagen queda subida y confirmada dentro de la misma llamada backend

Impacto operativo cerrado:

- el flujo canonico deja de depender de CORS de bucket, headers firmados o preflight browser
- la centralizacion de validacion, normalizacion y subida a storage queda alineada con la regla operativa del producto
- el bucket puede seguir requiriendo ajustes de CORS para usos manuales o legacy, pero ya no bloquea el camino principal del admin
- se retiraron los endpoints legacy `upload-url` y `confirm` de media para que el contrato backend-only quede sin caminos paralelos

Endpoints canonicos desde este corte:

- `POST /api/admin/lodging-image-uploads`
- `POST /api/admin/lodgings/:lodgingId/images`
- `POST /api/auth/me/profile-image`
