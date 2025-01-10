// backend/imageProcessing.js
import sharp from 'sharp';
import cv from 'opencv4nodejs';

export async function preprocessImage(imageBuffer) {
  try {
    // Enhance preprocessing for better OCR
    const processed = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .threshold(150) // Increased threshold for better digit separation
      .resize({
        width: 800,
        height: null,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 }
      })
      .sharpen()
      .toBuffer();

    const mat = cv.imdecode(processed);
    
    // Apply more aggressive preprocessing
    const processed_mat = mat
      .gaussianBlur(new cv.Size(3, 3), 0)
      .adaptiveThreshold(
        255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY,
        11,
        2
      );
    
    return cv.imencode('.png', processed_mat);
  } catch (error) {
    throw new Error('Failed to preprocess image');
  }
}

function findEquationRegions(mat) {
  // Find contours in the image
  const contours = mat.findContours(
    cv.RETR_EXTERNAL,
    cv.CHAIN_APPROX_SIMPLE
  );
  
  // Filter and sort contours to find equation regions
  return contours
    .filter(contour => {
      const area = contour.area;
      return area > 100; // Minimum area threshold
    })
    .sort((a, b) => {
      const rectA = a.boundingRect();
      const rectB = b.boundingRect();
      return rectA.y - rectB.y;
    });
}