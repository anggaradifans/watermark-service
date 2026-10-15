const express = require('express');
const multer = require('multer');
const path = require('path');
const { addWatermarkBuffer, addWatermarkPdf } = require('./lib/watermark');

const app = express();
const port = 3000;
const MAX_FILE_SIZE_MB = 50;

// Configure Multer for memory storage (no temp files needed for this simple app)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      const error = new Error('Only images and PDFs are allowed');
      error.statusCode = 400;
      cb(error);
    }
  }
});

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// API Route for Watermarking
app.post('/api/watermark', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const text = req.body.text || 'FOTOCOPY';
    const originalName = req.file.originalname;
    const nameWithoutExt = path.parse(originalName).name;
    const ext = path.parse(originalName).ext;

    console.log(`Processing: ${originalName} with text: "${text}"`);

    const watermarkedBuffer = req.file.mimetype === 'application/pdf'
      ? await addWatermarkPdf(req.file.buffer, text)
      : await addWatermarkBuffer(req.file.buffer, text);

    // sharp can't write SVG, so SVG input comes back as PNG
    const isSvg = req.file.mimetype === 'image/svg+xml';
    const outputType = isSvg ? 'image/png' : req.file.mimetype;
    const outputExt = isSvg ? '.png' : ext;

    // Set headers for download
    res.set('Content-Type', outputType);
    res.set('Content-Disposition', `attachment; filename="${nameWithoutExt}_watermarked${outputExt}"`);
    
    res.send(watermarkedBuffer);

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// Upload errors (size limit, file type) are raised by multer before the route handler runs
app.use((error, req, res, next) => {
  console.error('Upload error:', error.message);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large (max ${MAX_FILE_SIZE_MB} MB)` });
  }
  const status = error instanceof multer.MulterError ? 400 : error.statusCode || 500;
  res.status(status).json({ error: error.message });
});

// Express 5 passes listen errors (e.g. port in use) to this callback instead of throwing
app.listen(port, (error) => {
  if (error) throw error;
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open your browser and navigate to http://localhost:${port} to use the app.`);
});
