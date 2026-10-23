import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { ENV } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootUploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(rootUploadsDir)) {
  fs.mkdirSync(rootUploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/quicktime': 'video',
};

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, GIF, MP4, WEBM, MOV.`
      ),
      false
    );
  }
};

let storage;

if (
  ENV.STORAGE_PROVIDER === 'cloudinary' &&
  ENV.CLOUDINARY_CLOUD_NAME &&
  ENV.CLOUDINARY_API_KEY &&
  ENV.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'jansolve_evidence',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov'],
    },
  });
} else {
  // Local disk storage
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, rootUploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname) || '';
      cb(null, `evidence-${uniqueSuffix}${ext}`);
    },
  });
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 5, // Up to 5 files
  },
});

export const formatUploadedFile = (file) => {
  const isVideo = file.mimetype.startsWith('video/');
  const fileType = isVideo ? 'video' : 'image';

  // Cloudinary populates file.path with secure URL
  if (file.path && file.path.startsWith('http')) {
    return {
      url: file.path,
      fileType,
      publicId: file.filename || '',
      originalName: file.originalname,
    };
  }

  // Local file storage
  const filename = file.filename;
  return {
    url: `/uploads/${filename}`,
    fileType,
    publicId: filename,
    originalName: file.originalname,
  };
};
