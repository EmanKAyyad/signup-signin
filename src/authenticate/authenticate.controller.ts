import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  AuthenticateUserModel,
  CreateUserModel,
} from 'src/models/sign-up.model';
import { AuthService } from 'src/authenticate/authenticate.service';

@Controller('authenticate')
export class AuthenticateController {
  constructor(private authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sign-up')
  async createUser(@Body() body: CreateUserModel) {
    try {
      const user = await this.authService.signUp({
        name: body.name,
        email: body.email,
        password: body.password,
      });
      return { message: 'User signed up successfully', user };
    } catch (error) {
      return error;
    }
  }

  @Post()
  async authenticateUser(@Body() body: AuthenticateUserModel) {
    return this.authService.authenticate(body);
  }
}
