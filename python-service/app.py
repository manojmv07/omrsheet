from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import json
from typing import List
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def preprocess_image(img):
    """Preprocess the image for better bubble detection"""
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply adaptive histogram equalization for better contrast
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # Remove noise while preserving edges
        denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        
        # Apply Gaussian blur to smooth the image
        blurred = cv2.GaussianBlur(denoised, (5, 5), 0)
        
        # Use adaptive thresholding instead of global thresholding
        thresh = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            11,  # Block size
            2    # Constant subtracted from mean
        )
        
        # Clean up the image with morphological operations
        kernel = np.ones((3,3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        return thresh
    except Exception as e:
        logger.error(f"Error in preprocess_image: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Failed to preprocess image: {str(e)}")

def determine_marked_option(row):
    """Determine which option (if any) is marked in a row of bubbles"""
    try:
        # Calculate fill percentages for each bubble
        fill_values = [bubble['fill'] for bubble in row]
        
        # Find the bubble with maximum fill
        max_fill_idx = np.argmax(fill_values)
        max_fill = fill_values[max_fill_idx]
        
        # Calculate the average fill of other bubbles
        other_fills = [v for i, v in enumerate(fill_values) if i != max_fill_idx]
        avg_other_fill = sum(other_fills) / len(other_fills) if other_fills else 0
        
        # Calculate standard deviation of fill values
        std_dev = np.std(fill_values)
        
        logger.info(f"Fill values: {fill_values}, max_fill: {max_fill}, avg_other_fill: {avg_other_fill}, std_dev: {std_dev}")
        
        # More sophisticated marking detection:
        # 1. The maximum fill should be above a minimum threshold
        # 2. The difference between max fill and average should be significant
        # 3. The standard deviation should be high enough to indicate a clear choice
        if (max_fill > 25 and  # Lowered minimum threshold
            max_fill > (avg_other_fill * 1.3) and  # Must be 30% higher than average
            std_dev > 10):  # Ensure there's enough variation between bubbles
            return ['A', 'B', 'C', 'D'][max_fill_idx]
        return None
    except Exception as e:
        logger.error(f"Error in determine_marked_option: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Failed to determine marked option: {str(e)}")

def find_bubbles(img):
    """Find and analyze bubbles in the image"""
    try:
        height, width = img.shape[:2]
        logger.info(f"Processing image of size {width}x{height}")
        
        # Calculate expected bubble size based on image dimensions
        expected_bubble_size = min(height, width) // 35  # Adjusted for better detection
        min_bubble_size = (expected_bubble_size * 0.4) ** 2  # More lenient minimum size
        max_bubble_size = (expected_bubble_size * 2.2) ** 2  # More lenient maximum size
        
        # Find contours with hierarchy to better handle nested contours
        contours, hierarchy = cv2.findContours(img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            raise ValueError("No bubbles detected in the image")
        
        logger.info(f"Found {len(contours)} contours")
        
        # Filter and sort bubbles
        bubbles = []
        for i, contour in enumerate(contours):
            # Skip if this is a child contour (might be noise inside a bubble)
            if hierarchy[0][i][3] != -1:  # Has parent
                continue
                
            area = cv2.contourArea(contour)
            if area < min_bubble_size or area > max_bubble_size:
                continue
            
            # Use minimum enclosing circle to better handle slightly deformed bubbles
            (x, y), radius = cv2.minEnclosingCircle(contour)
            circularity = 4 * np.pi * area / (cv2.arcLength(contour, True) ** 2)
            
            # Check if the contour is approximately circular
            if circularity < 0.7:  # More lenient circularity check
                continue
            
            # Calculate bounding rectangle for organization purposes
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = float(w) / h
            if aspect_ratio < 0.7 or aspect_ratio > 1.3:  # More lenient aspect ratio
                continue
            
            # Calculate fill percentage with more precision
            mask = np.zeros(img.shape, dtype=np.uint8)
            cv2.drawContours(mask, [contour], -1, (255), -1)
            fill = cv2.mean(img, mask=mask)[0]
            
            bubbles.append({
                'contour': contour,
                'x': int(x),
                'y': int(y),
                'w': w,
                'h': h,
                'fill': fill,
                'area': area,
                'circularity': circularity
            })
        
        if not bubbles:
            raise ValueError("No valid bubbles found after filtering")
        
        logger.info(f"Found {len(bubbles)} valid bubbles")
        
        # Group bubbles into rows using clustering
        bubbles.sort(key=lambda b: (b['y'], b['x']))
        rows = []
        current_row = []
        row_y = bubbles[0]['y']
        avg_height = sum(b['h'] for b in bubbles) / len(bubbles)
        
        for bubble in bubbles:
            # Use dynamic threshold based on average bubble height
            if abs(bubble['y'] - row_y) > avg_height * 1.5:
                if current_row:
                    current_row.sort(key=lambda b: b['x'])
                    if len(current_row) == 4:  # Only accept rows with exactly 4 bubbles
                        rows.append(current_row)
                    current_row = []
                row_y = bubble['y']
            current_row.append(bubble)
        
        # Add the last row if it's complete
        if current_row and len(current_row) == 4:
            current_row.sort(key=lambda b: b['x'])
            rows.append(current_row)
        
        if not rows:
            raise ValueError("Could not identify complete rows of bubbles")
        
        logger.info(f"Grouped bubbles into {len(rows)} rows")
        return rows
    
    except Exception as e:
        logger.error(f"Error in find_bubbles: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Failed to find bubbles: {str(e)}")

@app.post("/process_omr")
async def process_omr(
    image: UploadFile = File(...),
    answer_key: str = Form(...),
    question_marks: str = Form(...)
):
    try:
        logger.info("Starting OMR processing")
        
        # Parse answer key and question marks
        try:
            answer_key_list = json.loads(answer_key)
            marks_list = json.loads(question_marks)
            logger.info(f"Answer key: {answer_key_list}")
            logger.info(f"Marks list: {marks_list}")
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=422, detail=f"Invalid JSON format: {str(e)}")
        
        if not answer_key_list:
            raise HTTPException(status_code=422, detail="Answer key is empty")
        if not marks_list:
            raise HTTPException(status_code=422, detail="Question marks are empty")
        
        # Read and process image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=422, detail="Could not read the image")
        
        # Process the image
        processed_img = preprocess_image(img)
        rows = find_bubbles(processed_img)
        
        # Process answers
        student_answers = []
        correct_count = 0
        total_marks = 0
        obtained_marks = 0
        
        # Convert answer key from X/O format to A,B,C,D format
        correct_answers = []
        for i in range(0, len(answer_key_list), 4):
            answer_slice = answer_key_list[i:i+4]
            if 'X' in answer_slice:
                correct_answers.append(['A', 'B', 'C', 'D'][answer_slice.index('X')])
            else:
                correct_answers.append(None)
        
        logger.info(f"Correct answers: {correct_answers}")
        
        # Process each row (question)
        for i, row in enumerate(rows):
            if i >= len(marks_list) or i >= len(correct_answers):
                break
            
            # Get marks for this question
            marks = marks_list[i]
            total_marks += marks
            
            # Get student's answer
            marked_option = determine_marked_option(row)
            student_answers.append(marked_option)
            
            logger.info(f"Question {i+1}: Student marked {marked_option}, Correct is {correct_answers[i]}")
            
            # Check if answer is correct
            if marked_option == correct_answers[i]:
                correct_count += 1
                obtained_marks += marks
        
        # Calculate score
        score = (obtained_marks / total_marks * 100) if total_marks > 0 else 0
        
        result = {
            "score": round(score, 2),
            "obtained_marks": obtained_marks,
            "total_marks": total_marks,
            "correct_answers": correct_count,
            "total_questions": len(rows)
        }
        
        logger.info(f"Processing complete. Result: {result}")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process OMR sheet: {str(e)}")
