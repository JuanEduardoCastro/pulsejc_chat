import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/\d/, { message: 'Password must include at least one number' })
  password: string;
}
