from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import threading
import subprocess
import time
import numpy as np
import cv2
import base64
import os
import requests
import pandas as pd
from ultralytics import YOLO
from tensorflow import keras
from keras.layers import Input
from keras.applications.inception_v3 import InceptionV3
from tensorflow.keras.layers import Activation, Dense, BatchNormalization, GlobalAveragePooling2D
from fastapi.middleware.cors import CORSMiddleware
import torch
from sklearn.preprocessing import StandardScaler
import joblib

app = FastAPI()

# 🚀 Enable CORS (For Frontend-Backend Communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Function to Run Flask (`app.py`) in a Separate Thread
def run_flask():
    """Runs the Flask server in a separate thread."""
    time.sleep(2)  # Give FastAPI time to start
    subprocess.run(["python", "app.py"])  # Run Flask backend

# ✅ Start Flask in a New Thread
threading.Thread(target=run_flask, daemon=True).start()

# Define Flask Chatbot URL (running in the background)
FLASK_CHATBOT_URL = "http://127.0.0.1:5001"

def start_flask():
    """Starts the Flask chatbot (app.py) in a background process."""
    try:
        subprocess.run(["python", "chatbot_app.py"])  # Run Flask backend
        # subprocess.Popen(["python", "chatbot_app.py"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        time.sleep(3)  # Give Flask time to start
    except Exception as e:
        print(f"Error starting Flask: {e}")

# Start Flask in a background thread when FastAPI runs
threading.Thread(target=start_flask, daemon=True).start()

@app.post("/sync_profile")
async def sync_profile(profile: dict):
    """Send user profile data to Flask chatbot for reference."""
    try:
        print("🟢 Sending profile data to Flask:", profile)  # Log request

        response = requests.post(f"{FLASK_CHATBOT_URL}/set_health_profile", json=profile)
        response_data = response.json()

        print("✅ Response from Flask:", response_data)  # Log response
        return response_data
    except requests.exceptions.RequestException as e:
        print(f"❌ Error syncing profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error syncing profile: {str(e)}")

# 🖥️ Disable GPU for inference
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

# 🚀 Load YOLOv11 detection model (For detecting plates)
detection_model = YOLO("model/plate_detection.pt")  # Change to actual path

# 🚀 Load YOLOv11 classification model (For classifying food)
classification_model = YOLO("model/yolo11m-cls.pt")  # Change to actual path

# 🚀 Load InceptionV3-based Nutrition Estimation Model
inputs = Input(shape=(224, 224, 3))
base_model = InceptionV3(weights=None, include_top=False, input_tensor=inputs)

x = base_model.get_layer('mixed7').output
x = Dense(512)(x)
x = BatchNormalization()(x)
x = Activation('relu')(x)
x = GlobalAveragePooling2D()(x)

FC1 = Dense(512, activation='relu')(x)
FC2 = Dense(512, activation='relu')(FC1)
FC3 = Dense(512, activation='relu')(FC2)

out0 = Dense(units=1, activation='linear', name='total_calories_neuron')(FC3)
out1 = Dense(units=1, activation='linear', name='total_mass_neuron')(FC3)
out2 = Dense(units=1, activation='linear', name='total_fat_neuron')(FC3)
out3 = Dense(units=1, activation='linear', name='total_carb_neuron')(FC3)
out4 = Dense(units=1, activation='linear', name='total_protein_neuron')(FC3)

# Creating the feature extraction model
nutrition_model = keras.Model(inputs=base_model.input, outputs=[out0, out1, out2, out3, out4])

# Load trained weights
nutrition_model.load_weights("model/inceptionv3_saved_model.h5")  # Change to actual path

# 🚀 Load Normalization Values
df_outputs_max_values = pd.read_csv("model/outputs_max_values.csv")  # Adjust path
max_calorie, max_mass, max_fat, max_carb, max_protein = df_outputs_max_values.iloc[0]

# 🔢 Compute Health Score Function
def compute_health_score(calories, mass, fat, carb, protein):
    # Convert numpy arrays to scalars (if needed)
    calories = float(calories) if isinstance(calories, np.ndarray) else calories
    mass = float(mass) if isinstance(mass, np.ndarray) else mass
    fat = float(fat) if isinstance(fat, np.ndarray) else fat
    carb = float(carb) if isinstance(carb, np.ndarray) else carb
    protein = float(protein) if isinstance(protein, np.ndarray) else protein

    # Define normalization max values based on dietary guidelines
    max_calories = 1500  # Adjusted for high-calorie meals
    max_fat = 150  # Increased max fat to balance scoring
    max_carb = 150  # Increased for carb-heavy meals
    max_protein = 100  # Reward high-protein meals
    max_mass = 1000  # Increased to reward large food portions

    # Normalize values between 0 and 1
    norm_calories = min(calories / max_calories, 1)
    norm_fat = min(fat / max_fat, 1)
    norm_carb = min(carb / max_carb, 1)
    norm_protein = min(protein / max_protein, 1)
    norm_mass = min(mass / max_mass, 1)

    # Adjusted weights (penalties and rewards)
    w1, w2, w3 = 0.13, 0.20, 0.23  # ⬇️ Less penalty for calories, fat, and carbs
    w4, w5 = 0.90, 0.85  # ⬆️ More reward for protein

    # Compute health score
    unhealthy_score = (w1 * norm_calories + w2 * norm_fat + w3 * norm_carb)
    healthy_score = (w4 * norm_protein + w5 * norm_mass)

    health_score = max(0, min(1, 1 - (unhealthy_score / (healthy_score + 0.1))))  # Avoid div by zero

    return round(float(health_score), 2)  # Ensure float output

# 📷 Image Preprocessing Function
def preprocess_image(img):
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224)) / 255.0
    return np.expand_dims(img, axis=0)

# 🚀 Food Recognition Endpoint
@app.post("/food-recognition")
async def food_recognition(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)

    # 🛑 Step 1: Detect the Plate in the Image
    detection_results = detection_model.predict(source=image, conf=0.5)

    # Get Largest Detected Plate
    largest_box, max_area = None, 0
    for box in detection_results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])
        area = (x2 - x1) * (y2 - y1)
        if area > max_area:
            max_area, largest_box = area, box

    # 🔹 If No Plate Found, Use Whole Image
    if not largest_box:
        cropped_img = image
    else:
        x1, y1, x2, y2 = map(int, largest_box.xyxy[0])
        cropped_img = image[y1:y2, x1:x2]

    # Convert cropped image to Base64
    _, buffer = cv2.imencode(".jpg", cropped_img)
    cropped_img_base64 = base64.b64encode(buffer).decode("utf-8")

    # 🔢 Step 2: Predict Nutritional Data
    preprocessed_img = preprocess_image(cropped_img)
    outputs = nutrition_model.predict(preprocessed_img)

    # Convert Outputs to Human-Readable Values
    calories, mass = float(outputs[0] * max_calorie), float(outputs[1] * max_mass)
    fat, carb, protein = float(outputs[2] * max_fat), float(outputs[3] * max_carb), float(outputs[4] * max_protein)

    # Compute Health Score
    health_score = compute_health_score(calories, mass, fat, carb, protein)

    return {
        "calories": round(calories, 2),
        "mass": round(mass, 2),
        "fat": round(fat, 2),
        "carb": round(carb, 2),
        "protein": round(protein, 2),
        "health_score": health_score,
        "cropped_image": f"data:image/jpeg;base64,{cropped_img_base64}"
    }

# 🚀 Load the Trained PyTorch Model
class HeartDiseaseNN(torch.nn.Module):
    def __init__(self, input_dim):
        super(HeartDiseaseNN, self).__init__()
        self.fc1 = torch.nn.Linear(input_dim, 128)
        self.bn1 = torch.nn.BatchNorm1d(128)
        self.fc2 = torch.nn.Linear(128, 64)
        self.bn2 = torch.nn.BatchNorm1d(64)
        self.fc3 = torch.nn.Linear(64, 32)
        self.bn3 = torch.nn.BatchNorm1d(32)
        self.fc4 = torch.nn.Linear(32, 1)
        self.dropout = torch.nn.Dropout(0.3)
        self.relu = torch.nn.ReLU()
        self.sigmoid = torch.nn.Sigmoid()

    def forward(self, x):
        x = self.relu(self.bn1(self.fc1(x)))
        x = self.dropout(x)
        x = self.relu(self.bn2(self.fc2(x)))
        x = self.dropout(x)
        x = self.relu(self.bn3(self.fc3(x)))
        x = self.dropout(x)
        x = self.sigmoid(self.fc4(x))
        return x

# Load model
input_dim = 13  # Make sure this matches your training input dimension
model = HeartDiseaseNN(input_dim)
model.load_state_dict(torch.load("model/heart_disease_model.pth", map_location=torch.device("cpu")))
model.eval()

# 🚀 Load Preprocessing Information
age_mapping = {"18-24": 1, "25-29": 2, "30-34": 3, "35-39": 4, "40-44": 5,
               "45-49": 6, "50-54": 7, "55-59": 8, "60-64": 9, "65-69": 10,
               "70-74": 11, "75-79": 12, "80+": 13}

# Standardize BMI & Alcohol Consumption
scaler = StandardScaler()
scaler = joblib.load("model/scaler.pkl")

# 🚀 Define API Input Model
class HealthProfile(BaseModel):
    age_category: str
    sex: str
    bmi: float
    exercise: int
    skin_cancer: str
    other_cancer: str
    depression: str
    arthritis: str
    smoking_history: str
    alcohol_days: int
    pre_diabetes: str
    diabetes: str
    pregnancy_diabetes: str

@app.post("/health-risk")
def calculate_health_risk(profile: HealthProfile):
    # Convert categorical values
    sex = 1 if profile.sex == "Male" else 0
    exercise = 1 if profile.exercise > 2 else 0
    skin_cancer = 1 if profile.skin_cancer == "Yes" else 0
    other_cancer = 1 if profile.other_cancer == "Yes" else 0
    depression = 1 if profile.depression == "Yes" else 0
    arthritis = 1 if profile.arthritis == "Yes" else 0
    smoking_history = 1 if profile.smoking_history == "Yes" else 0
    pre_diabetes = 1 if profile.pre_diabetes == "Yes" else 0
    diabetes = 1 if profile.diabetes == "Yes" else 0
    pregnancy_diabetes = 1 if profile.pregnancy_diabetes == "Yes" else 0
    age_category = age_mapping.get(profile.age_category, 1)  # Default to lowest category if not found

    # Standardize BMI & Alcohol Consumption
    bmi, alcohol = scaler.transform([[profile.bmi, profile.alcohol_days]])[0]

    # Prepare input tensor
    input_data = np.array([[exercise, skin_cancer, other_cancer, depression, arthritis, 
                             sex, age_category, bmi, smoking_history, alcohol, 
                             pre_diabetes, diabetes, pregnancy_diabetes]])

    input_tensor = torch.tensor(input_data, dtype=torch.float32)

    # Get prediction
    with torch.no_grad():
        risk_score = model(input_tensor).item()

    # Convert risk score to category
    risk_category = "Low"
    if risk_score > 0.2:
        risk_category = "High"
    elif risk_score > 0.1:
        risk_category = "Moderate"

    return {
        "risk_score": round(risk_score, 3),
        "risk_category": risk_category
    }

@app.get("/")
def home():
    return {"message": "Backend is running!"}
