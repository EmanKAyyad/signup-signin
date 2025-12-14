import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
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

export class UserWithToken extends CreateUserModel {
  token: string;
}
