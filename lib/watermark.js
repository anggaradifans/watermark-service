const sharp = require('sharp');

/**
 * Adds a watermark to an image buffer and returns the buffer.
 * @param {Buffer} inputBuffer - The input image buffer.
 * @param {string} text - The watermark text (default: "FOTOCOPY").
 * @returns {Promise<Buffer>} - The watermarked image buffer.
 */
async function addWatermarkBuffer(inputBuffer, text = 'FOTOCOPY') {
  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;

    const dimension = Math.min(width, height);
    const fontSize = Math.floor(dimension / 5); 

    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .watermark {
            fill: rgba(255, 140, 0, 0.5); /* Orange, 50% opacity */
            font-size: ${fontSize}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            text-anchor: middle;
            dominant-baseline: central;
          }
        </style>
        <text 
          x="50%" 
          y="50%" 
          class="watermark" 
          transform="rotate(-45, ${width/2}, ${height/2})"
        >
          ${text}
        </text>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgContent);

    return await image
      .composite([{
        input: svgBuffer,
        top: 0,
        left: 0,
      }])
      .toBuffer();

  } catch (error) {
    throw new Error('Error processing image: ' + error.message);
  }
}

module.exports = { addWatermarkBuffer };
