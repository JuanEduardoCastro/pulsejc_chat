import { IsIn, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarURL?: string;

  @IsOptional()
  @IsBoolean()
  hasSeenWelcome?: boolean;

  @IsOptional()
  @IsIn(['en', 'es'])
  locale?: 'en' | 'es';
}
