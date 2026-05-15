import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { extname } from 'path';

@Injectable()
export class GcsService {
  private readonly logger = new Logger(GcsService.name);
  private readonly storage = new Storage();
  private readonly bucket = process.env.GCS_BUCKET_NAME || 'cltiene-mundial-assets';

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${folder}/${uniqueSuffix}${extname(file.originalname)}`;

    const blob = this.storage.bucket(this.bucket).file(filename);
    await blob.save(file.buffer, {
      contentType: file.mimetype,
    });

    return `https://storage.googleapis.com/${this.bucket}/${filename}`;
  }

  async getResumableUploadUrl(folder: string, contentType: string, originalFilename: string): Promise<{ uploadUrl: string; publicUrl: string }> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalFilename) || '.mp4';
    const gcsFilename = `${folder}/${uniqueSuffix}${ext}`;

    const file = this.storage.bucket(this.bucket).file(gcsFilename);
    const [uploadUrl] = await file.createResumableUpload({
      metadata: { contentType },
    });

    return {
      uploadUrl,
      publicUrl: `https://storage.googleapis.com/${this.bucket}/${gcsFilename}`,
    };
  }
}
