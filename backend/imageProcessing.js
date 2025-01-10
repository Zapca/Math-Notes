// backend/imageProcessing.js
import sharp from 'sharp';
import cv from 'opencv4nodejs';

export async function preprocessImage(imageBuffer) {
  try {
    // Convert to grayscale and enhance contrast
    const processed = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .threshold(128)
      .toBuffer();

    // Load image with OpenCV for additional processing
    const mat = cv.imdecode(processed);
    
    // Apply additional preprocessing steps
    const processed_mat = mat
      .gaussianBlur(new cv.Size(3, 3), 0)
      .threshold(128, 255, cv.THRESH_BINARY);
    
    // Find and process individual equations
    const regions = findEquationRegions(processed_mat);
    
    // Return the processed image
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