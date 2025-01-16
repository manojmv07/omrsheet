import React, { useState, useRef } from 'react';

function Upload() {
  const [files, setFiles] = useState([]);
  const [answerKey, setAnswerKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [savedAnswerKeys, setSavedAnswerKeys] = useState([]);
  const [subjectName, setSubjectName] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Error accessing camera. Please make sure you have given camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFiles(prev => [...prev, file]);
    }, 'image/jpeg');
    
    stopCamera();
  };

  const saveAnswerKey = () => {
    if (!subjectName || !questionCount || !answerKey) {
      alert('Please fill in all fields (Subject Name, Number of Questions, and Answer Key)');
      return;
    }

    const newAnswerKey = {
      id: Date.now(),
      subjectName,
      questionCount: parseInt(questionCount),
      answerKey,
    };

    setSavedAnswerKeys(prev => [...prev, newAnswerKey]);
    // Save to localStorage
    const existingKeys = JSON.parse(localStorage.getItem('savedAnswerKeys') || '[]');
    localStorage.setItem('savedAnswerKeys', JSON.stringify([...existingKeys, newAnswerKey]));

    // Clear form
    setSubjectName('');
    setQuestionCount('');
    setAnswerKey('');
  };

  const loadAnswerKey = (savedKey) => {
    setAnswerKey(savedKey.answerKey);
    setSubjectName(savedKey.subjectName);
    setQuestionCount(savedKey.questionCount.toString());
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleAnswerKeyChange = (e) => {
    setAnswerKey(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('omr_sheets', file);
    });
    formData.append('answer_key', answerKey);
    formData.append('subject_name', subjectName);

    try {
      const response = await fetch('http://localhost:8000/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Upload OMR Sheets
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Upload scanned OMR sheets and provide the answer key for evaluation.</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-5">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  OMR Sheets
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {showCamera ? (
                      <div className="camera-container">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full max-w-md mx-auto"
                        />
                        <button
                          type="button"
                          onClick={captureImage}
                          className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700"
                        >
                          Capture
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="mt-2 ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700"
                          >
                            Open Camera
                          </button>
                        </div>
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-blue-500 focus-within:outline-none">
                            <span>Upload files</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              multiple
                              onChange={handleFileChange}
                              accept="image/*"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                      </>
                    )}
                  </div>
                </div>
                {files.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected files:</h4>
                    <ul className="mt-1 text-sm text-gray-500">
                      {files.map((file, index) => (
                        <li key={index}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter subject name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter number of questions"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Answer Key
                  </label>
                  <textarea
                    value={answerKey}
                    onChange={handleAnswerKeyChange}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Enter answer key (e.g., 1:A, 2:B, 3:C...)"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveAnswerKey}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Save Answer Key
                </button>
              </div>

              {savedAnswerKeys.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Answer Keys:</h4>
                  <div className="space-y-2">
                    {savedAnswerKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm text-gray-600">
                          {key.subjectName} ({key.questionCount} questions)
                        </span>
                        <button
                          type="button"
                          onClick={() => loadAnswerKey(key)}
                          className="text-sm text-primary hover:text-blue-700"
                        >
                          Load
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || files.length === 0 || !answerKey}
                  className={`w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading || files.length === 0 || !answerKey
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Processing...' : 'Upload and Evaluate'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Upload;
