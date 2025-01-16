import React, { useState, useRef, useEffect, useCallback } from 'react';

const Camera = () => {
  // Create New Test states
  const [testName, setTestName] = useState('');
  const [numQuestions, setNumQuestions] = useState('');
  const [step, setStep] = useState(1);
  const [marks, setMarks] = useState([]);
  const [answerKey, setAnswerKey] = useState([]);
  
  // Evaluate Test states
  const [selectedTest, setSelectedTest] = useState('');
  const [evaluationData, setEvaluationData] = useState(null);
  const [savedTests, setSavedTests] = useState(
    JSON.parse(localStorage.getItem('savedTests') || '[]')
  );
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Memoize initializeCamera to prevent unnecessary re-renders
  const initializeCamera = useCallback(async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        setStream(newStream);
      } else {
        throw new Error('Video element not found');
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      throw err;
    }
  }, []);

  // Add this effect to initialize camera after showing the camera UI
  useEffect(() => {
    let mounted = true;

    if (showCamera && !stream) {
      initializeCamera().catch(err => {
        if (mounted) {
          console.error('Failed to initialize camera:', err);
          setShowCamera(false);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [showCamera, stream, initializeCamera]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (stream) {
        console.log('Cleaning up camera stream');
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
      }
    };
  }, [stream]);

  const handleTestDetailsSubmit = (e) => {
    e.preventDefault();
    if (!testName || !numQuestions) {
      alert('Please fill in all fields');
      return;
    }
    setMarks(Array(parseInt(numQuestions)).fill(1));
    setStep(2);
  };

  const handleMarksChange = (index, value) => {
    const newMarks = [...marks];
    newMarks[index] = parseInt(value) || 0;
    setMarks(newMarks);
  };

  const handleMarksSubmit = (e) => {
    e.preventDefault();
    setAnswerKey(Array(parseInt(numQuestions)).fill(''));
    setStep(3);
  };

  const handleAnswerChange = (index, value) => {
    const newAnswerKey = [...answerKey];
    newAnswerKey[index] = value.toUpperCase();
    setAnswerKey(newAnswerKey);
  };

  const handleAnswerKeySubmit = (e) => {
    e.preventDefault();
    if (answerKey.some(answer => !answer)) {
      alert('Please fill in all answers');
      return;
    }

    const newTest = {
      id: Date.now(),
      name: testName,
      numQuestions: parseInt(numQuestions),
      marks,
      answerKey
    };

    const updatedTests = [...savedTests, newTest];
    localStorage.setItem('savedTests', JSON.stringify(updatedTests));
    setSavedTests(updatedTests);

    setTestName('');
    setNumQuestions('');
    setMarks([]);
    setAnswerKey([]);
    setStep(1);
    alert('Test saved successfully!');
  };

  const handleTestSelect = (e) => {
    const selectedId = e.target.value;
    setSelectedTest(selectedId);
    
    // Find the selected test data
    const test = savedTests.find(t => t.id.toString() === selectedId.toString());
    if (test) {
      setEvaluationData(test);
    }
  };

  const clearTest = () => {
    setSelectedTest('');
    setEvaluationData(null);
    stopCamera();
  };

  const deleteTest = () => {
    if (!selectedTest) {
      alert('Please select a test first');
      return;
    }

    const updatedTests = savedTests.filter(test => test.id.toString() !== selectedTest.toString());
    localStorage.setItem('savedTests', JSON.stringify(updatedTests));
    setSavedTests(updatedTests);
    clearTest(); // Clear selection after deleting
    alert('Test deleted successfully!');
  };

  const startCamera = async () => {
    if (!selectedTest) {
      alert('Please select a test first');
      return;
    }

    try {
      // Check for camera support
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Camera API is not supported in your browser. Please use Chrome, Firefox, or Edge.');
        return;
      }

      console.log('Starting camera...');
      setShowCamera(true);

    } catch (err) {
      console.error('Camera error:', err);
      let message = '';

      switch (err.name) {
        case 'NotAllowedError':
          message = 'Camera access was denied. Please allow camera access in your browser settings.';
          break;
        case 'NotFoundError':
          message = 'No camera found. Please connect a camera and try again.';
          break;
        case 'NotReadableError':
          message = 'Camera is in use by another application. Please close other apps using the camera.';
          break;
        default:
          message = `Could not start camera: ${err.message || 'Unknown error'}`;
      }

      alert(message);
      setShowCamera(false);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setShowCamera(false);
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    processImage(imageData);
  };

  const processImage = async (imageData) => {
    setProcessing(true);
    try {
      // Convert base64 to blob
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'omr.jpg');
      formData.append('testData', JSON.stringify(evaluationData));

      // Send to backend
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const result = await response.json();
      
      // Process results
      const processedResults = {
        usn: result.usn,
        totalMarks: result.answers.reduce((total, ans, idx) => {
          return total + (ans.isCorrect ? evaluationData.marks[idx] : 0);
        }, 0),
        maxMarks: evaluationData.marks.reduce((a, b) => a + b, 0),
        answers: result.answers,
        testName: evaluationData.name,
        timestamp: new Date().toISOString()
      };

      setEvaluationResults(processedResults);

      // Save to localStorage
      const savedResults = JSON.parse(localStorage.getItem('evaluationResults') || '[]');
      savedResults.push(processedResults);
      localStorage.setItem('evaluationResults', JSON.stringify(savedResults));

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === stepNumber 
              ? 'bg-blue-600 text-white' 
              : step > stepNumber 
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
          }`}>
            {step > stepNumber ? '✓' : stepNumber}
          </div>
          {stepNumber < 3 && (
            <div className={`w-16 h-1 mx-2 ${
              step > stepNumber ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {!showCamera ? (
          <>
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
              Smart OMR Evaluator
            </h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
              <div className="p-6">
                {renderStepIndicator()}
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {step === 1 ? 'Create New Test' : step === 2 ? 'Assign Marks' : 'Set Answer Key'}
                  </h2>
                  <p className="text-gray-600">
                    {step === 1 
                      ? 'Enter test details to get started'
                      : step === 2 
                        ? 'Assign marks for each question'
                        : 'Set the correct answers for each question'
                    }
                  </p>
                </div>

                {step === 1 && (
                  <form onSubmit={handleTestDetailsSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Name
                      </label>
                      <input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter test name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Questions
                      </label>
                      <input
                        type="number"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(e.target.value)}
                        min="1"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter number of questions"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Next: Assign Marks
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleMarksSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {marks.map((mark, index) => (
                        <div key={index} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Question {index + 1}
                          </label>
                          <input
                            type="number"
                            value={mark}
                            onChange={(e) => handleMarksChange(index, e.target.value)}
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Next: Set Answer Key
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handleAnswerKeySubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {answerKey.map((answer, index) => (
                        <div key={index} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Q{index + 1} ({marks[index]} marks)
                          </label>
                          <select
                            value={answer}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          >
                            <option value="">Select Answer</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                      >
                        Save Answer Key
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Evaluate Test</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Test to Evaluate
                    </label>
                    <select
                      value={selectedTest}
                      onChange={handleTestSelect}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select a test</option>
                      {savedTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} ({test.numQuestions} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={startCamera}
                      disabled={!selectedTest}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <span className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0111.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Start Camera
                      </span>
                    </button>
                    <button
                      onClick={clearTest}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={deleteTest}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    >
                      Delete Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-4xl w-full">
              <div className="relative">
                <div className="absolute top-4 left-4 z-10">
                  <h3 className="text-white text-lg font-semibold shadow-sm">
                    {processing ? 'Processing...' : 'Capturing OMR Sheet'}
                  </h3>
                </div>
                {!evaluationResults ? (
                  <div className="relative">
                    <div className="bg-black aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute bottom-4 right-4 flex space-x-4">
                      <button
                        onClick={captureImage}
                        disabled={processing || !stream}
                        className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-red-600 text-white p-3 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Evaluation Results</h3>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-600">USN: <span className="font-semibold">{evaluationResults.usn}</span></p>
                        <p className="text-gray-600">Score: <span className="font-semibold">{evaluationResults.totalMarks}/{evaluationResults.maxMarks}</span></p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-700">Answer Analysis:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {evaluationResults.answers.map((answer, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            <p className="font-medium">Q{index + 1}</p>
                            <p className="text-sm">
                              Marked: {answer.marked || '-'}
                              <br />
                              Correct: {evaluationData.answerKey[index]}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-4">
                      <button
                        onClick={() => {
                          setEvaluationResults(null);
                          stopCamera();
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
