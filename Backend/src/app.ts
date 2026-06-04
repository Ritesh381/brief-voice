import Fastify from "fastify";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";

import meetingRoutes from "./routes/meetings";

const app = Fastify({
  logger: true,
});

async function start() {
  await app.register(multipart);

  await app.register(swagger, {
    openapi: {
      info: {
        title: "BriefVoice API",
        description: "AI Meeting Intelligence Platform",
        version: "1.0.0",
      },
    },
  });

  await app.register(swaggerUI, {
    routePrefix: "/docs",
  });

  await app.register(meetingRoutes);

  app.get("/", async () => {
    return {
      status: "running",
      service: "BriefVoice",
    };
  });

  try {
    await app.listen({
      port: 8000,
      host: "0.0.0.0",
    });

    console.log(" Server running on port 8000");
    console.log("Swagger: http://localhost:8000/docs");
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();