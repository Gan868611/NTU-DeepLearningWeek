from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
import numpy as np
import cv2
import io
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔹 Allow all origins (change this in production)
    allow_credentials=True,
    allow_methods=["*"],  # 🔹 Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # 🔹 Allow all headers
)

# 🚀 Health Risk Model (Mock Data for Now)
class HealthProfile(BaseModel):
    age: int
    gender: str
    smoking: str
    exercise: str
    alcohol: str
    family_history: str

@app.post("/health-risk")
def calculate_health_risk(profile: HealthProfile):
    # 🔹 Mock Risk Calculation (Later replace with ML Model)
    risk_score = 100 - (int(profile.age) / 2)  # Simplified logic
    if profile.smoking == "Current smoker":
        risk_score += 20
    if profile.exercise == "Sedentary":
        risk_score += 15
    if profile.alcohol == "Frequent":
        risk_score += 10

    risk_level = "Low"
    if risk_score > 75:
        risk_level = "High"
    elif risk_score > 50:
        risk_level = "Moderate"

    return {"risk_score": risk_score, "risk_level": risk_level}

# 🚀 Food Recognition (Mock API)
@app.post("/food-recognition")
async def food_recognition(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = np.array(bytearray(image_bytes), dtype=np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    # 🔹 Mock Food Classification (Later replace with AI Model)
    return {"food": "Pizza", "calories": 300, "healthy": False}

@app.get("/")
def home():
    return {"message": "Backend is running!"}
