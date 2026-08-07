import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';

// Safety-net ceiling only — the documented 5MB / 413 behavior is enforced
// precisely in UploadsService so the error shape matches plans/02-API.md.
const MULTER_CEILING_BYTES = 8 * 1024 * 1024;

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        // Optional — group the upload under `dealport/products/{productId}`
        // in Cloudinary instead of the flat top-level folder.
        productId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MULTER_CEILING_BYTES },
    }),
  )
  uploadImage(@UploadedFile() file?: Express.Multer.File, @Body('productId') productId?: string) {
    return this.uploadsService.uploadImage(file, productId);
  }
}
