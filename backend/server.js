require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/solve', async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare image data
    const imageData = {
      inlineData: {
        data: req.body.image,
        mimeType: "image/png"
      }
    };

    // Generate content with the image
    const result = await model.generateContent([
      "You are a math expert. Please solve the mathematical equations or expressions shown in this image. Provide only the final answer without explanation.",
      imageData
    ]);

    const response = await result.response;
    const solution = response.text();

    res.json({ result: solution });

  } catch (error) {
    console.error('Error processing math:', error);
    res.status(500).json({ error: 'Failed to process mathematical expression' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});