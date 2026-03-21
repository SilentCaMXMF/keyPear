import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const THUMBNAIL_SIZE = 200;
const THUMBNAIL_DIR = process.env.THUMBNAIL_DIR 
  ? path.resolve(process.env.THUMBNAIL_DIR)
  : path.resolve(__dirname, '../../storage/thumbnails');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'];
const DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];
const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac'];

export const getFileIcon = (mimeType, filename) => {
  if (!mimeType && !filename) return '📄';
  
  const ext = path.extname(filename || '').toLowerCase();
  
  if (IMAGE_EXTENSIONS.includes(ext) || mimeType?.startsWith('image/')) return '🖼️';
  if (DOC_EXTENSIONS.includes(ext) || mimeType?.includes('pdf') || mimeType?.includes('document')) return '📝';
  if (VIDEO_EXTENSIONS.includes(ext) || mimeType?.startsWith('video/')) return '🎬';
  if (AUDIO_EXTENSIONS.includes(ext) || mimeType?.startsWith('audio/')) return '🎵';
  if (ext === '.zip' || ext === '.rar' || ext === '.7z') return '📦';
  if (ext === '.txt' || ext === '.md') return '📃';
  if (ext === '.js' || ext === '.ts' || ext === '.py') return '💻';
  
  return '📄';
};

export const getFileType = (mimeType, filename) => {
  const ext = path.extname(filename || '').toLowerCase();
  
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (DOC_EXTENSIONS.includes(ext)) return 'document';
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video';
  if (AUDIO_EXTENSIONS.includes(ext)) return 'audio';
  if (ext === '.zip' || ext === '.rar') return 'archive';
  
  return 'file';
};

export const generateThumbnail = async (filePath, fileId) => {
  const ext = path.extname(filePath).toLowerCase();
  
  if (!IMAGE_EXTENSIONS.includes(ext)) {
    return null;
  }

  if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
  }

  const thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}.jpg`);

  try {
    await sharp(filePath)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return null;
  }
};

export const deleteThumbnail = (fileId) => {
  const thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}.jpg`);
  if (fs.existsSync(thumbnailPath)) {
    fs.unlinkSync(thumbnailPath);
  }
};

export const getThumbnailUrl = (fileId) => {
  return `/api/files/${fileId}/thumbnail`;
};
