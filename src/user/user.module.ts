import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { AuthenticateModule } from 'src/authenticate/authenticate.module';

@Module({
  controllers: [UserController],
  imports: [TypeOrmModule.forFeature([User]), AuthenticateModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
