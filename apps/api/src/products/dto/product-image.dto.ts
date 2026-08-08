import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class ProductImageDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  publicId?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
