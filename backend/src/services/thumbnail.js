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
  },

  async deleteThumbnail(fileId) {
    const thumbnailPath = path.join(THUMBNAIL_DIR, `${fileId}.jpg`);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  },
};

module.exports = thumbnailService;
