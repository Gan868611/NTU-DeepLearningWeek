import cv2
from ultralytics import YOLO

# Load YOLOv11 detection model (for detecting plates)
detection_model = YOLO("/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/model/plate_detection.pt")

# Load YOLOv11 classification model (for classifying food)
classification_model = YOLO("/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/model/yolo11m-cls.pt")  # Change to your model path if trained on Food-101

image_path = "/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/test_image/pizza_5k.png"
# image_path = "/root/yzgan/test_image/burger.png"

# Run detection inference on the image
detection_results = detection_model.predict(source=image_path, conf=0.5)

# Load the original image
image = cv2.imread(image_path)
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)  # Convert to RGB for display

# Define bounding box color
color = (255, 0, 0)  # Blue

# Get image dimensions
img_h, img_w, _ = image.shape

# Find the plate with the largest area
largest_box = None
max_area = 0

if detection_results and len(detection_results[0].boxes) > 0:
    for box in detection_results[0].boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0])  # Bounding box coordinates
        area = (x2 - x1) * (y2 - y1)  # Calculate area
        if area > max_area:
            max_area = area
            largest_box = box  # Store the largest detected plate

# If a plate was found, process it
if largest_box:
    x1, y1, x2, y2 = map(int, largest_box.xyxy[0])  # Get largest plate's coordinates
    conf = largest_box.conf[0].item()  # Confidence score
    cls = int(largest_box.cls[0])  # Class index

    # Draw bounding box
    cv2.rectangle(image_rgb, (x1, y1), (x2, y2), color, 2)

    # Crop the detected plate region
    cropped_plate = image[y1:y2, x1:x2]

    # Save the cropped image temporarily
    cropped_image_path = "/root/yzgan/NTU-DeepLearningWeek/AI_Food_Recognition/cropped_plate.jpg"
    cv2.imwrite(cropped_image_path, cropped_plate)

