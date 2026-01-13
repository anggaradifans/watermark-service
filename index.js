const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Adds a watermark to an image.
 * @param {string} inputPath - Path to the input image.
 * @param {string} outputPath - Path to save the watermarked image.
 * @param {string} text - The watermark text (default: "FOTOCOPY").
 */
async function addWatermark(inputPath, outputPath, text = 'FOTOCOPY') {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;

    // Calculate font size dynamically based on image size
    // We want the text to look substantial (e.g., 15-20% of the smaller dimension)
    // Adjust logic to match "Big Text" requirement
    const dimension = Math.min(width, height);
    const fontSize = Math.floor(dimension / 5); 

    // Create SVG overlay
    // Transformed to rotate -45 degrees (diagonal up)
    // Centered in the middle of the image
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
        <!-- Center the text group, then apply rotation around the center -->
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

    await image
      .composite([{
        input: svgBuffer,
        top: 0,
        left: 0,
      }])
      .toFile(outputPath);

    console.log(`✅ Success! Watermarked image saved to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error processing image:', error);
    process.exit(1);
  }
}

// Execute if run directly from CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Usage: node index.js <input-path> <output-path> [text]

Example:
  node index.js ./public/image.jpg ./output.jpg "CONFIDENTIAL"
    `);
    process.exit(0);
  }

  const [input, output, text] = args;
  
  // Resolve paths relative to CWD if they are not absolute
  const inputPath = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
  const outputPath = path.isAbsolute(output) ? output : path.resolve(process.cwd(), output);

  addWatermark(inputPath, outputPath, text);
}

module.exports = { addWatermark };
