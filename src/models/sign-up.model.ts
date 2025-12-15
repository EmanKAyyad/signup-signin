import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { passwordRegex } from 'src/utils/globals';

export class CreateUserModel {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(passwordRegex)
  password: string;

  @IsEmail()
  email: string;
}

export class AuthenticateUserModel {
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEmail()
  email: string;
}

export class UserWithToken {
  token: string;
  _id: string;
  email: string;
  name: string;
}
