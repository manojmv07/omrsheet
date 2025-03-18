import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ButtonGroup,
} from '@mui/material';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [numQuestions, setNumQuestions] = useState('');
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(1);
  const [savedTests, setSavedTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');

  const OPTIONS = ['A', 'B', 'C', 'D'];

  // Load saved tests from localStorage
  useEffect(() => {
    const tests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    setSavedTests(tests);
  }, []);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubjectSubmit = (e) => {
    e.preventDefault();
    if (!subjectName || !numQuestions || isNaN(numQuestions)) {
      alert('Please enter valid subject name and number of questions.');
      return;
    }
    
    // Initialize questions array with empty answers and default marks of 1
    const newQuestions = Array(parseInt(numQuestions)).fill(null).map((_, i) => ({
      number: i + 1,
      answer: null,
      marks: 1
    }));
    setQuestions(newQuestions);
    setStep(2);
  };

  const handleMarksChange = (index, marks) => {
    setQuestions(prevQuestions => {
      const newQuestions = [...prevQuestions];
      newQuestions[index] = {
        ...newQuestions[index],
        marks: Math.max(0, parseInt(marks) || 0)
      };
      return newQuestions;
    });
  };

  const handleAnswerChange = (index, option) => {
    setQuestions(prevQuestions => {
      const newQuestions = [...prevQuestions];
      newQuestions[index] = {
        ...newQuestions[index],
        answer: option,
      };
      return newQuestions;
    });
  };

  const handleNextAfterMarks = () => {
    if (questions.some(q => q.marks <= 0)) {
      alert('Please assign valid marks (greater than 0) for all questions.');
      return;
    }
    setStep(3);
  };

  const saveAnswerKey = () => {
    if (questions.some(q => q.answer === null)) {
      alert('Please select answers for all questions before saving.');
      return;
    }

    const testKey = {
      id: Date.now().toString(),
      subjectName,
      numQuestions: parseInt(numQuestions),
      answers: questions.map(q => q.answer),
      marks: questions.map(q => q.marks),
      createdAt: new Date().toISOString(),
    };

    const existingTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    const updatedTests = [...existingTests, testKey];
    localStorage.setItem('savedTests', JSON.stringify(updatedTests));
    setSavedTests(updatedTests);
    setSelectedTest(testKey.id);
    alert('Answer key saved successfully!');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Please upload at least one OMR sheet image.');
      return;
    }
    if (!selectedTest) {
      alert('Please select a test to evaluate against.');
      return;
    }

    const selectedTestData = savedTests.find(test => test.id === selectedTest);
    if (!selectedTestData) {
      alert('Selected test not found.');
      return;
    }

    setLoading(true);

    try {
      // Process each file one by one
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        
        // Convert answers to X/O format based on bubble positions
        const answerKeyArray = [];
        selectedTestData.answers.forEach(answer => {
          const bubbleIndex = OPTIONS.indexOf(answer);
          OPTIONS.forEach((_, index) => {
            answerKeyArray.push(index === bubbleIndex ? 'X' : 'O');
          });
        });
        
        console.log('Sending data:', {
          answers: selectedTestData.answers,
          marks: selectedTestData.marks,
          answerKeyArray
        });

        formData.append('answer_key', JSON.stringify(answerKeyArray));
        formData.append('question_marks', JSON.stringify(selectedTestData.marks));

        const response = await fetch('http://localhost:3001/api/evaluate', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Evaluation failed');
        }

        const result = await response.json();
        console.log('Received result:', result);
        
        // Create a simplified result message
        let resultMessage = `Test: ${selectedTestData.subjectName}\n`;
        resultMessage += `Score: ${result.score}%\n`;
        resultMessage += `Marks: ${result.obtained_marks} out of ${result.total_marks}\n`;
        resultMessage += `Correct Answers: ${result.correct_answers} out of ${result.total_questions}`;
        
        alert(resultMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to evaluate OMR sheets: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        OMR Sheet Evaluation
      </Typography>

      {step === 1 && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <form onSubmit={handleSubjectSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Number of Questions"
                  type="number"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" type="submit">
                  Next
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {step === 2 && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Assign Marks for Each Question
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Enter the marks for each question (must be greater than 0)
          </Typography>
          <Grid container spacing={2}>
            {questions.map((question, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Box 
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 2
                  }}
                >
                  <Typography sx={{ mb: 1 }}>Question {question.number}</Typography>
                  <TextField
                    fullWidth
                    type="number"
                    label="Marks"
                    value={question.marks}
                    onChange={(e) => handleMarksChange(index, e.target.value)}
                    inputProps={{ min: "1", step: "1" }}
                    required
                  />
                </Box>
              </Grid>
            ))}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleNextAfterMarks}
                sx={{ mr: 1 }}
              >
                Next
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {step === 3 && (
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Select Correct Answers
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Click on A, B, C, or D for each question
          </Typography>
          <Grid container spacing={2}>
            {questions.map((question, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Box 
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 2
                  }}
                >
                  <Typography sx={{ mb: 1 }}>
                    Q{question.number} ({question.marks} marks):
                  </Typography>
                  <ButtonGroup variant="outlined" fullWidth>
                    {OPTIONS.map((option) => (
                      <Button
                        key={option}
                        variant={question.answer === option ? "contained" : "outlined"}
                        onClick={() => handleAnswerChange(index, option)}
                        sx={{ flexGrow: 1 }}
                      >
                        {option}
                      </Button>
                    ))}
                  </ButtonGroup>
                </Box>
              </Grid>
            ))}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={saveAnswerKey} 
                sx={{ mr: 1 }}
              >
                Save Answer Key
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => setStep(2)}
              >
                Back
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper elevation={3} sx={{ p: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Test</InputLabel>
                <Select
                  value={selectedTest}
                  onChange={(e) => setSelectedTest(e.target.value)}
                  label="Select Test"
                >
                  {savedTests.map((test) => (
                    <MenuItem key={test.id} value={test.id}>
                      {test.subjectName} - {new Date(test.createdAt).toLocaleDateString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
                sx={{ mr: 1 }}
              >
                Upload OMR Sheets
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading || files.length === 0}
              >
                {loading ? <CircularProgress size={24} /> : 'Evaluate'}
              </Button>
            </Grid>
            {files.length > 0 && (
              <Grid item xs={12}>
                <Typography>
                  Selected files: {files.map(f => f.name).join(', ')}
                </Typography>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Upload;
