require('ts-node/register/transpile-only');
require('tsconfig-paths/register');

const fs = require('node:fs');
const path = require('node:path');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../src/app.module');
const { createOpenApiDocument } = require('../src/swagger/openapi');

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });

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
