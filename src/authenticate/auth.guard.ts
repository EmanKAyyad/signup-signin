import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { TokenDenylistService } from './token-denylist.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly tokenDenylist: TokenDenylistService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;
    const ip = request.ip;

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.warn(`Missing Authorization header [path=${path} ip=${ip}]`);
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      this.logger.warn(`Invalid authorization format [path=${path} ip=${ip}]`);
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);

      if (payload.jti && this.tokenDenylist.has(payload.jti)) {
        this.logger.warn(
          `Revoked token used [jti=${payload.jti} path=${path} ip=${ip}]`,
        );
        throw new UnauthorizedException('Token has been revoked');
      }

      request['user'] = payload;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.warn(`Invalid or expired token [path=${path} ip=${ip}]`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
