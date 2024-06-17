import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

//@ts-ignore
import compression from "compression"

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api", {
    exclude: []
  })

  app.enableCors({
    origin: "*",
  })

  app.use(compression())

  await app.listen(3000);
}

bootstrap();
