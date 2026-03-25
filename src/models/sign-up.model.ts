import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { passwordRegex } from 'src/utils/globals';

export class CreateUserModel {
  @ApiProperty({
    description: 'user name',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description:
      'user password, should contain one letter, one number and one special char. minimum 12 chars, maximum 128 chars',
    minLength: 12,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(128)
  @Matches(passwordRegex)
  password: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class AuthenticateUserModel {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsEmail()
  email: string;
}

export class UserWithToken {
  token: string;
  _id: string;
  email: string;
  name: string;
}
