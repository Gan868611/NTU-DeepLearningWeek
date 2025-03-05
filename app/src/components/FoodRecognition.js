import React, { useState, useContext } from "react";
import { ProfileContext } from "./ProfileContext"; // 🔹 Import Profile Context
import "../styles.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";  // Fallback to localhost if not set

const FoodRecognition = () => {
  const { profile, addMealToLog, clearMealLog } = useContext(ProfileContext); // 🔹 Use Profile Context
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
      const response = await fetch(`${API_BASE_URL}/food-recognition`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setCroppedImage(data.cropped_image); // Set cropped image from backend

      // 🔹 Add meal to global log
      const newMeal = {
        id: Date.now(),
        calories: data.calories,
        mass: data.mass,
        fat: data.fat,
        carb: data.carb,
        protein: data.protein,
        healthScore: data.health_score,
      };
      addMealToLog(newMeal); // Save in context

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

      {/* {croppedImage && (
        <div>
          <h3>Cropped Image</h3>
          <img src={croppedImage} alt="Cropped Food" className="food-preview" />
        </div>
      )} */}

      {result && !error && (
          <div className="food-result">
              <p>🔥 Calories: {result.calories} kcal</p>
              <p>⚖️ Mass: {result.mass} g</p>
              <p>🍔 Fat: {result.fat} g</p>
              <p>🍞 Carbs: {result.carb} g</p>
              <p>💪 Protein: {result.protein} g</p>
              <h3 className="health-score">🟢 Health Score: {result.health_score} / 1</h3>
          </div>
      )}

      {/* 🔹 Display Meal Log */}
      {profile.mealLog && profile.mealLog.length > 0 && (
        <div className="meal-log">
          <h3>📜 Meal Log</h3>
          <ul>
            {profile.mealLog.map((meal) => (
              <li key={meal.id} className="meal-entry">
                🍽️ {meal.calories} kcal | ⚖️ {meal.mass} g | 💪 {meal.protein}g Protein | 🟢 Health Score: {meal.healthScore}
              </li>
            ))}
          </ul>
          <button className="clear-log-btn" onClick={clearMealLog}>Clear Meal Log</button>
        </div>
      )}
      <div style={{ marginBottom: "90px" }}></div>
    </div>
  );
};

export default FoodRecognition;
