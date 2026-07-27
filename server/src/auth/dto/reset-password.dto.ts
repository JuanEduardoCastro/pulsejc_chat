import { IsString, Matches, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, {
    message: i18nValidationMessage('validation.PASSWORD_MIN_LENGTH'),
  })
  @Matches(/\d/, {
    message: i18nValidationMessage('validation.PASSWORD_NEEDS_NUMBER'),
  })
  newPassword: string;
}
