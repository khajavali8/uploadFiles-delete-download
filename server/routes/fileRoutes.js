import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, png, pdf, doc, and docx files are allowed'));
    }
  },
});

// Upload single file
router.post('/uploads', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  res.status(200).json({
    message: 'File uploaded successfully',
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
    },
  });
});

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }

  const fileDetails = req.files.map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    path: file.path,
    size: file.size,
  }));

  res.status(200).json({
    message: 'Files uploaded successfully',
    files: fileDetails,
  });
});

// Download file
router.get('/download/:filename', (req, res) => {
  const filePath = path.resolve(__dirname, '../uploads', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  res.download(filePath, req.params.filename, err => {
    if (err) {
      res.status(500).json({ message: 'Error downloading file', error: err.message });
    }
  });
});

// List files
router.get('/files', (req, res) => {
  const uploadDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) {
    return res.status(200).json({ files: [] });
  }

  const files = fs.readdirSync(uploadDir).map(filename => {
    const filePath = path.join(uploadDir, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      size: stats.size,
      createdAt: stats.birthtime,
    };
  });

  res.status(200).json({ files });
});

// Delete file
router.delete('/files/:filename', (req, res) => {
  const filePath = path.resolve(__dirname, '../uploads', req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }

  fs.unlinkSync(filePath);
  res.status(200).json({ message: 'File deleted successfully' });
});

export default router;
