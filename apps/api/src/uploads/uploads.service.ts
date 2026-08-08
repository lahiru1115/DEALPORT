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

// Prisma's `cuid()` default — matches the `Product.id` format exactly. This
// is checked because `productId` becomes a Cloudinary folder segment, and it
// arrives as a plain client-supplied string.
const PRODUCT_ID_PATTERN = /^[a-z0-9]{20,32}$/;

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

  async uploadImage(file?: Express.Multer.File, productId?: string): Promise<UploadImageResult> {
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
    if (productId !== undefined && !PRODUCT_ID_PATTERN.test(productId)) {
      throw new UnprocessableEntityException('"productId" is not a valid product id');
    }

    const folder = productId ? `${CLOUDINARY_FOLDER}/${productId}` : CLOUDINARY_FOLDER;
    const result = await this.uploadBuffer(file.buffer, folder);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  }

  /**
   * Best-effort cleanup — called when a product's images are replaced or the
   * product itself is deleted. Never throws: an orphaned Cloudinary asset is
   * a cost/clutter issue, not a reason to fail the request that already
   * committed the DB change.
   */
  async destroyImages(publicIds: (string | null | undefined)[]): Promise<void> {
    const ids = publicIds.filter((id): id is string => Boolean(id));
    if (!this.configured || ids.length === 0) {
      return;
    }

    await Promise.all(
      ids.map(async (publicId) => {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          this.logger.error(`Failed to destroy Cloudinary asset "${publicId}"`, error);
        }
      }),
    );
  }

  private uploadBuffer(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
        if (error || !result) {
          this.logger.error(error);
          reject(new Error(error?.message ?? 'Cloudinary upload failed'));
          return;
        }
        resolve(result);
      });
      stream.end(buffer);
    });
  }
}
