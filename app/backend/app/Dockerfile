FROM python:3.12.9

# ✅ Set the working directory
WORKDIR /app

# ✅ Install system dependencies (required for OpenCV)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    ffmpeg \
    libsm6 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# ✅ Copy the project files into the container
COPY . /app

# ✅ Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# ✅ Expose the FastAPI port
EXPOSE 8000

