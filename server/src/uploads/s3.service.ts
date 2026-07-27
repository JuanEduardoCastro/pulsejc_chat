import { Injectable, Logger } from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const UPLOAD_URL_TTL_SECONDS = 300; // 5 minutes
const AVATAR_PREFIX = 'avatars';

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlPrefix: string;

  constructor(private readonly config: ConfigService) {
    const region = this.config.getOrThrow<string>('AWS_REGION');
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET_NAME');
    this.client = new S3Client({ region });
    this.publicUrlPrefix = `https://${this.bucket}.s3.${region}.amazonaws.com/`;
  }

  async createAvatarUploadUrl(userId: string, contentType: string) {
    const extension = EXTENSION_BY_CONTENT_TYPE[contentType];
    const key = `${AVATAR_PREFIX}/${userId}/${crypto.randomUUID()}.${extension}`;

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );
    return { uploadUrl, publicUrl: `${this.publicUrlPrefix}${key}` };
  }

  async deleteObjectByUrl(url: string) {
    if (!url.startsWith(this.publicUrlPrefix)) {
      return;
    }

    const key = url.slice(this.publicUrlPrefix.length);

    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (error) {
      this.logger.error(`Failed to delete S3 object ${key}`, error);
    }
  }
}
