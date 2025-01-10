const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createWorker } = require('tesseract.js');
const math = require('mathjs');
const nerdamer = require('nerdamer');
require('nerdamer/all');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Tesseract worker
async function initializeWorker() {
  const worker = await createWorker({
    logger: progress => console.log(progress)
  });
  // Load language data
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  console.log('Tesseract worker initialized successfully');
  return worker;
}

let workerPromise = initializeWorker();

// Function to determine if an equation is polynomial
function isPolynomialEquation(eq) {
  // Remove spaces and convert to lowercase
  const cleanEq = eq.replace(/\s/g, '').toLowerCase();
  
  // Check for presence of variables (x, y, z) and '^' operator
  return /[xyz]/.test(cleanEq) && /=/.test(cleanEq);
}

// Function to solve polynomial equation
function solvePolynomial(eq) {
  try {
    // Clean up the equation
    let cleanEq = eq
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\s/g, '')
      .trim();

    // Move everything to left side to get standard form
    if (cleanEq.includes('=')) {
      const [left, right] = cleanEq.split('=');
      cleanEq = `${left}-(${right})=0`;
    }

    // Solve using nerdamer
    const solution = nerdamer.solve(cleanEq, 'x');
    
    // Convert solution to readable format
    return Array.from(solution).map(sol => {
      const simplified = nerdamer(sol).text('decimals');
      return simplified.includes('i') ? simplified : Number(simplified).toFixed(4);
    });
  } catch (error) {
    console.error('Error solving polynomial:', error);
    return null;
  }
}

// Function to solve arithmetic expression
function solveArithmetic(eq) {
  try {
    const cleanEq = eq
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/[^0-9+\-*/()=.\s]/g, '')
      .trim();

    if (!cleanEq) return null;

    const result = math.evaluate(cleanEq);
    return typeof result === 'number' ? result.toFixed(4) : result;
  } catch (error) {
    console.error('Error solving arithmetic:', error);
    return null;
  }
}

// Enhanced endpoint to solve equations
app.post('/api/solve', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const worker = await workerPromise;
    console.log('Starting OCR recognition...');
    
    // Convert buffer to Uint8Array
    const imageData = new Uint8Array(req.file.buffer);
    
    const { data: { text } } = await worker.recognize(imageData);
    console.log('Recognized text:', text);

    // Split into lines and process each equation
    const equations = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Solve each equation
    const solutions = equations.map(eq => {
      try {
        if (isPolynomialEquation(eq)) {
          const result = solvePolynomial(eq);
          return {
            equation: eq,
            type: 'polynomial',
            result: result || 'Could not solve',
            solutions: Array.isArray(result) ? result.length : 0
          };
        } else {
          const result = solveArithmetic(eq);
          return {
            equation: eq,
            type: 'arithmetic',
            result: result || 'Could not solve'
          };
        }
      } catch (error) {
        console.log('Error solving equation:', eq, error);
        return {
          equation: eq,
          type: 'unknown',
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
    const readyWorker = await workerPromise;
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
    const readyWorker = await workerPromise;
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