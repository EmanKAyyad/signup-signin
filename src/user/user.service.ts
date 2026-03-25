import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async getAll(): Promise<User[]> {
    try {
      return await this.repo.find();
    } catch (err) {
      this.logger.error(`Failed to fetch all users: ${(err as Error).message}`);
      throw err;
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }
}
