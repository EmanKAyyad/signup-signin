import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  CreateUserModel,
  AuthenticateUserModel,
  UserWithToken,
} from 'src/models/sign-up.model';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { randomUUID } from 'crypto';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnSuccess, returnSuccess } from 'src/utils/return-success.handler';
import { TokenDenylistService } from './token-denylist.service';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private jwtService: JwtService,
    private tokenDenylist: TokenDenylistService,
  ) {}

  async signUp(user: CreateUserModel) {
    const existing = await this.findByEmail(user.email);

    if (existing) {
      this.logger.warn(`Sign-up attempt with existing email: ${user.email.replace(/.(?=.*@)/g, '*')}`);
      throw new BadRequestException('Email or password are incorrect');
    }

    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(user.password, salt, 32)) as Buffer;
    user.password = `${salt}.${hash.toString('hex')}`;

    this.logger.log(`New user registered: ${user.email.replace(/.(?=.*@)/g, '*')}`);
    return this.create(user);
  }

  private async create(user: CreateUserModel): Promise<User> {
    const newUser = this.repo.create(user);
    try {
      return await this.repo.save(newUser);
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException(err);
    }
  }

  async authenticate(
    user: AuthenticateUserModel,
  ): Promise<ReturnSuccess<UserWithToken> | HttpException> {
    const existingUser = await this.findByEmail(user.email);

    if (!existingUser) {
      this.logger.warn(`Failed login — unknown email: ${user.email.replace(/.(?=.*@)/g, '*')}`);
      throw new BadRequestException('Email or password are incorrect');
    }
    const { name, email, _id } = existingUser;
    const [salt, storedHash] = existingUser.password.split('.');
    const hash = (await scrypt(user.password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      this.logger.warn(`Failed login — wrong password for: ${user.email.replace(/.(?=.*@)/g, '*')}`);
      throw new BadRequestException('Email or password are incorrect');
    }

    const jti = randomUUID();
    const token = this.jwtService.sign({ name, email, _id, jti });

    this.logger.log(`Successful login: ${user.email.replace(/.(?=.*@)/g, '*')}`);

    return returnSuccess(
      {
        email: existingUser.email,
        name: existingUser.name,
        _id: existingUser._id.toString(),
        token,
      },
      'User signed in successfully',
    );
  }

  logout(jti: string): void {
    this.tokenDenylist.add(jti);
    this.logger.log(`Token revoked (jti: ${jti})`);
  }

  private findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }
}
