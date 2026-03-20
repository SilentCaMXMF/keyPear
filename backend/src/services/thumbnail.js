const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const THUMBNAIL_SIZE = 200;
const THUMBNAIL_DIR = process.env.THUMBNAIL_DIR || './storage/thumbnails';

const thumbnailService = {
  async generateThumbnail(filePath, fileId) {
    const ext = path.extname(filePath).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'];

    if (!imageExtensions.includes(ext)) {
      return null;
    }

    if (!fs.existsSync(THUMBNAIL_DIR)) {
      fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
    }

    let thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}.jpg`);
    // Remove leading './' if present to make the path relative to the app root
    if (thumbnailPath.startsWith('./')) {
      thumbnailPath = thumbnailPath.slice(2);
    }

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
  },

  async deleteThumbnail(fileId) {
    let thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}.jpg`);
    // Remove leading './' if present to make the path relative to the app root
    if (thumbnailPath.startsWith('./')) {
      thumbnailPath = thumbnailPath.slice(2);
    }
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  },
};

module.exports = thumbnailService;
