import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'user-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const imageFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedImageMimeTypes = new Set([
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
    ]);

    if (allowedImageMimeTypes.has(file.mimetype.toLowerCase())) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

const mediaFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (isImage || isVideo) {
        cb(null, true);
    } else {
        cb(new Error('Only image or video files are allowed'));
    }
};

export const uploadImage = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadMedia = multer({
    storage,
    fileFilter: mediaFileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Backward-compatible alias for existing image upload routes.
export const upload = uploadImage;
