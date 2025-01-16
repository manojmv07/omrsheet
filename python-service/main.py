from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from typing import List
import io
from PIL import Image

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_omr(image_bytes: bytes, answer_key: dict) -> dict:
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply threshold to get binary image
    _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    
    # TODO: Implement actual OMR processing logic
    # This is a placeholder that returns mock results
    return {
        "total_questions": len(answer_key),
        "correct_answers": len(answer_key) - 2,  # Mock value
        "score": ((len(answer_key) - 2) / len(answer_key)) * 100,  # Mock value
        "answers": {"1": "A", "2": "B", "3": "C"}  # Mock answers
    }

@app.post("/process")
async def process_images(files: List[UploadFile] = File(...), answer_key: str = None):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    if not answer_key:
        raise HTTPException(status_code=400, detail="No answer key provided")
    
    # Parse answer key
    try:
        answer_key_dict = dict(item.split(":") for item in answer_key.split(","))
    except:
        raise HTTPException(status_code=400, detail="Invalid answer key format")
    
    results = []
    for file in files:
        try:
            # Read image file
            contents = await file.read()
            
            # Process the image
            result = process_omr(contents, answer_key_dict)
            
            results.append({
                "filename": file.filename,
                "results": result
            })
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing {file.filename}: {str(e)}")
    
    return {"status": "success", "results": results}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
