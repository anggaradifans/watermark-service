const express = require('express');
const multer = require('multer');
const path = require('path');
const { addWatermarkBuffer } = require('./lib/watermark');

const app = express();
const port = 3000;

// Configure Multer for memory storage (no temp files needed for this simple app)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
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
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const text = req.body.text || 'FOTOCOPY';
    const originalName = req.file.originalname;
    const nameWithoutExt = path.parse(originalName).name;
    const ext = path.parse(originalName).ext;

    console.log(`Processing: ${originalName} with text: "${text}"`);

    const watermarkedBuffer = await addWatermarkBuffer(req.file.buffer, text);

    // Set headers for download
    res.set('Content-Type', req.file.mimetype);
    res.set('Content-Disposition', `attachment; filename="${nameWithoutExt}_watermarked${ext}"`);
    
    res.send(watermarkedBuffer);

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Open your browser and navigate to http://localhost:${port} to use the app.`);
});
