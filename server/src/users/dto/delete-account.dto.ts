import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty()
  @IsEmail()
  confirmEmail: string;
}
