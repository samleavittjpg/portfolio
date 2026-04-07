import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadRouter = Router();

uploadRouter.post('/upload', upload.single('file'), async (req, res) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    res.status(500).json({
      message:
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: 'Expected multipart field "file"' });
    return;
  }

  const file = req.file;

  try {
    type CloudinaryUploadResult = {
      secure_url?: unknown;
      url?: unknown;
      public_id?: unknown;
      original_filename?: unknown;
      bytes?: unknown;
      resource_type?: unknown;
      format?: unknown;
    };

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'portfolio',
          resource_type: 'auto',
          filename_override: file.originalname,
          use_filename: true,
          unique_filename: true,
        },
        (err, uploadResult) => {
          if (err) {
            reject(err);
            return;
          }
          resolve((uploadResult ?? {}) as CloudinaryUploadResult);
        }
      );

      stream.end(file.buffer);
    });

    // Cloudinary response shape: https://cloudinary.com/documentation/upload_images#upload_response
    const anyR = result;
    const url =
      (typeof anyR.secure_url === 'string' && anyR.secure_url) ||
      (typeof anyR.url === 'string' && anyR.url) ||
      '';

    if (!url) {
      res.status(500).json({ message: 'Upload failed (missing URL).' });
      return;
    }

    res.json({
      url,
      publicId: typeof anyR.public_id === 'string' ? anyR.public_id : undefined,
      originalFilename:
        typeof anyR.original_filename === 'string'
          ? anyR.original_filename
          : undefined,
      bytes: typeof anyR.bytes === 'number' ? anyR.bytes : undefined,
      resourceType:
        typeof anyR.resource_type === 'string' ? anyR.resource_type : undefined,
      format: typeof anyR.format === 'string' ? anyR.format : undefined,
    });
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    res.status(500).json({ message: 'Upload failed.' });
  }
});
