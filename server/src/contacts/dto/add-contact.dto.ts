import { IsEmail } from 'class-validator';

export class AddContactDto {
  @IsEmail()
  email: string;
}
