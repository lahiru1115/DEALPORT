import { Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';

// Safety-net ceiling only — the documented 5MB / 413 behavior is enforced
// precisely in UploadsService so the error shape matches plans/02-API.md.
const MULTER_CEILING_BYTES = 8 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MULTER_CEILING_BYTES },
    }),
  )
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    return this.uploadsService.uploadImage(file);
  }
}
