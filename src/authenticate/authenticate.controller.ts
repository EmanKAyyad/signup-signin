import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  AuthenticateUserModel,
  CreateUserModel,
} from 'src/models/sign-up.model';
import { AuthService } from 'src/authenticate/authenticate.service';
import { returnSuccess } from 'src/utils/return-success.handler';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './auth.guard';
import type { Request } from 'express';

@Controller('authenticate')
export class AuthenticateController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sign-up')
  async createUser(@Body() body: CreateUserModel) {
    try {
      const user = await this.authService.signUp({
        name: body.name,
        email: body.email,
        password: body.password,
      });
      return returnSuccess(user, 'User signed up successfully');
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  async authenticateUser(@Body() body: AuthenticateUserModel) {
    return this.authService.authenticate(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: Request) {
    const payload = req['user'] as { jti?: string };
    if (payload?.jti) {
      this.authService.logout(payload.jti);
    }
    return returnSuccess(null, 'Logged out successfully');
  }
}
