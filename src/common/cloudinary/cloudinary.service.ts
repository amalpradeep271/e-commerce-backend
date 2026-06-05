import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.logger.log('Cloudinary configured successfully.');
    } else {
      this.logger.warn(
        'Cloudinary environment variables are missing. File uploads will fail.',
      );
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    folder = 'products',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!cloudinary.config().api_key) {
        reject(
          new Error(
            'Cloudinary is not configured. Add CLOUDINARY_* environment variables.',
          ),
        );
        return;
      }

      cloudinary.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload failed', error);
            return reject(error);
          }
          resolve(result!);
        })
        .end(fileBuffer);
    });
  }
}
