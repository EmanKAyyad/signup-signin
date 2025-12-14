import { Module } from '@nestjs/common';
import { AuthenticateController } from './authenticate.controller';
import { AuthService } from 'src/authenticate/authenticate.service';
import 'dotenv/config';
import 'dotenv/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { JwtAuthGuard } from './auth.guard';

@Module({
  controllers: [AuthenticateController],
  providers: [AuthService, JwtAuthGuard],
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      useFactory: () => ({
        global: true,
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  exports: [JwtModule],
})
export class AuthenticateModule {}
