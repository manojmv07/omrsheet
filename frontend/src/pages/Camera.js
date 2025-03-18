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
      // Try to get the best possible resolution for the device
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: window.innerWidth },
          height: { ideal: window.innerHeight },
          aspectRatio: { ideal: window.innerWidth / window.innerHeight }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
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

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((num) => (
          <React.Fragment key={num}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === num
                  ? 'bg-blue-600 text-white'
                  : step > num
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > num ? '✓' : num}
            </div>
            {num < 3 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > num ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

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
    clearTest();
    alert('Test deleted successfully!');
  };

  const startCamera = async () => {
    if (!selectedTest) {
      alert('Please select a test first');
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Camera API is not supported in your browser.');
        return;
      }

      setShowCamera(true);

    } catch (err) {
      console.error('Camera error:', err);
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
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    processImage(imageData);
  };

  const processImage = async (imageData) => {
    setProcessing(true);
    try {
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'omr.jpg');
      formData.append('answer_key', JSON.stringify(evaluationData.answerKey.map(ans => {
        const options = ['A', 'B', 'C', 'D'];
        return options.map(opt => opt === ans ? 'X' : 'O').join('');
      })));
      formData.append('question_marks', JSON.stringify(evaluationData.marks));

      const response = await fetch('http://localhost:8000/process_omr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process OMR sheet');
      }

      const result = await response.json();
      setEvaluationResults(result);
      setProcessing(false);

    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process OMR sheet. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
        {!showCamera ? (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-4 sm:mb-8">
              Smart OMR Evaluator
            </h1>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-8">
              <div className="p-4 sm:p-6">
                {renderStepIndicator()}
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-2">
                    {step === 1 ? 'Create New Test' : step === 2 ? 'Assign Marks' : 'Set Answer Key'}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
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

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Evaluate Test</h2>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Test to Evaluate
                    </label>
                    <select
                      value={selectedTest}
                      onChange={handleTestSelect}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                    >
                      <option value="">Select a test</option>
                      {savedTests.map((test) => (
                        <option key={test.id} value={test.id}>
                          {test.name} ({test.numQuestions} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={startCamera}
                      disabled={!selectedTest}
                      className="w-full sm:flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                      <span className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Start Camera
                      </span>
                    </button>
                    <button
                      onClick={clearTest}
                      className="w-full sm:flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={deleteTest}
                      className="w-full sm:flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm sm:text-base"
                    >
                      Delete Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="fixed inset-0 bg-black z-50">
            <div className="h-full flex flex-col">
              <div className="relative flex-1">
                <div className="absolute top-4 left-4 z-10">
                  <h3 className="text-white text-base sm:text-lg font-semibold shadow-sm">
                    {processing ? 'Processing...' : 'Capturing OMR Sheet'}
                  </h3>
                </div>
                {!evaluationResults ? (
                  <div className="relative h-full">
                    <div className="h-full bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute bottom-4 inset-x-4 flex justify-center space-x-6">
                      <button
                        onClick={captureImage}
                        disabled={processing || !stream}
                        className="bg-green-600 text-white p-4 rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6 bg-white h-full overflow-y-auto">
                    <div className="mb-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Evaluation Results</h3>
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-gray-600">Score: <span className="font-semibold text-lg">{evaluationResults.score}%</span></p>
                          <p className="text-gray-600">Marks: <span className="font-semibold text-lg">{evaluationResults.obtained_marks}/{evaluationResults.total_marks}</span></p>
                        </div>
                        <p className="text-gray-600">Correct Answers: <span className="font-semibold text-lg">{evaluationResults.correct_answers}/{evaluationResults.total_questions}</span></p>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          setEvaluationResults(null);
                          stopCamera();
                        }}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
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
