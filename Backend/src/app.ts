import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import meetingRoutes from "./routes/meetings";
import searchRoutes from "./routes/search";
import analyticsRoutes from "./routes/analytics";

const app = Fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>();

// Use Zod for request validation and response serialization across all routes.
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

async function start() {
  // Allow the Vite frontend (and any browser origin in dev) to call the API.
  await app.register(cors, {
    origin: true,
  });

  await app.register(multipart, {
    limits: {
      fieldNameSize: 100,        // Max field name size in bytes
      fieldSize: 100,            // Max field value size in bytes
      fields: 10,                 // Max number of non-file fields
      fileSize: 500 * 1024 * 1024, // 500 MB limit (adjust this to your needs)
      files: 1,                  // Allow only 1 file per upload request
    }
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "BriefVoice API",
        description: "AI Meeting Intelligence Platform",
        version: "1.0.0",
      },
    },
    // Convert Zod route schemas into OpenAPI definitions for Swagger UI.
    transform: jsonSchemaTransform,
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });

  await app.register(meetingRoutes);
  await app.register(searchRoutes);
  await app.register(analyticsRoutes);

  app.get("/", async () => {
    return {
      status: "running",
      service: "BriefVoice",
    };
  });

  try {
    const port = Number(process.env.PORT ?? 8000);

    await app.listen({
      port,
      host: "0.0.0.0",
    });

    console.log(`Server running on port ${port}`);
    console.log(`Swagger: http://localhost:${port}/docs`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
