import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import AppDataSource from 'src/config/typeorm.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await AppDataSource.initialize();
  const config = new DocumentBuilder()
    .setTitle('PlanIO Productivity APIs')
    .setDescription('The PlanIO API description')
    .setVersion('1.0')
    .addTag('plan.io')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
