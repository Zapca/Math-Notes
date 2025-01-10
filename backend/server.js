// backend/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const math = require('mathjs');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Tesseract worker
let worker = null;

async function initializeWorker() {
  try {
    worker = await Tesseract.createWorker('eng', 1, {
      logger: progress => {
        console.log(progress);
      }
    });
    console.log('Tesseract worker initialized successfully');
    return worker;
  } catch (error) {
    console.error('Error initializing worker:', error);
    throw error;
  }
}

// Initialize the worker when server starts
let workerReady = initializeWorker();

// Endpoint to solve equations
app.post('/api/solve', upload.single('image'), async (req, res) => {
  try {
    // Ensure worker is initialized
    const readyWorker = await workerReady;
    if (!readyWorker) {
      return res.status(500).json({ error: 'OCR worker not initialized' });
    }

    // Recognize text from image
    console.log('Starting OCR recognition...');
    const { data: { text } } = await readyWorker.recognize(req.file.buffer);
    console.log('Recognized text:', text);
    
    // Split into lines and process each equation
    const equations = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Solve each equation
    const solutions = equations.map(eq => {
      try {
        const cleanEq = eq
          .replace(/×/g, '*')
          .replace(/÷/g, '/')
          .replace(/[^0-9+\-*/()=.\s]/g, '')
          .trim();

        if (!cleanEq) {
          return {
            equation: eq,
            result: 'Invalid equation'
          };
        }

        const result = math.evaluate(cleanEq);
        return {
          equation: eq,
          result: typeof result === 'number' ? result.toFixed(2) : result
        };
      } catch (error) {
        console.log('Error solving equation:', eq, error);
        return {
          equation: eq,
          result: 'Could not solve'
        };
      }
    });
    
    res.json({ solutions });
  } catch (error) {
    console.error('Error processing math:', error);
    res.status(500).json({ error: 'Failed to process mathematical expression' });
  }
});

// Add a test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Add a health check endpoint
app.get('/health', async (req, res) => {
  try {
    const readyWorker = await workerReady;
    res.json({ 
      status: 'healthy',
      workerInitialized: !!readyWorker
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Cleanup on server shutdown
process.on('SIGTERM', async () => {
  try {
    const readyWorker = await workerReady;
    if (readyWorker) {
      await readyWorker.terminate();
    }
  } catch (error) {
    console.error('Error terminating worker:', error);
  }
  process.exit(0);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});