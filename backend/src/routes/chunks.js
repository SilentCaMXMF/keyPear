const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { File, User, ChunkUpload, ActivityLog } = require('../models');
const { authenticate } = require('../middleware/auth');
const thumbnailService = require('../services/thumbnail');

const router = express.Router();

const CHUNK_TEMP_DIR = process.env.CHUNK_TEMP_DIR || './storage/chunks';
const UPLOAD_DIR = process.env.STORAGE_PATH || './storage/user-files';
const CHUNK_EXPIRY_HOURS = 24;

router.post('/upload/chunk', authenticate, async (req, res) => {
  try {
    const { uploadId, chunkNumber, totalChunks, filename, totalSize, mimeType, folderId } = req.body;
    const chunk = req.files?.chunk;

    if (!chunk) {
      return res.status(400).json({ error: 'No chunk uploaded' });
    }

    let chunkUpload;
    const expiresAt = new Date(Date.now() + CHUNK_EXPIRY_HOURS * 60 * 60 * 1000);

    if (uploadId) {
      chunkUpload = await ChunkUpload.findById(uploadId);
      if (!chunkUpload || chunkUpload.user_id !== req.userId) {
        return res.status(404).json({ error: 'Upload session not found' });
      }
    } else {
      const newUploadId = uuidv4();
      const uploadPath = path.join(CHUNK_TEMP_DIR, newUploadId);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      chunkUpload = await ChunkUpload.create({
        userId: req.userId,
        filename: filename,
        totalChunks: parseInt(totalChunks),
        totalSize: parseInt(totalSize),
        mimeType,
        folderId: folderId || null,
        uploadPath,
        expiresAt,
      });
    }

    const chunkPath = path.join(chunkUpload.upload_path, `chunk_${chunkNumber}`);
    await chunk.mv(chunkPath);

    res.json({
      uploadId: chunkUpload.id,
      chunkNumber: parseInt(chunkNumber),
      totalChunks: chunkUpload.total_chunks,
    });
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({ error: 'Chunk upload failed' });
  }
});

router.post('/upload/complete', authenticate, async (req, res) => {
  try {
    const { uploadId } = req.body;

    const chunkUpload = await ChunkUpload.findById(uploadId);
    if (!chunkUpload || chunkUpload.user_id !== req.userId) {
      return res.status(404).json({ error: 'Upload session not found' });
    }

    if (new Date(chunkUpload.expires_at) < new Date()) {
      fs.rmSync(chunkUpload.upload_path, { recursive: true, force: true });
      await ChunkUpload.delete(uploadId);
      return res.status(410).json({ error: 'Upload session expired' });
    }

    const user = await User.findById(req.userId);
    if (user.storage_used + chunkUpload.total_size > user.storage_quota) {
      fs.rmSync(chunkUpload.upload_path, { recursive: true, force: true });
      await ChunkUpload.delete(uploadId);
      return res.status(507).json({ error: 'Storage quota exceeded' });
    }

    const userDir = path.join(UPLOAD_DIR, req.userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const fileId = uuidv4();
    const ext = path.extname(chunkUpload.filename);
    const storagePath = path.join(userDir, `${fileId}${ext}`);

    const chunks = [];
    for (let i = 0; i < chunkUpload.total_chunks; i++) {
      const chunkPath = path.join(chunkUpload.upload_path, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        fs.rmSync(chunkUpload.upload_path, { recursive: true, force: true });
        await ChunkUpload.delete(uploadId);
        return res.status(400).json({ error: `Missing chunk ${i}` });
      }
      chunks.push(fs.readFileSync(chunkPath));
    }

    const mergedBuffer = Buffer.concat(chunks);
    fs.writeFileSync(storagePath, mergedBuffer);

    fs.rmSync(chunkUpload.upload_path, { recursive: true, force: true });

    let thumbnailPath = null;
    if (chunkUpload.mime_type && chunkUpload.mime_type.startsWith('image/')) {
      thumbnailPath = await thumbnailService.generateThumbnail(storagePath, fileId);
    }

    const checksum = crypto.createHash('sha256').update(mergedBuffer).digest('hex');

    const file = await File.create({
      userId: req.userId,
      folderId: chunkUpload.folder_id,
      filename: chunkUpload.filename,
      storagePath,
      thumbnailPath,
      size: chunkUpload.total_size,
      mimeType: chunkUpload.mime_type,
      checksum,
    });

    await User.updateStorageUsed(req.userId, chunkUpload.total_size);
    await ChunkUpload.delete(uploadId);
    await ActivityLog.create({
      userId: req.userId,
      action: 'file_upload_chunked',
      fileId: file.id,
      metadata: { filename: chunkUpload.filename, size: chunkUpload.total_size },
    });

    res.status(201).json({ file });
  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({ error: 'Upload completion failed' });
  }
});

router.post('/upload/cancel', authenticate, async (req, res) => {
  try {
    const { uploadId } = req.body;

    const chunkUpload = await ChunkUpload.findById(uploadId);
    if (!chunkUpload || chunkUpload.user_id !== req.userId) {
      return res.status(404).json({ error: 'Upload session not found' });
    }

    if (fs.existsSync(chunkUpload.upload_path)) {
      fs.rmSync(chunkUpload.upload_path, { recursive: true, force: true });
    }

    await ChunkUpload.delete(uploadId);

    res.json({ message: 'Upload cancelled' });
  } catch (error) {
    console.error('Cancel upload error:', error);
    res.status(500).json({ error: 'Cancel failed' });
  }
});

module.exports = router;
