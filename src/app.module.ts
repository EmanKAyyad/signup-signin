import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { User } from './entities/user.entity';
import { AuthenticateModule } from './authenticate/authenticate.module';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { WinstonModule } from 'nest-winston';
import { createWinstonConfig } from './logging/winston.config';
import { HttpLoggerMiddleware } from './logging/http-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(4000),
        DB_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        ALLOWED_ORIGIN: Joi.string().default('http://localhost:5173'),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info'),
        LOG_DIR: Joi.string().default('logs'),
        LOG_MAX_SIZE: Joi.string().default('20m'),
        LOG_MAX_FILES_COMBINED: Joi.string().default('14d'),
        LOG_MAX_FILES_ERROR: Joi.string().default('30d'),
      }),
    }),
    WinstonModule.forRoot(createWinstonConfig()),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    UserModule,
    AuthenticateModule,
    TypeOrmModule.forRoot({
      type: 'mongodb',
      database: 'sign-up',
      entities: [User],
      url: process.env.DB_URL,
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
