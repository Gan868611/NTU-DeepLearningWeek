import React, { useState } from "react";
import PixelButton from "./PixelButton";
import "../styles.css";

const FoodRecognition = () => {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImage(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setResult(null);
    setCroppedImage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/food-recognition", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setCroppedImage(data.cropped_image); // Set cropped image from backend
    } catch (err) {
      setError("Failed to analyze food. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="food-recognition">
      <h2 className="pixel-font">🍽️ Upload Your Meal</h2>
      <input type="file" accept="image/*" onChange={handleUpload} />

      {image && <img src={image} alt="Original Preview" className="food-preview" />}
      
      {loading && <p className="loading-message">⏳ Analyzing food...</p>}
      {error && <p className="error-message">{error}</p>}

      {croppedImage && (
        <div>
          <h3>Cropped Image</h3>
          <img src={croppedImage} alt="Cropped Food" className="food-preview" />
        </div>
      )}

      {result && (
        <div className="food-result">
          <p>🔥 Calories: {result.calories} kcal</p>
          <p>⚖️ Mass: {result.mass} g</p>
          <p>🍔 Fat: {result.fat} g</p>
          <p>🍞 Carbs: {result.carb} g</p>
          <p>💪 Protein: {result.protein} g</p>
          <h3 className="health-score">🟢 Health Score: {result.health_score} / 1</h3>
        </div>
      )}
    </div>
  );
};

export default FoodRecognition;
