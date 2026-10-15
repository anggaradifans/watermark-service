const sharp = require('sharp');
const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');

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

/**
 * Adds the same diagonal watermark to every page of a PDF buffer and returns the buffer.
 * @param {Buffer} inputBuffer - The input PDF buffer.
 * @param {string} text - The watermark text (default: "FOTOCOPY").
 * @returns {Promise<Buffer>} - The watermarked PDF buffer.
 */
async function addWatermarkPdf(inputBuffer, text = 'FOTOCOPY') {
  let pdfDoc;
  try {
    // Load encrypted files too, so they can be reported below instead of as unparseable
    pdfDoc = await PDFDocument.load(inputBuffer, { ignoreEncryption: true });
  } catch (error) {
    throw clientError('Invalid PDF file: ' + error.message);
  }

  // pdf-lib can't decrypt, so modifying an encrypted PDF would produce a broken file
  if (pdfDoc.isEncrypted) {
    throw clientError('Encrypted or password-protected PDFs are not supported');
  }

  // Standard PDF fonts only cover Latin (WinAnsi) characters
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  try {
    font.encodeText(text);
  } catch (error) {
    throw clientError('Watermark text for PDFs can only contain Latin characters');
  }

  for (const page of pdfDoc.getPages()) {
    const { x, y, width, height } = page.getCropBox();
    const fontSize = Math.floor(Math.min(width, height) / 5);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize, { descender: false });

    // Undo the page's own /Rotate so the text reads diagonally up on screen, like the image watermark
    const angle = 45 + page.getRotation().angle;
    const rad = (angle * Math.PI) / 180;

    // drawText rotates around the text origin, so shift the origin to keep the text centered on the page
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    page.drawText(text, {
      x: centerX - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad),
      y: centerY - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad),
      size: fontSize,
      font,
      color: rgb(1, 140 / 255, 0), // Orange
      opacity: 0.5,
      rotate: degrees(angle),
    });
  }

  return Buffer.from(await pdfDoc.save());
}

function clientError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = { addWatermarkBuffer, addWatermarkPdf };
