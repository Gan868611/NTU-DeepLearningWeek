import cv2
from ultralytics import YOLO

import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Disable GPU

# Load YOLOv11 detection model (for detecting plates)
detection_model = YOLO("/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/model/plate_detection.pt")

# Load YOLOv11 classification model (for classifying food)
classification_model = YOLO("/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/model/yolo11m-cls.pt")  # Change to your model path if trained on Food-101

image_path = "/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/test_image/salad.jpg"

from tensorflow import keras  # ✅ Import Keras from TensorFlow
import numpy as np

from keras.layers import Input
from keras.applications.inception_v3 import InceptionV3


# Define model architecture
inputs = Input(shape=(224, 224, 3))
base_model = InceptionV3(weights=None, include_top=False, input_tensor=inputs)

from tensorflow.keras.layers import Activation, Dense, BatchNormalization, GlobalAveragePooling2D

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
model = keras.Model(inputs=base_model.input, outputs=[out0, out1, out2, out3, out4])

# Load weights into the model
model.load_weights("/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/model/inceptionv3_saved_model.h5")
print(model.input_shape)


test_input = np.random.rand(1, 224, 224, 3)  # Random test data
outputs = model.predict(test_input)
print(outputs)


import numpy as np

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

# ✅ Test with Steak (Moderate Health)
steak_metrics = [967.55, 618.88, 89.84, 86.46, 12.31]
steak_health_score = compute_health_score(*steak_metrics)
print(f"🥩 Steak Health Score: {steak_health_score}")


# ✅ Test with Bolognese (Moderate Health)
bolognese_metrics = [984.13, 923.63, 130.98, 125.16, 17.83]
bolognese_health_score = compute_health_score(*bolognese_metrics)
print(f"🍝 Bolognese Health Score: {bolognese_health_score}")

# ✅ Test with Pizza (Moderate Health)
pizza_metrics = [502.02, 717.96, 84.78, 79.45, 14.37]
pizza_health_score = compute_health_score(*pizza_metrics)
print(f"🍕 Pizza Health Score: {pizza_health_score}")

# ✅ Test with Salad (Healthy)
salad_metrics = [235.43, 340.69, 18.88, 13.16, 4.33]
salad_health_score = compute_health_score(*salad_metrics)
print(f"🥗 Salad Health Score: {salad_health_score}")

# ❌ Test with Burger (Unhealthy)
burger_metrics = [769.39, 336.48, 64.69, 58.57, 11.99]
burger_health_score = compute_health_score(*burger_metrics)
print(f"🍔 Burger Health Score: {burger_health_score}")

# ✅ Test with Healthy Bowl (Expected High Score)
healthy_bowl_metrics = [786, 540, 77.27, 73.19, 11.62]
healthy_bowl_health_score = compute_health_score(*healthy_bowl_metrics)
print(f"🥗 Healthy Bowl Health Score: {healthy_bowl_health_score}")



import numpy as np
import cv2

def preprocess_image(img_path):
    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img = img / 255.0  # Normalize
    return np.expand_dims(img, axis=0)  # Add batch dimension

# Load a test image
# img_path = "/root/yzgan/test_image/burger_fries.jpg"
# img_path = "/root/yzgan/test_image/salad.jpg"
# img_path = "/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/test_image/steak.jpg"
# img_path = "/root/yzgan/test_image/pasta.png"
preprocessed_img = preprocess_image(image_path)
assert preprocessed_img.shape == (1, 224, 224, 3), "Mismatch in input shape!"

# get the max values to de normalize the outputs
import pandas as pd
df_outputs_max_values = pd.read_csv('./outputs_max_values.csv')
max_calorie = df_outputs_max_values.iloc[0, 0]
max_mass = df_outputs_max_values.iloc[0, 1]
max_fat = df_outputs_max_values.iloc[0, 2]
max_carb = df_outputs_max_values.iloc[0, 3]
max_protein = df_outputs_max_values.iloc[0, 4]

# import matplotlib.pyplot as plt
# import matplotlib.image as mpimg
# img = mpimg.imread(img_path)
# imgplot = plt.imshow(img)
# plt.show()


# Make predictions
outputs = model.predict(preprocessed_img)
calories = float(outputs[0]*max_calorie)
mass =  float(outputs[1]*max_mass)
fat =  float(outputs[2]*max_fat)
carb =  float(outputs[3]*max_carb)
protein = float(outputs[4]*max_protein)

print('calories: ', calories)
print('mass: ',mass)
print('fat: ', fat)
print('carb: ', carb)
print('protein: ',protein)

if any(val < 0 for val in [calories, mass, fat, carb, protein]):
    print("This might not be a food image, Please upload again.")
else:
# Compute health score
    health_score = compute_health_score(calories, mass, fat, carb, protein)

    print(f"🍎 Health Score: {health_score} (0 = Unhealthy, 1 = Healthy)")