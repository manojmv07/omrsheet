from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import json
from typing import List
import io

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_omr_image(image_bytes: bytes, answer_key: List[str]) -> dict:
    # Convert image bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply threshold
    _, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours by y-coordinate (top to bottom)
    sorted_contours = sorted(contours, key=lambda c: cv2.boundingRect(c)[1])
    
    # Process bubbles and get student answers
    student_answers = []
    correct_count = 0
    
    for i, contour in enumerate(sorted_contours):
        if i >= len(answer_key):
            break
            
        x, y, w, h = cv2.boundingRect(contour)
        roi = thresh[y:y+h, x:x+w]
        
        # Find the darkest bubble (most filled)
        options = ['A', 'B', 'C', 'D']
        bubble_values = []
        
        for j in range(4):
            bubble_x = x + (j * (w//4))
            bubble_roi = roi[:, j*(w//4):(j+1)*(w//4)]
            bubble_value = np.sum(bubble_roi)
            bubble_values.append(bubble_value)
        
        # Get student's answer based on the darkest bubble
        max_value_index = bubble_values.index(max(bubble_values))
        student_answer = options[max_value_index]
        student_answers.append(student_answer)
        
        # Check if answer is correct
        if student_answer == answer_key[i]:
            correct_count += 1
    
    # Calculate score
    total_questions = len(answer_key)
    score = (correct_count / total_questions) * 100
    
    return {
        "score": score,
        "correct_answers": correct_count,
        "total_questions": total_questions,
        "student_answers": student_answers
    }

@app.post("/process_omr")
async def process_omr(
    image: UploadFile = File(...),
    answer_key: str = Form(...)
):
    try:
        # Read image content
        image_bytes = await image.read()
        
        # Parse answer key from JSON string
        answer_key_list = json.loads(answer_key)
        
        # Process the image
        result = process_omr_image(image_bytes, answer_key_list)
        
        return result
    except Exception as e:
        return {"error": str(e)}
