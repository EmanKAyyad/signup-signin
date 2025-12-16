import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { passwordRegex } from 'src/utils/globals';

export class CreateUserModel {
  @ApiProperty({
    description: 'user name',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description:
      'user password, should contain one letter, one number and one special char. not less that 8 chars',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
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
