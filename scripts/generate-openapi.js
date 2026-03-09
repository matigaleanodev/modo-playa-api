require('ts-node/register/transpile-only');
require('tsconfig-paths/register');

const fs = require('node:fs');
const path = require('node:path');
const { NestFactory } = require('@nestjs/core');
const { OpenApiAppModule } = require('../src/swagger/openapi-app.module');
const { createOpenApiDocument } = require('../src/swagger/openapi');

function applyOpenApiGenerationEnvDefaults() {
  process.env.NODE_ENV ??= 'documentation';
  process.env.PORT ??= '3000';
  process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/modo-playa-openapi';
  process.env.SECRET_KEY ??= 'openapi-secret-key';
  process.env.BCRYPT_ROUNDS ??= '12';
  process.env.RESEND_API_KEY ??= 're_docs_dummy_key';
  process.env.RESEND_FROM_EMAIL ??= 'no-reply@example.com';
  process.env.R2_ENDPOINT ??= 'https://example.r2.cloudflarestorage.com';
  process.env.R2_BUCKET ??= 'modo-playa-media';
  process.env.R2_ACCESS_KEY_ID ??= 'docs-access-key';
  process.env.R2_SECRET_ACCESS_KEY ??= 'docs-secret-key';
  process.env.R2_REGION ??= 'auto';
  process.env.R2_SIGNED_URL_EXPIRES_SECONDS ??= '600';
  process.env.MEDIA_PUBLIC_BASE_URL ??= 'https://media.example.com';
  process.env.IMAGE_ALLOWED_MIME ??= 'image/jpeg,image/png,image/webp';
  process.env.PENDING_UPLOAD_TTL_SECONDS ??= '1800';
  process.env.LODGING_IMAGE_MAX_BYTES ??= '10485760';
  process.env.LODGING_IMAGE_MAX_WIDTH ??= '2560';
  process.env.LODGING_IMAGE_MAX_HEIGHT ??= '2560';
  process.env.USER_PROFILE_IMAGE_MAX_BYTES ??= '5242880';
  process.env.USER_PROFILE_IMAGE_MAX_WIDTH ??= '1024';
  process.env.USER_PROFILE_IMAGE_MAX_HEIGHT ??= '1024';
}

async function generateOpenApi() {
  applyOpenApiGenerationEnvDefaults();

  const app = await NestFactory.create(OpenApiAppModule, { logger: false });

  try {
    const document = createOpenApiDocument(app);
    const outputPath = path.resolve(process.cwd(), 'openapi.json');

    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  } finally {
    await app.close();
  }
}

generateOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
