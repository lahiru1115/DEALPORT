import {
  Injectable,
  Logger,
  NotImplementedException,
  PayloadTooLargeException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CLOUDINARY_FOLDER = 'dealport/products';

export interface UploadImageResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    this.configured = Boolean(cloudName && apiKey && apiSecret);

    if (this.configured) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    }
  }

  async uploadImage(file?: Express.Multer.File): Promise<UploadImageResult> {
    if (!this.configured) {
      throw new NotImplementedException(
        'Image upload is not configured on this environment — set CLOUDINARY_CLOUD_NAME, ' +
          'CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }
    if (!file) {
      throw new UnprocessableEntityException(
        'No file received — send a multipart/form-data request with field "file"',
      );
    }
    if (file.size > MAX_BYTES) {
      throw new PayloadTooLargeException('Image exceeds the 5MB limit');
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      throw new UnprocessableEntityException(
        `Unsupported image type "${file.mimetype}" — accepted: ${ACCEPTED_MIME_TYPES.join(', ')}`,
      );
    }

    const result = await this.uploadBuffer(file.buffer);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  private uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: CLOUDINARY_FOLDER },
        (error, result) => {
          if (error || !result) {
            this.logger.error(error);
            reject(new Error(error?.message ?? 'Cloudinary upload failed'));
            return;
          }
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }
}
