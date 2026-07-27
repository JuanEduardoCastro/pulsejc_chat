import { IsIn } from 'class-validator';

export const ALLOWED_AVATAR_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export class AvatarUploadUrlDto {
  @IsIn(ALLOWED_AVATAR_CONTENT_TYPES)
  contentType: (typeof ALLOWED_AVATAR_CONTENT_TYPES)[number];
}
