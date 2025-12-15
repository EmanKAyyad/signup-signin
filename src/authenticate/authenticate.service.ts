import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import {
  CreateUserModel,
  AuthenticateUserModel,
  UserWithToken,
} from 'src/models/sign-up.model';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReturnSuccess, returnSuccess } from 'src/utils/return-success.handler';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(user: CreateUserModel) {
    const existing = await this.findByEmail(user.email);

    if (existing) {
      throw new BadRequestException('Email or password are incorrect');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = (await scrypt(user.password, salt, 32)) as Buffer;
    user.password = `${salt}.${hash.toString('hex')}`;

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
      throw new BadRequestException('Email or password are incorrect');
    }
    const { name, email, _id } = existingUser;
    const [salt, storedHash] = existingUser.password.split('.');
    const hash = (await scrypt(user.password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('Email or password are incorrect');
    }

    const token = this.jwtService.sign({ name, email, _id });

    return returnSuccess({
      email: existingUser.email,
      name: existingUser.name,
      _id: existingUser._id.toString(),
      token,
    });
  }

  private findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }
}
