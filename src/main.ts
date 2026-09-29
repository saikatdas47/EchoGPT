import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const echoGptExtensionOrigin =
    "chrome-extension://negimdcamohmoheiifgecbjgjepkcfhj";
  const app = await NestFactory.create(AppModule);
  app
    .getHttpAdapter()
    .get("/", (_request: Request, response: Response) =>
      response.redirect("/docs"),
    );
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      const allowed =
        !origin ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        origin === echoGptExtensionOrigin;
      callback(allowed ? null : new Error("Origin is not allowed"), allowed);
    },
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle("EchoGPT Backend API")
    .setDescription("REST API for the EchoGPT browser extension")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { persistAuthorization: true },
  });
  await app.listen(Number(process.env.PORT || 3100), "0.0.0.0");
}
void bootstrap();
