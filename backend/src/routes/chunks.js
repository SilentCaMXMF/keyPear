import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { File, User, ChunkUpload, ActivityLog } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const CHUNK_TEMP_DIR = process.env.CHUNK_TEMP_DIR || './storage/chunks';
const UPLOAD_DIR = process.env.SMB_MOUNT_PATH 
  ? path.join(process.env.SMB_MOUNT_PATH, 'user_files')
  : process.env.LOCAL_STORAGE_PATH || './storage/user-files';

router.post('/upload/chunk', authenticate, async (req, res) => {
  try {
    const { uploadId, chunkNumber, totalChunks, filename, totalSize, mimeType, folderId } = req.body;
    const chunk = req.files?.chunk;

    if (!chunk) {
      return res.status(400).json({ error: 'No chunk uploaded' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let chunkUpload;
    if (uploadId) {
      chunkUpload = await ChunkUpload.findById(uploadId);
    } else {
      const newUploadId = uuidv4();
      const uploadPath = path.join(CHUNK_TEMP_DIR, newUploadId);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      chunkUpload = await ChunkUpload.create({
        userId: req.userId,
        filename, totalChunks: parseInt(totalChunks),
        totalSize: parseInt(totalSize), mimeType,
        folderId: folderId || null,
        uploadPath, expiresAt,
      });
    }

    const chunkPath = path.join(chunkUpload.upload_path, `chunk_${chunkNumber}`);
    await chunk.mv(chunkPath);

    res.json({ uploadId: chunkUpload.id, chunkNumber: parseInt(chunkNumber), totalChunks: chunkUpload.total_chunks });
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({ error: 'Chunk upload failed' });
  }
});

router.post('/upload/complete', authenticate, async (req, res) => {
  try {
    const { uploadId } = req.body;
    const chunkUpload = await ChunkUpload.findById(uploadId);
    if (!chunkUpload) {
      return res.status(404).json({ error: 'Upload session not found' });
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
      chunks.push(fs.readFileSync(path.join(chunkUpload.upload_path, `chunk_${i}`)));
    }

    const mergedBuffer = Buffer.concat(chunks);
    fs.writeFileSync(storagePath, mergedBuffer);
    fs.rmSync(chunkUpload.upload_path, { recursive: true, force: true });

    const checksum = crypto.createHash('sha256').update(mergedBuffer).digest('hex');

    const file = await File.create({
      userId: req.userId,
      folderId: chunkUpload.folder_id,
      filename: chunkUpload.filename,
      storagePath,
      thumbnailPath: null,
      size: chunkUpload.total_size,
      mimeType: chunkUpload.mime_type,
      checksum,
    });

    await User.updateStorageUsed(req.userId, chunkUpload.total_size);
    await ChunkUpload.delete(uploadId);

    res.status(201).json({ file });
  } catch (error) {
    console.error('Complete upload error:', error);
    res.status(500).json({ error: 'Upload completion failed' });
  }
});

export default router;
