import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from 'react-modal';

// Set the app element for accessibility
Modal.setAppElement('#root');

function Home() {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxWidth: '800px',
      padding: '0',
      border: 'none',
      background: 'none',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
    },
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
      <div className="lg:text-center">
        <h2 className="text-base text-primary font-semibold tracking-wide uppercase">
          Smart OMR Evaluator
        </h2>
        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Automated OMR Sheet Evaluation
        </p>
        <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
          Evaluate OMR sheets quickly and accurately with our advanced computer vision technology.
        </p>
      </div>

      <div className="mt-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Real-time Evaluation
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Use your device's camera to instantly evaluate OMR sheets with our advanced recognition system.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Instant Results
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Get immediate evaluation results with detailed analysis and scoring.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <div className="flow-root bg-white rounded-lg px-6 pb-8">
              <div className="-mt-6">
                <div className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                  <svg
                    className="h-6 w-6 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </div>
                <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                  Export Data
                </h3>
                <p className="mt-5 text-base text-gray-500">
                  Export results in various formats including PDF, Excel, and CSV.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center space-x-4">
        <Link
          to="/camera"
          className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-700"
        >
          Start Evaluation
        </Link>
        <button
          onClick={openModal}
          className="inline-flex items-center justify-center px-5 py-3 border border-primary text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          Watch Demo
        </button>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="Demo Video Modal"
      >
        <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/OoEVd75x_FY"
            title="OMR Evaluator Demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Home;
