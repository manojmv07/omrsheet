const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// In-memory storage for test results (replace with database in production)
const testResults = [];

// Routes
app.post('/api/evaluate', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { testId, answerKey } = req.body;
    if (!testId || !answerKey) {
      return res.status(400).json({ error: 'Test ID and answer key are required' });
    }

    // Send image to Python service for processing
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));
    formData.append('answer_key', answerKey);

    const pythonServiceResponse = await axios.post(
      'http://localhost:5000/process_omr',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    const result = pythonServiceResponse.data;

    // Save the result
    const testResult = {
      id: Date.now(),
      testId,
      score: result.score,
      correctAnswers: result.correct_answers,
      totalQuestions: result.total_questions,
      studentAnswers: result.student_answers,
      timestamp: new Date(),
    };

    testResults.push(testResult);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json(testResult);
  } catch (error) {
    console.error('Error processing OMR:', error);
    res.status(500).json({ error: 'Failed to process OMR sheet' });
  }
});

app.get('/api/results', (req, res) => {
  try {
    const { testId } = req.query;
    let filteredResults = testResults;

    if (testId) {
      filteredResults = testResults.filter(result => result.testId === testId);
    }

    res.json(filteredResults);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

app.get('/api/test/:testId', (req, res) => {
  try {
    const { testId } = req.params;
    const testResults = testResults.filter(result => result.testId === testId);
    
    if (testResults.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Calculate statistics
    const totalStudents = testResults.length;
    const averageScore = testResults.reduce((acc, curr) => acc + curr.score, 0) / totalStudents;
    const highestScore = Math.max(...testResults.map(r => r.score));
    const lowestScore = Math.min(...testResults.map(r => r.score));

    res.json({
      testId,
      statistics: {
        totalStudents,
        averageScore,
        highestScore,
        lowestScore,
      },
      results: testResults,
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
