import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Logger,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/authenticate/auth.guard';
import { UserService } from 'src/user/user.service';
import type { Request } from 'express';

@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async getAllUsers(@Req() req: Request) {
    const userId = (req['user'] as { _id?: string })?._id;
    this.logger.debug(`GET /users requested [userId=${userId}]`);
    try {
      return await this.userService.getAll();
    } catch (err) {
      this.logger.error(`Failed to fetch users: ${(err as Error).message}`);
      throw err;
    }
  }
}
