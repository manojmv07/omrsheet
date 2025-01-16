# Smart OMR Evaluator

A web-based OMR (Optical Mark Recognition) sheet evaluation system with automatic grading and result analysis capabilities.

## Features

- Upload and process OMR sheet images
- Automatic answer detection and grading
- Detailed results visualization with charts
- Export results in multiple formats (PDF, Excel, CSV)
- Grade distribution analysis
- Individual score tracking

## System Requirements

- Node.js (v14 or higher)
- Python 3.8 or higher
- npm (Node Package Manager)
- pip (Python Package Manager)

## Project Structure

```
OMR1/
├── frontend/          # React frontend application
├── backend/          # Node.js backend server
└── python-service/   # Python image processing service
```

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Required dependencies:
- express
- cors
- multer
- axios
- form-data

### 2. Python Service Setup

```bash
cd python-service
pip install -r requirements.txt
```

Required dependencies:
- fastapi
- uvicorn
- python-multipart
- opencv-python
- numpy
- python-jose

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

You need to start all three services in separate terminal windows:

### 1. Start Backend Server
```bash
cd backend
npm start
```
The backend server will run on `http://localhost:3001`

### 2. Start Python Service
```bash
cd python-service
python app.py
```
The Python service will run on `http://localhost:8000`

### 3. Start Frontend Application
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3002`

## Using the Application

1. **Access the Application**
   - Open your web browser
   - Navigate to `http://localhost:3002`

2. **Upload OMR Sheets**
   - Click on the "Upload" tab
   - Select an OMR sheet image (supported formats: JPEG, PNG)
   - Fill in the test details
   - Click "Upload" to process the image

3. **View Results**
   - Navigate to the "Results" tab
   - Select a test from the dropdown menu
   - View the following information:
     - Grade distribution chart
     - Score distribution chart
     - Detailed results table
   - Export options:
     - PDF Report
     - Excel Spreadsheet
     - CSV File

## Troubleshooting

1. **Port Conflicts**
   - Ensure ports 3001, 3002, and 8000 are available
   - If a port is in use, you may need to stop other services or change the port in the configuration

2. **Image Processing Issues**
   - Ensure the image is clear and well-lit
   - Check if the image format is supported (JPEG, PNG)
   - Verify that all Python dependencies are installed correctly

3. **Connection Issues**
   - Verify all three services are running
   - Check if the correct ports are being used
   - Ensure there are no firewall restrictions

4. **Export Problems**
   - Check if you have selected a test before attempting to export
   - Ensure you have proper permissions to write files
   - Verify that there is enough disk space

## Common Error Messages

1. "Failed to fetch tests"
   - Backend server might not be running
   - Check if the backend is accessible at port 3001

2. "Error processing image"
   - Python service might not be running
   - Image format might be unsupported
   - Check Python service logs for details

3. "Port already in use"
   - Stop any existing instances of the services
   - Change the port in the configuration if needed

## Best Practices

1. **Image Quality**
   - Use clear, well-lit images
   - Ensure the OMR sheet is properly aligned
   - Avoid shadows and glare on the image

2. **Testing Process**
   - Upload a sample image first to verify system functionality
   - Check results immediately after processing
   - Export results in multiple formats for backup

3. **System Resources**
   - Keep all services running while using the application
   - Monitor system resources during batch processing
   - Regular cleanup of temporary files

## Support

For technical support or questions, please contact:
- Email: [Your Email]
- Phone: [Your Contact Number]

## License

[Your License Information]
