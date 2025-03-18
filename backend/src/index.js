const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Enable CORS
app.use(cors());
app.use(express.json());

// Store for results
const results = [];

// Routes
app.post('/api/evaluate', upload.single('image'), async (req, res) => {
  try {
    console.log('Received evaluation request');
    console.log('Request body:', req.body);
    console.log('File:', req.file);

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const answer_key = req.body.answer_key;
    const question_marks = req.body.question_marks;

    if (!answer_key) {
      return res.status(400).json({ error: 'Answer key is required' });
    }

    if (!question_marks) {
      return res.status(400).json({ error: 'Question marks are required' });
    }

    // Create form data for Python service
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path));
    formData.append('answer_key', answer_key);
    formData.append('question_marks', question_marks);

    console.log('Sending request to Python service with:', {
      answer_key,
      question_marks,
      file: req.file.path
    });

    // Send to Python service for processing
    const pythonServiceResponse = await axios.post(
      'http://localhost:5000/process_omr',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('Received response from Python service:', pythonServiceResponse.data);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Store result
    const result = {
      id: Date.now().toString(),
      ...pythonServiceResponse.data,
      timestamp: new Date()
    };
    results.push(result);

    res.json(result);
  } catch (error) {
    console.error('Error details:', error.response?.data || error.message);
    
    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    // Send appropriate error response
    if (error.response) {
      // Error from Python service
      res.status(error.response.status).json({
        error: error.response.data.detail || 'Failed to process OMR sheet'
      });
    } else {
      // Other errors
      res.status(500).json({
        error: 'Failed to process OMR sheet: ' + (error.message || 'Unknown error')
      });
    }
  }
});

// Get all results
app.get('/api/results', (req, res) => {
  res.json(results);
});

// Get specific result
app.get('/api/results/:id', (req, res) => {
  const result = results.find(r => r.id === req.params.id);
  if (!result) {
    return res.status(404).json({ error: 'Result not found' });
  }
  res.json(result);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
