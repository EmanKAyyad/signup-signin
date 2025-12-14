import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { User } from './entities/user.entity';
import { AuthenticateModule } from './authenticate/authenticate.module';
import { AppService } from './app.service';

@Module({
  imports: [
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
export class AppModule {}
