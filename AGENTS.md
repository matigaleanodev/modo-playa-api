# modo-playa-api

## Contexto de trabajo

Si existe un workspace con AGENTS.md en los directorios padre, leerlo explícitamente antes de editar y seguir sus referencias. Una raíz Git anidada puede impedir la herencia automática. Fuera de ese entorno, este archivo y el README deben ser suficientes para trabajar.

## Código y contratos

- NestJS, TypeScript, MongoDB/Mongoose; módulos en src/ y pruebas en test/.
- Separar rutas públicas del catálogo y operaciones administrativas autenticadas.
- Conservar aislamiento ownerId en queries, mutaciones, contactos y media.
- Respetar SUPERADMIN y targetOwnerId según los contratos existentes.
- Media se procesa en el backend con Sharp y almacenamiento R2.
- Validar cambios contractuales contra modo-playa-admin y modo-playa-app.
- La implementación Lambda compatible está en modo-playa-api-cloud.

## Desarrollo y verificación

- Instalar con npm ci; iniciar con npm run start:dev.
- Compilar con npm run build y probar con npm test.
- npm run test:e2e verifica integración cuando corresponda.
- npm run generate:openapi genera contratos; npm run generate:postman los deriva.
- npm run lint aplica fixes; revisar cambios antes de conservarlos.

## Restricciones

- No exponer campos internos ni información de propietarios en rutas públicas.
- Preservar uploads, confirmación, selección de imagen y limpieza/compensación.
- No convertir errores de almacenamiento en éxitos de negocio.
- Usar configuración ficticia y dobles para proveedores en pruebas locales.
- Consultar README y DEVELOPMENT para configuración y límites vigentes.
