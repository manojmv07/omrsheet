import React from 'react';

function About() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div className="lg:text-center mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          About Smart OMR Evaluator
        </h2>
        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
          An innovative solution for automated OMR sheet evaluation using advanced computer vision technology.
        </p>
      </div>

      {/* Key Features Section */}
      <div className="mb-16">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-primary mb-3">Real-time Evaluation</h4>
            <p className="text-gray-600">
              Instantly evaluate OMR sheets using your device's camera with advanced image processing.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-primary mb-3">Accurate Detection</h4>
            <p className="text-gray-600">
              Precise bubble detection and answer recognition using computer vision algorithms.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-primary mb-3">Result Management</h4>
            <p className="text-gray-600">
              Comprehensive result tracking with detailed analytics and export capabilities.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-primary mb-3">USN Detection</h4>
            <p className="text-gray-600">
              Automatic detection and recognition of student USN numbers for easy identification.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-primary mb-3">Export Options</h4>
            <p className="text-gray-600">
              Export results in multiple formats including PDF and Excel for easy sharing and record-keeping.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h4 className="text-lg font-semibold text-primary mb-3">Test Management</h4>
            <p className="text-gray-600">
              Create and manage multiple tests with custom answer keys and scoring criteria.
            </p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Development Team</h3>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">MV</span>
            </div>
            <div className="ml-6">
              <h4 className="text-xl font-semibold text-gray-900">Manoj M V</h4>
              <p className="text-gray-600 mt-1">Lead Developer</p>
              <div className="mt-2 text-gray-500">
                <h5 className="font-medium mb-2">Contributions:</h5>
                <ul className="list-disc list-inside space-y-1">
                  <li>Designed and implemented the complete frontend interface using React.js</li>
                  <li>Developed the camera-based OMR sheet evaluation system</li>
                  <li>Implemented real-time USN detection and recognition</li>
                  <li>Created the result management system with export capabilities</li>
                  <li>Integrated backend services with Python for image processing</li>
                  <li>Designed and implemented the test management system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
